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
    // Initialize on first user interaction
    const handleInteraction = async () => {
      if (!hasInteracted.current) {
        await audioManager.initialize()
        hasInteracted.current = true
      }
    }
    
    // Listen for any user interaction
    document.addEventListener('click', handleInteraction, { once: true })
    document.addEventListener('keydown', handleInteraction, { once: true })
    
    return () => {
      document.removeEventListener('click', handleInteraction)
      document.removeEventListener('keydown', handleInteraction)
    }
  }, [])
  
  useEffect(() => {
    if (!isInGame || !phase) return
    
    // Update current phase in audio manager
    audioManager.currentPhase = phase
    audioManager.setPhase(phase)
    
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