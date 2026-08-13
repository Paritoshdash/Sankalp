-- ============================================================
-- Sankalp Supabase PostgreSQL Database Schema
-- Run this in your Supabase SQL Editor or via MCP Tool
-- ============================================================

-- 1. Users table (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name VARCHAR(255) NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  gmail VARCHAR(255),
  aadhaar VARCHAR(20),
  phone VARCHAR(15),
  state VARCHAR(100),
  district VARCHAR(100),
  city VARCHAR(100),
  pincode VARCHAR(10),
  validation_status VARCHAR(50) DEFAULT 'Pending',
  health_status VARCHAR(50) DEFAULT 'Cleared',
  has_achievements BOOLEAN DEFAULT FALSE,
  date_of_birth DATE,
  registered_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Athlete scores table
CREATE TABLE IF NOT EXISTS public.athlete_scores (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  excellence_score FLOAT DEFAULT 0,
  fitness_score FLOAT DEFAULT 0,
  video_analysis_score FLOAT DEFAULT 0,
  overall_score FLOAT DEFAULT 0,
  tier VARCHAR(50) DEFAULT 'Beginner',
  video_metrics_json JSONB,
  technique_score FLOAT DEFAULT 0,
  performance_score FLOAT DEFAULT 0,
  analysis_timestamp TIMESTAMPTZ,
  model_version VARCHAR(50) DEFAULT '1.0.0',
  analysis_warnings JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Fitness health data table
CREATE TABLE IF NOT EXISTS public.fitness_health_data (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  height_cm FLOAT,
  weight_kg FLOAT,
  age INT,
  gender VARCHAR(20),
  experience TEXT,
  chronic_disease VARCHAR(10),
  chronic_disease_details TEXT,
  injury VARCHAR(20),
  injury_details TEXT,
  substances VARCHAR(20),
  stress VARCHAR(20),
  medications VARCHAR(20),
  medication_details TEXT,
  criminal_record VARCHAR(10),
  criminal_record_details TEXT,
  under_investigation VARCHAR(10),
  disciplinary_action VARCHAR(10),
  disciplinary_action_details TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. User sports table
CREATE TABLE IF NOT EXISTS public.user_sports (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  sport_name VARCHAR(100),
  sport_category VARCHAR(100),
  skill_level VARCHAR(50),
  sport_id VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Achievements table
CREATE TABLE IF NOT EXISTS public.achievements (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  level VARCHAR(50),
  experience TEXT,
  certificate_url VARCHAR(500),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.athlete_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fitness_health_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_sports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;

-- Grants & Policies
GRANT ALL ON TABLE public.users TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.athlete_scores TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.fitness_health_data TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.user_sports TO anon, authenticated, service_role;
GRANT ALL ON TABLE public.achievements TO anon, authenticated, service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated, service_role;
