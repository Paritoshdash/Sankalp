# Sport analyzers package
from .running_100m import Running100mAnalyzer
from .long_jump import LongJumpAnalyzer
from .high_jump import HighJumpAnalyzer
from .shot_put import ShotPutAnalyzer
from .javelin import JavelinAnalyzer
from .archery import ArcheryAnalyzer
from .shooting import ShootingAnalyzer

SPORT_ANALYZER_MAP = {
    "running-100m":  Running100mAnalyzer,
    "long-jump":     LongJumpAnalyzer,
    "high-jump":     HighJumpAnalyzer,
    "shotput":       ShotPutAnalyzer,
    "javelin":       JavelinAnalyzer,
    "archery":       ArcheryAnalyzer,
    "shooting":      ShootingAnalyzer,
}

def get_analyzer(sport: str, age: int, gender: str = "male"):
    cls = SPORT_ANALYZER_MAP.get(sport)
    if cls is None:
        raise ValueError(f"Unknown sport: '{sport}'. Supported: {list(SPORT_ANALYZER_MAP.keys())}")
    return cls(age=age, gender=gender)
