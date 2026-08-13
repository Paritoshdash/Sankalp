"""
Long Jump Analyzer

Phases detected:
  1. Approach — body moving toward takeoff
  2. Takeoff — leg fully extended, body airborne
  3. Flight — peak body elevation
  4. Landing — body descends, knees bend

Metrics (all estimated):
  - takeoff_knee_angle: angle at takeoff knee during push-off
  - flight_hip_angle: body position during flight (tuck vs extended)
  - landing_knee_angle: knee bend on landing (absorbs impact)
  - approach_consistency: trunk lean consistency during approach
  - estimated_takeoff_angle: body inclination at takeoff frame
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class LongJumpAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "long-jump"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 8:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for long jump analysis."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

        # ── Takeoff knee angle ────────────────────────────────────────────────
        # The takeoff frame is where one ankle is at minimum y (highest in image)
        takeoff_knee, takeoff_conf = self._measure_takeoff_knee_angle(sequence)
        if takeoff_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="takeoff_knee_angle",
                value=round(takeoff_knee, 1),
                unit="degrees",
                threshold_key="knee_angle_deg",
                direction="higher_better",
                confidence=takeoff_conf,
                ceiling_multiplier=1.2,
                floor_fraction=0.7,
                estimated=True,
                note="Knee extension angle at estimated takeoff frame.",
            ))
        else:
            warnings.append("Could not identify takeoff frame reliably.")

        # ── Estimated takeoff angle ───────────────────────────────────────────
        takeoff_angle, ta_conf = self._estimate_takeoff_angle(sequence)
        if ta_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="estimated_takeoff_angle",
                value=round(takeoff_angle, 1),
                unit="degrees",
                threshold_key="takeoff_angle_deg",
                direction="higher_better",
                confidence=ta_conf,
                ceiling_multiplier=1.5,
                floor_fraction=0.5,
                estimated=True,
                note="Trunk inclination angle at estimated takeoff (not real-world angle).",
            ))
        else:
            warnings.append("Takeoff angle could not be estimated (missing hip/ankle landmarks).")

        # ── Flight body position ──────────────────────────────────────────────
        flight_score, flight_conf = self._measure_flight_position(sequence)
        if flight_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="flight_body_position_score",
                raw_value=round(flight_score, 1),
                unit="score/100",
                normalized_score=round(flight_score, 1),
                confidence=round(flight_conf, 3),
                estimated=True,
                note="Body extension/tuck quality during flight phase.",
            ))

        # ── Landing knee angle ────────────────────────────────────────────────
        landing_knee, landing_conf = self._measure_landing_knee_angle(sequence)
        if landing_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="landing_knee_angle",
                raw_value=round(landing_knee, 1),
                unit="degrees",
                normalized_score=round(np.clip((landing_knee - 90) / 80 * 100, 0, 100), 1),
                confidence=round(landing_conf, 3),
                estimated=True,
                note="Knee angle at landing frame. ~120-140° is good landing absorption.",
            ))
        else:
            warnings.append("Landing frame not clearly detected.")

        if not scored_metrics:
            return self._low_data_result(self.sport_id, "Could not extract any reliable metrics.")

        technique_metrics = [m for m in scored_metrics if m.name in
                             ["flight_body_position_score", "landing_knee_angle"]]
        perf_metrics = [m for m in scored_metrics if m.name in
                       ["takeoff_knee_angle", "estimated_takeoff_angle"]]

        technique_score = engine.aggregate(technique_metrics or scored_metrics)
        performance_score = engine.aggregate(perf_metrics or scored_metrics)
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

    def _measure_takeoff_knee_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Find the frame with the highest ankle position (min y = highest point) as takeoff."""
        # Find frame where center of mass is highest (min y of hip midpoint)
        best_frame = None
        best_y = float("inf")
        for f in sequence.frames:
            if not f.pose_detected:
                continue
            lh = f.landmarks.get(LM.LEFT_HIP)
            rh = f.landmarks.get(LM.RIGHT_HIP)
            if lh and rh:
                mid_y = (lh[1] + rh[1]) / 2
                if mid_y < best_y:
                    best_y = mid_y
                    best_frame = f

        if best_frame is None:
            return 0.0, 0.0

        # Measure knee angle at that frame
        for knee, hip, ankle in [
            (LM.LEFT_KNEE, LM.LEFT_HIP, LM.LEFT_ANKLE),
            (LM.RIGHT_KNEE, LM.RIGHT_HIP, LM.RIGHT_ANKLE),
        ]:
            vis = min(best_frame.visibility.get(hip, 0),
                      best_frame.visibility.get(knee, 0),
                      best_frame.visibility.get(ankle, 0))
            if vis > 0.4:
                h = best_frame.landmarks[hip][:2]
                k = best_frame.landmarks[knee][:2]
                a = best_frame.landmarks[ankle][:2]
                angle = self.estimator.angle_between_points(h, k, a)
                return angle, vis

        return 0.0, 0.0

    def _estimate_takeoff_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Estimate takeoff angle from trunk inclination at the takeoff frame.
        This is NOT the real-world launch angle — it's the body lean angle.
        """
        takeoff_frame = sequence.get_frame_at_landmark_extremum(LM.LEFT_HIP, axis=1, mode="min")
        if takeoff_frame is None:
            return 0.0, 0.0

        needed = [LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_ANKLE]
        vis = min(takeoff_frame.visibility.get(i, 0) for i in needed)
        if vis < 0.4:
            return 0.0, 0.0

        s = takeoff_frame.landmarks[LM.LEFT_SHOULDER][:2]
        h = takeoff_frame.landmarks[LM.LEFT_HIP][:2]
        a = takeoff_frame.landmarks[LM.LEFT_ANKLE][:2]
        angle = self.estimator.angle_between_points(s, h, a)
        return angle, vis

    def _measure_flight_position(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Score body extension during flight.
        During flight, extended hips (hip angle ~160-180) score higher.
        """
        left_angles, conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, min_visibility=0.4
        )
        if not left_angles:
            return 0.0, 0.0
        max_angle = max(left_angles)
        score = np.clip((max_angle - 120) / 60 * 100, 0, 100)
        return float(score), conf

    def _measure_landing_knee_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Landing frame = where the hip reaches a low point (high y value).
        Measure knee angle at that point.
        """
        landing_frame = sequence.get_frame_at_landmark_extremum(LM.LEFT_HIP, axis=1, mode="max")
        if landing_frame is None:
            return 0.0, 0.0

        for knee, hip, ankle in [
            (LM.LEFT_KNEE, LM.LEFT_HIP, LM.LEFT_ANKLE),
            (LM.RIGHT_KNEE, LM.RIGHT_HIP, LM.RIGHT_ANKLE),
        ]:
            vis = min(landing_frame.visibility.get(hip, 0),
                      landing_frame.visibility.get(knee, 0),
                      landing_frame.visibility.get(ankle, 0))
            if vis > 0.4:
                h = landing_frame.landmarks[hip][:2]
                k = landing_frame.landmarks[knee][:2]
                a = landing_frame.landmarks[ankle][:2]
                angle = self.estimator.angle_between_points(h, k, a)
                return angle, vis

        return 0.0, 0.0
