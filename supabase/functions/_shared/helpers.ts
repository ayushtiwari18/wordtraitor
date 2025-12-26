// Shared helper functions for WordTraitor game logic
// Used by multiple edge functions

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

// Initialize Supabase client with service role
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

export const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check if game should end based on win conditions
 * Returns winner if game is over, null otherwise
 */
export async function checkWinCondition(roomId: string): Promise<{
  game_over: boolean;
  winner: 'CITIZENS' | 'TRAITOR' | null;
}> {
  // 1. Count alive players
  const { data: alive, error: aliveError } = await supabase
    .from('room_participants')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('is_alive', true);

  if (aliveError) throw aliveError;

  // 2. Check if traitor is still alive
  const { data: traitorSecret, error: traitorError } = await supabase
    .from('round_secrets')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('role', 'TRAITOR')
    .single();

  if (traitorError) throw traitorError;

  const traitorAlive = alive!.some(p => p.user_id === traitorSecret!.user_id);

  // 3. Win conditions
  if (!traitorAlive) {
    // Traitor eliminated → Citizens win
    return { game_over: true, winner: 'CITIZENS' };
  }

  if (alive!.length === 2 && traitorAlive) {
    // 2 players left, traitor survives → Traitor wins
    return { game_over: true, winner: 'TRAITOR' };
  }

  // Game continues
  return { game_over: false, winner: null };
}

/**
 * Process voting end: calculate elimination and advance to REVEAL
 */
export async function processVotingEnd(roomId: string) {
  const { data: room, error: roomError } = await supabase
    .from('game_rooms')
    .select('current_round')
    .eq('id', roomId)
    .single();

  if (roomError) throw roomError;

  // 1. Aggregate votes
  const { data: votes, error: votesError } = await supabase
    .from('game_votes')
    .select('target_id')
    .eq('room_id', roomId)
    .eq('round_number', room!.current_round);

  if (votesError) throw votesError;

  // Count votes per target
  const voteCounts: Record<string, number> = {};
  votes!.forEach(v => {
    voteCounts[v.target_id] = (voteCounts[v.target_id] || 0) + 1;
  });

  // 2. Find highest vote count
  const maxVotes = Math.max(...Object.values(voteCounts), 0);
  const topCandidates = Object.keys(voteCounts).filter(
    id => voteCounts[id] === maxVotes
  );

  // 3. Handle tie: random selection
  const eliminatedId = topCandidates[
    Math.floor(Math.random() * topCandidates.length)
  ];

  // 4. Check if eliminated was traitor
  const { data: secret, error: secretError } = await supabase
    .from('round_secrets')
    .select('role')
    .eq('room_id', roomId)
    .eq('user_id', eliminatedId)
    .single();

  if (secretError) throw secretError;

  const wasTraitor = secret!.role === 'TRAITOR';

  // 5. Mark as eliminated
  const { error: updateError } = await supabase
    .from('room_participants')
    .update({ is_alive: false })
    .eq('room_id', roomId)
    .eq('user_id', eliminatedId);

  if (updateError) throw updateError;

  // 6. Advance to REVEAL
  const { error: phaseError } = await supabase
    .from('game_rooms')
    .update({ current_phase: 'REVEAL' })
    .eq('id', roomId);

  if (phaseError) throw phaseError;

  return {
    next_phase: 'REVEAL',
    eliminated_id: eliminatedId,
    was_traitor: wasTraitor,
    vote_counts: voteCounts
  };
}

/**
 * Clean up round data (hints and votes) but preserve round_secrets
 */
export async function cleanupRoundData(roomId: string, roundNumber: number) {
  // Delete hints for this round
  const { error: hintsError } = await supabase
    .from('game_hints')
    .delete()
    .eq('room_id', roomId)
    .eq('round_number', roundNumber);

  if (hintsError) throw hintsError;

  // Delete votes for this round
  const { error: votesError } = await supabase
    .from('game_votes')
    .delete()
    .eq('room_id', roomId)
    .eq('round_number', roundNumber);

  if (votesError) throw votesError;

  // DO NOT DELETE round_secrets (persist entire game)
}

/**
 * Check if all alive players have voted
 * If yes, auto-advance to elimination
 */
export async function checkVotingComplete(roomId: string, currentRound: number) {
  // Count alive players
  const { data: alive, error: aliveError } = await supabase
    .from('room_participants')
    .select('user_id')
    .eq('room_id', roomId)
    .eq('is_alive', true);

  if (aliveError) throw aliveError;

  // Count votes submitted
  const { data: votes, error: votesError } = await supabase
    .from('game_votes')
    .select('voter_id')
    .eq('room_id', roomId)
    .eq('round_number', currentRound);

  if (votesError) throw votesError;

  // Auto-advance if all voted
  if (alive!.length === votes!.length && alive!.length > 0) {
    return await processVotingEnd(roomId);
  }

  return { waiting: true, votes_count: votes!.length, alive_count: alive!.length };
}
