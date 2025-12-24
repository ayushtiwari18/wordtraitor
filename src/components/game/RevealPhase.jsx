import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { gameHelpers } from '../../lib/supabase'
import Spinner from '../Spinner'

const RevealPhase = () => {
  const { roomId, room, votes, participants, phaseTimer } = useGameStore()
  const [voteResults, setVoteResults] = useState(null)
  const [eliminatedPlayer, setEliminatedPlayer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [revealStep, setRevealStep] = useState(0)
  const [retryCount, setRetryCount] = useState(0)

  useEffect(() => {
    calculateResults()
  }, [votes, roomId])

  // Timed reveal sequence
  useEffect(() => {
    if (!voteResults || loading || !eliminatedPlayer) return
    
    const timer1 = setTimeout(() => setRevealStep(1), 1000)
    const timer2 = setTimeout(() => setRevealStep(2), 2500)
    const timer3 = setTimeout(() => setRevealStep(3), 4000)
    const timer4 = setTimeout(() => setRevealStep(4), 5500)
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
      clearTimeout(timer4)
    }
  }, [voteResults, loading, eliminatedPlayer])

  const calculateResults = async () => {
    if (!roomId || !room) {
      console.warn('⚠️ Room not loaded, waiting...')
      if (retryCount < 3) {
        setTimeout(() => {
          setRetryCount(prev => prev + 1)
        }, 1000)
      }
      return
    }
    
    try {
      setLoading(true)
      console.log('📊 Calculating vote results for room:', roomId)
      
      const results = await gameHelpers.calculateVoteResults(roomId)
      console.log('✅ Vote results:', results)
      
      setVoteResults(results)
      
      // Find eliminated player from participants
      if (results?.eliminatedId) {
        const eliminated = participants.find(p => p.user_id === results.eliminatedId)
        console.log('💀 Eliminated player:', eliminated)
        setEliminatedPlayer(eliminated)
      }
      
      setLoading(false)
    } catch (error) {
      console.error('❌ Error calculating results:', error)
      setVoteResults({ error: error.message })
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Spinner size="lg" variant="cyan" text="Calculating results..." />
      </div>
    )
  }

  if (voteResults?.error) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <p className="text-red-400 text-xl mb-2">❌ Error</p>
          <p className="text-gray-400">{voteResults.error}</p>
          <button 
            onClick={calculateResults}
            className="mt-4 px-4 py-2 bg-neon-cyan text-dark-bg rounded-lg hover:bg-cyan-400 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    )
  }

  const voteCounts = voteResults?.voteCounts || {}
  const sortedVotes = Object.entries(voteCounts).sort((a, b) => b[1] - a[1])

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">🎭 The Verdict</h2>
        <AnimatePresence mode="wait">
          {revealStep === 0 && (
            <motion.p
              key="counting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-gray-400 animate-pulse"
            >
              📊 Counting votes...
            </motion.p>
          )}
          {revealStep === 1 && (
            <motion.p
              key="accused"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="text-xl text-purple-400 font-bold"
            >
              The accused is...
            </motion.p>
          )}
          {revealStep >= 2 && (
            <motion.p
              key="truth"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-gray-400"
            >
              The truth is revealed...
            </motion.p>
          )}
        </AnimatePresence>
        <div className="mt-4 text-2xl font-bold text-purple-400">{phaseTimer}s</div>
      </div>

      {/* Eliminated Player Card */}
      {revealStep >= 2 && eliminatedPlayer && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ 
            opacity: 1, 
            scale: 1,
            rotate: revealStep === 2 ? [0, -5, 5, -5, 5, 0] : 0
          }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="mb-8 bg-gradient-to-r from-red-900/50 to-purple-900/50 border-2 border-red-500 rounded-2xl p-8 text-center shadow-2xl shadow-red-500/20"
        >
          <div className="text-6xl mb-4">💀</div>
          <h3 className="text-3xl font-bold text-white mb-2">
            {eliminatedPlayer.username || `Player ${eliminatedPlayer.user_id.slice(0, 6)}`}
          </h3>
          <p className="text-xl text-red-400 font-semibold">has been eliminated!</p>
          
          {/* Role and Word Reveal */}
          <AnimatePresence>
            {revealStep >= 3 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-6 pt-6 border-t border-gray-700"
              >
                <div className={`inline-block px-6 py-2 rounded-full font-bold text-lg mb-4 ${
                  eliminatedPlayer.role === 'TRAITOR'
                    ? 'bg-red-500/20 text-red-400 border-2 border-red-500'
                    : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
                }`}>
                  {eliminatedPlayer.role === 'TRAITOR' ? '🕵️ They were the TRAITOR!' : '👤 They were a CITIZEN...'}
                </div>
                
                <div className="mt-4">
                  <p className="text-gray-400 text-sm mb-2">Their word was:</p>
                  <div className="inline-block bg-gray-900 border-2 border-purple-500 rounded-lg px-6 py-3">
                    <span className="text-3xl font-bold text-purple-400">
                      {eliminatedPlayer.secret_word || 'Unknown'}
                    </span>
                  </div>
                </div>
                
                {eliminatedPlayer.role === 'TRAITOR' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-green-400 font-bold text-lg mt-4"
                  >
                    ✅ Citizens Win! The traitor has been caught!
                  </motion.p>
                )}
                {eliminatedPlayer.role === 'CITIZEN' && (
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-yellow-400 font-bold text-lg mt-4"
                  >
                    ⚠️ Wrong choice! An innocent was eliminated...
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* No Elimination */}
      {revealStep >= 2 && !eliminatedPlayer && sortedVotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-gray-800 border-2 border-yellow-500 rounded-2xl p-8 text-center"
        >
          <div className="text-6xl mb-4">🤝</div>
          <h3 className="text-2xl font-bold text-white mb-2">It's a tie!</h3>
          <p className="text-gray-400">No one was eliminated this round</p>
          <p className="text-sm text-gray-500 mt-2">The game continues... 🔄</p>
        </motion.div>
      )}

      {/* Vote Breakdown */}
      {revealStep >= 4 && sortedVotes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4 mb-8"
        >
          <h3 className="text-xl font-bold text-white text-center mb-4">📊 Full Vote Breakdown</h3>
          {sortedVotes.map(([userId, count], index) => {
            const player = participants.find(p => p.user_id === userId)
            const isEliminated = userId === voteResults?.eliminatedId
            
            return (
              <motion.div
                key={userId}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.15 }}
                className={`p-6 rounded-xl border-2 ${
                  isEliminated
                    ? 'bg-red-500/20 border-red-500'
                    : 'bg-gray-800 border-gray-700'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center text-xl ${
                      isEliminated ? 'bg-red-500/30' : 'bg-gray-700'
                    }`}>
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
                          transition={{ delay: index * 0.15 + i * 0.1 }}
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
      )}

      {/* Continue Info */}
      <AnimatePresence>
        {revealStep >= 4 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-gray-400"
          >
            <p>🔍 Checking win conditions...</p>
            <p className="text-xs text-gray-500 mt-2">Next phase starting soon...</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default RevealPhase