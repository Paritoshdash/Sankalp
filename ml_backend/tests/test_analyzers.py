"""
Unit tests for sport analyzers using mock PoseSequence data.
Run with: python -m pytest tests/test_analyzers.py -v
"""
import sys
import os
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from unittest.mock import patch, MagicMock
import pytest

from pose.estimator import PoseSequence, FrameLandmarks, LM
from analyzers import get_analyzer, SPORT_ANALYZER_MAP


# ── Shared fixture: patch PoseEstimator.__init__ to not load MediaPipe ────────

class MockPoseEstimator:
    """Minimal stand-in for PoseEstimator that provides the geometry methods."""

    @staticmethod
    def angle_between_points(a, b, c):
        from pose.estimator import PoseEstimator as _PE
        return _PE.angle_between_points(a, b, c)

    @staticmethod
    def smooth_trajectory(traj, window=3):
        from pose.estimator import PoseEstimator as _PE
        return _PE.smooth_trajectory(traj, window)

    def get_joint_angle_sequence(self, sequence, lm_a, lm_b, lm_c, min_visibility=0.5):
        from pose.estimator import PoseEstimator as _PE
        return _PE.get_joint_angle_sequence(self, sequence, lm_a, lm_b, lm_c, min_visibility)

    def measure_body_sway(self, sequence, landmark_idx=LM.NOSE):
        from pose.estimator import PoseEstimator as _PE
        return _PE.measure_body_sway(self, sequence, landmark_idx)


def _get_analyzer_with_mock(sport: str, age: int):
    """Get an analyzer with the PoseEstimator replaced by the mock."""
    analyzer = object.__new__(SPORT_ANALYZER_MAP[sport])
    analyzer.age = age
    analyzer.gender = "male"
    analyzer.estimator = MockPoseEstimator()
    return analyzer


def make_mock_landmark(x=0.5, y=0.5, z=0.0):
    return (x, y, z)


def make_running_sequence(n_frames=40, fps=10.0) -> PoseSequence:
    """Build a realistic-looking running sequence with oscillating ankles."""
    import math
    seq = PoseSequence()
    seq.video_fps = fps
    seq.video_duration_s = n_frames / fps

    for i in range(n_frames):
        t = i / fps
        # Oscillate ankles to simulate running
        left_ankle_y = 0.8 + 0.05 * math.sin(2 * math.pi * 2 * t)
        right_ankle_y = 0.8 + 0.05 * math.sin(2 * math.pi * 2 * t + math.pi)

        lms = {
            LM.NOSE: (0.5, 0.1, 0.0),
            LM.LEFT_SHOULDER: (0.45, 0.3, 0.0),
            LM.RIGHT_SHOULDER: (0.55, 0.3, 0.0),
            LM.LEFT_ELBOW: (0.4, 0.45, 0.0),
            LM.RIGHT_ELBOW: (0.6, 0.45, 0.0),
            LM.LEFT_WRIST: (0.38, 0.55, 0.0),
            LM.RIGHT_WRIST: (0.62, 0.55, 0.0),
            LM.LEFT_HIP: (0.45, 0.55, 0.0),
            LM.RIGHT_HIP: (0.55, 0.55, 0.0),
            LM.LEFT_KNEE: (0.44, 0.70, 0.0),
            LM.RIGHT_KNEE: (0.56, 0.70, 0.0),
            LM.LEFT_ANKLE: (0.43, left_ankle_y, 0.0),
            LM.RIGHT_ANKLE: (0.57, right_ankle_y, 0.0),
        }
        vis = {k: 0.9 for k in lms}
        seq.frames.append(FrameLandmarks(
            frame_index=i, timestamp_s=t,
            landmarks=lms, visibility=vis, pose_detected=True
        ))
        seq.pose_detected_count += 1

    seq.total_frames_sampled = n_frames
    return seq


