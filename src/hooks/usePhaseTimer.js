// Hook: usePhaseTimer
// Purpose: Provide countdown timers for phases
// Key: Returns NULL for DEBATE_VOTING (no timer, vote-based advancement)

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// Phase durations in seconds
const PHASE_DURATIONS = {
  WHISPER: 10,
  HINT_DROP: 30,
  DEBATE_VOTING: null, // NO TIMER - vote-based
  REVEAL: 5,
  LOBBY: null,
  POST_ROUND: null
};

export function usePhaseTimer(roomId, currentPhase) {
  const [timeRemaining, setTimeRemaining] = useState(null);

  useEffect(() => {
    if (!roomId || !currentPhase) return;

    const duration = PHASE_DURATIONS[currentPhase];

    // No timer for phases without duration
    if (duration === null) {
      setTimeRemaining(null);
      return;
    }

    // Initialize timer
    setTimeRemaining(duration);

    // Start countdown
    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev === null || prev <= 0) {
          clearInterval(interval);
          // Auto-advance phase when timer expires
          advancePhase(roomId);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [roomId, currentPhase]);

  // Call advance-phase edge function
  const advancePhase = async (roomId) => {
    try {
      const { data, error } = await supabase.functions.invoke('advance-phase', {
        body: { room_id: roomId }
      });

      if (error) throw error;
      console.log('Phase advanced:', data);
    } catch (err) {
      console.error('Error advancing phase:', err);
    }
  };

  return {
    timeRemaining,
    duration: PHASE_DURATIONS[currentPhase],
    hasTimer: PHASE_DURATIONS[currentPhase] !== null
  };
}
