-- WordTraitor Game Logic Functions
-- These are server-side functions for secure game operations

-- ========================================
-- FUNCTION: Start New Round
-- Assigns roles and words to players
-- ========================================
CREATE OR REPLACE FUNCTION start_new_round(
  p_room_id UUID,
  p_round_number INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_player_count INTEGER;
  v_traitor_id UUID;
  v_word_pair RECORD;
  v_player RECORD;
  v_result JSON;
BEGIN
  -- Count active players
  SELECT COUNT(*) INTO v_player_count
  FROM room_participants
  WHERE room_id = p_room_id AND is_alive = true;

  -- Need at least 4 players
  IF v_player_count < 4 THEN
    RAISE EXCEPTION 'Not enough players. Need at least 4.';
  END IF;

  -- Get random word pair based on room settings
  SELECT * INTO v_word_pair
  FROM word_pairs
  WHERE word_pack = (SELECT word_pack FROM game_rooms WHERE id = p_room_id)
    AND difficulty = (SELECT difficulty FROM game_rooms WHERE id = p_room_id)
  ORDER BY RANDOM()
  LIMIT 1;

  IF v_word_pair IS NULL THEN
    RAISE EXCEPTION 'No word pairs available for this pack/difficulty';
  END IF;

  -- Randomly select one traitor
  SELECT user_id INTO v_traitor_id
  FROM room_participants
  WHERE room_id = p_room_id AND is_alive = true
  ORDER BY RANDOM()
  LIMIT 1;

  -- Assign words to all players
  FOR v_player IN 
    SELECT user_id 
    FROM room_participants 
    WHERE room_id = p_room_id AND is_alive = true
  LOOP
    INSERT INTO round_secrets (room_id, user_id, round_number, role, secret_word)
    VALUES (
      p_room_id,
      v_player.user_id,
      p_round_number,
      CASE WHEN v_player.user_id = v_traitor_id THEN 'TRAITOR' ELSE 'CITIZEN' END,
      CASE WHEN v_player.user_id = v_traitor_id THEN v_word_pair.traitor_word ELSE v_word_pair.main_word END
    );
  END LOOP;

  -- Update room status
  UPDATE game_rooms
  SET 
    status = 'PLAYING',
    current_round = p_round_number,
    started_at = CASE WHEN started_at IS NULL THEN NOW() ELSE started_at END
  WHERE id = p_room_id;

  v_result := json_build_object(
    'success', true,
    'round_number', p_round_number,
    'player_count', v_player_count
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCTION: Process Vote Results
-- Counts votes and eliminates player
-- ========================================
CREATE OR REPLACE FUNCTION process_vote_results(
  p_room_id UUID,
  p_round_number INTEGER
)
RETURNS JSON AS $$
DECLARE
  v_eliminated_id UUID;
  v_vote_count INTEGER;
  v_was_traitor BOOLEAN;
  v_remaining_players INTEGER;
  v_result JSON;
BEGIN
  -- Find player with most votes
  SELECT target_id, COUNT(*) as votes INTO v_eliminated_id, v_vote_count
  FROM game_votes
  WHERE room_id = p_room_id AND round_number = p_round_number
  GROUP BY target_id
  ORDER BY votes DESC, RANDOM() -- Random tiebreaker
  LIMIT 1;

  IF v_eliminated_id IS NULL THEN
    RAISE EXCEPTION 'No votes found for this round';
  END IF;

  -- Mark player as eliminated
  UPDATE room_participants
  SET is_alive = false
  WHERE room_id = p_room_id AND user_id = v_eliminated_id;

  -- Check if eliminated player was traitor
  SELECT (role = 'TRAITOR') INTO v_was_traitor
  FROM round_secrets
  WHERE room_id = p_room_id 
    AND user_id = v_eliminated_id 
    AND round_number = p_round_number;

  -- Count remaining players
  SELECT COUNT(*) INTO v_remaining_players
  FROM room_participants
  WHERE room_id = p_room_id AND is_alive = true;

  -- Determine game outcome
  IF v_was_traitor THEN
    -- Word Keepers win!
    UPDATE game_rooms
    SET status = 'FINISHED', finished_at = NOW()
    WHERE id = p_room_id;
  ELSIF v_remaining_players <= 2 THEN
    -- Traitor survives to final 2, Traitor wins!
    UPDATE game_rooms
    SET status = 'FINISHED', finished_at = NOW()
    WHERE id = p_room_id;
  END IF;

  v_result := json_build_object(
    'eliminated_player_id', v_eliminated_id,
    'vote_count', v_vote_count,
    'was_traitor', v_was_traitor,
    'remaining_players', v_remaining_players,
    'game_over', v_was_traitor OR v_remaining_players <= 2,
    'winner', CASE 
      WHEN v_was_traitor THEN 'WORD_KEEPERS'
      WHEN v_remaining_players <= 2 THEN 'TRAITOR'
      ELSE NULL
    END
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- FUNCTION: Create Room with Code
-- ========================================
CREATE OR REPLACE FUNCTION create_game_room(
  p_host_id UUID,
  p_game_mode TEXT DEFAULT 'SILENT',
  p_difficulty TEXT DEFAULT 'MEDIUM',
  p_word_pack TEXT DEFAULT 'GENERAL'
)
RETURNS JSON AS $$
DECLARE
  v_room_code TEXT;
  v_room_id UUID;
  v_result JSON;
BEGIN
  -- Generate unique room code
  LOOP
    v_room_code := generate_room_code();
    EXIT WHEN NOT EXISTS (SELECT 1 FROM game_rooms WHERE room_code = v_room_code);
  END LOOP;

  -- Create room
  INSERT INTO game_rooms (room_code, host_id, game_mode, difficulty, word_pack)
  VALUES (v_room_code, p_host_id, p_game_mode, p_difficulty, p_word_pack)
  RETURNING id INTO v_room_id;

  -- Add host as first participant
  INSERT INTO room_participants (room_id, user_id)
  VALUES (v_room_id, p_host_id);

  v_result := json_build_object(
    'room_id', v_room_id,
    'room_code', v_room_code
  );

  RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION start_new_round TO authenticated;
GRANT EXECUTE ON FUNCTION process_vote_results TO authenticated;
GRANT EXECUTE ON FUNCTION create_game_room TO authenticated;