# ML Setup Guide — Sankalp

## Prerequisites
- Node.js 18+
- Python 3.10+
- MySQL 8.0+
- pip

---

## 1. Database Setup

```sql
-- Run the migration (one time):
mysql -u root -p your_database < db_migration.sql
```

---

## 2. Environment Variables

Create a `.env.local` file in the project root:

```env
DB_HOST=localhost
DB_USER=your_mysql_user
DB_PASSWORD=your_mysql_password
DB_DATABASE=sankalp

# Optional: override ML backend URL (default: http://127.0.0.1:8000)
ML_BACKEND_URL=http://127.0.0.1:8000
```

---

## 3. Python ML Backend

```bash
cd ml_backend

# Create virtual environment
python -m venv venv

# Activate (Windows CMD)
venv\Scripts\activate

# Activate (PowerShell)
venv\Scripts\Activate.ps1

# Install dependencies
pip install -r requirements.txt

# Start the FastAPI server
python main.py
# OR
uvicorn main:app --host 127.0.0.1 --port 8000 --reload
```

The service will be available at: http://127.0.0.1:8000
Swagger docs at: http://127.0.0.1:8000/docs

**Verify it's running:**
```bash
curl http://127.0.0.1:8000/health
```

---

## 4. Next.js Frontend

```bash
# From project root
npm install
# or
pnpm install

# Development server
npm run dev

# Build for production
npm run build
npm run start
```

---

## 5. Run ML Tests

```bash
cd ml_backend

# With venv active:
python -m pytest tests/ -v

# Specific test file:
python -m pytest tests/test_scoring.py -v
python -m pytest tests/test_analyzers.py -v
```

---

## 6. Full System Startup Order

1. Start MySQL
2. Run `db_migration.sql` (first time only)
3. Start Python ML backend (`cd ml_backend && python main.py`)
4. Start Next.js (`npm run dev`)
5. Open http://localhost:3000

---

## 7. Supported Sports

| Sport ID        | Display Name   |
|-----------------|----------------|
| `running-100m`  | 100m Sprint    |
| `long-jump`     | Long Jump      |
| `high-jump`     | High Jump      |
| `shotput`       | Shot Put       |
| `javelin`       | Javelin Throw  |
| `archery`       | Archery        |
| `shooting`      | Shooting       |

---

## 8. Configuration (ml_backend/config.py)

| Variable                   | Default | Description                        |
|----------------------------|---------|------------------------------------|
| `MAX_VIDEO_SIZE_MB`        | 100     | Max upload size in MB              |
| `MAX_VIDEO_DURATION_S`     | 60      | Max video duration in seconds      |
| `ANALYSIS_FPS`             | 10      | Frames analyzed per second         |
| `MAX_ANALYSIS_FRAMES`      | 300     | Hard cap on frames processed       |
| `FRAME_RESIZE_WIDTH`       | 640     | Resize width before pose detection |
| `MODEL_CONFIDENCE_THRESHOLD` | 0.5   | Min MediaPipe confidence to use    |
| `TIER_ADVANCED`            | 75      | Min overall score for Advanced     |
| `TIER_INTERMEDIATE`        | 50      | Min overall score for Intermediate |
| `W_EXCELLENCE`             | 0.30    | Excellence score weight            |
| `W_FITNESS`                | 0.30    | Fitness score weight               |
| `W_VIDEO`                  | 0.40    | Video analysis score weight        |

---

## 9. Adding a New Sport

1. Add sport to `ml_backend/analyzers/` (extend `BaseSportAnalyzer`)
2. Register it in `ml_backend/analyzers/__init__.py`
3. Add thresholds to `lib/thresholds.json`
4. Add to `SPORT_DISPLAY_NAMES` in `app/video-analysis/page.tsx`
5. Add QA dataset to `public/api/questions/`
6. Add to `sportAPIs` and `sportNames` in `app/excellence/[sport]/page.tsx`
