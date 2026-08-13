# 🏆 Sankalp (संकल्प) — AI-Powered Sports Talent Identification & Assessment Platform

[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?logo=next.js)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?logo=fastapi)](https://fastapi.tiangolo.com/)
[![MediaPipe](https://img.shields.io/badge/MediaPipe-Pose-orange?logo=google)](https://ai.google.dev/edge/mediapipe/solutions/guide)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

**Sankalp** is a comprehensive digital sports assessment platform designed to identify, evaluate, and benchmark athletic talent across India. Combining Next.js, Computer Vision (MediaPipe Pose & OpenCV), Python FastAPI, and MySQL, Sankalp provides automated movement posture analysis, sport-specific knowledge evaluation, physical fitness scoring, and centralized talent scouting dashboards.

---

## 📸 Key Features & Capabilities

- 🤖 **Computer Vision Motion Analysis**: Upload motion/athletic videos to extract 33 spatial landmarks per frame, running temporal smoothing and extracting key metric signatures (step frequency, knee lift, takeoff angle, arch posture, etc.).
- 🧠 **Multi-Tiered Scoring Engine**: Combines **Sports Knowledge/Excellence Score (30%)**, **Physical Fitness Battery Score (30%)**, and **AI Movement Analysis (40%)** into a standardized national athletic benchmark.
- 🎯 **Sport-Specific Assessment Engines**:
  - 🏃 **100m Sprint**: Cadence, stride frequency, trunk tilt, and knee elevation.
  - 🏃‍♂️ **Long Jump**: Takeoff knee extension angle, takeoff vector, and landing stability.
  - 🦘 **High Jump**: Fosbury flop arch score, knee drive, and peak hip elevation.
  - ☄️ **Shot Put & Javelin**: Kinetic chain tracking and arm release extension.
  - 🎯 **Archery & Shooting**: Postural stability and sway variance metrics.
- 🏅 **Athlete Tiering & Classification**: Automatic classification into **Emerging**, **Intermediate**, or **Advanced** talent tiers based on age and gender-adjusted percentile thresholds.
- 📊 **Government / Scout Admin Dashboard**: Centralized leaderboard allowing sports officials to filter, search, and discover top-performing grassroots talent across districts and states.
- 📱 **Cross-Platform Mobile Ready**: Integrated Capacitor configuration for Android and iOS app generation.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | [Next.js 16 (App Router)](https://nextjs.org/), [React 18](https://react.dev/), [TypeScript](https://www.typescriptlang.org/) |
| **Styling & Components** | [Tailwind CSS v4](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide React Icons](https://lucide.dev/) |
| **ML & Computer Vision** | [Python 3.11](https://www.python.org/), [FastAPI](https://fastapi.tiangolo.com/), [MediaPipe Pose](https://ai.google.dev/edge/mediapipe/solutions/vision/pose_landmarker), [OpenCV](https://opencv.org/), [NumPy](https://numpy.org/) |
| **Database** | [MySQL 8.0](https://www.mysql.com/), `mysql2` client |
| **Mobile Runtime** | [Capacitor 7 (Android / iOS)](https://capacitorjs.com/) |

---

## 🏗️ System Architecture

```
                                  +-----------------------+
                                  |     User Browser      |
                                  +-----------+-----------+
                                              |
                                              v
                              +---------------+---------------+
                              |    Next.js 16 (Port 3000)     |
                              |  - Authentication & Profiles  |
                              |  - Admin Dashboard & Analytics|
                              |  - Sports Quiz & Fitness Form |
                              +---------------+---------------+
                                              |
                          POST /api/analyze   |  MySQL Database
                                (Video)       v  (Port 3306)
                              +---------------+---------------+
                              |   FastAPI Backend (Port 8000) |
                              |  - OpenCV Frame Extraction    |
                              |  - MediaPipe Pose Estimation  |
                              |  - Sport Analyzer Modules     |
                              +-------------------------------+
```

---

## 🚀 Quickstart Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10 or higher
- **MySQL**: v8.0 or higher

---

### 1. Database Initialization
Execute the SQL migration script to set up the schema and tables:
```bash
mysql -u root -p your_database_name < db_migration.sql
```

---

### 2. Environment Setup
Create a `.env.local` file in the root directory:
```env
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_DATABASE=sankalp

# ML Backend Endpoint
ML_BACKEND_URL=http://127.0.0.1:8000
```

---

### 3. Start the Python ML Service
```bash
cd ml_backend

# Create & activate Python virtual environment
python -m venv venv

# Windows (PowerShell):
.\venv\Scripts\Activate.ps1
# Linux / macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Start FastAPI application server
python main.py
```
> The API will start at `http://127.0.0.1:8000`. API docs will be available at `http://127.0.0.1:8000/docs`.

---

### 4. Start the Next.js Web App
In a new terminal window (from the repository root):
```bash
# Install dependencies
npm install

# Run dev server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧪 Testing & Verification

Run the test suite for the Python ML scoring and pose analysis modules:
```bash
cd ml_backend
python -m pytest tests/ -v
```

---

## 📁 Repository Structure

```
Sankalp/
├── app/                        # Next.js App Router (Pages & API endpoints)
│   ├── admin/                  # Talent scouting admin leaderboard page
│   ├── api/                    # Serverless API routes (auth, analyze, admin)
│   ├── excellence/[sport]/     # Sport-specific knowledge assessment modules
│   ├── fitness-details/        # Physical fitness parameter collection
│   └── video-analysis/         # Video upload & motion analysis interface
├── components/                 # Reusable UI components & dialogs
├── lib/                        # Database pool & metric threshold configurations
├── ml_backend/                 # Python OpenCV + MediaPipe ML backend
│   ├── analyzers/              # Sport-specific biomechanical calculators
│   ├── pose/                   # Pose estimator & landmark trajectory smoothers
│   ├── scoring/                # Percentile & metric scoring algorithms
│   ├── tests/                  # PyTest verification test suite
│   ├── config.py               # ML server configuration defaults
│   └── main.py                 # FastAPI application entrypoint
├── public/                     # Static assets & sports quiz datasets
├── db_migration.sql            # Database creation & migration script
├── ML_ARCHITECTURE.md          # Technical ML design doc
├── ML_SETUP.md                 # Detailed ML setup instructions
└── SECURITY_NOTES.md           # Security & data privacy guidelines
```

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).