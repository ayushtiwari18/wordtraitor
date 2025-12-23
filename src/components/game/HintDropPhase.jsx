import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import useGameStore from '../../store/gameStore'

const HintDropPhase = () => {
  const { 
    hints, 
    participants,
    room,
    myUserId, 
    submitHint,
    submitRealModeNext,
    phaseTimer,
    getAliveParticipants,
    getCurrentTurnPlayer,
    isMyTurnToHint
  } = useGameStore()
  
  const [hintText, setHintText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)

  useEffect(() => {
    // Check if I've already submitted
    const myHint = hints.find(h => h.user_id === myUserId)
    setHasSubmitted(!!myHint)
  }, [hints, myUserId])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!hintText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await submitHint(hintText.trim())
      setHintText('')
      setHasSubmitted(true)
    } catch (error) {
      console.error('Error submitting hint:', error)
    } finally {
      setIsSubmitting(false)
    }
  }
  
  const handleRealModeNext = async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitRealModeNext()
      setHasSubmitted(true)
    } catch (error) {
      console.error('Error marking next:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const alivePlayers = getAliveParticipants()
  const submittedCount = hints.length
  const totalCount = alivePlayers.length
  const isSilentMode = room?.game_mode === 'SILENT'
  const isMyTurn = isMyTurnToHint()
  const currentPlayer = getCurrentTurnPlayer()

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="hint-drop-phase-container">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">💡 Drop Your Hint</h2>
        <p className="text-gray-400">
          {isSilentMode ? 'Give a one-word hint about your secret word' : 'Say your hint out loud, then click Next'}
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div data-testid="phase-timer" className="text-2xl font-bold text-purple-400">{phaseTimer}s</div>
          <div className="text-gray-400">|</div>
          <div data-testid="hint-progress" className="text-sm text-gray-400">
            {submittedCount}/{totalCount} hints submitted
          </div>
        </div>
      </div>

      {/* Turn Indicator for Silent Mode */}
      {isSilentMode && currentPlayer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="current-turn-player"
          className={`mb-6 p-4 rounded-xl border-2 text-center ${
            isMyTurn 
              ? 'bg-purple-500/20 border-purple-500'
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          <p className="text-sm text-gray-400 mb-1">Current Turn</p>
          <p className="text-xl font-bold text-white">
            {isMyTurn ? '👉 YOUR TURN!' : `⏳ ${currentPlayer.username || 'Player'}'s turn`}
          </p>
        </motion.div>
      )}

      {/* Hint Input - Silent Mode */}
      {isSilentMode && !hasSubmitted && isMyTurn && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="mb-8"
        >
          <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6">
            <input
              type="text"
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="Type your one-word hint..."
              maxLength={30}
              data-testid="hint-input"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Be specific but not too obvious!
              </p>
              <button
                type="submit"
                data-testid="submit-hint-button"
                disabled={!hintText.trim() || isSubmitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Hint'}
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Next Button - Real Mode */}
      {!isSilentMode && !hasSubmitted && isMyTurn && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 text-center">
            <p className="text-lg text-gray-300 mb-4">
              🎤 Say your hint out loud to everyone
            </p>
            <button
              onClick={handleRealModeNext}
              disabled={isSubmitting}
              data-testid="real-mode-next-button"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center gap-2 mx-auto"
            >
              {isSubmitting ? 'Processing...' : 'Next Player'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </motion.div>
      )}

      {/* Waiting Message */}
      {!isMyTurn && !hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-gray-800 border-2 border-gray-700 rounded-xl p-6 text-center"
          data-testid="waiting-for-turn"
        >
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-400">Wait for your turn...</p>
          <p className="text-sm text-gray-500 mt-2">
            {currentPlayer ? `${currentPlayer.username} is giving their hint` : 'Waiting...'}
          </p>
        </motion.div>
      )}

      {/* Submitted Confirmation */}
      {hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          data-testid="hint-submitted-confirmation"
          className="mb-8 bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center"
        >
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-400 font-semibold">Hint submitted!</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for other players...</p>
        </motion.div>
      )}

      {/* Hint List */}
      {hints.length > 0 && (
        <div data-testid="hint-list" className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">📝 Hints So Far</h3>
          <div className="space-y-2">
            {hints.map((hint, index) => (
              <div key={hint.id || index} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <span className="text-purple-400 font-mono">{index + 1}.</span>
                <span className="text-white">{hint.hint_text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Submission Progress */}
      <div data-testid="player-status-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
          {alivePlayers.map((player, index) => {
            const hasSubmitted = hints.some(h => h.user_id === player.user_id)
            const isMe = player.user_id === myUserId
            const isCurrentTurn = currentPlayer?.user_id === player.user_id
            
            return (
              <motion.div
                key={player.user_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                data-testid="player-status-item"
                className={`p-4 rounded-lg border-2 transition-all ${
                  hasSubmitted
                    ? 'bg-green-500/10 border-green-500'
                    : isCurrentTurn && isSilentMode
                    ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-400 animate-pulse'
                    : 'bg-gray-800 border-gray-700'
                } ${isMe ? 'ring-2 ring-blue-500' : ''}`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {hasSubmitted ? '✓' : isCurrentTurn && isSilentMode ? '👉' : '⏳'}
                  </div>
                  <p className="text-sm text-gray-300 truncate">
                    {player.username || `Player ${player.user_id.slice(0, 6)}`}
                  </p>
                  {isMe && <p className="text-xs text-blue-400 mt-1">You</p>}
                  {isCurrentTurn && isSilentMode && !hasSubmitted && (
                    <p className="text-xs text-purple-400 mt-1">Turn</p>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="mt-8 bg-blue-500/10 border border-blue-500 rounded-xl p-4"
      >
        <h3 className="text-blue-400 font-semibold mb-2">💡 Tips</h3>
        <ul className="text-sm text-gray-300 space-y-1">
          {isSilentMode ? (
            <>
              <li>• Wait for your turn to submit your hint</li>
              <li>• Make your hint related to your word but not too obvious</li>
              <li>• Keep it to one word or a short phrase</li>
            </>
          ) : (
            <>
              <li>• Say your hint clearly to everyone in the voice chat</li>
              <li>• Click "Next Player" when you're done</li>
              <li>• Listen carefully to other players' hints</li>
            </>
          )}
        </ul>
      </motion.div>
    </div>
  )
}

export default HintDropPhase