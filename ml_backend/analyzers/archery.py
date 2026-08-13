"""
Archery Analyzer

We measure technique only — NOT target accuracy (not visible in video).

Metrics:
  - draw_arm_angle: elbow angle of the drawing arm
  - bow_arm_stability: sway of the bow arm wrist over time
  - shoulder_alignment: alignment of both shoulders to the target line
  - body_stability: overall body sway during the shot
  - anchor_consistency: consistency of wrist position at anchor point

target_accuracy_score = null (cannot be determined from video without target data)
"""
from __future__ import annotations

import numpy as np
from typing import List, Optional, Tuple

from .base import BaseSportAnalyzer, AnalysisResult
from pose.estimator import PoseSequence, LM
from scoring.engine import ScoredMetric


class ArcheryAnalyzer(BaseSportAnalyzer):

    @property
    def sport_id(self) -> str:
        return "archery"

    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        if sequence.pose_detection_rate < 0.20 or len(sequence.frames) < 8:
            return self._low_data_result(
                self.sport_id,
                "Insufficient pose data for archery analysis."
            )

        engine = self._make_engine()
        scored_metrics: List[ScoredMetric] = []
        warnings: List[str] = []

        # ── Draw arm angle ────────────────────────────────────────────────────
        draw_angle, da_conf = self._measure_draw_arm_angle(sequence)
        if da_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="draw_arm_elbow_angle",
                value=round(draw_angle, 1),
                unit="degrees",
                threshold_key="elbow_angle_deg",
                direction="higher_better",
                confidence=da_conf,
                ceiling_multiplier=1.15,
                floor_fraction=0.75,
                estimated=True,
                note="Draw arm elbow angle. Ideal: ~140-155° for recurve.",
            ))
        else:
            warnings.append("Draw arm elbow angle could not be measured.")

        # ── Body stability (overall sway) ─────────────────────────────────────
        sway, sway_conf = self.estimator.measure_body_sway(sequence, LM.NOSE)
        if sway_conf > 0.2:
            # Lower sway = better. Scale: sway > 0.05 = very unstable
            stability_score = float(np.clip((0.05 - sway) / 0.05 * 100, 0, 100))
            scored_metrics.append(engine.score_metric(
                name="body_stability_score",
                value=round(sway * 1000, 2),  # report as normalised pixels * 1000
                unit="sway_units",
                threshold_key="body_sway_px",
                direction="lower_better",
                confidence=sway_conf,
                estimated=True,
                note="Body sway during aiming. Lower = more stable.",
            ))
        else:
            warnings.append("Body stability could not be measured (nose landmark not visible).")

        # ── Shoulder alignment ────────────────────────────────────────────────
        shoulder_align, sa_conf = self._measure_shoulder_alignment(sequence)
        if sa_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="shoulder_alignment_score",
                value=round(shoulder_align, 2),
                unit="degrees",
                threshold_key="shoulder_alignment_deg",
                direction="lower_better",
                confidence=sa_conf,
                ceiling_multiplier=4.0,
                floor_fraction=0.2,
                estimated=True,
                note="Shoulder tilt deviation from horizontal. Closer to 0° = better.",
            ))
        else:
            warnings.append("Shoulder alignment could not be measured.")

        # ── Draw consistency ──────────────────────────────────────────────────
        draw_consistency, dc_conf = self._measure_draw_consistency(sequence)
        if dc_conf > 0.3:
            scored_metrics.append(engine.score_metric(
                name="draw_consistency_score",
                value=round(draw_consistency, 1),
                unit="score/100",
                threshold_key="draw_consistency_score",
                direction="higher_better",
                confidence=dc_conf,
                ceiling_multiplier=1.3,
                floor_fraction=0.5,
                estimated=True,
                note="Wrist position consistency during hold phase.",
            ))

        # Note: target accuracy is explicitly null
        warnings.append(
            "Target accuracy score is null — target-to-arrow accuracy "
            "cannot be determined from video without target visibility."
        )

        if not scored_metrics:
            return self._low_data_result(self.sport_id, "Could not extract any reliable metrics.")

        technique_score = engine.aggregate(scored_metrics)
        performance_score = technique_score  # No measurable perf metric without target
        overall_video_score = round(technique_score, 1)

        metrics_dict = self._build_metrics_dict(scored_metrics)
        # Explicitly mark target accuracy as null
        metrics_dict["target_accuracy_score"] = {
            "value": None,
            "unit": None,
            "confidence": 0.0,
            "estimated": False,
            "note": "Cannot be determined from video without visible target data.",
        }

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

    def _measure_draw_arm_angle(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Max elbow extension on the drawing arm during hold phase."""
        right_angles, right_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.RIGHT_SHOULDER, LM.RIGHT_ELBOW, LM.RIGHT_WRIST, min_visibility=0.4
        )
        left_angles, left_conf = self.estimator.get_joint_angle_sequence(
            sequence, LM.LEFT_SHOULDER, LM.LEFT_ELBOW, LM.LEFT_WRIST, min_visibility=0.4
        )
        all_angles = right_angles + left_angles
        if not all_angles:
            return 0.0, 0.0
        return float(np.mean(all_angles)), max(right_conf, left_conf)

    def _measure_shoulder_alignment(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Deviation of shoulder axis from horizontal."""
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
            tilt = abs(np.degrees(np.arctan2(rs[1] - ls[1], rs[0] - ls[0])))
            deviations.append(tilt)
            confs.append(min(lsv, rsv))

        if not deviations:
            return 0.0, 0.0
        return float(np.mean(deviations)), float(np.mean(confs))

    def _measure_draw_consistency(self, sequence: PoseSequence) -> Tuple[float, float]:
        """Consistency of wrist position during the hold phase (low variance = good)."""
        wrist_traj = sequence.get_landmark_trajectory(LM.RIGHT_WRIST, min_visibility=0.4)
        if len(wrist_traj) < 5:
            return 0.0, 0.0
        xs = [t[0] for t in wrist_traj]
        ys = [t[1] for t in wrist_traj]
        variance = float(np.std(xs) + np.std(ys))
        score = float(np.clip((0.05 - variance) / 0.05 * 100, 0, 100))
        conf = min(1.0, len(wrist_traj) / 20)
        return score, conf
