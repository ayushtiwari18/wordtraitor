import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'

const VerdictPhase = () => {
  const { 
    participants, 
    myUserId, 
    votes, 
    submitVote, 
    phaseTimer,
    gamePhase, // 🔧 FIX: Get gamePhase to check if we should show votes
    getAliveParticipants 
  } = useGameStore()
  
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const alivePlayers = getAliveParticipants().filter(p => p.user_id !== myUserId)
  const myPlayer = getAliveParticipants().find(p => p.user_id === myUserId)

  useEffect(() => {
    const myVote = votes.find(v => v.voter_id === myUserId)
    setHasVoted(!!myVote)
    if (myVote) {
      setSelectedPlayer(myVote.target_id)
    }
  }, [votes, myUserId])

  const handleVote = async () => {
    if (!selectedPlayer || isSubmitting || hasVoted) return

    setIsSubmitting(true)
    try {
      await submitVote(selectedPlayer)
      setHasVoted(true)
    } catch (error) {
      console.error('Error submitting vote:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const voteCount = votes.length
  const totalVoters = getAliveParticipants().length

  // Calculate vote tally
  const voteTally = {}
  votes.forEach(vote => {
    voteTally[vote.target_id] = (voteTally[vote.target_id] || 0) + 1
  })

  // Check if I'm eliminated (can't vote)
  if (!myPlayer || !myPlayer.is_alive) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border-2 border-gray-700 rounded-xl p-8"
        >
          <div className="text-6xl mb-4">👻</div>
          <h2 className="text-2xl font-bold text-gray-400 mb-2">You've Been Eliminated</h2>
          <p className="text-gray-500">Watch as the remaining players vote</p>
          <div data-testid="phase-timer" className="mt-6 text-4xl font-bold text-purple-400">{phaseTimer}s</div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="verdict-phase-container">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">⚖️ Cast Your Vote</h2>
        <p className="text-gray-400">Who do you think is the traitor?</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div data-testid="phase-timer" className="text-2xl font-bold text-red-400">{phaseTimer}s</div>
          <div className="text-gray-400">|</div>
          <div data-testid="vote-progress" className="text-sm text-gray-400">
            {voteCount}/{totalVoters} votes cast
          </div>
        </div>
      </div>

      {/* Voted Confirmation */}
      {hasVoted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          data-testid="vote-submitted"
          className="mb-8 bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center"
        >
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-400 font-semibold">Vote cast!</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for other players...</p>
        </motion.div>
      )}

      {/* Player Selection */}
      {!hasVoted && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <AnimatePresence>
              {alivePlayers.map((player) => (
                <motion.button
                  key={player.user_id}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedPlayer(player.user_id)}
                  data-testid="vote-option"
                  disabled={hasVoted}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    selectedPlayer === player.user_id
                      ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500'
                      : 'bg-gray-800 border-gray-700 hover:border-red-400'
                  } ${hasVoted ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center text-2xl mb-3">
                      {player.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <p className="text-white font-semibold text-center">
                      {player.username || `Player ${player.user_id.slice(0, 6)}`}
                    </p>
                    {selectedPlayer === player.user_id && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="mt-2 text-red-400"
                      >
                        ✓ Selected
                      </motion.div>
                    )}
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </div>

          {/* Confirm Button */}
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleVote}
              disabled={!selectedPlayer || isSubmitting || hasVoted}
              data-testid="confirm-vote-button"
              className="px-8 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-colors shadow-lg"
            >
              {isSubmitting ? 'Voting...' : 'Confirm Vote'}
            </button>
          </div>
        </motion.div>
      )}

      {/* 🔧 FIX: Vote Tally - ONLY SHOW IN REVEAL PHASE */}
      {gamePhase === 'REVEAL' && votes.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="vote-tally"
          className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-6"
        >
          <h3 className="text-white font-semibold mb-4">📊 Vote Results</h3>
          <div className="space-y-3">
            {Object.entries(voteTally)
              .sort(([, a], [, b]) => b - a)
              .map(([playerId, count]) => {
                const player = participants.find(p => p.user_id === playerId)
                return (
                  <div key={playerId} className="flex items-center justify-between p-3 bg-gray-900 rounded-lg">
                    <span className="text-gray-300">
                      {player?.username || `Player ${playerId.slice(0, 6)}`}
                    </span>
                    <div className="flex items-center gap-2">
                      <div className="h-2 bg-red-500 rounded" style={{ width: `${(count / totalVoters) * 100}px` }} />
                      <span className="text-red-400 font-bold">{count}</span>
                    </div>
                  </div>
                )
              })}
          </div>
        </motion.div>
      )}

      {/* Warning */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-yellow-500/10 border-2 border-yellow-500 rounded-xl p-4 text-center"
      >
        <p className="text-yellow-400 font-semibold">⚠️ Think carefully!</p>
        <p className="text-gray-400 text-sm mt-1">
          The player with the most votes will be eliminated
        </p>
      </motion.div>
    </div>
  )
}

export default VerdictPhase