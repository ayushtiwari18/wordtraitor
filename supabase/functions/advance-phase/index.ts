// Edge Function: advance-phase
// Purpose: Advance to next phase based on current phase and game state

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { 
  supabase, 
  checkWinCondition, 
  cleanupRoundData 
} from '../_shared/helpers.ts';

interface AdvancePhaseRequest {
  room_id: string;
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const { room_id }: AdvancePhaseRequest = await req.json();

    if (!room_id) {
      throw new Error('room_id is required');
    }

    // 1. Get current phase and round
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('current_phase, current_round')
      .eq('id', room_id)
      .single();

    if (roomError) throw roomError;

    const currentPhase = room!.current_phase;
    const currentRound = room!.current_round;

    // 2. Phase-specific advancement logic
    switch (currentPhase) {
      case 'WHISPER': {
        // Auto-advance to HINT_DROP after 10s
        const { error: updateError } = await supabase
          .from('game_rooms')
          .update({ current_phase: 'HINT_DROP' })
          .eq('id', room_id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({
            success: true,
            next_phase: 'HINT_DROP',
            duration: 30
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      case 'HINT_DROP': {
        // Check if all alive players submitted hints
        const { data: participants } = await supabase
          .from('room_participants')
          .select('user_id')
          .eq('room_id', room_id)
          .eq('is_alive', true);

        const { data: hints } = await supabase
          .from('game_hints')
          .select('user_id')
          .eq('room_id', room_id)
          .eq('round_number', currentRound);

        const allSubmitted = participants!.length === hints!.length;

        if (allSubmitted) {
          const { error: updateError } = await supabase
            .from('game_rooms')
            .update({ current_phase: 'DEBATE_VOTING' })
            .eq('id', room_id);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({
              success: true,
              next_phase: 'DEBATE_VOTING',
              duration: null // No timer for voting
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        return new Response(
          JSON.stringify({
            success: false,
            waiting: true,
            message: 'Not all hints submitted yet'
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      case 'DEBATE_VOTING': {
        // This should only be called by force_end_voting or check_voting_complete
        // Not by timer
        return new Response(
          JSON.stringify({
            success: false,
            error: 'DEBATE_VOTING phase cannot be advanced by timer. Use force_end_voting or wait for all votes.'
          }),
          {
            status: 400,
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      case 'REVEAL': {
        // Check win condition
        const winResult = await checkWinCondition(room_id);

        if (winResult.game_over) {
          // Game ends
          const { error: updateError } = await supabase
            .from('game_rooms')
            .update({
              status: 'FINISHED',
              finished_at: new Date().toISOString(),
              current_phase: 'POST_ROUND'
            })
            .eq('id', room_id);

          if (updateError) throw updateError;

          return new Response(
            JSON.stringify({
              success: true,
              game_over: true,
              winner: winResult.winner,
              message: `${winResult.winner} win!`
            }),
            {
              headers: {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
              },
            }
          );
        }

        // Game continues - cleanup and start next round
        await cleanupRoundData(room_id, currentRound);

        const nextRound = currentRound + 1;
        const { error: updateError } = await supabase
          .from('game_rooms')
          .update({
            current_phase: 'HINT_DROP', // Skip WHISPER on Round 2+
            current_round: nextRound
          })
          .eq('id', room_id);

        if (updateError) throw updateError;

        return new Response(
          JSON.stringify({
            success: true,
            next_phase: 'HINT_DROP',
            round: nextRound,
            duration: 30,
            message: `Round ${nextRound} started - same words continue`
          }),
          {
            headers: {
              'Content-Type': 'application/json',
              'Access-Control-Allow-Origin': '*',
            },
          }
        );
      }

      default:
        throw new Error(`Unknown phase: ${currentPhase}`);
    }
  } catch (error) {
    console.error('advance-phase error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
