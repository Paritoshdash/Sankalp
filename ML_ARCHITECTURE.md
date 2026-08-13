# ML Architecture — Sankalp

## 1. System Architecture

```
Browser (Next.js 14)
│
├─ /video-analysis          → Upload video + sport
│     │
│     └─ POST /api/analyze  (Next.js API route)
│           │
│           ├─ Validate file (type, size)
│           ├─ Forward to Python FastAPI
│           │     │
│           │     ├─ Temp file save
│           │     ├─ PoseEstimator.process_video()
│           │     │     ├─ Frame extraction (OpenCV, ~10 fps)
│           │     │     ├─ MediaPipe Pose (model_complexity=1)
│           │     │     └─ PoseSequence (landmarks + visibility + timestamps)
│           │     │
│           │     ├─ get_analyzer(sport, age, gender)
│           │     │     └─ Sport-specific analyzer
│           │     │           ├─ extract_features(sequence)
│           │     │           ├─ ScoringEngine.score_metric()  [thresholds.json]
│           │     │           └─ AnalysisResult
│           │     │
│           │     └─ JSON response
│           │
│           ├─ Save video_analysis_score → athlete_scores (MySQL)
│           ├─ Compute overall_score (30/30/40 weights)
│           ├─ Classify tier
│           └─ Return to frontend
│
├─ /excellence/[sport]      → Quiz → save-excellence-score → athlete_scores
├─ /fitness-details         → Form → fitness-details API → fitness_score + athlete_scores
└─ /admin                   → GET /api/admin/athletes → MySQL (ranked by overall_score)
```

---

## 2. Pose Estimation Pipeline

1. **Frame extraction** — OpenCV reads every N-th frame (`ANALYSIS_FPS=10`)
2. **Resize** — Frame resized to `FRAME_RESIZE_WIDTH=640` for speed
3. **Landmark detection** — MediaPipe Pose (33 landmarks, 0-1 normalized coords)
4. **Confidence gating** — Landmarks below `MODEL_CONFIDENCE_THRESHOLD=0.5` are excluded
5. **Temporal smoothing** — Moving average (window=3) over trajectories
6. **PoseSequence** — Full collection of `FrameLandmarks` with timestamps

---

## 3. Sport-Specific Analysis

Each sport implements `BaseSportAnalyzer.analyze(sequence) → AnalysisResult`:

| Sport | Key Metrics Extracted |
|---|---|
| 100m Running | Step frequency (ankle oscillation), knee lift, trunk posture, hip angle, movement consistency |
| Long Jump | Takeoff knee angle, estimated takeoff angle, flight body position, landing knee angle |
| High Jump | Knee drive angle, body arch score (Fosbury flop), hip elevation |
| Shot Put | Hip-shoulder rotation, estimated release angle, elbow position, stance width |
| Javelin | Release angle, elbow extension, shoulder rotation, follow-through |
| Archery | Draw arm angle, body sway, shoulder alignment, draw consistency |
| Shooting | Body stability, arm stability, shoulder alignment, aiming posture |

---

## 4. Scoring Engine

### Metric Normalization
```
For higher-is-better:
  floor   = threshold × 0.5  →  score 0
  at_threshold               →  score ~50
  ceiling = threshold × 1.5  →  score 100

For lower-is-better (e.g. reaction time, sway):
  Values inverted: being below threshold scores higher
```

### Confidence Dampening
Each metric has a `confidence` [0-1]. Low-confidence metrics are down-weighted during aggregation:
```
effective_weight = base_weight × (0.5 + 0.5 × confidence)
```

### Overall Score Formula
```
overall_score = excellence_score × 0.30
              + fitness_score    × 0.30
              + video_score      × 0.40
```
Weights are configurable via environment variables.

### Tier Classification
```
overall_score ≥ 75  → Advanced
overall_score ≥ 50  → Intermediate
otherwise           → Beginner
```

---

## 5. Database Schema (ML-relevant tables)

### athlete_scores
| Column | Type | Description |
|---|---|---|
| user_id | INT | FK to users |
| excellence_score | FLOAT | 0-100, from quiz |
| fitness_score | FLOAT | 0-100, computed from health form |
| video_analysis_score | FLOAT | 0-100, from ML pipeline |
| overall_score | FLOAT | weighted aggregate |
| tier | ENUM | Beginner/Intermediate/Advanced |
| video_metrics_json | JSON | Full metrics dict from analyzer |
| technique_score | FLOAT | Technique sub-score |
| performance_score | FLOAT | Performance sub-score |
| analysis_timestamp | DATETIME | When video was analyzed |
| model_version | VARCHAR | ML model version string |

---

## 6. API Specification

### POST /api/analyze

**Request:** `multipart/form-data`
| Field | Type | Required | Description |
|---|---|---|---|
| video | File | Yes | Video file (mp4, mov, avi, webm) |
| sport | string | Yes | Sport ID (e.g. `running-100m`) |
| userId | string | No | Save score to DB if provided |
| athleteAge | integer | No | Default 18 |
| gender | string | No | Default "male" |

**Success Response:**
```json
{
  "success": true,
  "sport": "running-100m",
  "video": { "frames_processed": 120, "duration_seconds": 12.0, "pose_detection_rate": 0.87 },
  "metrics": {
    "estimated_step_frequency": {
      "value": 3.8, "unit": "steps/sec",
      "normalized_score": 72.4, "confidence": 0.81,
      "estimated": true, "note": "Derived from ankle oscillation."
    }
  },
  "technique_score": 68.5,
  "performance_score": 74.2,
  "overall_video_score": 71.3,
  "warnings": [],
  "model": { "name": "sankalp_pose_analyzer", "version": "1.0.0", "analysis_timestamp": "..." },
  "saved": { "video_analysis_score": 71.3, "overall_score": 65.1, "tier": "Intermediate" }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": { "code": "NO_PERSON_DETECTED", "message": "No person was detected in the video." }
}
```

---

## 7. Model Limitations

| Limitation | Reason |
|---|---|
| No exact speed measurement | Requires camera calibration and known reference distance |
| No jump height measurement | Requires calibration markers |
| No bullet/target accuracy | Not visible from athlete-only video |
| Precision sports scores technique only | Target cannot be observed |
| Poor results in low lighting | MediaPipe landmark detection degrades |
| Poor results with multiple people | Single-person analysis only |
| Short videos may lack temporal context | < 10 detected pose frames → low-data result |

---

## 8. Extending the System

To add a new sport:
1. Create `ml_backend/analyzers/my_sport.py` extending `BaseSportAnalyzer`
2. Register it in `ml_backend/analyzers/__init__.py`
3. Add thresholds to `lib/thresholds.json`
4. Add QA dataset to `public/api/questions/`
5. Run tests: `python -m pytest tests/test_analyzers.py -v`