def make_minimal_sequence(n_frames=10) -> PoseSequence:
    """Minimal sequence with all landmarks at neutral positions."""
    seq = PoseSequence()
    seq.video_fps = 10.0
    seq.video_duration_s = n_frames / 10.0

    lms = {
        LM.NOSE: (0.5, 0.1, 0.0),
        LM.LEFT_SHOULDER: (0.45, 0.3, 0.0),
        LM.RIGHT_SHOULDER: (0.55, 0.3, 0.0),
        LM.LEFT_ELBOW: (0.4, 0.45, 0.0),
        LM.RIGHT_ELBOW: (0.6, 0.45, 0.0),
        LM.LEFT_WRIST: (0.38, 0.55, 0.0),
        LM.RIGHT_WRIST: (0.62, 0.25, 0.0),
        LM.LEFT_HIP: (0.45, 0.55, 0.0),
        LM.RIGHT_HIP: (0.55, 0.55, 0.0),
        LM.LEFT_KNEE: (0.44, 0.70, 0.0),
        LM.RIGHT_KNEE: (0.56, 0.70, 0.0),
        LM.LEFT_ANKLE: (0.43, 0.85, 0.0),
        LM.RIGHT_ANKLE: (0.57, 0.85, 0.0),
        LM.LEFT_HEEL: (0.42, 0.88, 0.0),
        LM.RIGHT_HEEL: (0.58, 0.88, 0.0),
    }
    vis = {k: 0.85 for k in lms}

    for i in range(n_frames):
        seq.frames.append(FrameLandmarks(
            frame_index=i, timestamp_s=i / 10.0,
            landmarks=lms.copy(), visibility=vis.copy(), pose_detected=True
        ))
        seq.pose_detected_count += 1

    seq.total_frames_sampled = n_frames
    return seq


def make_empty_sequence() -> PoseSequence:
    seq = PoseSequence()
    seq.total_frames_sampled = 5
    for i in range(5):
        seq.frames.append(FrameLandmarks(
            frame_index=i, timestamp_s=i / 10.0,
            landmarks={}, visibility={}, pose_detected=False
        ))
    return seq


class TestAnalyzerRegistry:
    def test_all_sports_registered(self):
        expected = ["running-100m", "long-jump", "high-jump", "shotput", "javelin", "archery", "shooting"]
        for sport in expected:
            assert sport in SPORT_ANALYZER_MAP, f"Missing: {sport}"

    def test_get_analyzer_returns_instance(self):
        for sport in SPORT_ANALYZER_MAP:
            analyzer = _get_analyzer_with_mock(sport=sport, age=18)
            assert analyzer is not None

    def test_get_analyzer_invalid_sport_raises(self):
        with pytest.raises(ValueError, match="Unknown sport"):
            get_analyzer(sport="table_tennis", age=20)


class TestRunningAnalyzer:
    def setup_method(self):
        self.analyzer = _get_analyzer_with_mock("running-100m", age=18)

    def test_running_produces_result(self):
        seq = make_running_sequence(n_frames=40)
        result = self.analyzer.analyze(seq)
        assert result.sport == "running-100m"
        assert 0 <= result.overall_video_score <= 100
        assert 0 <= result.technique_score <= 100
        assert 0 <= result.performance_score <= 100

    def test_running_empty_sequence_returns_low_data_result(self):
        seq = make_empty_sequence()
        result = self.analyzer.analyze(seq)
        assert result.overall_video_score == 0.0
        assert len(result.warnings) > 0

    def test_running_metrics_have_confidence(self):
        seq = make_running_sequence(n_frames=40)
        result = self.analyzer.analyze(seq)
        for name, m in result.metrics.items():
            assert "confidence" in m
            if m.get("value") is not None:
                assert 0 <= m["confidence"] <= 1


class TestAllAnalyzersWithMinimalData:
    """Ensure all analyzers return valid AnalysisResult with minimal data."""

    @pytest.mark.parametrize("sport", list(SPORT_ANALYZER_MAP.keys()))
    def test_minimal_sequence(self, sport):
        analyzer = _get_analyzer_with_mock(sport=sport, age=18)
        seq = make_minimal_sequence(n_frames=12)
        result = analyzer.analyze(seq)
        assert 0 <= result.overall_video_score <= 100
        assert 0 <= result.technique_score <= 100
        assert isinstance(result.warnings, list)
        assert isinstance(result.metrics, dict)

    @pytest.mark.parametrize("sport", list(SPORT_ANALYZER_MAP.keys()))
    def test_empty_sequence_graceful(self, sport):
        analyzer = _get_analyzer_with_mock(sport=sport, age=18)
        seq = make_empty_sequence()
        result = analyzer.analyze(seq)
        assert result.overall_video_score == 0.0
        assert len(result.warnings) > 0

    @pytest.mark.parametrize("sport", list(SPORT_ANALYZER_MAP.keys()))
    def test_various_ages(self, sport):
        seq = make_minimal_sequence(n_frames=12)
        for age in [14, 17, 22, 35]:
            analyzer = _get_analyzer_with_mock(sport=sport, age=age)
            result = analyzer.analyze(seq)
            assert 0 <= result.overall_video_score <= 100


class TestTierClassification:
    def test_tier_based_on_score(self):
        from scoring.engine import ScoringEngine
        assert ScoringEngine.classify_tier(80) == "Advanced"
        assert ScoringEngine.classify_tier(60) == "Intermediate"
        assert ScoringEngine.classify_tier(30) == "Beginner"
