"""
Unit tests for the scoring engine.
Run with: python -m pytest tests/test_scoring.py -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

import pytest
from scoring.engine import (
    ScoringEngine,
    ScoredMetric,
    normalize_metric,
    get_age_band,
)


class TestAgeBanding:
    def test_under_16(self):
        assert get_age_band(14) == "age_14-16"
        assert get_age_band(16) == "age_14-16"

    def test_17_to_19(self):
        assert get_age_band(17) == "age_17-19"
        assert get_age_band(19) == "age_17-19"

    def test_adult(self):
        assert get_age_band(20) == "age_20+"
        assert get_age_band(35) == "age_20+"


class TestNormalizeMetric:
    def test_at_threshold_equals_70(self):
        # At threshold → 70 points
        threshold = 8.5
        score = normalize_metric(threshold, threshold, "higher_better")
        # At exactly threshold → 70% of the range [floor → ceiling]
        # floor = 8.5 * 0.5 = 4.25, ceiling = 8.5 * 1.5 = 12.75
        # normalized = (8.5 - 4.25) / (12.75 - 4.25) * 100 = 50
        assert 45 <= score <= 55  # ~50 at threshold midpoint

    def test_above_ceiling_returns_100(self):
        score = normalize_metric(100.0, 8.5, "higher_better", ceiling_multiplier=1.5)
        assert score == 100.0

    def test_below_floor_returns_0(self):
        score = normalize_metric(0.0, 8.5, "higher_better", floor_fraction=0.5)
        assert score == 0.0

    def test_lower_better_inverts(self):
        # reaction time: lower is better
        # at threshold → mid score
        threshold = 0.18
        at_threshold = normalize_metric(threshold, threshold, "lower_better")
        below_threshold = normalize_metric(threshold * 0.3, threshold, "lower_better")
        above_threshold = normalize_metric(threshold * 1.8, threshold, "lower_better")
        assert below_threshold > at_threshold
        assert above_threshold < at_threshold

    def test_zero_threshold_returns_50(self):
        score = normalize_metric(5.0, 0.0)
        assert score == 50.0


class TestScoringEngine:
    def setup_method(self):
        self.engine = ScoringEngine(sport="running-100m", age=18)

    def test_score_metric_with_valid_threshold(self):
        metric = self.engine.score_metric(
            name="estimated_step_frequency",
            value=4.0,
            unit="steps/sec",
            threshold_key="step_frequency_hz",
            direction="higher_better",
            confidence=0.8,
        )
        assert 0 <= metric.normalized_score <= 100
        # When threshold IS found, confidence is passed through (rounded to 3dp)
        assert abs(metric.confidence - 0.8) < 0.01
        assert metric.estimated is True

    def test_score_metric_unknown_threshold(self):
        metric = self.engine.score_metric(
            name="unknown_metric",
            value=5.0,
            unit="x",
            threshold_key="nonexistent_key",
            confidence=0.9,
        )
        # Should return neutral score and lower confidence
        assert metric.normalized_score == 50.0
        assert metric.confidence < 0.9

    def test_aggregate_empty_returns_zero(self):
        score = self.engine.aggregate([])
        assert score == 0.0

    def test_aggregate_single_metric(self):
        m = ScoredMetric(
            name="test", raw_value=5.0, unit="x",
            normalized_score=80.0, confidence=1.0
        )
        assert self.engine.aggregate([m]) == 80.0

    def test_aggregate_weighted(self):
        m1 = ScoredMetric(name="a", raw_value=0, unit="", normalized_score=100.0, confidence=1.0)
        m2 = ScoredMetric(name="b", raw_value=0, unit="", normalized_score=0.0, confidence=1.0)
        # Equal weights → 50
        result = self.engine.aggregate([m1, m2])
        assert abs(result - 50.0) < 1.0

    def test_aggregate_confidence_dampening(self):
        m_high_conf = ScoredMetric(name="a", raw_value=0, unit="", normalized_score=80.0, confidence=1.0)
        m_low_conf = ScoredMetric(name="b", raw_value=0, unit="", normalized_score=80.0, confidence=0.1)
        result = self.engine.aggregate([m_high_conf, m_low_conf])
        # Both at 80, result should still be ~80 (dampening pulls low-conf weight)
        assert 70 <= result <= 85

    def test_tier_classification(self):
        assert ScoringEngine.classify_tier(80) == "Advanced"
        assert ScoringEngine.classify_tier(75) == "Advanced"
        assert ScoringEngine.classify_tier(74) == "Intermediate"
        assert ScoringEngine.classify_tier(50) == "Intermediate"
        assert ScoringEngine.classify_tier(49) == "Beginner"
        assert ScoringEngine.classify_tier(0) == "Beginner"


class TestScoringEngineAllSports:
    """Ensure ScoringEngine initializes cleanly for every supported sport."""

    @pytest.mark.parametrize("sport,age", [
        ("running-100m", 16),
        ("running-100m", 22),
        ("long-jump", 17),
        ("shotput", 19),
        ("javelin", 20),
        ("high-jump", 15),
        ("archery", 25),
        ("shooting", 30),
    ])
    def test_engine_initializes(self, sport, age):
        engine = ScoringEngine(sport=sport, age=age)
        assert engine.age_band in ("age_14-16", "age_17-19", "age_20+")
