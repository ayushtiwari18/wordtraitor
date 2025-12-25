import { useEffect, useRef } from 'react'
import audioManager from '../lib/AudioManager'

/**
 * Hook to manage game music based on current phase
 * @param {string} phase - Current game phase
 * @param {boolean} isInGame - Whether user is in an active game
 */
export const useGameMusic = (phase, isInGame = false) => {
  const hasInteracted = useRef(false)
  
  useEffect(() => {
    // Initialize and auto-play on first user interaction (if music is enabled)
    const handleInteraction = async () => {
      if (!hasInteracted.current) {
        await audioManager.initialize()
        hasInteracted.current = true
        
        // Auto-play if music is enabled (default for new users)
        if (audioManager.isEnabled && !audioManager.isMuted && phase) {
          console.log('🎵 First interaction detected - starting music')
          audioManager.setPhase(phase)
        }
      }
    }
    
    // Listen for any user interaction
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })
    document.addEventListener('touchstart', handleInteraction, { once: true })
    
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
      document.removeEventListener('touchstart', handleInteraction)
    }
  }, [phase])
  
  useEffect(() => {
    if (!isInGame || !phase) return
    
    // Update current phase in audio manager
    audioManager.currentPhase = phase
    
    // Only change music if already initialized
    if (audioManager.isInitialized) {
      audioManager.setPhase(phase)
    }
    
    // Cleanup on unmount
    return () => {
      // Don't stop music when component unmounts, let it transition
    }
  }, [phase, isInGame])
  
  return {
    isEnabled: audioManager.isEnabled,
    isMuted: audioManager.isMuted,
    volume: audioManager.volume
  }
}

export default useGameMusic