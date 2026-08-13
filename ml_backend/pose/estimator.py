"""
Reusable Pose Estimator — works with MediaPipe 0.10.x (Tasks API).

Responsibilities:
  - Frame extraction from video (via OpenCV)
  - Landmark detection with confidence gating
  - Temporal smoothing of landmark positions
  - Joint angle calculation
  - Movement trajectory extraction

Important:
  - Never calculates metrics from a single frame.
  - Handles missing/low-confidence landmarks gracefully.
  - Returns confidence per landmark/metric.
"""
from __future__ import annotations

import math
import os
import urllib.request
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import cv2
import numpy as np

from config import (
    ANALYSIS_FPS,
    FRAME_RESIZE_WIDTH,
    MAX_ANALYSIS_FRAMES,
    MODEL_CONFIDENCE_THRESHOLD,
)

# ── MediaPipe landmark indices ────────────────────────────────────────────────
class LM:
    """Named landmark indices — avoids magic numbers."""
    NOSE = 0
    LEFT_SHOULDER = 11;  RIGHT_SHOULDER = 12
    LEFT_ELBOW = 13;     RIGHT_ELBOW = 14
    LEFT_WRIST = 15;     RIGHT_WRIST = 16
    LEFT_HIP = 23;       RIGHT_HIP = 24
    LEFT_KNEE = 25;      RIGHT_KNEE = 26
    LEFT_ANKLE = 27;     RIGHT_ANKLE = 28
    LEFT_HEEL = 29;      RIGHT_HEEL = 30
    LEFT_FOOT_INDEX = 31;RIGHT_FOOT_INDEX = 32


@dataclass
class FrameLandmarks:
    """Pose landmarks for one frame."""
    frame_index: int
    timestamp_s: float
    landmarks: Dict[int, Tuple[float, float, float]]  # idx → (x, y, z) normalised [0,1]
    visibility: Dict[int, float]                       # idx → confidence [0,1]
    pose_detected: bool


@dataclass
class PoseSequence:
    """Complete pose data for a video."""
    frames: List[FrameLandmarks] = field(default_factory=list)
    video_fps: float = 30.0
    video_duration_s: float = 0.0
    total_frames_sampled: int = 0
    pose_detected_count: int = 0

    @property
    def pose_detection_rate(self) -> float:
        if self.total_frames_sampled == 0:
            return 0.0
        return self.pose_detected_count / self.total_frames_sampled

    def get_landmark_trajectory(
        self, landmark_idx: int, min_visibility: float = 0.5
    ) -> List[Tuple[float, float, float, float]]:
        traj = []
        for f in self.frames:
            if f.pose_detected and f.visibility.get(landmark_idx, 0) >= min_visibility:
                lm = f.landmarks[landmark_idx]
                traj.append((lm[0], lm[1], lm[2], f.timestamp_s))
        return traj

    def get_frame_at_landmark_extremum(
        self, landmark_idx: int, axis: int, mode: str = "max"
    ) -> Optional[FrameLandmarks]:
        best_frame = None
        best_val = None
        for f in self.frames:
            if not f.pose_detected:
                continue
            if f.visibility.get(landmark_idx, 0) < MODEL_CONFIDENCE_THRESHOLD:
                continue
            val = f.landmarks[landmark_idx][axis]
            if best_val is None or (mode == "max" and val > best_val) or (mode == "min" and val < best_val):
                best_val = val
                best_frame = f
        return best_frame


def _get_model_path() -> str:
    """
    Download the MediaPipe pose landmarker model if not already cached.
    Uses the lite variant for speed.
    """
    model_dir = Path(__file__).parent / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / "pose_landmarker_lite.task"

    if not model_path.exists():
        url = (
            "https://storage.googleapis.com/mediapipe-models/"
            "pose_landmarker/pose_landmarker_lite/float16/latest/"
            "pose_landmarker_lite.task"
        )
        print(f"[PoseEstimator] Downloading MediaPipe model to {model_path}...")
        urllib.request.urlretrieve(url, str(model_path))
        print("[PoseEstimator] Model downloaded.")

    return str(model_path)


