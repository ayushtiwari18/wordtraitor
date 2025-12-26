import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../../lib/supabase.js'
import useGameStore from '../../store/gameStore'

const PostRoundPhase = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const room = useGameStore(state => state.room)
  const [loading, setLoading] = useState(false)

  // Get current user ID
  const getCurrentUserId = () => {
    return localStorage.getItem('guestId') || localStorage.getItem('userId')
  }

  // Determine winner from room data
  const getWinnerMessage = () => {
    // Check room status or game_over state
    const status = room?.status
    const winner = room?.winner // Assuming this field exists in game_rooms

    if (winner === 'CITIZENS' || status === 'CITIZENS_WIN') {
      return {
        title: 'CITIZENS WIN! 🎉',
        subtitle: 'The traitor was caught!',
        emoji: '🎯',
        color: 'text-green-400'
      }
    } else if (winner === 'TRAITOR' || status === 'TRAITOR_WIN') {
      return {
        title: 'TRAITOR WINS! 😈',
        subtitle: 'The traitor escaped detection!',
        emoji: '👹',
        color: 'text-red-400'
      }
    } else {
      return {
        title: 'GAME OVER',
        subtitle: 'Thanks for playing!',
        emoji: '🏆',
        color: 'text-purple-400'
      }
    }
  }

  // Handle "Back to Lobby" button
  const handleBackToLobby = async () => {
    try {
      setLoading(true)

      // 1. Reset room to LOBBY state
      const { error: roomError } = await supabase
        .from('game_rooms')
        .update({
          current_phase: 'LOBBY',
          status: 'LOBBY',
          current_round: 1,
          started_at: null,
          finished_at: null
        })
        .eq('id', roomId)

      if (roomError) throw roomError

      // 2. Reset all participants to alive
      const { error: participantsError } = await supabase
        .from('room_participants')
        .update({ is_alive: true })
        .eq('room_id', roomId)

      if (participantsError) throw participantsError

      // 3. Delete round secrets (game over, fresh start)
      const { error: secretsError } = await supabase
        .from('round_secrets')
        .delete()
        .eq('room_id', roomId)

      if (secretsError) throw secretsError

      // 4. Delete all hints (already cleaned up by backend, but ensure)
      await supabase.from('game_hints').delete().eq('room_id', roomId)
      
      // 5. Delete all votes
      await supabase.from('game_votes').delete().eq('room_id', roomId)
      
      // 6. Delete all chat messages
      await supabase.from('room_messages').delete().eq('room_id', roomId)

      console.log('✅ Room reset to lobby successfully')

      // Navigate back to lobby
      const roomCode = room?.room_code || roomId
      navigate(`/lobby/${roomCode}`)
    } catch (err) {
      console.error('Error returning to lobby:', err)
      alert('Failed to return to lobby. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Handle "Leave Game" button
  const handleLeaveGame = async () => {
    try {
      setLoading(true)
      const userId = getCurrentUserId()

      if (!userId) {
        console.warn('No user ID found')
        navigate('/')
        return
      }

      // Remove user from room
      const { error } = await supabase
        .from('room_participants')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', userId)

      if (error) throw error

      console.log('✅ Left game successfully')

      // Navigate to home
      navigate('/')
    } catch (err) {
      console.error('Error leaving game:', err)
      alert('Failed to leave game. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const message = getWinnerMessage()

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-gradient-to-br from-gray-900 to-gray-800 border-2 border-purple-500/30 rounded-3xl p-10">
          {/* Winner Announcement */}
          <div className="text-center mb-8">
            <motion.div 
              className="text-9xl mb-4"
              animate={{ 
                scale: [1, 1.2, 1],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ 
                duration: 1.5,
                repeat: Infinity,
                repeatDelay: 1
              }}
            >
              {message.emoji}
            </motion.div>
            <h2 className={`text-5xl font-bold mb-2 ${message.color}`}>
              {message.title}
            </h2>
            <p className="text-xl text-gray-400">{message.subtitle}</p>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-700 my-8"></div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={handleBackToLobby}
              disabled={loading}
              className="flex-1 px-6 py-4 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🔄</span>
                  <span>Back to Lobby</span>
                </>
              )}
            </button>

            <button
              onClick={handleLeaveGame}
              disabled={loading}
              className="flex-1 px-6 py-4 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-800 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-all transform hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span>
                  <span>Loading...</span>
                </>
              ) : (
                <>
                  <span>🚺</span>
                  <span>Leave Game</span>
                </>
              )}
            </button>
          </div>

          {/* Info Text */}
          <p className="text-sm text-gray-500 text-center mt-6 px-4">
            Click "Back to Lobby" to play again with the same players,<br />
            or "Leave Game" to return to the main menu.
          </p>
        </div>
      </motion.div>
    </div>
  )
}

export default PostRoundPhase