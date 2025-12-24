import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'

/**
 * SpinningWheel Component
 * Mystery-themed wheel for REAL mode turn selection
 * 
 * Features:
 * - Smooth CSS animation with cubic-bezier easing
 * - Random selection without repeats
 * - Dark mystery theme (purple/gold)
 * - Host controls, all players see
 */
const SpinningWheel = ({ 
  players = [], 
  completedPlayerIds = [], 
  onSpinComplete, 
  isHost = false,
  isSpinning = false 
}) => {
  const [rotation, setRotation] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [spinning, setSpinning] = useState(false)

  // Calculate available players (haven't gone yet)
  const availablePlayers = players.filter(
    p => !completedPlayerIds.includes(p.user_id)
  )

  const totalPlayers = players.length
  const segmentAngle = 360 / totalPlayers

  // Generate wheel segments
  const segments = players.map((player, index) => {
    const isCompleted = completedPlayerIds.includes(player.user_id)
    const rotation = segmentAngle * index
    
    return {
      ...player,
      rotation,
      isCompleted
    }
  })

  /**
   * Spin the wheel to select next player
   * Uses cubic-bezier for realistic deceleration
   */
  const spinWheel = () => {
    if (availablePlayers.length === 0) {
      console.log('🎯 All players completed, moving to next phase')
      return
    }

    setSpinning(true)
    setSelectedPlayer(null)

    // Pick random available player
    const randomIndex = Math.floor(Math.random() * availablePlayers.length)
    const winner = availablePlayers[randomIndex]
    const winnerGlobalIndex = players.findIndex(p => p.user_id === winner.user_id)

    // Calculate rotation: 3-5 full spins + angle to winner
    const fullSpins = 3 + Math.floor(Math.random() * 3) // 3-5 spins
    const winnerAngle = segmentAngle * winnerGlobalIndex
    const extraSpin = 360 * fullSpins
    const finalRotation = extraSpin + (360 - winnerAngle) + (segmentAngle / 2)

    console.log('🎡 Spinning to:', winner.username, 'at', winnerAngle, 'degrees')

    // Apply rotation
    setRotation(prev => prev + finalRotation)

    // Finish animation after 5 seconds
    setTimeout(() => {
      setSpinning(false)
      setSelectedPlayer(winner)
      if (onSpinComplete) {
        onSpinComplete(winner)
      }
      console.log('✅ Spin complete:', winner.username)
    }, 5000)
  }

  // Sync external spinning state
  useEffect(() => {
    if (isSpinning && !spinning) {
      spinWheel()
    }
  }, [isSpinning])

  return (
    <div className="spinning-wheel-container">
      {/* Wheel Title */}
      <div className="wheel-title">
        <h3>🎭 Circle of Secrets</h3>
        <p className="text-sm text-gray-400">
          {availablePlayers.length === 0 
            ? '✅ All players have spoken' 
            : `${availablePlayers.length} player${availablePlayers.length !== 1 ? 's' : ''} remaining`
          }
        </p>
      </div>

      {/* Wheel Container */}
      <div className="wheel-wrapper">
        {/* Arrow/Pointer */}
        <div className="wheel-pointer">
          <div className="pointer-triangle"></div>
        </div>

        {/* The Wheel */}
        <div 
          className={`wheel ${spinning ? 'spinning' : ''}`}
          style={{
            transform: `rotate(${rotation}deg)`,
            transition: spinning 
              ? 'transform 5s cubic-bezier(0.17, 0.67, 0.12, 0.99)' 
              : 'none'
          }}
        >
          {segments.map((segment, index) => (
            <div
              key={segment.user_id}
              className={`wheel-segment ${segment.isCompleted ? 'completed' : ''}`}
              style={{
                transform: `rotate(${segment.rotation}deg)`,
                '--segment-color': segment.isCompleted 
                  ? '#4a5568' // Gray for completed
                  : `hsl(${(index * 360) / totalPlayers}, 70%, 50%)` // Rainbow colors
              }}
            >
              <div className="segment-content">
                <span className="segment-text">
                  {segment.username}
                  {segment.isCompleted && ' ✓'}
                </span>
              </div>
            </div>
          ))}

          {/* Center Circle */}
          <div className="wheel-center">
            <div className="center-dot"></div>
          </div>
        </div>
      </div>

      {/* Spin Button (Host Only) */}
      {isHost && (
        <div className="wheel-controls">
          <button
            onClick={spinWheel}
            disabled={spinning || availablePlayers.length === 0}
            className={`spin-button ${spinning ? 'spinning' : ''}`}
          >
            {spinning ? (
              <>
                <span className="spinner"></span>
                Spinning...
              </>
            ) : availablePlayers.length === 0 ? (
              '✅ All Complete'
            ) : (
              <>
                <span className="spin-icon">🎲</span>
                Spin the Wheel
              </>
            )}
          </button>
        </div>
      )}

      {/* Selected Player Display */}
      {selectedPlayer && !spinning && (
        <div className="selected-player">
          <div className="selected-badge">
            <span className="badge-icon">👤</span>
            <div>
              <p className="text-sm text-gray-400">Next Speaker</p>
              <p className="text-xl font-bold text-purple-300">
                {selectedPlayer.username}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Styles */}
      <style jsx>{`
        .spinning-wheel-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
          border-radius: 1rem;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.5);
        }

        .wheel-title {
          text-align: center;
        }

        .wheel-title h3 {
          font-size: 1.5rem;
          font-weight: bold;
          color: #d4af37;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 10px rgba(212, 175, 55, 0.5);
        }

        .wheel-wrapper {
          position: relative;
          width: 400px;
          height: 400px;
        }

        .wheel-pointer {
          position: absolute;
          top: -20px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 10;
        }

        .pointer-triangle {
          width: 0;
          height: 0;
          border-left: 20px solid transparent;
          border-right: 20px solid transparent;
          border-top: 40px solid #d4af37;
          filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.5));
        }

        .wheel {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          overflow: hidden;
          box-shadow: 
            0 0 0 10px #2a2a4e,
            0 0 0 15px #d4af37,
            0 10px 50px rgba(0, 0, 0, 0.7);
        }

        .wheel-segment {
          position: absolute;
          width: 50%;
          height: 50%;
          top: 50%;
          left: 50%;
          transform-origin: 0% 0%;
          background: var(--segment-color);
          clip-path: polygon(0 0, 100% 0, 0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.3s;
        }

        .wheel-segment.completed {
          opacity: 0.4;
          background: #4a5568 !important;
        }

        .segment-content {
          position: absolute;
          top: 20%;
          left: 20%;
          transform: rotate(${-segmentAngle / 2}deg);
          transform-origin: center;
          width: 80px;
        }

        .segment-text {
          display: block;
          color: white;
          font-weight: bold;
          font-size: 0.9rem;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.8);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: radial-gradient(circle, #1a1a2e 0%, #2a2a4e 100%);
          border-radius: 50%;
          border: 5px solid #d4af37;
          box-shadow: 
            inset 0 0 20px rgba(0, 0, 0, 0.5),
            0 0 20px rgba(212, 175, 55, 0.5);
          z-index: 5;
        }

        .center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 20px;
          height: 20px;
          background: #d4af37;
          border-radius: 50%;
          box-shadow: 0 0 10px rgba(212, 175, 55, 0.8);
        }

        .wheel-controls {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .spin-button {
          padding: 1rem 2rem;
          font-size: 1.1rem;
          font-weight: bold;
          color: #1a1a2e;
          background: linear-gradient(135deg, #d4af37 0%, #f4d03f 100%);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s;
          box-shadow: 0 4px 15px rgba(212, 175, 55, 0.4);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .spin-button:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(212, 175, 55, 0.6);
        }

        .spin-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #4a5568;
        }

        .spin-button .spin-icon {
          font-size: 1.5rem;
          animation: pulse 2s infinite;
        }

        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        .spinner {
          width: 20px;
          height: 20px;
          border: 3px solid rgba(0, 0, 0, 0.3);
          border-top-color: #1a1a2e;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        .selected-player {
          width: 100%;
          animation: fadeInUp 0.5s;
        }

        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .selected-badge {
          display: flex;
          align-items: center;
          gap: 1rem;
          padding: 1.5rem;
          background: linear-gradient(135deg, #2a2a4e 0%, #1a1a2e 100%);
          border: 2px solid #d4af37;
          border-radius: 1rem;
          box-shadow: 0 4px 20px rgba(212, 175, 55, 0.3);
        }

        .badge-icon {
          font-size: 2rem;
          filter: drop-shadow(0 0 10px rgba(212, 175, 55, 0.5));
        }

        @media (max-width: 640px) {
          .wheel-wrapper {
            width: 300px;
            height: 300px;
          }

          .segment-text {
            font-size: 0.7rem;
          }

          .spin-button {
            padding: 0.75rem 1.5rem;
            font-size: 1rem;
          }
        }
      `}</style>
    </div>
  )
}

SpinningWheel.propTypes = {
  players: PropTypes.arrayOf(
    PropTypes.shape({
      user_id: PropTypes.string.isRequired,
      username: PropTypes.string.isRequired
    })
  ).isRequired,
  completedPlayerIds: PropTypes.arrayOf(PropTypes.string),
  onSpinComplete: PropTypes.func,
  isHost: PropTypes.bool,
  isSpinning: PropTypes.bool
}

export default SpinningWheel