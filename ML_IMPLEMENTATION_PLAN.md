# ML Implementation Plan — Sankalp Athlete Performance Analysis System

## 1. Current Architecture

### Frontend (Next.js 14, App Router, TypeScript)
- `/` — Landing page
- `/login` — Simulated login (localStorage only, no real API call)
- `/register` — Simulated registration (localStorage, no real API call)
- `/sports-selection` — Saves selection to localStorage only
- `/excellence/[sport]` — Real MCQ system, reads from public JSON datasets
- `/achievements` — Real API call to `/api/user/achievements`
- `/fitness-details` — Simulated submission (setTimeout, no real API call)
- `/video-analysis` — Fully mocked: fake 8s countdown, hardcoded metrics
- `/admin` — Uses 1 hardcoded mock athlete, no DB fetch

### Backend (Next.js API Routes)
- `POST /api/auth/register` — Real bcrypt + MySQL (NOT called by frontend)
- `POST /api/auth/login` — Real bcrypt + MySQL (NOT called by frontend)
- `POST /api/user/achievements` — Real MySQL (IS called by frontend)
- `POST /api/user/fitness-details` — Real MySQL (NOT called by frontend)
- `POST /api/user/sports-selection` — Real MySQL (NOT called by frontend)
- `GET /api/user/sports-selection` — Real MySQL
- `POST /api/analyze` — Proxy to Python FastAPI at :8000 (Python service does NOT exist yet)
- `GET /api/admin/athletes` — Real MySQL query (NOT called by frontend — frontend uses mock data)
- `GET /api/locations/districts` — Exists

### Database (MySQL via mysql2/promise)
Tables identified from API code:
- `users` — id, full_name, username, gmail, aadhaar, phone, password, state, district, city, pincode, health_status, has_achievements, validation_status, date_of_birth, registered_at
- `user_sports` — user_id (UNIQUE FK), sport_name, sport_category, skill_level, sport_id
- `fitness_health_data` — user_id (FK), height_cm, weight_kg, age, gender, experience, chronic_disease, injury, substances, stress, medications, criminal_record, under_investigation, disciplinary_action, + detail fields
- `achievements` — user_id (FK), level, experience, certificate_url
- `athlete_scores` — user_id (FK), excellence_score, fitness_score, video_analysis_score, overall_score, tier

### Python ML Backend
- Does NOT exist yet. The Next.js `/api/analyze` route references `http://127.0.0.1:8000/analyze` but nothing is there.

---

## 2. Existing ML Components

| Component | Status |
|---|---|
| Excellence QA system | ✅ Real — 7 JSON datasets, 29K+ QA pairs, trilingual |
| Fitness health scoring | ⚠️ Partial — health_status set server-side but score not saved |
| Video analysis | ❌ Fake — hardcoded values, setTimeout |
| Python FastAPI | ❌ Does not exist |
| Pose estimation | ❌ Does not exist |
| Score normalization | ❌ Does not exist |
| Admin leaderboard | ❌ Mock data — not reading from DB |
| Overall score formula | ❌ Not implemented |
| Tier classification | ❌ Not implemented |

---

## 3. Missing Components

1. **Python FastAPI ML service** — the entire `ml_backend/` directory
2. **Pose estimation module** — MediaPipe Pose integration
3. **Per-sport analyzers** — 7 sport-specific analysis classes
4. **Scoring engine** — threshold-based normalized scoring
5. **Database integration in analyze route** — save video_analysis_score
6. **Fitness score calculation** — convert BMI + health data into a score
7. **Frontend wiring** — login, register, fitness, sports-selection all bypass their APIs
8. **Admin leaderboard** — must read from MySQL, not mock data
9. **Excellence score persistence** — quiz result not saved to DB
10. **Overall score + tier** — aggregation formula not implemented

---

## 4. Data Flow

