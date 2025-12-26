// Edge Function: start-round
// Purpose: Start a new round - assign words ONCE on Round 1, skip WHISPER on Round 2+

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { supabase } from '../_shared/helpers.ts';

interface StartRoundRequest {
  room_id: string;
  current_round?: number;
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
    const { room_id, current_round }: StartRoundRequest = await req.json();

    if (!room_id) {
      throw new Error('room_id is required');
    }

    // 1. Fetch room details
    const { data: room, error: roomError } = await supabase
      .from('game_rooms')
      .select('*')
      .eq('id', room_id)
      .single();

    if (roomError) throw roomError;

    // 2. Fetch alive participants
    const { data: participants, error: participantsError } = await supabase
      .from('room_participants')
      .select('*')
      .eq('room_id', room_id)
      .eq('is_alive', true);

    if (participantsError) throw participantsError;

    if (!participants || participants.length < 2) {
      throw new Error('Need at least 2 alive players to start round');
    }

    const roundNumber = current_round || room!.current_round || 1;

    // 3. ROUND 1: Assign words ONCE
    if (roundNumber === 1) {
      // Get random word pair based on room settings
      const { data: wordPair, error: wordError } = await supabase
        .from('word_pairs')
        .select('*')
        .eq('difficulty', room!.difficulty || 'MEDIUM')
        .eq('word_pack', room!.word_pack || 'GENERAL')
        .order('random()', { ascending: true })
        .limit(1)
        .single();

      if (wordError || !wordPair) {
        throw new Error('Failed to fetch word pair');
      }

      // Pick random traitor
      const traitorIndex = Math.floor(Math.random() * participants.length);

      // Create round_secrets for ALL participants
      const secrets = participants.map((p, idx) => ({
        room_id: room_id,
        user_id: p.user_id,
        round_number: 1,
        role: idx === traitorIndex ? 'TRAITOR' : 'CITIZEN',
        secret_word: idx === traitorIndex ? wordPair.traitor_word : wordPair.main_word
      }));

      const { error: secretsError } = await supabase
        .from('round_secrets')
        .insert(secrets);

      if (secretsError) throw secretsError;

      // Set phase to WHISPER and update room
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          current_phase: 'WHISPER',
          status: 'PLAYING',
          current_round: 1,
          started_at: new Date().toISOString()
        })
        .eq('id', room_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          phase: 'WHISPER',
          duration: 10,
          round: 1,
          message: 'Round 1 started - words assigned'
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }

    // 4. ROUND 2+: Skip WHISPER, go directly to HINT_DROP
    else {
      // Verify round_secrets still exist (same words continue)
      const { data: existingSecrets, error: secretsError } = await supabase
        .from('round_secrets')
        .select('user_id')
        .eq('room_id', room_id)
        .limit(1);

      if (secretsError || !existingSecrets || existingSecrets.length === 0) {
        throw new Error('Round secrets missing - cannot continue game');
      }

      // Skip WHISPER, go to HINT_DROP
      const { error: updateError } = await supabase
        .from('game_rooms')
        .update({
          current_phase: 'HINT_DROP',
          current_round: roundNumber
        })
        .eq('id', room_id);

      if (updateError) throw updateError;

      return new Response(
        JSON.stringify({
          success: true,
          phase: 'HINT_DROP',
          duration: 30,
          round: roundNumber,
          message: `Round ${roundNumber} started - same words continue`
        }),
        {
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
          },
        }
      );
    }
  } catch (error) {
    console.error('start-round error:', error);
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
