// Edge Function: force-end-voting
// Purpose: Allow host to manually end voting phase

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase, processVotingEnd } from '../_shared/helpers.ts';

interface ForceEndVotingRequest {
  room_id: string;
  host_id: string;
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
    const { room_id, host_id }: ForceEndVotingRequest = await req.json();

    if (!room_id || !host_id) {
      throw new Error('room_id and host_id are required');
    }

    // 1. Verify caller is host
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('host_id, current_phase')
      .eq('id', room_id)
      .single();

    if (roomError) throw roomError;

    if (room!.host_id !== host_id) {
      return new Response(
        JSON.stringify({ error: 'Only the host can force end voting' }),
        {
          status: 403,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    if (room!.current_phase !== 'DEBATE_VOTING') {
      return new Response(
        JSON.stringify({ error: 'Not in voting phase' }),
        {
          status: 400,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 2. Process voting end (eliminate player)
    const result = await processVotingEnd(room_id);

    return new Response(
      JSON.stringify({
        success: true,
        ...result,
        message: 'Voting ended by host'
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('force-end-voting error:', error);
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
