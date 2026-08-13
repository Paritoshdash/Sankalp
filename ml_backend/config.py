"""
Central configuration for the Sankalp ML backend.
All tunable constants live here — do not scatter them across analyzers.
"""
import json
import os
from pathlib import Path

# ── Processing limits ─────────────────────────────────────────────────────────
MAX_VIDEO_SIZE_MB: int = int(os.getenv("MAX_VIDEO_SIZE_MB", "100"))
MAX_VIDEO_DURATION_S: int = int(os.getenv("MAX_VIDEO_DURATION_S", "60"))
ANALYSIS_FPS: int = int(os.getenv("ANALYSIS_FPS", "10"))           # sample every N-th frame
MAX_ANALYSIS_FRAMES: int = int(os.getenv("MAX_ANALYSIS_FRAMES", "300"))
FRAME_RESIZE_WIDTH: int = int(os.getenv("FRAME_RESIZE_WIDTH", "640"))

# ── Pose estimation ───────────────────────────────────────────────────────────
MODEL_CONFIDENCE_THRESHOLD: float = float(os.getenv("MODEL_CONFIDENCE_THRESHOLD", "0.5"))
MIN_POSE_DETECTION_RATE: float = float(os.getenv("MIN_POSE_DETECTION_RATE", "0.3"))

# ── Model identity ────────────────────────────────────────────────────────────
MODEL_NAME: str = "sankalp_pose_analyzer"
MODEL_VERSION: str = "1.0.0"

# ── Tier thresholds (overall_score) ──────────────────────────────────────────
TIER_ADVANCED: float = float(os.getenv("TIER_ADVANCED", "75.0"))
TIER_INTERMEDIATE: float = float(os.getenv("TIER_INTERMEDIATE", "50.0"))
# Below TIER_INTERMEDIATE → Beginner

# ── Overall score weights ─────────────────────────────────────────────────────
# excellence_score * W_EXCELLENCE + fitness_score * W_FITNESS + video_score * W_VIDEO = overall_score
W_EXCELLENCE: float = float(os.getenv("W_EXCELLENCE", "0.30"))
W_FITNESS: float = float(os.getenv("W_FITNESS", "0.30"))
W_VIDEO: float = float(os.getenv("W_VIDEO", "0.40"))

# ── Thresholds from the shared lib ───────────────────────────────────────────
_THRESHOLDS_PATH = Path(__file__).parent.parent / "lib" / "thresholds.json"

def load_thresholds() -> dict:
    if _THRESHOLDS_PATH.exists():
        with open(_THRESHOLDS_PATH, "r") as f:
            return json.load(f)
    # Fallback inline thresholds matching the existing thresholds.json
    return {
        "running-100m": {
            "age_14-16": {"speed_m_s": 7.5, "reaction_time_s": 0.2, "step_frequency_hz": 3.5},
            "age_17-19": {"speed_m_s": 8.5, "reaction_time_s": 0.18, "step_frequency_hz": 4.0},
            "age_20+":   {"speed_m_s": 9.0, "reaction_time_s": 0.16, "step_frequency_hz": 4.3},
        },
        "long-jump": {
            "age_14-16": {"takeoff_speed_m_s": 6.0, "takeoff_angle_deg": 18, "knee_angle_deg": 140},
            "age_17-19": {"takeoff_speed_m_s": 7.0, "takeoff_angle_deg": 20, "knee_angle_deg": 145},
            "age_20+":   {"takeoff_speed_m_s": 7.5, "takeoff_angle_deg": 22, "knee_angle_deg": 150},
        },
        "shotput": {
            "age_14-16": {"release_speed_m_s": 10.0, "release_angle_deg": 35, "hip_shoulder_rotation_deg": 30},
            "age_17-19": {"release_speed_m_s": 12.0, "release_angle_deg": 38, "hip_shoulder_rotation_deg": 40},
            "age_20+":   {"release_speed_m_s": 13.5, "release_angle_deg": 40, "hip_shoulder_rotation_deg": 45},
        },
        "javelin": {
            "age_14-16": {"release_angle_deg": 30, "elbow_angle_deg": 160, "shoulder_rotation_deg": 35},
            "age_17-19": {"release_angle_deg": 33, "elbow_angle_deg": 165, "shoulder_rotation_deg": 40},
            "age_20+":   {"release_angle_deg": 35, "elbow_angle_deg": 168, "shoulder_rotation_deg": 45},
        },
        "high-jump": {
            "age_14-16": {"knee_drive_angle_deg": 130, "hip_elevation_score": 60, "body_arch_score": 55},
            "age_17-19": {"knee_drive_angle_deg": 140, "hip_elevation_score": 70, "body_arch_score": 65},
            "age_20+":   {"knee_drive_angle_deg": 150, "hip_elevation_score": 80, "body_arch_score": 75},
        },
        "archery": {
            "all_ages": {
                "shoulder_alignment_deg": 5,
                "elbow_angle_deg": 150,
                "body_sway_px": 20,
                "draw_consistency_score": 70,
            }
        },
        "shooting": {
            "all_ages": {
                "body_sway_px": 15,
                "arm_stability_score": 70,
                "shoulder_alignment_deg": 5,
            }
        },
    }

THRESHOLDS: dict = load_thresholds()
