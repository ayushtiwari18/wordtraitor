/**
 * AudioManager - Handles all game music and sound effects
 * Manages phase-based music, volume control, and user preferences
 */

class AudioManager {
  constructor() {
    this.currentTrack = null
    this.currentPhase = null
    this.volume = 0.6 // Default 60%
    this.isInitialized = false
    
    // Audio element pool
    this.audioElements = {}
    
    // Track definitions (using placeholder URLs - replace with actual music files)
    this.tracks = {
      LOBBY: {
        url: '/music/lobby.mp3',
        name: 'Lobby Theme',
        loop: true
      },
      GAMEPLAY: {
        url: '/music/gameplay.mp3',
        name: 'Gameplay Theme',
        loop: true
      },
      RESULTS: {
        url: '/music/results.mp3',
        name: 'Results Theme',
        loop: false
      }
    }
    
    // Phase to track mapping
    this.phaseMapping = {
      'LOBBY': 'LOBBY',
      'WHISPER': 'GAMEPLAY',
      'HINT_DROP': 'GAMEPLAY',
      'DEBATE': 'GAMEPLAY',
      'VERDICT': 'GAMEPLAY',
      'REVEAL': 'RESULTS',
      'FINISHED': 'RESULTS'
    }
    
    // Load preferences from localStorage (defaults to ON for new users)
    this.loadPreferences()
    
    // Preload audio elements
    this.preloadTracks()
  }
  
  /**
   * Preload all audio tracks
   */
  preloadTracks() {
    Object.keys(this.tracks).forEach(key => {
      const track = this.tracks[key]
      const audio = new Audio()
      audio.src = track.url
      audio.loop = track.loop
      audio.volume = this.volume
      audio.preload = 'auto'
      
      // Handle loading errors gracefully
      audio.addEventListener('error', (e) => {
        console.warn(`🎵 Failed to load ${track.name}:`, e)
      })
      
      this.audioElements[key] = audio
    })
  }
  
  /**
   * Load user preferences from localStorage
   * 🎵 NEW: Defaults to music ON for first-time users
   */
  loadPreferences() {
    try {
      const prefs = localStorage.getItem('wordtraitor_music_prefs')
      
      if (prefs) {
        // Returning user - load their saved preferences
        const parsed = JSON.parse(prefs)
        this.isEnabled = parsed.enabled ?? true  // Default true if not set
        this.volume = parsed.volume ?? 0.6
        this.isMuted = parsed.muted ?? false
        console.log('🎵 Loaded user music preferences:', { enabled: this.isEnabled, muted: this.isMuted })
      } else {
        // New user - default to music ON
        this.isEnabled = true
        this.isMuted = false
        this.volume = 0.6
        console.log('🎵 New user detected - music enabled by default')
        
        // Save initial preference
        this.savePreferences()
      }
    } catch (err) {
      console.warn('Failed to load music preferences:', err)
      // On error, default to ON
      this.isEnabled = true
      this.isMuted = false
    }
  }
  
  /**
   * Save user preferences to localStorage
   */
  savePreferences() {
    try {
      const prefs = {
        enabled: this.isEnabled,
        volume: this.volume,
        muted: this.isMuted
      }
      localStorage.setItem('wordtraitor_music_prefs', JSON.stringify(prefs))
      console.log('💾 Music preferences saved:', prefs)
    } catch (err) {
      console.warn('Failed to save music preferences:', err)
    }
  }
  
  /**
   * Initialize audio (must be called after user interaction)
   */
  async initialize() {
    if (this.isInitialized) return
    
    try {
      // Try to play a silent audio to unlock autoplay
      const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA')
      await silentAudio.play()
      silentAudio.pause()
      
      this.isInitialized = true
      console.log('🎵 AudioManager initialized')
    } catch (err) {
      console.warn('🎵 Autoplay blocked, waiting for user interaction')
    }
  }
  
  /**
   * Change game phase and switch music accordingly
   */
  setPhase(phase) {
    this.currentPhase = phase
    
    if (!this.isEnabled || this.isMuted) {
      console.log(`🎵 Phase set to ${phase}, but music is ${!this.isEnabled ? 'disabled' : 'muted'}`)
      return
    }
    
    const trackKey = this.phaseMapping[phase]
    if (!trackKey) {
      console.warn(`🎵 No track mapping for phase: ${phase}`)
      return
    }
    
    if (trackKey === this.currentTrack) {
      console.log(`🎵 Already playing ${trackKey} for phase ${phase}`)
      return
    }
    
    console.log(`🎵 Phase changed to ${phase}, switching to ${trackKey}`)
    this.playTrack(trackKey)
  }
  
  /**
   * Play a specific track
   */
  async playTrack(trackKey) {
    try {
      // Stop current track
      if (this.currentTrack && this.audioElements[this.currentTrack]) {
        const currentAudio = this.audioElements[this.currentTrack]
        currentAudio.pause()
        currentAudio.currentTime = 0
      }
      
      // Start new track
      const audio = this.audioElements[trackKey]
      if (!audio) {
        console.warn(`🎵 Track ${trackKey} not found`)
        return
      }
      
      audio.volume = this.volume
      await audio.play()
      this.currentTrack = trackKey
      
      console.log(`🎵 Now playing: ${this.tracks[trackKey].name}`)
    } catch (err) {
      console.warn(`🎵 Failed to play ${trackKey}:`, err.message)
      
      // If autoplay blocked, try to initialize
      if (err.name === 'NotAllowedError') {
        this.isInitialized = false
      }
    }
  }
  
  /**
   * Stop all music
   */
  stopAll() {
    Object.values(this.audioElements).forEach(audio => {
      audio.pause()
      audio.currentTime = 0
    })
    this.currentTrack = null
  }
  
  /**
   * Toggle music on/off
   */
  toggle() {
    this.isEnabled = !this.isEnabled
    this.savePreferences()
    
    if (!this.isEnabled) {
      this.stopAll()
    }
    
    return this.isEnabled
  }
  
  /**
   * Set volume (0-1)
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    
    Object.values(this.audioElements).forEach(audio => {
      audio.volume = this.volume
    })
    
    this.savePreferences()
  }
  
  /**
   * Toggle mute
   */
  toggleMute() {
    this.isMuted = !this.isMuted
    
    if (this.isMuted) {
      this.stopAll()
    } else if (this.isEnabled && this.currentPhase) {
      this.setPhase(this.currentPhase)
    }
    
    this.savePreferences()
    return this.isMuted
  }
  
  /**
   * Enable music
   */
  enable() {
    this.isEnabled = true
    this.savePreferences()
  }
  
  /**
   * Disable music
   */
  disable() {
    this.isEnabled = false
    this.stopAll()
    this.savePreferences()
  }
  
  /**
   * Get current state
   */
  getState() {
    return {
      isEnabled: this.isEnabled,
      isMuted: this.isMuted,
      volume: this.volume,
      currentTrack: this.currentTrack,
      isInitialized: this.isInitialized
    }
  }
}

// Create singleton instance
const audioManager = new AudioManager()

export default audioManager