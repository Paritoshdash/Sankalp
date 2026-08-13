"""
Shooting Analyzer

We measure only what video can reasonably provide:
  - stance stability (body sway)
  - arm stability (wrist sway while aiming)
  - shoulder alignment
  - aiming posture (trunk lean, head position)

We do NOT claim:
  - Bullet accuracy
  - Target score
  - Shot timing
"""
from __future__ import annotations

import numpy as np
from typing import List, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class ShootingAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "shooting"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 8:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for shooting analysis."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

        # ── Body stability ────────────────────────────────────────────────────
        sway, sway_conf = self.estimator.measure_body_sway(sequence, LM.NOSE)
        if sway_conf > 0.2:
            scored_metrics.append(engine.score_metric(
                name="body_stability_score",
                value=round(sway * 1000, 2),
                unit="sway_units",
                threshold_key="body_sway_px",
                direction="lower_better",
                confidence=sway_conf,
                estimated=True,
                note="Overall body sway. Lower = more stable platform.",
            ))
        else:
            warnings.append("Body stability could not be measured.")

        # ── Arm stability (wrist) ─────────────────────────────────────────────
        arm_stability, arm_conf = self._measure_arm_stability(sequence)
        if arm_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="arm_stability_score",
                value=round(arm_stability, 1),
                unit="score/100",
                threshold_key="arm_stability_score",
                direction="higher_better",
                confidence=arm_conf,
                ceiling_multiplier=1.4,
                floor_fraction=0.5,
                estimated=True,
                note="Wrist position stability during aiming phase.",
            ))
        else:
            warnings.append("Arm stability could not be measured (wrist not visible).")

        # ── Shoulder alignment ────────────────────────────────────────────────
        shoulder_align, sa_conf = self._measure_shoulder_alignment(sequence)
        if sa_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="shoulder_alignment",
                value=round(shoulder_align, 2),
                unit="degrees",
                threshold_key="shoulder_alignment_deg",
                direction="lower_better",
                confidence=sa_conf,
                ceiling_multiplier=4.0,
                floor_fraction=0.2,
                estimated=True,
                note="Shoulder tilt from horizontal. Closer to 0° = better.",
            ))

        # ── Aiming posture (trunk lean) ───────────────────────────────────────
        posture_score, posture_conf = self._measure_aiming_posture(sequence)
        if posture_conf > 0.3:
            scored_metrics.append(ScoredMetric(
                name="aiming_posture_score",
                raw_value=round(posture_score, 1),
                unit="score/100",
                normalized_score=round(posture_score, 1),
                confidence=round(posture_conf, 3),
                estimated=True,
                note="Trunk uprightness during aiming.",
            ))

        # Explicit note about bullet accuracy
        warnings.append(
            "Bullet/target accuracy cannot be determined from video. "
            "Only stance and posture metrics are reported."
        )

        if not scored_metrics:
            return self._low_data_result(self.sport_id, "Could not extract any reliable metrics.")

        technique_score = engine.aggregate(scored_metrics)
        overall_video_score = round(technique_score, 1)

        return AnalysisResult(
            sport=self.sport_id,
            technique_score=technique_score,
            performance_score=technique_score,
            overall_video_score=overall_video_score,
            metrics=self._build_metrics_dict(scored_metrics),
            scored_metrics=scored_metrics,
            warnings=warnings,
            pose_detection_rate=sequence.pose_detection_rate,
            frames_processed=sequence.total_frames_sampled,
            video_duration_s=sequence.video_duration_s,
        )

    def _measure_arm_stability(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Wrist position stability = inverse of wrist sway."""
        # Right wrist (pistol/rifle)
        wrist_sway, conf = self.estimator.measure_body_sway(sequence, LM.RIGHT_WRIST)
        if conf < 0.2:
            wrist_sway, conf = self.estimator.measure_body_sway(sequence, LM.LEFT_WRIST)
        if conf < 0.2:
            return 0.0, 0.0
        stability = float(np.clip((0.03 - wrist_sway) / 0.03 * 100, 0, 100))
        return stability, conf

    def _measure_shoulder_alignment(self, sequence: PoseSequence) -> Tuple[float, float]:
        deviations = []
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
            tilt = abs(float(np.degrees(np.arctan2(rs[1] - ls[1], rs[0] - ls[0]))))
            deviations.append(tilt)
            confs.append(min(lsv, rsv))
        if not deviations:
            return 0.0, 0.0
        return float(np.mean(deviations)), float(np.mean(confs))

    def _measure_aiming_posture(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Trunk lean during aiming (minimal sway = good)."""
        scores = []
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
            s_mid_x = (ls[0] + rs[0]) / 2
            h_mid_x = (lh[0] + rh[0]) / 2
            s_mid_y = (ls[1] + rs[1]) / 2
            h_mid_y = (lh[1] + rh[1]) / 2
            vert = abs(s_mid_y - h_mid_y)
            if vert < 0.01:
                continue
            lean = abs(s_mid_x - h_mid_x) / vert
            score = max(0.0, 100.0 - lean * 200)
            scores.append(score)
            confs.append(min(vis))
        if not scores:
            return 0.0, 0.0
        return float(np.mean(scores)), float(np.mean(confs))
