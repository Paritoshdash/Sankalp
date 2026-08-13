"""
Javelin Throw Analyzer

Metrics:
  - estimated_release_angle: arm angle at release frame
  - shoulder_rotation_score: shoulder turn during wind-up
  - elbow_extension_score: elbow angle at release
  - cross_step_score: body lean/approach alignment
  - follow_through_score: arm extension after release
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class JavelinAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "javelin"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 6:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for javelin throw analysis."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

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
                ceiling_multiplier=1.4,
                floor_fraction=0.6,
                estimated=True,
                note="Arm angle at estimated release frame (not real-world projection angle).",
            ))
        else:
            warnings.append("Release angle estimation failed — wrist/elbow not clearly visible.")

        # ── Elbow extension ───────────────────────────────────────────────────
        elbow_score, elbow_conf = self._measure_elbow_extension(sequence)
        if elbow_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="elbow_extension_score",
                value=round(elbow_score, 1),
                unit="degrees",
                threshold_key="elbow_angle_deg",
                direction="higher_better",
                confidence=elbow_conf,
                ceiling_multiplier=1.15,
                floor_fraction=0.8,
                estimated=True,
                note="Elbow extension angle at release. Ideal: ~160-170°.",
            ))
        else:
            warnings.append("Elbow extension could not be measured.")

        # ── Shoulder rotation ─────────────────────────────────────────────────
        shoulder_rot, sr_conf = self._measure_shoulder_rotation(sequence)
        if sr_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="shoulder_rotation_score",
                value=round(shoulder_rot, 1),
                unit="degrees",
                threshold_key="shoulder_rotation_deg",
                direction="higher_better",
                confidence=sr_conf,
                ceiling_multiplier=1.5,
                floor_fraction=0.4,
                estimated=True,
                note="Max shoulder rotation range during throw.",
            ))

        # ── Follow-through ────────────────────────────────────────────────────
        followthrough, ft_conf = self._measure_follow_through(sequence)
        if ft_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="follow_through_score",
                raw_value=round(followthrough, 1),
                unit="score/100",
                normalized_score=round(followthrough, 1),
                confidence=round(ft_conf, 3),
                estimated=True,
                note="Arm extension and deceleration after release.",
            ))

        if not scored_metrics:
            return self._low_data_result(self.sport_id, "Could not extract any reliable metrics.")

        technique_score = engine.aggregate(
            [m for m in scored_metrics if m.name in ["elbow_extension_score", "follow_through_score"]]
            or scored_metrics
        )
        performance_score = engine.aggregate(
            [m for m in scored_metrics if m.name in ["estimated_release_angle", "shoulder_rotation_score"]]
            or scored_metrics
        )
        overall_video_score = round(technique_score * 0.45 + performance_score * 0.55, 1)

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

    def _estimate_release_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Release = highest wrist position. Measure shoulder-elbow-wrist angle."""
        release_frame = sequence.get_frame_at_landmark_extremum(LM.RIGHT_WRIST, axis=1, mode="min")
        if release_frame is None:
            return 0.0, 0.0

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
                return self.estimator.angle_between_points(s, e, w), vis

        return 0.0, 0.0

    def _measure_elbow_extension(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Max elbow extension (shoulder-elbow-wrist) across all frames."""
        right_angles, right_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, min_visibility=0.4
        )
        left_angles, left_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, min_visibility=0.4
        )
        all_angles = right_angles + left_angles
        if not all_angles:
            return 0.0, 0.0
        return float(max(all_angles)), max(right_conf, left_conf)

    def _measure_shoulder_rotation(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Range of shoulder axis rotation across the throw."""
        angles = []
        confs = []
        for f in sequence.frames:
            if not f.pose_detected:
                continue
            lsv = f.visibility.get(LM.LEFT_SHOULDER, 0)
            rsv = f.visibility.get(LM.RIGHT_SHOULDER, 0)
            if min(lsv, rsv) < 0.4:
                continue
            ls = f.landmarks[LM.LEFT_SHOULDER]
            rs = f.landmarks[LM.RIGHT_SHOULDER]
            angle = np.degrees(np.arctan2(rs[1] - ls[1], rs[0] - ls[0]))
            angles.append(angle)
            confs.append(min(lsv, rsv))

        if len(angles) < 3:
            return 0.0, 0.0
        rotation_range = float(np.max(angles) - np.min(angles))
        return rotation_range, float(np.mean(confs))

    def _measure_follow_through(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        After the release frame, the throwing arm should continue its arc.
        Score = how much the wrist continues moving after the release frame.
        """
        wrist_traj = sequence.get_landmark_trajectory(LM.RIGHT_WRIST, min_visibility=0.4)
        if len(wrist_traj) < 6:
            return 0.0, 0.0

        # Find release frame (minimum y = highest point)
        min_y_idx = int(np.argmin([t[1] for t in wrist_traj]))
        after = wrist_traj[min_y_idx:]

        if len(after) < 3:
            return 0.0, 0.0

        # Movement after release
        total_movement = sum(
            ((after[i][0] - after[i-1][0])**2 + (after[i][1] - after[i-1][1])**2)**0.5
            for i in range(1, len(after))
        )
        score = float(np.clip(total_movement * 200, 0, 100))
        conf = min(1.0, len(after) / 10)
        return score, conf
