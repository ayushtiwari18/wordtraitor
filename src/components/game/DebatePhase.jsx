import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import ChatBox from './ChatBox'

const DebatePhase = () => {
  const { 
    hints, 
    participants, 
    room, 
    phaseTimer, 
    getAliveParticipants,
    isHost,
    advancePhase 
  } = useGameStore()

  const alivePlayers = getAliveParticipants()
  const isSilentMode = room?.game_mode === 'SILENT'
  const isRealMode = room?.game_mode === 'REAL'

  // Group hints by user
  const hintsWithUsers = hints.map(hint => {
    const player = participants.find(p => p.user_id === hint.user_id)
    return {
      ...hint,
      username: player?.username || `Player ${hint.user_id.slice(0, 6)}`
    }
  })

  const handleEndDebate = async () => {
    console.log('🏁 Host ending debate phase')
    try {
      await advancePhase()
    } catch (error) {
      console.error('❌ Error ending debate:', error)
    }
  }

  return (
    <div className="max-w-7xl mx-auto p-6" data-testid="debate-phase-container">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {isRealMode ? '🎤 Voice Discussion' : '💬 Debate Time'}
        </h2>
        <p className="text-gray-400">
          {isSilentMode 
            ? 'Discuss the hints in chat and identify the traitor' 
            : 'Discuss the hints over voice chat and identify the traitor'
          }
        </p>
        
        {/* Timer - SILENT mode only */}
        {isSilentMode && (
          <div data-testid="phase-timer" className="mt-4 text-3xl font-bold text-orange-400">
            {phaseTimer}s
          </div>
        )}

        {/* Host Control - REAL mode only */}
        {isRealMode && isHost && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <button
              onClick={handleEndDebate}
              className="px-8 py-4 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 rounded-xl font-bold text-white text-lg shadow-lg transition-all transform hover:scale-105 flex items-center gap-3 mx-auto"
            >
              <span className="text-2xl">✅</span>
              End Debate → Vote Now
            </button>
            <p className="text-sm text-gray-400 mt-2">Click when discussion is complete</p>
          </motion.div>
        )}

        {/* Non-Host Message - REAL mode only */}
        {isRealMode && !isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-6 p-4 bg-gray-800 border-2 border-gray-700 rounded-xl"
          >
            <p className="text-gray-400">
              ⏳ Waiting for host to start voting...
            </p>
          </motion.div>
        )}
      </div>

      {/* Main Content Area */}
      <div className={`grid ${isSilentMode ? 'lg:grid-cols-2' : 'grid-cols-1'} gap-6`}>
        {/* Hints Display */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold text-white mb-4">💡 Given Hints</h3>
          <div data-testid="hint-list" className="grid grid-cols-1 gap-4 max-h-[600px] overflow-y-auto">
            <AnimatePresence>
              {hintsWithUsers.map((hint, index) => (
                <motion.div
                  key={hint.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  data-testid="hint-item"
                  className="bg-gray-800 border-2 border-gray-700 rounded-xl p-6 hover:border-purple-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-lg">
                        {hint.username.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-white font-semibold">{hint.username}</p>
                        <p className="text-xs text-gray-500">
                          {new Date(hint.submitted_at).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-gray-900 rounded-lg p-4 mt-3">
                    <p className="text-2xl font-bold text-purple-400 text-center">
                      "{hint.hint_text}"
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Alive Players */}
          <div className="mt-6">
            <h3 className="text-sm text-gray-400 mb-3">Players Alive: {alivePlayers.length}</h3>
            <div className="flex flex-wrap gap-2">
              {alivePlayers.map(player => (
                <div
                  key={player.user_id}
                  className="px-3 py-1 bg-gray-800 border border-gray-700 rounded-full text-sm text-gray-300"
                >
                  {player.username || `Player ${player.user_id.slice(0, 6)}`}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Chat Box - Silent Mode Only */}
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
        <h3 className="text-lg font-bold text-blue-400 mb-3">💡 Discussion Tips</h3>
        <ul className="space-y-2 text-gray-300">
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Look for hints that don't quite match the pattern</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>Ask players to explain their hint choices</span>
          </li>
          <li className="flex items-start gap-2">
            <span className="text-blue-400">•</span>
            <span>The traitor is trying to blend in - look for vague hints</span>
          </li>
          {isSilentMode && (
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Use the chat to discuss suspicions and coordinate votes</span>
            </li>
          )}
          {isRealMode && (
            <li className="flex items-start gap-2">
              <span className="text-blue-400">•</span>
              <span>Host: End debate when everyone has shared their thoughts</span>
            </li>
          )}
        </ul>
      </motion.div>
    </div>
  )
}

export default DebatePhase