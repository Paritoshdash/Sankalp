"""
Centralized scoring engine.

Input : raw performance metrics + age + sport
Output: normalized 0-100 score with component breakdown

Rules:
  - Uses thresholds.json as the source of truth for benchmarks.
  - Does NOT contain sport-specific logic — that lives in each analyzer.
  - Supports higher-is-better and lower-is-better metrics.
  - Every output score includes the raw value, normalized value, and confidence.
"""
from __future__ import annotations

import math
from dataclasses import dataclass
from typing import Dict, List, Literal, Optional

from config import THRESHOLDS, TIER_ADVANCED, TIER_INTERMEDIATE


@dataclass
class ScoredMetric:
    """A single scored metric with full provenance."""
    name: str
    raw_value: float
    unit: str
    normalized_score: float           # 0-100
    confidence: float                 # 0-1
    estimated: bool = True
    direction: Literal["higher_better", "lower_better"] = "higher_better"
    threshold_used: Optional[float] = None
    note: str = ""


def get_age_band(age: int) -> str:
    """Map athlete age to thresholds.json age key."""
    if age <= 16:
        return "age_14-16"
    elif age <= 19:
        return "age_17-19"
    else:
        return "age_20+"


def normalize_metric(
    value: float,
    threshold: float,
    direction: Literal["higher_better", "lower_better"] = "higher_better",
    ceiling_multiplier: float = 1.5,
    floor_fraction: float = 0.5,
) -> float:
    """
    Converts a raw metric value to a 0-100 score relative to a threshold.

    For higher_better:
      - At threshold value → 70 points (meeting the standard = decent score)
      - At threshold * ceiling_multiplier → 100 points
      - At threshold * floor_fraction → 0 points

    For lower_better (e.g. reaction time):
      - At threshold value → 70 points
      - At threshold * floor_fraction → 100 points  (beat the threshold by a lot)
      - At threshold * ceiling_multiplier → 0 points (much worse than threshold)
    """
    if threshold <= 0:
        return 50.0  # no information

    if direction == "higher_better":
        ceiling = threshold * ceiling_multiplier
        floor = threshold * floor_fraction
        if value >= ceiling:
            return 100.0
        if value <= floor:
            return 0.0
        return 100.0 * (value - floor) / (ceiling - floor)
    else:
        # lower_better
        best = threshold * floor_fraction     # best possible (very low)
        worst = threshold * ceiling_multiplier
        if value <= best:
            return 100.0
        if value >= worst:
            return 0.0
        return 100.0 * (worst - value) / (worst - best)


class ScoringEngine:
    """
    Aggregates multiple scored metrics into a final video analysis score.
    """

    def __init__(self, sport: str, age: int):
        self.sport = sport
        self.age = age
        self.age_band = get_age_band(age)
        self._sport_thresholds = self._load_thresholds()

    def _load_thresholds(self) -> dict:
        sport_data = THRESHOLDS.get(self.sport, {})
        # Try age_band first, then "all_ages" fallback
        return sport_data.get(self.age_band) or sport_data.get("all_ages") or {}

    def score_metric(
        self,
        name: str,
        value: float,
        unit: str,
        threshold_key: str,
        direction: Literal["higher_better", "lower_better"] = "higher_better",
        confidence: float = 0.7,
        ceiling_multiplier: float = 1.5,
        floor_fraction: float = 0.5,
        estimated: bool = True,
        note: str = "",
    ) -> ScoredMetric:
        """Score a single metric against the age-appropriate threshold."""
        threshold = self._sport_thresholds.get(threshold_key)
        if threshold is None:
            # No threshold → use neutral 50 but flag it
            return ScoredMetric(
                name=name, raw_value=value, unit=unit,
                normalized_score=50.0, confidence=confidence * 0.5,
                estimated=True, direction=direction,
                threshold_used=None,
                note=f"No threshold available for '{threshold_key}' in '{self.sport}' / '{self.age_band}'"
            )

        normalized = normalize_metric(value, threshold, direction, ceiling_multiplier, floor_fraction)
        return ScoredMetric(
            name=name, raw_value=value, unit=unit,
            normalized_score=round(normalized, 1),
            confidence=round(confidence, 3),
            estimated=estimated, direction=direction,
            threshold_used=threshold,
            note=note,
        )

    def aggregate(
        self,
        metrics: List[ScoredMetric],
        weights: Optional[Dict[str, float]] = None,
    ) -> float:
        """
        Weighted average of normalized scores.
        If weights is None, equal weighting is used.
        Confidence acts as a secondary weight dampener.
        Returns a 0-100 score.
        """
        if not metrics:
            return 0.0

        total_weight = 0.0
        weighted_sum = 0.0

        for m in metrics:
            w = (weights or {}).get(m.name, 1.0)
            # Dampen by confidence: low-confidence metrics contribute less
            effective_weight = w * (0.5 + 0.5 * m.confidence)
            weighted_sum += m.normalized_score * effective_weight
            total_weight += effective_weight

        if total_weight == 0:
            return 0.0
        return round(min(100.0, max(0.0, weighted_sum / total_weight)), 1)

    @staticmethod
    def classify_tier(overall_score: float) -> str:
        if overall_score >= TIER_ADVANCED:
            return "Advanced"
        elif overall_score >= TIER_INTERMEDIATE:
            return "Intermediate"
        return "Beginner"
