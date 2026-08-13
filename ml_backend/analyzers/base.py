"""
Abstract base class for all sport analyzers.

Each subclass MUST implement:
  - analyze(sequence) → AnalysisResult

The base class provides:
  - Shared utility: pose estimator access
  - Standardized result structure
  - Common metric helpers
"""
from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from typing import Dict, List, Optional

from pose.estimator import PoseEstimator, PoseSequence
from scoring.engine import ScoredMetric, ScoringEngine


@dataclass
class AnalysisResult:
    """Standardized analysis result — all analyzers produce this."""
    sport: str
    technique_score: float             # 0-100 — form/posture quality
    performance_score: float           # 0-100 — measurable performance metrics
    overall_video_score: float         # weighted combination
    metrics: Dict[str, dict]           # name → {value, unit, confidence, estimated, note}
    scored_metrics: List[ScoredMetric] = field(default_factory=list)
    warnings: List[str] = field(default_factory=list)
    pose_detection_rate: float = 0.0
    frames_processed: int = 0
    video_duration_s: float = 0.0


class BaseSportAnalyzer(ABC):
    """
    All sport analyzers inherit from this.
    They receive a PoseSequence and return an AnalysisResult.
    """

    def __init__(self, age: int = 20, gender: str = "male"):
        self.age = age
        self.gender = gender
        self.estimator = PoseEstimator()

    @abstractmethod
    def analyze(self, sequence: PoseSequence) -> AnalysisResult:
        """Perform sport-specific analysis. Must not raise."""
        ...

    @property
    @abstractmethod
    def sport_id(self) -> str:
        """Return the sport identifier matching thresholds.json keys."""
        ...

    def _make_engine(self) -> ScoringEngine:
        return ScoringEngine(sport=self.sport_id, age=self.age)

    def _build_metrics_dict(self, scored: List[ScoredMetric]) -> Dict[str, dict]:
        """Convert ScoredMetric list to JSON-serializable dict."""
        result = {}
        for m in scored:
            result[m.name] = {
                "value": m.raw_value,
                "unit": m.unit,
                "normalized_score": m.normalized_score,
                "confidence": m.confidence,
                "estimated": m.estimated,
                "threshold_used": m.threshold_used,
                "note": m.note,
            }
        return result

    def _low_data_result(self, sport: str, reason: str) -> AnalysisResult:
        """Return a safe result when there is insufficient pose data."""
        return AnalysisResult(
            sport=sport,
            technique_score=0.0,
            performance_score=0.0,
            overall_video_score=0.0,
            metrics={},
            warnings=[reason],
            pose_detection_rate=0.0,
        )
