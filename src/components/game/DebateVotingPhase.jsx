import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import ChatBox from './ChatBox'

const DebateVotingPhase = () => {
  const { 
    hints,
    participants, 
    myUserId, 
    votes, 
    submitVote, 
    room,
    getAliveParticipants,
    isHost,
    advancePhase  // ✅ Use advancePhase instead of non-existent forceEndVoting
  } = useGameStore()

  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)

  const alivePlayers = getAliveParticipants()
  const myPlayer = alivePlayers.find(p => p.user_id === myUserId)
  const votablePlayers = alivePlayers.filter(p => p.user_id !== myUserId)  // ✅ FIXED: Was "votableP layers"
  const isSilentMode = room?.game_mode === 'SILENT'
  const isRealMode = room?.game_mode === 'REAL'

  // Check if user has already voted
  useEffect(() => {
    const myVote = votes.find(v => v.voter_id === myUserId)
    setHasVoted(!!myVote)
    if (myVote) {
      setSelectedPlayer(myVote.target_id)
    }
  }, [votes, myUserId])

  // Group hints by user
  const hintsWithUsers = hints.map(hint => {
    const player = participants.find(p => p.user_id === hint.user_id)
    return {
      ...hint,
      username: player?.username || `Player ${hint.user_id.slice(0, 6)}`
    }
  })

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

  const handleForceEnd = async () => {
    if (!isHost) return
    
    if (confirm('End voting now? Not all players have voted yet.')) {
      try {
        console.log('🚨 Host forcing advance to REVEAL phase')
        await advancePhase()  // ✅ Use advancePhase method
      } catch (error) {
        console.error('Error forcing end voting:', error)
      }
    }
  }

  const voteCount = votes.length
  const totalVoters = alivePlayers.length
  const allVoted = voteCount >= totalVoters

  // Spectator view
  if (!myPlayer || !myPlayer.is_alive) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-white mb-2">💬 Debate & Vote</h2>
          <p className="text-gray-400">You are spectating</p>
        </div>
        
        <div className="bg-gray-800 border-2 border-gray-700 rounded-xl p-8 text-center">
          <div className="text-6xl mb-4">👻</div>
          <h3 className="text-2xl font-bold text-gray-400 mb-2">You've Been Eliminated</h3>
          <p className="text-gray-500">Watch as the remaining players discuss and vote</p>
          <div className="mt-4 text-sm text-gray-400">
            Votes: {voteCount}/{totalVoters}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="debate-voting-phase-container">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {isRealMode ? '🎤 Voice Discussion & Vote' : '💬 Debate & Vote'}
        </h2>
        <p className="text-gray-400">
          Discuss the hints and vote to eliminate a player
        </p>
        
        {/* Vote Progress - NO TIMER */}
        <div className="mt-4 flex items-center justify-center gap-2">
          <div data-testid="vote-progress" className="text-lg font-semibold text-purple-400">
            Votes: {voteCount}/{totalVoters}
          </div>
        </div>

        {allVoted && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-4 bg-green-500/20 border-2 border-green-500 rounded-xl p-4"
          >
            <p className="text-green-400 font-bold">✅ All votes in! Advancing...</p>
          </motion.div>
        )}

        {/* Host: Force End Button */}
        {isHost && !allVoted && voteCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <button
              onClick={handleForceEnd}
              className="px-6 py-3 bg-orange-600 hover:bg-orange-700 rounded-xl font-bold text-white shadow-lg transition-all"
            >
              🚨 Force End Voting
            </button>
            <p className="text-sm text-gray-400 mt-2">End voting early (only if needed)</p>
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`grid ${isSilentMode ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Left: Hints Display */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">💡 Given Hints</h3>
          <div data-testid="hint-list" className="grid grid-cols-1 gap-4 max-h-[400px] overflow-y-auto">
            <AnimatePresence>
              {hintsWithUsers.map((hint, index) => (
                <motion.div
                  key={hint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid="hint-item"
                  className="bg-gray-800 border-2 border-gray-700 rounded-xl p-4 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center text-sm">
                      {hint.username.charAt(0).toUpperCase()}
                    </div>
                    <p className="text-white font-semibold">{hint.username}</p>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-3">
                    <p className="text-xl font-bold text-purple-400 text-center">
                      "{hint.hint_text}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Voting Section */}
          <div className="mt-6 bg-gray-800 border-2 border-gray-700 rounded-xl p-6">
            <h3 className="text-xl font-bold text-white mb-4">⚖️ Cast Your Vote</h3>
            
            {hasVoted ? (
              <div className="text-center p-6 bg-green-500/20 border-2 border-green-500 rounded-xl">
                <div className="text-4xl mb-2">✓</div>
                <p className="text-green-400 font-semibold">Vote submitted!</p>
                <p className="text-gray-400 text-sm mt-2">Waiting for others...</p>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {votablePlayers.map((player) => (
                    <button
                      key={player.user_id}
                      onClick={() => setSelectedPlayer(player.user_id)}
                      data-testid="vote-option"
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPlayer === player.user_id
                          ? 'bg-red-500/20 border-red-500 ring-2 ring-red-500'
                          : 'bg-gray-900 border-gray-700 hover:border-red-400'
                      }`}
                    >
                      <div className="flex flex-col items-center">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg mb-2 ${
                          selectedPlayer === player.user_id ? 'bg-red-500/30' : 'bg-gray-700'
                        }`}>
                          {player.username?.charAt(0).toUpperCase() || '?'}
                        </div>
                        <p className="text-white font-semibold text-sm text-center">
                          {player.username || `Player ${player.user_id.slice(0, 6)}`}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>

                <button
                  onClick={handleVote}
                  disabled={!selectedPlayer || isSubmitting}
                  data-testid="confirm-vote-button"
                  className="w-full px-6 py-3 bg-red-600 hover:bg-red-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white transition-colors"
                >
                  {isSubmitting ? '📤 Submitting...' : selectedPlayer ? '🎯 Eliminate Player' : '⏳ Select a Player'}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Right: Chat Box - Silent Mode Only */}
        {isSilentMode && (
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="h-[600px]"
          >
            <ChatBox />
          </motion.div>
        )}
      </div>

      {/* Discussion Tips */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-blue-500/10 border-2 border-blue-500 rounded-xl p-6"
      >
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Voting Tips</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Look for hints that seem out of place or too generic</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>The traitor is trying to blend in - watch for hesitation</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Trust your instincts and discuss with others</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span><strong>No timer!</strong> Vote when you're ready</span>
          </li>
        </ul>
      </motion.div>
    </div>
  )
}

export default DebateVotingPhase