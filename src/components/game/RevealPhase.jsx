import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { gameHelpers } from '../../lib/supabase'

const RevealPhase = () => {
  const { roomId, votes, participants, phaseTimer, eliminated } = useGameStore()
  const [voteResults, setVoteResults] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    calculateResults()
  }, [votes])

  const calculateResults = async () => {
  const { roomId, room } = useGameStore()
  
  // 🔧 FIX: Add null checks
  if (!roomId || !room) {
    console.warn('⚠️ Room not loaded, skipping results')
    setResults({ error: 'Room not loaded' })
    return
  }
  
  try {
    const results = await gameHelpers.calculateVoteResults(roomId)
    setResults(results)
  } catch (error) {
    console.error('Error calculating results:', error)
    setResults({ error: error.message })
  }
}


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-2xl text-purple-400 animate-pulse">Calculating results...</div>
      </div>
    )
  }

  const eliminatedPlayer = participants.find(p => p.user_id === voteResults?.eliminatedId)
  const voteCounts = voteResults?.voteCounts || {}
  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🎭 The Verdict</h2>
        <p className="text-gray-400">The votes have been counted...</p>
        <div className="mt-4 text-2xl font-bold text-purple-400">{phaseTimer}s</div>
      </div>

      {/* Vote Results */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4 mb-8"
      >
        {sortedVotes.map(([userId, count], index) => {
          const player = participants.find(p => p.user_id === userId)
          const isEliminated = userId === voteResults?.eliminatedId
          
          return (
            <motion.div
              key={userId}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.2 }}
              className={`p-6 rounded-xl border-2 ${
                isEliminated
                  ? 'bg-red-500/20 border-red-500'
                  : 'bg-gray-800 border-gray-700'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gray-700 rounded-full flex items-center justify-center text-xl">
                    {player?.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-bold text-lg">
                      {player?.username || `Player ${userId.slice(0, 6)}`}
                    </p>
                    {isEliminated && (
                      <p className="text-red-400 text-sm font-semibold">❌ Eliminated</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <div className="text-3xl font-bold text-white">{count}</div>
                    <div className="text-xs text-gray-400">
                      {count === 1 ? 'vote' : 'votes'}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    {Array.from({ length: count }).map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: index * 0.2 + i * 0.1 }}
                        className="w-3 h-3 bg-red-500 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )
        })}
      </motion.div>

      {/* Elimination Announcement */}
      {eliminatedPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.8, type: 'spring' }}
          className="bg-gradient-to-r from-red-900/50 to-purple-900/50 border-2 border-red-500 rounded-2xl p-8 text-center"
        >
          <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ delay: 1, duration: 0.5 }}
            className="text-6xl mb-4"
          >
            💀
          </motion.div>
          <h3 className="text-2xl font-bold text-white mb-2">
            {eliminatedPlayer.username || `Player ${eliminatedPlayer.user_id.slice(0, 6)}`}
          </h3>
          <p className="text-xl text-red-400 font-semibold">has been eliminated!</p>
        </motion.div>
      )}

      {/* No Elimination */}
      {!eliminatedPlayer && sortedVotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border-2 border-yellow-500 rounded-2xl p-8 text-center"
        >
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-2xl font-bold text-white mb-2">It's a tie!</h3>
          <p className="text-gray-400">No one was eliminated this round</p>
        </motion.div>
      )}

      {/* Continue Info */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="mt-8 text-center text-gray-400"
      >
        <p>Checking win conditions...</p>
      </motion.div>
    </div>
  )
}

export default RevealPhase