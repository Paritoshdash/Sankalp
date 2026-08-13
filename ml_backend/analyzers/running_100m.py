"""
100m Sprint Analyzer

What we measure from video (without calibration):
  - estimated_step_frequency: foot oscillation rate (Hz) via ankle y-trajectory
  - knee_lift_score: average max knee angle during swing phase (higher = better knee drive)
  - hip_angle_score: average hip flexion angle during running
  - posture_score: trunk uprightness (shoulder midpoint vs hip midpoint vertical deviation)
  - movement_consistency: variance in step cadence (lower variance = more consistent)

What we do NOT claim:
  - Exact speed in m/s (no camera calibration)
  - Exact race time (video may not capture full 100m)
  - Exact stride length in meters
All reported values are labeled estimated=True.
"""
from __future__ import annotations

import math
import numpy as np
from typing import List, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class Running100mAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "running-100m"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 10:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for 100m running analysis. "
                "Ensure the runner is fully visible in the frame."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

        # ── Step frequency (cadence) ─────────────────────────────────────────
        step_freq, step_freq_conf = self._estimate_step_frequency(sequence)
        if step_freq is not None and step_freq_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="estimated_step_frequency",
                value=round(step_freq, 2),
                unit="steps/sec",
                threshold_key="step_frequency_hz",
                direction="higher_better",
                confidence=step_freq_conf,
                ceiling_multiplier=1.4,
                floor_fraction=0.6,
                estimated=True,
                note="Derived from ankle y-axis oscillation frequency.",
            ))
        else:
            warnings.append("Could not reliably estimate step frequency. Ankle landmarks not visible.")

        # ── Knee lift score ──────────────────────────────────────────────────
        knee_score, knee_conf = self._measure_knee_lift(sequence)
        if knee_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="knee_lift_score",
                raw_value=round(knee_score, 1),
                unit="score/100",
                normalized_score=round(knee_score, 1),
                confidence=round(knee_conf, 3),
                estimated=True,
                direction="higher_better",
                note="Based on average knee flexion angle during swing phase.",
            ))
        else:
            warnings.append("Knee landmark visibility too low for knee lift analysis.")

        # ── Posture (trunk upright) ───────────────────────────────────────────
        posture_score, posture_conf = self._measure_trunk_posture(sequence)
        if posture_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="posture_score",
                raw_value=round(posture_score, 1),
                unit="score/100",
                normalized_score=round(posture_score, 1),
                confidence=round(posture_conf, 3),
                estimated=True,
                direction="higher_better",
                note="Trunk vertical alignment (shoulder vs hip midpoint).",
            ))

        # ── Hip mobility ──────────────────────────────────────────────────────
        hip_score, hip_conf = self._measure_hip_angle(sequence)
        if hip_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="hip_angle_score",
                raw_value=round(hip_score, 1),
                unit="score/100",
                normalized_score=round(hip_score, 1),
                confidence=round(hip_conf, 3),
                estimated=True,
                direction="higher_better",
                note="Average hip flexion angle relative to ideal sprint mechanics.",
            ))

        # ── Movement consistency ──────────────────────────────────────────────
        consistency, cons_conf = self._measure_movement_consistency(sequence)
        if cons_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="movement_consistency",
                raw_value=round(consistency, 1),
                unit="score/100",
                normalized_score=round(consistency, 1),
                confidence=round(cons_conf, 3),
                estimated=True,
                direction="higher_better",
                note="Cadence regularity (lower cadence variance = higher score).",
            ))

        if not scored_metrics:
            return self._low_data_result(
                self.sport_id,
                "Could not extract any reliable metrics from this video."
            )

        # ── Scoring weights ───────────────────────────────────────────────────
        weights = {
            "estimated_step_frequency": 2.0,
            "knee_lift_score": 1.5,
            "posture_score": 1.5,
            "hip_angle_score": 1.0,
            "movement_consistency": 1.0,
        }
        technique_metrics = [m for m in scored_metrics if m.name != "estimated_step_frequency"]
        perf_metrics = [m for m in scored_metrics if m.name == "estimated_step_frequency"]

        technique_score = engine.aggregate(technique_metrics or scored_metrics)
        performance_score = engine.aggregate(perf_metrics or scored_metrics)
        overall_video_score = round(technique_score * 0.5 + performance_score * 0.5, 1)

        metrics_dict = self._build_metrics_dict(scored_metrics)

        return AnalysisResult(
            sport=self.sport_id,
            technique_score=technique_score,
            performance_score=performance_score,
            overall_video_score=overall_video_score,
            metrics=metrics_dict,
            scored_metrics=scored_metrics,
            warnings=warnings,
            pose_detection_rate=sequence.pose_detection_rate,
            frames_processed=sequence.total_frames_sampled,
            video_duration_s=sequence.video_duration_s,
        )

    # ── Private metric extraction ─────────────────────────────────────────────

    def _estimate_step_frequency(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Estimates step frequency by counting oscillation cycles in ankle y-positions.
        Returns (frequency_hz, confidence).
        """
        left_traj = sequence.get_landmark_trajectory(LM.LEFT_ANKLE, min_visibility=0.4)
        right_traj = sequence.get_landmark_trajectory(LM.RIGHT_ANKLE, min_visibility=0.4)

        if len(left_traj) < 10 and len(right_traj) < 10:
            return None, 0.0

        # Use whichever ankle has more data
        traj = left_traj if len(left_traj) >= len(right_traj) else right_traj
        smoothed = self.estimator.smooth_trajectory(traj, window=3)

        if len(smoothed) < 6:
            return None, 0.0

        ys = np.array([t[1] for t in smoothed])
        times = np.array([t[3] for t in smoothed])
        duration = times[-1] - times[0]

        if duration < 0.5:
            return None, 0.0

        # Count zero-crossings of the de-meaned signal → approximates step count
        ys_norm = ys - np.mean(ys)
        crossings = np.where(np.diff(np.signbit(ys_norm)))[0]
        half_cycles = len(crossings)
        step_freq = half_cycles / (2 * duration)

        # Clamp to realistic range: 2-6 steps/sec
        if step_freq < 1.5 or step_freq > 8.0:
            return None, 0.2

        confidence = min(1.0, len(traj) / 40)
        return step_freq, confidence

    def _measure_knee_lift(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Scores knee lift from hip-knee-ankle angle. Higher knee drive → larger angle."""
        # Use both legs; pick the one with better visibility
        left_angles, left_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_HIP, LM.LEFT_KNEE, LM.LEFT_ANKLE, min_visibility=0.4
        )
        right_angles, right_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.RIGHT_HIP, LM.RIGHT_KNEE, LM.RIGHT_ANKLE, min_visibility=0.4
        )

        if not left_angles and not right_angles:
            return 0.0, 0.0

        all_angles = left_angles + right_angles
        conf = max(left_conf, right_conf)
        mean_angle = float(np.mean(all_angles))

        # Ideal knee angle during sprint swing phase: ~120-150 degrees
        # Map 90-170 degrees → 0-100 score
        score = np.clip((mean_angle - 90) / 80 * 100, 0, 100)
        return float(score), conf

    def _measure_trunk_posture(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Measures trunk lean. A sprinter should have a slight forward lean early,
        then more upright. We score uprightness as the alignment of
        shoulder-midpoint → hip-midpoint vertical deviation.
        """
        scores = []
        confs = []
        for f in sequence.frames:
            if not f.pose_detected:
                continue
            needed = [LM.LEFT_SHOULDER, LM.RIGHT_SHOULDER, LM.LEFT_HIP, LM.RIGHT_HIP]
            if any(f.visibility.get(i, 0) < 0.4 for i in needed):
                continue
            ls = f.landmarks[LM.LEFT_SHOULDER]
            rs = f.landmarks[LM.RIGHT_SHOULDER]
            lh = f.landmarks[LM.LEFT_HIP]
            rh = f.landmarks[LM.RIGHT_HIP]
            shoulder_mid_x = (ls[0] + rs[0]) / 2
            hip_mid_x = (lh[0] + rh[0]) / 2
            shoulder_mid_y = (ls[1] + rs[1]) / 2
            hip_mid_y = (lh[1] + rh[1]) / 2
            # Horizontal deviation relative to vertical extent
            vertical = abs(shoulder_mid_y - hip_mid_y)
            if vertical < 0.01:
                continue
            lean = abs(shoulder_mid_x - hip_mid_x) / vertical
            # lean close to 0 → upright; lean > 0.5 → heavy forward lean
            score = max(0, 100 - lean * 150)
            scores.append(score)
            confs.append(min(f.visibility.get(LM.LEFT_SHOULDER, 0),
                             f.visibility.get(LM.RIGHT_SHOULDER, 0)))

        if not scores:
            return 0.0, 0.0
        return float(np.mean(scores)), float(np.mean(confs))

    def _measure_hip_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Measures hip flexion angle (shoulder-hip-knee). Higher during sprint = better."""
        left_angles, left_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_SHOULDER, LM.LEFT_HIP, LM.LEFT_KNEE, min_visibility=0.4
        )
        right_angles, right_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.RIGHT_SHOULDER, LM.RIGHT_HIP, LM.RIGHT_KNEE, min_visibility=0.4
        )
        all_angles = left_angles + right_angles
        if not all_angles:
            return 0.0, 0.0
        mean_angle = float(np.mean(all_angles))
        # Typical hip flexion during sprint: 100-140 degrees → map to score
        score = np.clip((mean_angle - 80) / 80 * 100, 0, 100)
        return float(score), max(left_conf, right_conf)

    def _measure_movement_consistency(self, sequence: PoseSequence) -> Tuple[float, float]:
        """
        Measures consistency of left-right ankle movement. Low variance = high score.
        """
        left_traj = sequence.get_landmark_trajectory(LM.LEFT_ANKLE, min_visibility=0.4)
        if len(left_traj) < 8:
            return 0.0, 0.0

        ys = np.array([t[1] for t in left_traj])
        ys_norm = ys - np.mean(ys)
        crossings = np.where(np.diff(np.signbit(ys_norm)))[0]
        if len(crossings) < 3:
            return 0.0, 0.2

        gaps = np.diff(crossings)
        cv = float(np.std(gaps) / (np.mean(gaps) + 1e-6))
        # cv = 0 → perfect consistency; cv = 1 → very inconsistent
        score = max(0, 100 - cv * 150)
        conf = min(1.0, len(left_traj) / 30)
        return float(score), conf
