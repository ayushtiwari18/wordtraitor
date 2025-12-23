-- Migration: Add Phase Synchronization to game_rooms
-- Purpose: Fix phase desynchronization bug (BUG #2)
-- Run this in your Supabase SQL Editor

-- Add columns for server-authoritative phase management
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS current_phase TEXT CHECK (current_phase IN ('WHISPER', 'HINT_DROP', 'DEBATE', 'VERDICT', 'REVEAL')),
ADD COLUMN IF NOT EXISTS phase_started_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS custom_timings JSONB DEFAULT NULL,
ADD COLUMN IF NOT EXISTS traitor_count INTEGER DEFAULT 1;

-- Create index for phase queries
CREATE INDEX IF NOT EXISTS idx_game_rooms_phase ON game_rooms(current_phase);

-- Migration complete! Now all clients will sync to the same phase via realtime updates