class PoseEstimator:
    """
    Extracts and processes pose landmarks from a video file.
    Uses MediaPipe Tasks API (0.10.x compatible).
    """

    def process_video(self, video_path: str) -> Tuple[PoseSequence, List[str]]:
        """
        Main entry point.
        Returns (PoseSequence, warnings[]).
        Never raises — all errors are captured in warnings.
        """
        warnings: List[str] = []
        sequence = PoseSequence()

        try:
            from mediapipe.tasks import python as mp_python
            from mediapipe.tasks.python import vision as mp_vision
            from mediapipe.tasks.python.vision import RunningMode

            model_path = _get_model_path()

            options = mp_vision.PoseLandmarkerOptions(
                base_options=mp_python.BaseOptions(model_asset_path=model_path),
                running_mode=RunningMode.IMAGE,
                min_pose_detection_confidence=MODEL_CONFIDENCE_THRESHOLD,
                min_pose_presence_confidence=MODEL_CONFIDENCE_THRESHOLD,
                min_tracking_confidence=MODEL_CONFIDENCE_THRESHOLD,
                num_poses=1,
            )
        except Exception as e:
            warnings.append(f"MediaPipe initialization failed: {e}")
            return sequence, warnings

        cap = cv2.VideoCapture(video_path)
        if not cap.isOpened():
            warnings.append("Could not open video file.")
            return sequence, warnings

        original_fps = cap.get(cv2.CAP_PROP_FPS) or 30.0
        total_video_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        sequence.video_fps = original_fps
        sequence.video_duration_s = total_video_frames / original_fps if original_fps > 0 else 0

        stride = max(1, int(original_fps / ANALYSIS_FPS))

        try:
            from mediapipe.tasks.python.vision import PoseLandmarker
            import mediapipe as mp

            with PoseLandmarker.create_from_options(options) as landmarker:
                frame_idx = 0
                sampled = 0

                while cap.isOpened() and sampled < MAX_ANALYSIS_FRAMES:
                    ret, frame = cap.read()
                    if not ret:
                        break

                    if frame_idx % stride == 0:
                        timestamp_s = frame_idx / original_fps

                        # Resize for speed
                        h, w = frame.shape[:2]
                        if w > FRAME_RESIZE_WIDTH:
                            scale = FRAME_RESIZE_WIDTH / w
                            frame = cv2.resize(frame, (FRAME_RESIZE_WIDTH, int(h * scale)))

                        rgb = cv2.cvtColor(frame, cv2.COLOR_BGR2RGB)
                        mp_image = mp.Image(
                            image_format=mp.ImageFormat.SRGB,
                            data=rgb
                        )

                        result = landmarker.detect(mp_image)
                        sampled += 1

                        if result.pose_landmarks and len(result.pose_landmarks) > 0:
                            lms = {}
                            vis = {}
                            for idx, lm in enumerate(result.pose_landmarks[0]):
                                lms[idx] = (lm.x, lm.y, lm.z)
                                vis[idx] = lm.visibility if hasattr(lm, 'visibility') else 0.8
                            sequence.frames.append(FrameLandmarks(
                                frame_index=frame_idx,
                                timestamp_s=timestamp_s,
                                landmarks=lms,
                                visibility=vis,
                                pose_detected=True,
                            ))
                            sequence.pose_detected_count += 1
                        else:
                            sequence.frames.append(FrameLandmarks(
                                frame_index=frame_idx,
                                timestamp_s=timestamp_s,
                                landmarks={},
                                visibility={},
                                pose_detected=False,
                            ))

                    frame_idx += 1

        except Exception as e:
            warnings.append(f"Error during pose detection: {e}")
        finally:
            cap.release()

        sequence.total_frames_sampled = max(sequence.total_frames_sampled, len(sequence.frames))

        if sequence.pose_detection_rate < 0.30 and sequence.total_frames_sampled > 0:
            warnings.append(
                f"Low pose detection rate ({sequence.pose_detection_rate:.0%}). "
                "Results may be unreliable. Ensure the athlete is clearly visible."
            )
        if sequence.total_frames_sampled == 0:
            warnings.append("No frames could be extracted from the video.")

        return sequence, warnings

    # ── Static geometry helpers ───────────────────────────────────────────────

    @staticmethod
    def angle_between_points(
        a: Tuple[float, float],
        b: Tuple[float, float],
        c: Tuple[float, float],
    ) -> float:
        """Angle at vertex b, formed by a-b-c, in degrees [0, 180]."""
        ba = (a[0] - b[0], a[1] - b[1])
        bc = (c[0] - b[0], c[1] - b[1])
        dot = ba[0] * bc[0] + ba[1] * bc[1]
        mag_ba = math.sqrt(ba[0] ** 2 + ba[1] ** 2)
        mag_bc = math.sqrt(bc[0] ** 2 + bc[1] ** 2)
        if mag_ba == 0 or mag_bc == 0:
            return 0.0
        cos_angle = max(-1.0, min(1.0, dot / (mag_ba * mag_bc)))
        return math.degrees(math.acos(cos_angle))

    @staticmethod
    def body_midpoint(
        lm_left: Tuple[float, float, float],
        lm_right: Tuple[float, float, float],
    ) -> Tuple[float, float]:
        return ((lm_left[0] + lm_right[0]) / 2, (lm_left[1] + lm_right[1]) / 2)

    @staticmethod
    def smooth_trajectory(
        traj: List[Tuple[float, float, float, float]],
        window: int = 3,
    ) -> List[Tuple[float, float, float, float]]:
        if len(traj) < window:
            return traj
        smoothed = []
        half = window // 2
        for i in range(len(traj)):
            lo = max(0, i - half)
            hi = min(len(traj), i + half + 1)
            xs = [t[0] for t in traj[lo:hi]]
            ys = [t[1] for t in traj[lo:hi]]
            zs = [t[2] for t in traj[lo:hi]]
            smoothed.append((
                float(np.mean(xs)),
                float(np.mean(ys)),
                float(np.mean(zs)),
                traj[i][3],
            ))
        return smoothed

    @staticmethod
    def velocity_from_trajectory(
        traj: List[Tuple[float, float, float, float]],
        frame_width_px: int = 640,
    ) -> List[float]:
        speeds = []
        for i in range(1, len(traj)):
            dx = traj[i][0] - traj[i - 1][0]
            dy = traj[i][1] - traj[i - 1][1]
            dt = traj[i][3] - traj[i - 1][3]
            if dt <= 0:
                continue
            speed = math.sqrt(dx ** 2 + dy ** 2) / dt
            speeds.append(speed)
        return speeds

    def get_joint_angle_sequence(
        self,
        sequence: PoseSequence,
        lm_a: int,
        lm_b: int,
        lm_c: int,
        min_visibility: float = 0.5,
    ) -> Tuple[List[float], float]:
        angles = []
        confidences = []
        for f in sequence.frames:
            if not f.pose_detected:
                continue
            vis_a = f.visibility.get(lm_a, 0)
            vis_b = f.visibility.get(lm_b, 0)
            vis_c = f.visibility.get(lm_c, 0)
            min_vis = min(vis_a, vis_b, vis_c)
            if min_vis < min_visibility:
                continue
            a = f.landmarks[lm_a][:2]
            b = f.landmarks[lm_b][:2]
            c = f.landmarks[lm_c][:2]
            angle = self.angle_between_points(a, b, c)
            angles.append(angle)
            confidences.append(min_vis)
        mean_conf = float(np.mean(confidences)) if confidences else 0.0
        return angles, mean_conf

    def measure_body_sway(
        self,
        sequence: PoseSequence,
        landmark_idx: int = LM.NOSE,
    ) -> Tuple[float, float]:
        traj = sequence.get_landmark_trajectory(landmark_idx, min_visibility=0.5)
        if len(traj) < 5:
            return 0.0, 0.0
        xs = [t[0] for t in traj]
        sway = float(np.std(xs))
        conf = min(1.0, len(traj) / 30)
        return sway, conf
