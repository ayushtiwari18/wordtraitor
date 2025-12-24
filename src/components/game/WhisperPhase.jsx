import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'

const WhisperPhase = () => {
  const { mySecret, phaseTimer } = useGameStore()
  
  // NEW: Timed reveal state (0 = waiting, 1 = "Revealing...", 2 = "Your word is...", 3 = show word)
  const [revealStep, setRevealStep] = useState(0)

  useEffect(() => {
    // Start reveal sequence
    const timer1 = setTimeout(() => setRevealStep(1), 500) // "Revealing..." after 0.5s
    const timer2 = setTimeout(() => setRevealStep(2), 1500) // "Your word is..." after 1.5s
    const timer3 = setTimeout(() => setRevealStep(3), 2500) // Show word after 2.5s
    
    return () => {
      clearTimeout(timer1)
      clearTimeout(timer2)
      clearTimeout(timer3)
    }
  }, [])

  if (!mySecret) return null

  const isTraitor = mySecret.role === 'TRAITOR'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
      data-testid="whisper-phase-container"
    >
      {/* Role Badge - ENHANCED */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        data-testid="player-role"
        className={`mb-8 px-6 py-3 rounded-full font-bold text-xl ${
          isTraitor 
            ? 'bg-red-500/20 text-red-400 border-2 border-red-500 glow-red-sm' 
            : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500 glow-cyan-sm'
        }`}
      >
        {isTraitor ? '🕵️ You are the TRAITOR' : '👤 You are a CITIZEN'}
      </motion.div>

      {/* Secret Word - TIMED REVEAL */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <div className={`absolute inset-0 blur-2xl opacity-30 animate-pulse ${
          isTraitor ? 'bg-gradient-to-r from-red-500 to-orange-500' : 'bg-gradient-to-r from-purple-500 to-pink-500'
        }`} />
        <div className={`relative bg-gray-800/90 backdrop-blur-sm border-2 rounded-2xl p-12 shadow-2xl ${
          isTraitor ? 'border-red-500' : 'border-purple-500'
        }`}>
          <AnimatePresence mode="wait">
            {revealStep === 0 && (
              <motion.div
                key="waiting"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="text-center"
              >
                <div className="text-6xl mb-4">🔒</div>
              </motion.div>
            )}
            
            {revealStep === 1 && (
              <motion.div
                key="revealing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 1.2 }}
                className="text-center"
              >
                <p className="text-gray-400 text-2xl animate-pulse">🔓 Revealing...</p>
              </motion.div>
            )}
            
            {revealStep === 2 && (
              <motion.div
                key="your-word-is"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="text-center"
              >
                <p className="text-gray-400 text-xl">Your word is...</p>
              </motion.div>
            )}
            
            {revealStep === 3 && (
              <motion.div
                key="word"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                className="text-center"
              >
                <p className="text-gray-400 text-sm mb-2">Your Secret Word</p>
                <h2 
                  data-testid="secret-word" 
                  className={`text-6xl font-bold text-white tracking-wider ${
                    isTraitor ? 'text-red-400' : 'text-purple-400'
                  }`}
                >
                  {mySecret.secret_word}
                </h2>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      {/* Instructions - ENHANCED */}
      <AnimatePresence>
        {revealStep === 3 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-12 max-w-2xl text-center"
          >
            <p className="text-gray-300 text-lg leading-relaxed mb-4">
              {isTraitor ? (
                <>
                  <span className="font-bold text-red-400 block text-2xl mb-2">🎭 Lie. Deceive. Survive.</span>
                  Your word is different. Give hints that blend in without being caught.
                  <span className="block text-sm text-gray-500 mt-2">Memorize it. The clock is ticking. ⏳</span>
                </>
              ) : (
                <>
                  <span className="font-bold text-blue-400 block text-2xl mb-2">👥 Memorize it. Trust nobody.</span>
                  Everyone else has this word... except the traitor.
                  <span className="block text-sm text-gray-500 mt-2">Find the liar before they deceive you all. 🔍</span>
                </>
              )}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        data-testid="phase-timer"
        className="mt-8 text-4xl font-bold text-purple-400"
      >
        {phaseTimer}s
      </motion.div>
    </motion.div>
  )
}

export default WhisperPhase