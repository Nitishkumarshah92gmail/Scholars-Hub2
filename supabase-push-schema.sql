-- ─────────────────────────────────────────────────────────────────────────────
-- StudyShare Push Notifications — Supabase SQL Schema
--
-- Run this in your Supabase project → SQL Editor → New Query
-- ─────────────────────────────────────────────────────────────────────────────

-- device_tokens: stores FCM registration tokens per user/device.
-- One row per physical device (enforced by UNIQUE on fcm_token).
-- When a user uninstalls + reinstalls the app the token changes and a new row
-- is inserted (the old stale token is cleaned up automatically by the backend
-- when FCM returns messaging/registration-token-not-registered).

CREATE TABLE IF NOT EXISTS device_tokens (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fcm_token   text        NOT NULL,
  platform    text        NOT NULL DEFAULT 'android' CHECK (platform IN ('android', 'ios')),
  created_at  timestamptz NOT NULL DEFAULT now(),

  CONSTRAINT device_tokens_fcm_token_key UNIQUE (fcm_token)
);

-- Index for fast lookup by user when sending notifications
CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON device_tokens(user_id);

-- Row Level Security: users can only see/manage their own tokens
ALTER TABLE device_tokens ENABLE ROW LEVEL SECURITY;

-- Policy: authenticated users can insert their own tokens
CREATE POLICY "Users can register their own device tokens"
  ON device_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Policy: authenticated users can delete their own tokens (on logout)
CREATE POLICY "Users can delete their own device tokens"
  ON device_tokens
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Policy: service role (backend) can read all tokens for push dispatch
-- (The backend uses the service_role key, which bypasses RLS anyway,
--  but this policy makes the intent explicit if you ever use anon key.)
CREATE POLICY "Service role can read all device tokens"
  ON device_tokens
  FOR SELECT
  TO service_role
  USING (true);
