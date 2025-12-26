// Hook: useGameState
// Purpose: Track game phase, round, and player's secret word/role
// Key: Fetches round_secrets ONCE on game start, never refetches

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useGameState(roomId) {
  const [currentPhase, setCurrentPhase] = useState('LOBBY');
  const [currentRound, setCurrentRound] = useState(1);
  const [myWord, setMyWord] = useState(null);
  const [myRole, setMyRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Get current user ID from localStorage (anonymous guest ID)
  const getCurrentUserId = () => {
    return localStorage.getItem('guestId') || localStorage.getItem('userId');
  };

  useEffect(() => {
    if (!roomId) return;

    // Initial fetch of room state
    const fetchRoomState = async () => {
      try {
        const { data, error: fetchError } = await supabase
          .from('game_rooms')
          .select('current_phase, current_round, status')
          .eq('id', roomId)
          .single();

        if (fetchError) throw fetchError;

        setCurrentPhase(data.current_phase || 'LOBBY');
        setCurrentRound(data.current_round || 1);
      } catch (err) {
        console.error('Error fetching room state:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRoomState();

    // Subscribe to real-time phase changes
    const subscription = supabase
      .channel(`room:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'game_rooms',
          filter: `id=eq.${roomId}`
        },
        (payload) => {
          if (payload.new.current_phase) {
            setCurrentPhase(payload.new.current_phase);
          }
          if (payload.new.current_round !== undefined) {
            setCurrentRound(payload.new.current_round);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId]);

  // Fetch my secret word/role ONCE when WHISPER phase starts
  useEffect(() => {
    if (currentPhase === 'WHISPER' && currentRound === 1 && !myWord) {
      fetchMySecret();
    }
  }, [currentPhase, currentRound]);

  const fetchMySecret = async () => {
    try {
      const userId = getCurrentUserId();
      if (!userId) {
        console.warn('No user ID found');
        return;
      }

      const { data, error: secretError } = await supabase
        .from('round_secrets')
        .select('secret_word, role')
        .eq('room_id', roomId)
        .eq('user_id', userId)
        .single();

      if (secretError) {
        console.error('Error fetching secret:', secretError);
        return;
      }

      // Store locally - never refetch
      setMyWord(data.secret_word);
      setMyRole(data.role);
    } catch (err) {
      console.error('Error in fetchMySecret:', err);
    }
  };

  return {
    currentPhase,
    currentRound,
    myWord,
    myRole,
    loading,
    error,
    isTraitor: myRole === 'TRAITOR'
  };
}
