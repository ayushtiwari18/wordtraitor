// Edge Function: check-voting-complete
// Purpose: Check if all alive players have voted, auto-advance if complete
// Called after each vote submission

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { checkVotingComplete } from '../_shared/helpers.ts';

interface CheckVotingRequest {
  room_id: string;
  round_number: number;
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
    const { room_id, round_number }: CheckVotingRequest = await req.json();

    if (!room_id || round_number === undefined) {
      throw new Error('room_id and round_number are required');
    }

    // Check if voting is complete and auto-advance if yes
    const result = await checkVotingComplete(room_id, round_number);

    return new Response(
      JSON.stringify({
        success: true,
        ...result
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    console.error('check-voting-complete error:', error);
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
