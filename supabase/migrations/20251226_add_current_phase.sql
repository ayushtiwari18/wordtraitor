-- Migration: Add current_phase column to game_rooms
-- Date: 2025-12-26
-- Purpose: Enable granular phase state tracking for new game flow

-- Add current_phase column with CHECK constraint
ALTER TABLE game_rooms 
ADD COLUMN IF NOT EXISTS current_phase TEXT DEFAULT 'LOBBY' 
CHECK (current_phase IN ('LOBBY', 'WHISPER', 'HINT_DROP', 'DEBATE_VOTING', 'REVEAL', 'POST_ROUND'));

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_game_rooms_current_phase ON game_rooms(current_phase);

-- Enable realtime for current_phase updates (already enabled, but ensuring)
-- Clients subscribe to this column for phase rendering
