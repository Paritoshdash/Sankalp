"""
Creates a more realistic synthetic test video using proper human silhouette
proportions with filled shapes, attempting to trigger MediaPipe detection.

Also creates an error-test video (tiny / corrupted) for validation testing.
"""
import cv2
import numpy as np
import math
import os

BASE_DIR = os.path.dirname(__file__)


def create_human_silhouette_video():
    """Create a video with a filled human silhouette in running pose."""
    output_path = os.path.join(BASE_DIR, "test_running.mp4")
    WIDTH, HEIGHT = 640, 480
    FPS = 30
    DURATION_S = 6
    TOTAL_FRAMES = FPS * DURATION_S

    fourcc = cv2.VideoWriter_fourcc(*"mp4v")
    out = cv2.VideoWriter(output_path, fourcc, FPS, (WIDTH, HEIGHT))

    for i in range(TOTAL_FRAMES):
        t = i / FPS
        frame = np.ones((HEIGHT, WIDTH, 3), dtype=np.uint8) * 200  # light grey bg

        # White background (better contrast for MediaPipe)
        frame[:] = (240, 240, 240)

        # Running figure position moving left to right
        cx = int(120 + (WIDTH - 280) * (t / DURATION_S))
        base_y = HEIGHT // 2 + 50

        # Running animation parameters
        phase = t * 3.5  # ~3.5 strides/sec
        leg_swing = math.sin(phase * 2 * math.pi) * 40  # degrees

        # Human body color (skin tone)
        skin = (140, 180, 220)
        dark = (60, 100, 140)

        # Scale factor
        s = 1.0
        H = int(160 * s)  # total height

        # ── Draw filled human body segments ──────────────────────────────────

        # Torso (rectangle)
        tx, ty = cx, base_y - int(H * 0.5)
        tw, th = int(30 * s), int(H * 0.3)
        cv2.rectangle(frame, (tx - tw//2, ty - th//2), (tx + tw//2, ty + th//2), skin, -1)

        # Head (circle)
        head_r = int(22 * s)
        head_cy = ty - th//2 - head_r
        cv2.circle(frame, (cx, head_cy), head_r, skin, -1)
        # Eyes
        cv2.circle(frame, (cx - 7, head_cy - 3), 3, dark, -1)
        cv2.circle(frame, (cx + 7, head_cy - 3), 3, dark, -1)

        # ── Arms ─────────────────────────────────────────────────────────────
        arm_angle = math.sin(phase * 2 * math.pi) * 50
        # Left arm
        lsh = (cx - int(20*s), ty - th//4)
        lelbow = (lsh[0] - int(15*s) + int(10*s * math.sin(math.radians(arm_angle))),
                  lsh[1] + int(30*s))
        lwrist = (lelbow[0] + int(8*s * math.sin(math.radians(arm_angle))),
                  lelbow[1] + int(25*s))
        cv2.line(frame, lsh, lelbow, skin, int(10*s))
        cv2.line(frame, lelbow, lwrist, skin, int(8*s))
        cv2.circle(frame, lelbow, int(6*s), skin, -1)

        # Right arm (opposite)
        rsh = (cx + int(20*s), ty - th//4)
        relbow = (rsh[0] + int(15*s) - int(10*s * math.sin(math.radians(arm_angle))),
                  rsh[1] + int(30*s))
        rwrist = (relbow[0] - int(8*s * math.sin(math.radians(arm_angle))),
                  relbow[1] + int(25*s))
        cv2.line(frame, rsh, relbow, skin, int(10*s))
        cv2.line(frame, relbow, rwrist, skin, int(8*s))
        cv2.circle(frame, relbow, int(6*s), skin, -1)

        # ── Hips ─────────────────────────────────────────────────────────────
        hip_y = ty + th//2
        hip_w = int(22*s)
        cv2.rectangle(frame, (cx - hip_w, hip_y - int(10*s)),
                       (cx + hip_w, hip_y + int(10*s)), skin, -1)

        # ── Legs ─────────────────────────────────────────────────────────────
        # Left leg swings forward
        lhip = (cx - int(15*s), hip_y + int(5*s))
        lknee = (lhip[0] + int(20*s * math.sin(math.radians(leg_swing))),
                 lhip[1] + int(55*s))
        lankle = (lknee[0] - int(10*s * math.sin(math.radians(leg_swing * 0.7))),
                  lknee[1] + int(50*s))
        cv2.line(frame, lhip, lknee, skin, int(12*s))
        cv2.line(frame, lknee, lankle, skin, int(10*s))
        cv2.circle(frame, lknee, int(7*s), skin, -1)
        # Left foot
        cv2.ellipse(frame, (lankle[0], lankle[1] + int(5*s)),
                    (int(15*s), int(7*s)), 0, 0, 360, dark, -1)

        # Right leg (opposite swing)
        rhip = (cx + int(15*s), hip_y + int(5*s))
        rknee = (rhip[0] - int(20*s * math.sin(math.radians(leg_swing))),
                 rhip[1] + int(55*s))
        rankle = (rknee[0] + int(10*s * math.sin(math.radians(leg_swing * 0.7))),
                  rknee[1] + int(50*s))
        cv2.line(frame, rhip, rknee, skin, int(12*s))
        cv2.line(frame, rknee, rankle, skin, int(10*s))
        cv2.circle(frame, rknee, int(7*s), skin, -1)
        # Right foot
        cv2.ellipse(frame, (rankle[0], rankle[1] + int(5*s)),
                    (int(15*s), int(7*s)), 0, 0, 360, dark, -1)

        # Ground shadow
        shadow_pts = np.array([
            [cx - 40, base_y + 5],
            [cx + 40, base_y + 5],
            [cx + 30, base_y + 12],
            [cx - 30, base_y + 12],
        ], dtype=np.int32)
        cv2.fillPoly(frame, [shadow_pts], (180, 180, 180))

        # Label
        cv2.putText(frame, f"Sankalp Test Video | 100m Running | t={t:.1f}s",
                    (10, 25), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (50, 50, 50), 1)

        out.write(frame)

    out.release()
    size_kb = os.path.getsize(output_path) / 1024
    print(f"[OK] Running video: {output_path} ({size_kb:.1f} KB, {TOTAL_FRAMES} frames)")
    return output_path


def create_error_test_videos():
    """Create videos that should trigger specific error codes."""

    # 1. Empty file → EMPTY_FILE
    empty_path = os.path.join(BASE_DIR, "test_empty.mp4")
    open(empty_path, "wb").close()
    print(f"[OK] Empty file:    {empty_path}")

    # 2. Non-video file with mp4 extension → will be caught by backend
    bad_path = os.path.join(BASE_DIR, "test_not_a_video.mp4")
    with open(bad_path, "wb") as f:
        f.write(b"This is not a video file, just text content for testing error handling.")
    print(f"[OK] Bad file:      {bad_path}")


if __name__ == "__main__":
    video_path = create_human_silhouette_video()
    create_error_test_videos()
    print(f"\nVideos ready. Now run: python test_pipeline.py")
