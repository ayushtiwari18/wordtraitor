import React from 'react'
import { motion } from 'framer-motion'
import useGameStore from '../../store/gameStore'

const WhisperPhase = () => {
  const { mySecret, phaseTimer } = useGameStore()

  if (!mySecret) return null

  const isTraitor = mySecret.role === 'TRAITOR'

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center min-h-[60vh] p-8"
    >
      {/* Role Badge */}
      <motion.div
        initial={{ y: -20 }}
        animate={{ y: 0 }}
        className={`mb-8 px-6 py-3 rounded-full font-bold text-xl ${
          isTraitor 
            ? 'bg-red-500/20 text-red-400 border-2 border-red-500' 
            : 'bg-blue-500/20 text-blue-400 border-2 border-blue-500'
        }`}
      >
        {isTraitor ? '🕵️ You are the TRAITOR' : '👤 You are a CITIZEN'}
      </motion.div>

      {/* Secret Word */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 200 }}
        className="relative"
      >
        <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 blur-2xl opacity-30 animate-pulse" />
        <div className="relative bg-gray-800/90 backdrop-blur-sm border-2 border-purple-500 rounded-2xl p-12 shadow-2xl">
          <p className="text-gray-400 text-sm mb-2 text-center">Your Secret Word</p>
          <h2 className="text-6xl font-bold text-white text-center tracking-wider">
            {mySecret.secret_word}
          </h2>
        </div>
      </motion.div>

      {/* Instructions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="mt-12 max-w-2xl text-center"
      >
        <p className="text-gray-300 text-lg leading-relaxed">
          {isTraitor ? (
            <>
              <span className="font-bold text-red-400">Blend in!</span> Your word is different from the others. 
              Give hints that match the citizen's word without revealing yourself.
            </>
          ) : (
            <>
              <span className="font-bold text-blue-400">Work together!</span> Give clear hints to help 
              other citizens identify the traitor who has a different word.
            </>
          )}
        </p>
      </motion.div>

      {/* Timer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
        className="mt-8 text-4xl font-bold text-purple-400"
      >
        {phaseTimer}s
      </motion.div>
    </motion.div>
  )
}

export default WhisperPhase