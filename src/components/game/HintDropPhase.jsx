import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'

const HintDropPhase = () => {
  const { 
    hints, 
    participants, 
    myUserId, 
    submitHint, 
    phaseTimer,
    getAliveParticipants 
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

  const alivePlayers = getAliveParticipants()
  const submittedCount = hints.length
  const totalCount = alivePlayers.length

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">💭 Drop Your Hint</h2>
        <p className="text-gray-400">Give a one-word hint about your secret word</p>
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className="text-2xl font-bold text-purple-400">{phaseTimer}s</div>
          <div className="text-gray-400">|</div>
          <div className="text-sm text-gray-400">
            {submittedCount}/{totalCount} hints submitted
          </div>
        </div>
      </div>

      {/* Hint Input */}
      {!hasSubmitted && (
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
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500 transition-colors"
              disabled={isSubmitting}
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Be specific but not too obvious!
              </p>
              <button
                type="submit"
                disabled={!hintText.trim() || isSubmitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Hint'}
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* Submitted Confirmation */}
      {hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center"
        >
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-400 font-semibold">Hint submitted!</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for other players...</p>
        </motion.div>
      )}

      {/* Submission Progress */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
        <AnimatePresence>
          {alivePlayers.map((player) => {
            const hasSubmitted = hints.some(h => h.user_id === player.user_id)
            const isMe = player.user_id === myUserId
            
            return (
              <motion.div
                key={player.user_id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={`p-4 rounded-lg border-2 transition-colors ${
                  hasSubmitted
                    ? 'bg-green-500/10 border-green-500'
                    : 'bg-gray-800 border-gray-700'
                } ${isMe ? 'ring-2 ring-purple-500' : ''}`}
              >
                <div className="text-center">
                  <div className="text-2xl mb-2">
                    {hasSubmitted ? '✓' : '⏳'}
                  </div>
                  <p className="text-sm text-gray-300 truncate">
                    {player.username || `Player ${player.user_id.slice(0, 6)}`}
                  </p>
                  {isMe && <p className="text-xs text-purple-400 mt-1">You</p>}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}

export default HintDropPhase