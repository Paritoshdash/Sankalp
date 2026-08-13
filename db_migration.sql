-- ============================================================
-- Sankalp ML System — Safe Database Migration
-- Run this ONCE against your existing MySQL database.
-- All ALTER TABLE statements use IF NOT EXISTS / MODIFY safely.
-- ============================================================

-- 1. Ensure athlete_scores table exists with base columns
CREATE TABLE IF NOT EXISTS athlete_scores (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  user_id              INT NOT NULL UNIQUE,
  excellence_score     FLOAT DEFAULT 0,
  fitness_score        FLOAT DEFAULT 0,
  video_analysis_score FLOAT DEFAULT 0,
  overall_score        FLOAT DEFAULT 0,
  tier                 ENUM('Beginner','Intermediate','Advanced') DEFAULT 'Beginner',
  created_at           DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at           DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 2. Add new ML columns to athlete_scores (safe: only if not already there)
ALTER TABLE athlete_scores
  ADD COLUMN IF NOT EXISTS video_metrics_json  JSON,
  ADD COLUMN IF NOT EXISTS technique_score     FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS performance_score   FLOAT DEFAULT 0,
  ADD COLUMN IF NOT EXISTS analysis_timestamp  DATETIME,
  ADD COLUMN IF NOT EXISTS model_version       VARCHAR(50) DEFAULT '1.0.0',
  ADD COLUMN IF NOT EXISTS analysis_warnings   JSON;

-- 3. Ensure users table has validation_status and health_status
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS validation_status VARCHAR(50) DEFAULT 'Pending',
  ADD COLUMN IF NOT EXISTS health_status     VARCHAR(50) DEFAULT 'Cleared',
  ADD COLUMN IF NOT EXISTS has_achievements  BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS date_of_birth     DATE;

-- 4. Ensure fitness_health_data table exists
CREATE TABLE IF NOT EXISTS fitness_health_data (
  id                         INT AUTO_INCREMENT PRIMARY KEY,
  user_id                    INT NOT NULL UNIQUE,
  height_cm                  FLOAT,
  weight_kg                  FLOAT,
  age                        INT,
  gender                     VARCHAR(20),
  experience                 TEXT,
  chronic_disease            VARCHAR(10),
  chronic_disease_details    TEXT,
  injury                     VARCHAR(20),
  injury_details             TEXT,
  substances                 VARCHAR(20),
  stress                     VARCHAR(20),
  medications                VARCHAR(20),
  medication_details         TEXT,
  criminal_record            VARCHAR(10),
  criminal_record_details    TEXT,
  under_investigation        VARCHAR(10),
  disciplinary_action        VARCHAR(10),
  disciplinary_action_details TEXT,
  created_at                 DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at                 DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 5. Ensure user_sports table exists
CREATE TABLE IF NOT EXISTS user_sports (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  user_id        INT NOT NULL UNIQUE,
  sport_name     VARCHAR(100),
  sport_category VARCHAR(100),
  skill_level    VARCHAR(50),
  sport_id       VARCHAR(50),
  created_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 6. Ensure achievements table exists
CREATE TABLE IF NOT EXISTS achievements (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  user_id         INT NOT NULL,
  level           VARCHAR(50),
  experience      TEXT,
  certificate_url VARCHAR(500),
  created_at      DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 7. Ensure users base table has all required columns
-- (safe: these are additive)
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS full_name  VARCHAR(255),
  ADD COLUMN IF NOT EXISTS username   VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS gmail      VARCHAR(255),
  ADD COLUMN IF NOT EXISTS aadhaar    VARCHAR(20) UNIQUE,
  ADD COLUMN IF NOT EXISTS phone      VARCHAR(15),
  ADD COLUMN IF NOT EXISTS password   VARCHAR(255),
  ADD COLUMN IF NOT EXISTS state      VARCHAR(100),
  ADD COLUMN IF NOT EXISTS district   VARCHAR(100),
  ADD COLUMN IF NOT EXISTS city       VARCHAR(100),
  ADD COLUMN IF NOT EXISTS pincode    VARCHAR(10),
  ADD COLUMN IF NOT EXISTS registered_at DATETIME DEFAULT CURRENT_TIMESTAMP;

-- Done. Verify with:
-- SHOW COLUMNS FROM athlete_scores;
-- SHOW COLUMNS FROM users;
