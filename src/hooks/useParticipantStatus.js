// Hook: useParticipantStatus
// Purpose: Track if current user is alive or spectating
// Key: Used to disable chat/vote for spectators

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

export function useParticipantStatus(roomId, userId) {
  const [isAlive, setIsAlive] = useState(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!roomId || !userId) return;

    // Initial fetch
    const fetchStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('room_participants')
          .select('is_alive')
          .eq('room_id', roomId)
          .eq('user_id', userId)
          .single();

        if (error) throw error;
        setIsAlive(data.is_alive);
      } catch (err) {
        console.error('Error fetching participant status:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchStatus();

    // Subscribe to real-time changes
    const subscription = supabase
      .channel(`participant:${roomId}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'room_participants',
          filter: `room_id=eq.${roomId},user_id=eq.${userId}`
        },
        (payload) => {
          if (payload.new.is_alive !== undefined) {
            setIsAlive(payload.new.is_alive);
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [roomId, userId]);

  return {
    isAlive,
    isSpectator: !isAlive,
    loading
  };
}