```
Athlete → Register (→ MySQL users)
        → Login (→ MySQL users, localStorage session)
        → Select Sport (→ MySQL user_sports)
        → Excellence Quiz (→ MySQL athlete_scores.excellence_score)
        → Achievements (→ MySQL achievements)
        → Fitness Details (→ MySQL fitness_health_data + athlete_scores.fitness_score)
        → Video Upload (→ Next.js /api/analyze → Python FastAPI → MySQL athlete_scores.video_analysis_score)
        → Overall Score calculated → athlete_scores.overall_score + tier
        → Admin Dashboard reads athlete_scores + users + user_sports
```

---

## 5. API Flow

```
POST /api/analyze
  ├── Validate file (type, size)
  ├── Forward to Python FastAPI POST /analyze
  │     ├── Extract frames (OpenCV)
  │     ├── Run MediaPipe Pose
  │     ├── Sport-specific Analyzer
  │     ├── Scoring Engine
  │     └── Return structured JSON
  ├── Save video_analysis_score to athlete_scores
  ├── Calculate overall_score
  ├── Set tier
  └── Return full result to frontend

POST /api/user/save-excellence-score  (NEW)
  └── Save excellence_score to athlete_scores

POST /api/user/fitness-details  (EXISTS, needs score calc)
  └── Save fitness_score to athlete_scores
```

---

## 6. Database Flow

Existing `athlete_scores` table needs extension:
```sql
ALTER TABLE athlete_scores ADD COLUMN IF NOT EXISTS video_metrics_json JSON;
ALTER TABLE athlete_scores ADD COLUMN IF NOT EXISTS technique_score FLOAT DEFAULT 0;
ALTER TABLE athlete_scores ADD COLUMN IF NOT EXISTS performance_score FLOAT DEFAULT 0;
ALTER TABLE athlete_scores ADD COLUMN IF NOT EXISTS analysis_timestamp DATETIME;
ALTER TABLE athlete_scores ADD COLUMN IF NOT EXISTS model_version VARCHAR(50) DEFAULT '1.0.0';
ALTER TABLE athlete_scores ADD COLUMN IF NOT EXISTS analysis_warnings JSON;
```

---

## 7. Implementation Plan

### Phase A — Python FastAPI ML Service
- `ml_backend/main.py` — FastAPI app
- `ml_backend/pose/estimator.py` — MediaPipe Pose wrapper
- `ml_backend/analyzers/base.py` — Abstract base analyzer
- `ml_backend/analyzers/running_100m.py`
- `ml_backend/analyzers/long_jump.py`
- `ml_backend/analyzers/high_jump.py`
- `ml_backend/analyzers/shot_put.py`
- `ml_backend/analyzers/javelin.py`
- `ml_backend/analyzers/archery.py`
- `ml_backend/analyzers/shooting.py`
- `ml_backend/scoring/engine.py` — Threshold-based normalization
- `ml_backend/config.py` — Configuration constants
- `ml_backend/requirements.txt`

### Phase B — Next.js Wiring
- Wire login/register to real APIs
- Wire sports-selection to real API
- Wire fitness-details to real API + compute fitness_score
- Add `/api/user/save-excellence-score` route
- Update `/api/analyze` to save scores to DB
- Update admin page to fetch from `/api/admin/athletes`

### Phase C — Database Migration
- Safe SQL migration script

### Phase D — Frontend Video Analysis
- Replace fake processing with real API call
- Show real metrics from backend response
- Proper error handling

---

## 8. Risks & Limitations

| Risk | Mitigation |
|---|---|
| No labeled video training data | Use pose estimation + rule-based scoring (defensible, honest) |
| Camera calibration unavailable | All speed/distance metrics labeled "estimated" |
| Pose detection fails in poor lighting | Return structured error, flag low confidence |
| Large video files | Enforce MAX_VIDEO_SIZE (50MB), MAX_DURATION (30s) |
| Multiple people in frame | Return structured warning, use central person |
| localStorage auth not production-grade | Document in SECURITY_NOTES.md, wire to real API |

---

## 9. Testing Strategy

- Unit tests for scoring engine (thresholds, normalization)
- Unit tests for each sport analyzer (mock landmarks)
- API tests for /analyze (valid video, invalid file, wrong sport)
- Integration test: full flow video → score → DB
- Frontend: verify real data appears in admin leaderboard
