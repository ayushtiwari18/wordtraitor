import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Volume2, VolumeX } from 'lucide-react'
import audioManager from '../lib/AudioManager'

/**
 * Floating music control button
 * Appears in bottom-left corner on all pages
 */
const MusicToggle = () => {
  const [isEnabled, setIsEnabled] = useState(audioManager.isEnabled)
  const [isMuted, setIsMuted] = useState(audioManager.isMuted)
  const [showTooltip, setShowTooltip] = useState(false)
  
  useEffect(() => {
    // Update local state when preferences change
    const interval = setInterval(() => {
      const state = audioManager.getState()
      setIsEnabled(state.isEnabled)
      setIsMuted(state.isMuted)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleToggle = () => {
    if (!isEnabled) {
      // If disabled, enable it
      audioManager.enable()
      setIsEnabled(true)
    } else {
      // If enabled, toggle mute
      const newMuted = audioManager.toggleMute()
      setIsMuted(newMuted)
    }
  }
  
  const getIcon = () => {
    if (!isEnabled || isMuted) {
      return <VolumeX className="w-5 h-5" />
    }
    return <Volume2 className="w-5 h-5" />
  }
  
  const getTooltip = () => {
    if (!isEnabled) return 'Music is disabled (click to enable)'
    if (isMuted) return 'Music is muted (click to unmute)'
    return 'Music is playing (click to mute)'
  }
  
  return (
    <div className="fixed bottom-20 left-4 z-40">
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5 }}
        onClick={handleToggle}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={`
          w-12 h-12 rounded-full
          flex items-center justify-center
          transition-all duration-300
          shadow-lg hover:shadow-xl
          ${
            !isEnabled || isMuted
              ? 'bg-gray-700 text-gray-400 hover:bg-gray-600'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700'
          }
        `}
      >
        <motion.div
          animate={{
            scale: isEnabled && !isMuted ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
        >
          {getIcon()}
        </motion.div>
      </motion.button>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none border border-gray-700"
          >
            {getTooltip()}
            <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-4 border-t-transparent border-b-4 border-b-transparent border-r-4 border-r-gray-800" />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default MusicToggle