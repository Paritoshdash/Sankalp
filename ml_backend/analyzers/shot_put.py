"""
Shot Put Analyzer

Phases: stance → power position → release → follow-through

Metrics:
  - hip_shoulder_rotation: separation angle between hips and shoulders (power)
  - elbow_position_score: elbow height relative to shoulder at release
  - estimated_release_angle: arm angle at release frame
  - follow_through_score: arm extension after release
  - stance_width_score: foot separation (wider → more stable base)

Note: Release speed NOT claimed — no calibration available.
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class ShotPutAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "shotput"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 6:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for shot put analysis."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

        # ── Hip-shoulder separation ───────────────────────────────────────────
        rotation, rot_conf = self._measure_hip_shoulder_rotation(sequence)
        if rot_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="hip_shoulder_rotation",
                value=round(rotation, 1),
                unit="degrees",
                threshold_key="hip_shoulder_rotation_deg",
                direction="higher_better",
                confidence=rot_conf,
                ceiling_multiplier=1.5,
                floor_fraction=0.4,
                estimated=True,
                note="Separation angle between shoulder axis and hip axis during power phase.",
            ))
        else:
            warnings.append("Hip-shoulder rotation could not be measured.")

        # ── Estimated release angle ───────────────────────────────────────────
        release_angle, ra_conf = self._estimate_release_angle(sequence)
        if ra_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="estimated_release_angle",
                value=round(release_angle, 1),
                unit="degrees",
                threshold_key="release_angle_deg",
                direction="higher_better",
                confidence=ra_conf,
                ceiling_multiplier=1.3,
                floor_fraction=0.7,
                estimated=True,
                note="Arm extension angle at estimated release frame. ~35-42° is optimal.",
            ))
        else:
            warnings.append("Release angle could not be estimated (wrist/elbow not clearly visible).")

        # ── Elbow position ────────────────────────────────────────────────────
        elbow_score, elbow_conf = self._measure_elbow_position(sequence)
        if elbow_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="elbow_position_score",
                raw_value=round(elbow_score, 1),
                unit="score/100",
                normalized_score=round(elbow_score, 1),
                confidence=round(elbow_conf, 3),
                estimated=True,
                note="Elbow height relative to shoulder at release frame.",
            ))

        # ── Stance width ──────────────────────────────────────────────────────
        stance_score, stance_conf = self._measure_stance_width(sequence)
        if stance_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="stance_width_score",
                raw_value=round(stance_score, 1),
                unit="score/100",
                normalized_score=round(stance_score, 1),
                confidence=round(stance_conf, 3),
                estimated=True,
                note="Foot separation relative to shoulder width (stable base).",
            ))

        if not scored_metrics:
            return self._low_data_result(self.sport_id, "Could not extract any reliable metrics.")

        technique_score = engine.aggregate(
            [m for m in scored_metrics if m.name in ["elbow_position_score", "stance_width_score"]]
            or scored_metrics
        )
        performance_score = engine.aggregate(
            [m for m in scored_metrics if m.name in ["hip_shoulder_rotation", "estimated_release_angle"]]
            or scored_metrics
        )
        overall_video_score = round(technique_score * 0.4 + performance_score * 0.6, 1)

        return AnalysisResult(
            sport=self.sport_id,
            technique_score=technique_score,
            performance_score=performance_score,
            overall_video_score=overall_video_score,
            metrics=self._build_metrics_dict(scored_metrics),
            scored_metrics=scored_metrics,
            warnings=warnings,
            pose_detection_rate=sequence.pose_detection_rate,
            frames_processed=sequence.total_frames_sampled,
            video_duration_s=sequence.video_duration_s,
        )

    def _measure_hip_shoulder_rotation(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Measures the angular difference between the shoulder axis and hip axis.
        Greater separation = more stored rotational energy.
        """
        max_rotation = 0.0
        confs = []
        for f in sequence.frames:
            if not f.pose_detected:
                continue
            needed = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP]
            vis = [f.visibility.get(i, 0) for i in needed]
            if min(vis) < 0.4:
                continue
            ls = f.landmarks[LM.LEFT_SHOULDER]
            rs = f.landmarks[LM.RIGHT_SHOULDER]
            lh = f.landmarks[LM.LEFT_HIP]
            rh = f.landmarks[LM.RIGHT_HIP]

            # Angle of shoulder axis
            shoulder_angle = np.degrees(np.arctan2(rs[1] - ls[1], rs[0] - ls[0]))
            # Angle of hip axis
            hip_angle = np.degrees(np.arctan2(rh[1] - lh[1], rh[0] - lh[0]))

            rotation = abs(shoulder_angle - hip_angle)
            if rotation > 90:
                rotation = 180 - rotation  # normalize to 0-90

            if rotation > max_rotation:
                max_rotation = rotation
            confs.append(min(vis))

        if not confs:
            return 0.0, 0.0
        return max_rotation, float(np.mean(confs))

    def _estimate_release_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Release frame = when the throwing arm (wrist) is at its highest y position.
        Measure shoulder-elbow-wrist angle at that frame.
        """
        release_frame = sequence.get_frame_at_landmark_extremum(LM.RIGHT_WRIST, axis=1, mode="min")
        if release_frame is None:
            release_frame = sequence.get_frame_at_landmark_extremum(LM.LEFT_WRIST, axis=1, mode="min")

        if release_frame is None:
            return 0.0, 0.0

        # Try right arm first (most throwers are right-handed)
        for shoulder, elbow, wrist in [
            (LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST),
            (LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST),
        ]:
            vis = min(
                release_frame.visibility.get(shoulder, 0),
                release_frame.visibility.get(elbow, 0),
                release_frame.visibility.get(wrist, 0),
            )
            if vis > 0.4:
                s = release_frame.landmarks[shoulder][:2]
                e = release_frame.landmarks[elbow][:2]
                w = release_frame.landmarks[wrist][:2]
                angle = self.estimator.angle_between_points(s, e, w)
                return angle, vis

        return 0.0, 0.0

    def _measure_elbow_position(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Score elbow height relative to shoulder at estimated release frame."""
        release_frame = sequence.get_frame_at_landmark_extremum(LM.RIGHT_WRIST, axis=1, mode="min")
        if release_frame is None:
            return 0.0, 0.0

        for shoulder, elbow in [
            (LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW),
            (LM.LEFT_SHOULDER, LM.LEFT_ELBOW),
        ]:
            sv = release_frame.visibility.get(shoulder, 0)
            ev = release_frame.visibility.get(elbow, 0)
            if min(sv, ev) > 0.4:
                s_y = release_frame.landmarks[shoulder][1]
                e_y = release_frame.landmarks[elbow][1]
                # Elbow should be at or slightly above shoulder level (lower y = higher)
                diff = s_y - e_y  # positive if elbow is higher
                score = float(np.clip(50 + diff * 500, 0, 100))
                return score, min(sv, ev)

        return 0.0, 0.0

    def _measure_stance_width(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Score stance width relative to shoulder width."""
        scores = []
        confs = []
        for f in sequence.frames:
            if not f.pose_detected:
                continue
            needed = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_ANKLE, LM.RIGHT_ANKLE]
            vis = [f.visibility.get(i, 0) for i in needed]
            if min(vis) < 0.4:
                continue
            ls = f.landmarks[LM.LEFT_SHOULDER]
            rs = f.landmarks[LM.RIGHT_SHOULDER]
            la = f.landmarks[LM.LEFT_ANKLE]
            ra = f.landmarks[LM.RIGHT_ANKLE]
            shoulder_w = abs(rs[0] - ls[0])
            stance_w = abs(ra[0] - la[0])
            if shoulder_w < 0.01:
                continue
            ratio = stance_w / shoulder_w
            # Ideal: 1.0-1.5x shoulder width
            score = float(np.clip(100 - abs(ratio - 1.25) * 80, 0, 100))
            scores.append(score)
            confs.append(min(vis))

        if not scores:
            return 0.0, 0.0
        return float(np.mean(scores)), float(np.mean(confs))
