import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { gameHelpers } from '../../lib/supabase'
import confetti from 'canvas-confetti'

const Results = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const { gameResults, participants, myUserId, mySecret, leaveRoom } = useGameStore()
  const [secrets, setSecrets] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fire confetti
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 }
      })
    }, 500)

    // Load all secrets (game is over, so we can show them)
    loadSecrets()
  }, [])

  const loadSecrets = async () => {
    try {
      // In a real implementation, you'd need a server function to reveal all secrets
      // For now, we'll just show what we know
      setLoading(false)
    } catch (error) {
      console.error('Error loading secrets:', error)
      setLoading(false)
    }
  }

  const handleNewGame = async () => {
    await leaveRoom()
    navigate('/')
  }

  const handleGoHome = async () => {
    await leaveRoom()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-2xl text-purple-400 animate-pulse">Loading results...</div>
      </div>
    )
  }

  const winner = gameResults?.winner
  const traitorId = gameResults?.traitorId
  const traitor = participants.find(p => p.user_id === traitorId)
  const wasITraitor = myUserId === traitorId
  const didIWin = (winner === 'TRAITOR' && wasITraitor) || (winner === 'CITIZENS' && !wasITraitor)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Winner Announcement */}
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 0.8 }}
          className="text-center mb-12"
        >
          <div className="text-8xl mb-6">
            {winner === 'TRAITOR' ? '🕵️' : '🏆'}
          </div>
          <h1 className="text-5xl font-bold text-white mb-4">
            {winner === 'TRAITOR' ? 'Traitor Wins!' : 'Citizens Win!'}
          </h1>
          <p className="text-2xl text-gray-400">
            {didIWin ? (
              <span className="text-green-400 font-bold">You won! 🎉</span>
            ) : (
              <span className="text-red-400">You lost!</span>
            )}
          </p>
        </motion.div>

        {/* Traitor Reveal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 border-2 border-red-500 rounded-2xl p-8 mb-8"
        >
          <div className="text-center">
            <p className="text-gray-400 mb-3">The traitor was...</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-3xl border-2 border-red-500">
                {traitor?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-left">
                <h2 className="text-3xl font-bold text-white">
                  {traitor?.username || 'Unknown Player'}
                </h2>
                <p className="text-red-400 font-semibold">
                  {wasITraitor ? '(You!)' : ''}
                </p>
              </div>
            </div>
            {mySecret && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Your role & word:</p>
                <div className="inline-block px-6 py-3 bg-gray-900 rounded-lg">
                  <span className={`font-bold ${
                    mySecret.role === 'TRAITOR' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {mySecret.role}
                  </span>
                  <span className="text-gray-400 mx-2">-</span>
                  <span className="text-purple-400 font-bold text-xl">
                    "{mySecret.secret_word}"
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Player List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Final Standings</h3>
          <div className="space-y-3">
            {participants.map((player) => (
              <div
                key={player.user_id}
                className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                  player.user_id === traitorId
                    ? 'bg-red-500/10 border-red-500'
                    : 'bg-gray-900 border-gray-700'
                } ${!player.is_alive ? 'opacity-50' : ''}`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    {player.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-semibold">
                      {player.username || `Player ${player.user_id.slice(0, 6)}`}
                      {player.user_id === myUserId && ' (You)'}
                    </p>
                    {player.user_id === traitorId && (
                      <p className="text-red-400 text-sm font-semibold">🕵️ Traitor</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {player.is_alive ? (
                    <span className="text-green-400 font-semibold">✓ Survived</span>
                  ) : (
                    <span className="text-red-400">❌ Eliminated</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={handleNewGame}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition-colors shadow-lg"
            title="Create a new game room"
          >
            🆕 New Game
          </button>
          <button
            onClick={handleGoHome}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white text-lg transition-colors"
          >
            🏠 Go Home
          </button>
        </motion.div>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          💡 Tip: 'New Game' will return you to the home screen to create or join another room
        </p>
      </div>
    </div>
  )
}

export default Results