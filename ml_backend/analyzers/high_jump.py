"""
High Jump Analyzer

Important: We do NOT claim actual jump height. The video does not have
calibration data to convert pixel displacement to real-world meters.

What we measure:
  - knee_drive_angle: knee drive during approach/takeoff
  - body_arch_score: how well the athlete achieves the Fosbury Flop arch
  - hip_elevation_score: relative hip elevation above baseline (normalized)
  - shoulder_alignment: shoulders parallel to bar (rotation quality)
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class HighJumpAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "high-jump"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 8:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for high jump analysis."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

        # ── Knee drive ────────────────────────────────────────────────────────
        knee_drive, kd_conf = self._measure_knee_drive(sequence)
        if kd_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="knee_drive_angle",
                value=round(knee_drive, 1),
                unit="degrees",
                threshold_key="knee_drive_angle_deg",
                direction="higher_better",
                confidence=kd_conf,
                ceiling_multiplier=1.2,
                floor_fraction=0.75,
                estimated=True,
                note="Knee drive angle at estimated takeoff. Ideal: >130° for juniors.",
            ))
        else:
            warnings.append("Knee drive angle could not be measured reliably.")

        # ── Body arch (Fosbury Flop back arch) ───────────────────────────────
        arch_score, arch_conf = self._measure_body_arch(sequence)
        if arch_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="body_arch_score",
                value=round(arch_score, 1),
                unit="score/100",
                threshold_key="body_arch_score",
                direction="higher_better",
                confidence=arch_conf,
                ceiling_multiplier=1.4,
                floor_fraction=0.5,
                estimated=True,
                note="Back arch quality during bar clearance phase.",
            ))

        # ── Hip elevation ─────────────────────────────────────────────────────
        hip_elev, he_conf = self._measure_hip_elevation(sequence)
        if he_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="hip_elevation_score",
                value=round(hip_elev, 1),
                unit="score/100",
                threshold_key="hip_elevation_score",
                direction="higher_better",
                confidence=he_conf,
                ceiling_multiplier=1.4,
                floor_fraction=0.5,
                estimated=True,
                note="Relative hip elevation (pixel-space, not real-world height).",
            ))
        else:
            warnings.append("Hip elevation could not be measured (hip landmarks not visible).")

        if not scored_metrics:
            return self._low_data_result(self.sport_id, "Could not extract any reliable metrics.")

        technique_score = engine.aggregate(
            [m for m in scored_metrics if m.name in ["body_arch_score"]]
            or scored_metrics
        )
        performance_score = engine.aggregate(
            [m for m in scored_metrics if m.name in ["knee_drive_angle", "hip_elevation_score"]]
            or scored_metrics
        )
        overall_video_score = round(technique_score * 0.5 + performance_score * 0.5, 1)

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

    def _measure_knee_drive(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Max knee lift angle (hip-knee-ankle) across all frames."""
        left_angles, left_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, min_visibility=0.4
        )
        right_angles, right_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, min_visibility=0.4
        )
        all_angles = left_angles + right_angles
        if not all_angles:
            return 0.0, 0.0
        # Use the maximum angle achieved (best knee drive moment)
        return float(max(all_angles)), max(left_conf, right_conf)

    def _measure_body_arch(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Fosbury flop: back should arch. Measure shoulder-hip-knee angle.
        When athlets arches, shoulders and knees go backward → angle decreases.
        A score is derived from the minimum angle seen (most arched position).
        """
        left_angles, left_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, min_visibility=0.4
        )
        if not left_angles:
            return 0.0, 0.0
        min_angle = min(left_angles)
        # For high jump Fosbury flop: min angle < 100 is a good arch
        score = float(np.clip((170 - min_angle) / 100 * 100, 0, 100))
        return score, left_conf

    def _measure_hip_elevation(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Measures how high (low y in image) the hips get relative to the
        athlete's standing position at the start of the video.
        """
        traj = sequence.get_landmark_trajectory(LM.LEFT_HIP, min_visibility=0.4)
        if len(traj) < 5:
            return 0.0, 0.0

        ys = [t[1] for t in traj]
        baseline_y = float(np.mean(ys[-5:]))  # last frames = standing
        min_y = float(np.min(ys))

        elevation_ratio = (baseline_y - min_y) / (baseline_y + 1e-6)
        score = float(np.clip(elevation_ratio * 200, 0, 100))
        conf = min(1.0, len(traj) / 25)
        return score, conf
