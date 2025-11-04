-- AI Church Slide Builder - Supabase Database Initialization
-- Run this script in your Supabase SQL Editor

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============ USERS TABLE ============
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE,
  is_demo BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users
CREATE POLICY users_self ON users 
  FOR SELECT 
  USING (auth.uid() = id);

CREATE POLICY users_insert ON users 
  FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY users_update ON users 
  FOR UPDATE 
  USING (auth.uid() = id);

-- ============ PRESENTATIONS TABLE ============
CREATE TABLE IF NOT EXISTS presentations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title TEXT,
  slides_json JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE presentations ENABLE ROW LEVEL SECURITY;

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS presentations_user_idx ON presentations(user_id);

-- RLS Policies for presentations
CREATE POLICY pres_select ON presentations 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY pres_insert ON presentations 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY pres_update ON presentations 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY pres_delete ON presentations 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============ PROMPTS HISTORY TABLE ============
CREATE TABLE IF NOT EXISTS prompts_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  input_text TEXT,
  ai_response JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE prompts_history ENABLE ROW LEVEL SECURITY;

-- RLS Policies for prompts_history
CREATE POLICY ph_select ON prompts_history 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY ph_insert ON prompts_history 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ph_update ON prompts_history 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY ph_delete ON prompts_history 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============ TRANSFER LINKS TABLE ============
CREATE TABLE IF NOT EXISTS transfer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  demo_user_id UUID NOT NULL,
  real_user_id UUID,
  claimed BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE transfer_links ENABLE ROW LEVEL SECURITY;

-- RLS Policies for transfer_links
CREATE POLICY tl_select ON transfer_links 
  FOR SELECT 
  USING (auth.uid() = demo_user_id OR auth.uid() = real_user_id);

CREATE POLICY tl_insert ON transfer_links 
  FOR INSERT 
  WITH CHECK (TRUE);

CREATE POLICY tl_update ON transfer_links 
  FOR UPDATE 
  USING (auth.uid() = real_user_id OR auth.uid() = demo_user_id);

-- ============ EXPORTS TABLE ============
CREATE TABLE IF NOT EXISTS exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  presentation_id UUID REFERENCES presentations(id) ON DELETE CASCADE,
  format TEXT CHECK (format IN ('PNG', 'PDF', 'PPTX')),
  file_path TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE exports ENABLE ROW LEVEL SECURITY;

-- RLS Policies for exports
CREATE POLICY ex_select ON exports 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY ex_insert ON exports 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY ex_update ON exports 
  FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY ex_delete ON exports 
  FOR DELETE 
  USING (auth.uid() = user_id);

-- ============ STORAGE BUCKET ============
-- Create storage bucket for exports
INSERT INTO storage.buckets (id, name, public)
VALUES ('exports', 'exports', FALSE)
ON CONFLICT DO NOTHING;

-- Storage policies for exports bucket
CREATE POLICY "Users can upload their own exports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view their own exports"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own exports"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'exports' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
