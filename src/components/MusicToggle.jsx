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
  const [isInitializing, setIsInitializing] = useState(false)
  
  useEffect(() => {
    // Update local state every second
    const interval = setInterval(() => {
      const state = audioManager.getState()
      setIsEnabled(state.isEnabled)
      setIsMuted(state.isMuted)
    }, 1000)
    
    return () => clearInterval(interval)
  }, [])
  
  const handleToggle = async () => {
    if (isInitializing) return
    
    try {
      setIsInitializing(true)
      
      // First, ensure audio is initialized
      if (!audioManager.isInitialized) {
        console.log('🎵 Initializing audio on user click...')
        await audioManager.initialize()
      }
      
      // If disabled, enable and unmute
      if (!isEnabled || isMuted) {
        console.log('🎵 Enabling music...')
        audioManager.enable()
        audioManager.isMuted = false
        audioManager.savePreferences()
        
        // Force play current phase music
        const currentPhase = audioManager.currentPhase || 'LOBBY'
        audioManager.setPhase(currentPhase)
        
        setIsEnabled(true)
        setIsMuted(false)
      } else {
        // If enabled and playing, mute it
        console.log('🎵 Muting music...')
        audioManager.toggleMute()
        setIsMuted(true)
      }
      
    } catch (err) {
      console.error('🎵 Toggle error:', err)
    } finally {
      setIsInitializing(false)
    }
  }
  
  const getIcon = () => {
    if (!isEnabled || isMuted) {
      return <VolumeX className="w-5 h-5" />
    }
    return <Volume2 className="w-5 h-5" />
  }
  
  const getTooltip = () => {
    if (!isEnabled) return '🎵 Click to enable music'
    if (isMuted) return '🎵 Click to unmute'
    return '🔇 Click to mute'
  }
  
  const getButtonColor = () => {
    if (isInitializing) {
      return 'bg-yellow-600 hover:bg-yellow-700'
    }
    if (!isEnabled || isMuted) {
      return 'bg-gray-700 hover:bg-gray-600'
    }
    return 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'
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
        disabled={isInitializing}
        className={`
          w-12 h-12 rounded-full
          flex items-center justify-center
          transition-all duration-300
          shadow-lg hover:shadow-xl
          disabled:opacity-50 disabled:cursor-wait
          ${getButtonColor()}
        `}
      >
        <motion.div
          animate={{
            scale: isEnabled && !isMuted && !isInitializing ? [1, 1.1, 1] : 1
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 1
          }}
        >
          {isInitializing ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            getIcon()
          )}
        </motion.div>
      </motion.button>
      
      {/* Tooltip */}
      <AnimatePresence>
        {showTooltip && !isInitializing && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            className="absolute left-16 top-1/2 -translate-y-1/2 bg-gray-800 text-white text-xs px-3 py-2 rounded-lg whitespace-nowrap pointer-events-none border border-gray-700 shadow-xl"
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