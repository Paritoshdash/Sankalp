"""
Sankalp ML Backend — FastAPI Service
Runs at http://127.0.0.1:8000

Endpoints:
  POST /analyze    — Video analysis (main ML endpoint)
  GET  /health     — Health check
  GET  /sports     — List supported sports
"""
from __future__ import annotations

import os
import tempfile
import time
import traceback
from datetime import datetime, timezone
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import config
from analyzers import get_analyzer
from pose.estimator import PoseEstimator

app = FastAPI(
    title="Sankalp ML Backend",
    description="Pose estimation and sport performance analysis service.",
    version=config.MODEL_VERSION,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

ALLOWED_VIDEO_TYPES = {
    "video/mp4", "video/quicktime", "video/x-msvideo",
    "video/webm", "video/mpeg", "video/3gpp",
}

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".avi", ".webm", ".mpeg", ".3gp"}

MAX_BYTES = config.MAX_VIDEO_SIZE_MB * 1024 * 1024


def error_response(code: str, message: str, status: int = 400) -> JSONResponse:
    return JSONResponse(
        status_code=status,
        content={
            "success": False,
            "error": {"code": code, "message": message},
        },
    )


@app.get("/health")
def health_check():
    return {
        "status": "ok",
        "model_name": config.MODEL_NAME,
        "model_version": config.MODEL_VERSION,
        "timestamp": datetime.now(timezone.utc).isoformat(),
    }


@app.get("/sports")
def list_sports():
    from analyzers import SPORT_ANALYZER_MAP
    return {"supported_sports": list(SPORT_ANALYZER_MAP.keys())}


@app.post("/analyze")
async def analyze_video(
    video: UploadFile = File(...),
    sport: str = Form(...),
    athlete_age: int = Form(default=18),
    gender: str = Form(default="male"),
    user_id: Optional[str] = Form(default=None),
):
    """
    Receive a video file, run pose-based analysis, return structured metrics.
    """
    start_time = time.time()

    # ── Input validation ──────────────────────────────────────────────────────

    # File type
    suffix = Path(video.filename or "file.mp4").suffix.lower()
    if suffix not in ALLOWED_EXTENSIONS:
        return error_response(
            "INVALID_FILE_TYPE",
            f"File type '{suffix}' is not supported. "
            f"Accepted: {', '.join(ALLOWED_EXTENSIONS)}"
        )

    # Sport validation
    from analyzers import SPORT_ANALYZER_MAP
    if sport not in SPORT_ANALYZER_MAP:
        return error_response(
            "UNSUPPORTED_SPORT",
            f"Sport '{sport}' is not supported. "
            f"Supported: {list(SPORT_ANALYZER_MAP.keys())}"
        )

    # Age
    if not (5 <= athlete_age <= 80):
        return error_response("INVALID_AGE", "athlete_age must be between 5 and 80.")

    # Read and size-check
    video_bytes = await video.read()
    if len(video_bytes) > MAX_BYTES:
        return error_response(
            "FILE_TOO_LARGE",
            f"Video exceeds {config.MAX_VIDEO_SIZE_MB} MB limit. "
            f"Received: {len(video_bytes) / 1024 / 1024:.1f} MB."
        )
    if len(video_bytes) == 0:
        return error_response("EMPTY_FILE", "Uploaded file is empty.")

    # ── Save to temp file ─────────────────────────────────────────────────────
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(
            delete=False, suffix=suffix, prefix="sankalp_"
        ) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        # ── Pose estimation ───────────────────────────────────────────────────
        estimator = PoseEstimator()
        sequence, pose_warnings = estimator.process_video(tmp_path)

        if sequence.total_frames_sampled == 0:
            return error_response(
                "VIDEO_UNREADABLE",
                "Could not extract any frames from the video. "
                "Ensure the file is not corrupted.",
                status=422,
            )

        if sequence.pose_detection_rate == 0:
            return error_response(
                "NO_PERSON_DETECTED",
                "No person was detected in the video. "
                "Ensure the athlete is clearly visible in good lighting.",
                status=422,
            )

        # ── Sport-specific analysis ───────────────────────────────────────────
        analyzer = get_analyzer(sport=sport, age=athlete_age, gender=gender)
        result = analyzer.analyze(sequence)

        # Merge pose warnings into result warnings
        all_warnings = pose_warnings + result.warnings

        processing_time_ms = round((time.time() - start_time) * 1000)

        return {
            "success": True,
            "sport": sport,
            "video": {
                "frames_processed": result.frames_processed,
                "duration_seconds": round(result.video_duration_s, 2),
                "pose_detection_rate": round(result.pose_detection_rate, 3),
            },
            "metrics": result.metrics,
            "technique_score": result.technique_score,
            "performance_score": result.performance_score,
            "overall_video_score": result.overall_video_score,
            "warnings": all_warnings,
            "processing": {
                "time_ms": processing_time_ms,
                "frames_processed": result.frames_processed,
                "pose_detection_rate": round(result.pose_detection_rate, 3),
            },
            "model": {
                "name": config.MODEL_NAME,
                "version": config.MODEL_VERSION,
                "analysis_timestamp": datetime.now(timezone.utc).isoformat(),
            },
        }

    except ValueError as e:
        return error_response("INVALID_INPUT", str(e))
    except Exception as e:
        traceback.print_exc()
        return error_response(
            "ANALYSIS_FAILED",
            f"An unexpected error occurred during analysis: {str(e)}",
            status=500,
        )
    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="127.0.0.1",
        port=8000,
        reload=True,
        log_level="info",
    )
