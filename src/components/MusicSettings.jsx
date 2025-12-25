import React, { useState, useEffect } from 'react'
import { Volume2, VolumeX, Music } from 'lucide-react'
import audioManager from '../lib/AudioManager'

/**
 * Music settings component for Settings page
 */
const MusicSettings = () => {
  const [isEnabled, setIsEnabled] = useState(audioManager.isEnabled)
  const [volume, setVolume] = useState(Math.round(audioManager.volume * 100))
  
  useEffect(() => {
    // Sync with audio manager
    const state = audioManager.getState()
    setIsEnabled(state.isEnabled)
    setVolume(Math.round(state.volume * 100))
  }, [])
  
  const handleToggle = () => {
    if (isEnabled) {
      audioManager.disable()
      setIsEnabled(false)
    } else {
      audioManager.enable()
      setIsEnabled(true)
    }
  }
  
  const handleVolumeChange = (e) => {
    const newVolume = parseInt(e.target.value)
    setVolume(newVolume)
    audioManager.setVolume(newVolume / 100)
  }
  
  return (
    <div className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <Music className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-bold text-white">Game Music</h3>
      </div>
      
      <p className="text-gray-400 text-sm mb-4">
        Background music that changes based on game phase. Music adds atmosphere and helps track game flow.
      </p>
      
      {/* Enable/Disable Toggle */}
      <div className="flex items-center justify-between mb-4 p-4 bg-gray-900/50 rounded-lg">
        <div className="flex items-center gap-3">
          {isEnabled ? (
            <Volume2 className="w-5 h-5 text-purple-400" />
          ) : (
            <VolumeX className="w-5 h-5 text-gray-500" />
          )}
          <div>
            <p className="text-white font-semibold">Background Music</p>
            <p className="text-gray-500 text-xs">
              {isEnabled ? 'Music is enabled' : 'Music is disabled'}
            </p>
          </div>
        </div>
        
        <button
          onClick={handleToggle}
          className={`
            relative w-14 h-7 rounded-full transition-colors
            ${isEnabled ? 'bg-purple-600' : 'bg-gray-700'}
          `}
        >
          <div
            className={`
              absolute top-1 w-5 h-5 bg-white rounded-full transition-transform
              ${isEnabled ? 'translate-x-8' : 'translate-x-1'}
            `}
          />
        </button>
      </div>
      
      {/* Volume Slider */}
      <div className={`transition-opacity ${isEnabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <div className="flex items-center justify-between mb-2">
          <label className="text-gray-300 text-sm font-medium">Volume</label>
          <span className="text-purple-400 font-semibold">{volume}%</span>
        </div>
        
        <input
          type="range"
          min="0"
          max="100"
          value={volume}
          onChange={handleVolumeChange}
          disabled={!isEnabled}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer"
          style={{
            background: isEnabled
              ? `linear-gradient(to right, rgb(147, 51, 234) 0%, rgb(147, 51, 234) ${volume}%, rgb(55, 65, 81) ${volume}%, rgb(55, 65, 81) 100%)`
              : 'rgb(55, 65, 81)'
          }}
        />
        
        <div className="flex justify-between text-xs text-gray-500 mt-1">
          <span>Silent</span>
          <span>Loud</span>
        </div>
      </div>
      
      {/* Info */}
      <div className="mt-4 p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
        <p className="text-purple-300 text-xs">
          💡 <strong>Tip:</strong> Music changes based on game phase - calm in lobby, tense during gameplay, dramatic at results!
        </p>
      </div>
    </div>
  )
}

export default MusicSettings