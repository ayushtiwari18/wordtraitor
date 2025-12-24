import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import { supabase } from '../lib/supabase'
import useGameStore from '../store/gameStore'

/**
 * SpinningWheel Component
 * Realistic 3D casino-style wheel for REAL mode turn selection
 * 
 * Features:
 * - 3D perspective with depth shadows
 * - Vegas-style gold metallic rim
 * - Realistic physics (ease-out with bounce)
 * - Synced via Supabase Realtime broadcast
 * - Professional casino aesthetics
 */
const SpinningWheel = ({ 
  players = [], 
  completedPlayerIds = [], 
  onSpinComplete, 
  isHost = false,
  isSpinning: externalIsSpinning = false 
}) => {
  const [rotation, setRotation] = useState(0)
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [spinning, setSpinning] = useState(false)
  const { roomId } = useGameStore()

  // Calculate available players (haven't gone yet)
  const availablePlayers = players.filter(
    p => !completedPlayerIds.includes(p.user_id)
  )

  const totalPlayers = players.length
  const segmentAngle = 360 / totalPlayers

  // Generate wheel segments with alternating colors
  const segments = players.map((player, index) => {
    const isCompleted = completedPlayerIds.includes(player.user_id)
    const rotation = segmentAngle * index
    
    // Alternating purple/pink gradient
    const isEven = index % 2 === 0
    const color = isCompleted 
      ? '#374151' // Gray for completed
      : isEven 
        ? 'linear-gradient(135deg, #7c3aed 0%, #a855f7 100%)' // Purple
        : 'linear-gradient(135deg, #ec4899 0%, #f472b6 100%)' // Pink
    
    return {
      ...player,
      rotation,
      isCompleted,
      color
    }
  })

  // Subscribe to wheel spin events from other players
  useEffect(() => {
    if (!roomId) return

    const channel = supabase.channel(`room-${roomId}-wheel`)
    
    channel
      .on('broadcast', { event: 'WHEEL_SPIN' }, (payload) => {
        console.log('📡 Received WHEEL_SPIN broadcast:', payload)
        const { selectedPlayerId, finalRotation, timestamp } = payload.payload
        
        // Find the selected player
        const winner = players.find(p => p.user_id === selectedPlayerId)
        
        if (winner) {
          console.log('🎯 Remote wheel spin to:', winner.username)
          setSpinning(true)
          setSelectedPlayer(null)
          setRotation(prev => prev + finalRotation)
          
          // Complete animation after 6 seconds
          setTimeout(() => {
            setSpinning(false)
            setSelectedPlayer(winner)
            console.log('✅ Remote spin complete:', winner.username)
          }, 6000)
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
    }
  }, [roomId, players])

  /**
   * Spin the wheel to select next player
   * Uses realistic ease-out with slight bounce
   * Broadcasts to all players via Realtime
   */
  const spinWheel = async () => {
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

    // Calculate rotation: 4-6 full spins + angle to winner
    const fullSpins = 4 + Math.floor(Math.random() * 3) // 4-6 spins
    const winnerAngle = segmentAngle * winnerGlobalIndex
    const extraSpin = 360 * fullSpins
    const finalRotation = extraSpin + (360 - winnerAngle) + (segmentAngle / 2)

    console.log('🎡 Spinning to:', winner.username, 'at', winnerAngle, 'degrees')

    // Broadcast to all players
    try {
      const channel = supabase.channel(`room-${roomId}-wheel`)
      await channel.send({
        type: 'broadcast',
        event: 'WHEEL_SPIN',
        payload: {
          selectedPlayerId: winner.user_id,
          finalRotation,
          timestamp: Date.now()
        }
      })
      console.log('📡 Broadcasted WHEEL_SPIN to all players')
    } catch (error) {
      console.error('❌ Error broadcasting wheel spin:', error)
    }

    // Apply rotation locally for host
    setRotation(prev => prev + finalRotation)

    // Finish animation after 6 seconds (realistic casino timing)
    setTimeout(() => {
      setSpinning(false)
      setSelectedPlayer(winner)
      if (onSpinComplete) {
        onSpinComplete(winner)
      }
      console.log('✅ Spin complete:', winner.username)
    }, 6000)
  }

  // Sync external spinning state (for backwards compatibility)
  useEffect(() => {
    if (externalIsSpinning && !spinning && isHost) {
      spinWheel()
    }
  }, [externalIsSpinning])

  return (
    <div className="spinning-wheel-container">
      {/* Wheel Title */}
      <div className="wheel-title">
        <h3>🎰 Wheel of Fortune</h3>
        <p className="text-sm text-gray-400">
          {availablePlayers.length === 0 
            ? '✅ All players have spoken' 
            : `${availablePlayers.length} player${availablePlayers.length !== 1 ? 's' : ''} remaining`
          }
        </p>
      </div>

      {/* 3D Wheel Container */}
      <div className="wheel-wrapper">
        {/* Arrow/Pointer with 3D effect */}
        <div className="wheel-pointer">
          <div className="pointer-shadow"></div>
          <div className="pointer-triangle"></div>
        </div>

        {/* The Wheel with 3D perspective */}
        <div className="wheel-scene">
          <div 
            className={`wheel ${spinning ? 'spinning' : ''}`}
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning 
                ? 'transform 6s cubic-bezier(0.17, 0.67, 0.05, 0.98)' // Realistic ease-out
                : 'none'
            }}
          >
            {/* Tick marks around rim */}
            {Array.from({ length: totalPlayers * 4 }).map((_, i) => (
              <div
                key={`tick-${i}`}
                className="rim-tick"
                style={{
                  transform: `rotate(${(360 / (totalPlayers * 4)) * i}deg)`
                }}
              />
            ))}

            {/* Player segments */}
            {segments.map((segment, index) => (
              <div
                key={segment.user_id}
                className={`wheel-segment ${segment.isCompleted ? 'completed' : ''}`}
                style={{
                  transform: `rotate(${segment.rotation}deg)`,
                  background: segment.color,
                  zIndex: totalPlayers - index
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

            {/* Center Hub with glow */}
            <div className="wheel-center">
              <div className="center-ring"></div>
              <div className="center-dot"></div>
              <div className="center-glow"></div>
            </div>
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
                Spin to Win
              </>
            )}
          </button>
        </div>
      )}

      {/* Non-Host: Show spinning state */}
      {!isHost && spinning && (
        <div className="wheel-controls">
          <div className="text-center text-gray-400 py-4">
            <span className="text-2xl animate-pulse">🎰</span>
            <p className="mt-2">Host is spinning...</p>
          </div>
        </div>
      )}

      {/* Selected Player Display */}
      {selectedPlayer && !spinning && (
        <div className="selected-player">
          <div className="selected-badge">
            <span className="badge-icon">🎯</span>
            <div>
              <p className="text-sm text-gray-400">Winner!</p>
              <p className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-orange-500">
                {selectedPlayer.username}
              </p>
            </div>
          </div>
        </div>
      )}

      <style>{`
        .spinning-wheel-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 2rem;
          padding: 2rem;
          background: linear-gradient(135deg, #0f0f23 0%, #1a0a2e 100%);
          border-radius: 1.5rem;
          box-shadow: 
            0 20px 60px rgba(0, 0, 0, 0.8),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .wheel-title h3 {
          font-size: 2rem;
          font-weight: bold;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-bottom: 0.5rem;
          text-shadow: 0 0 20px rgba(251, 191, 36, 0.5);
        }

        .wheel-wrapper {
          position: relative;
          width: 450px;
          height: 450px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .wheel-pointer {
          position: absolute;
          top: -15px;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100;
          filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.8));
        }

        .pointer-shadow {
          position: absolute;
          width: 50px;
          height: 50px;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          background: radial-gradient(circle, rgba(0, 0, 0, 0.6) 0%, transparent 70%);
          filter: blur(8px);
        }

        .pointer-triangle {
          position: relative;
          width: 0;
          height: 0;
          border-left: 22px solid transparent;
          border-right: 22px solid transparent;
          border-top: 50px solid #fbbf24;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
        }

        .pointer-triangle::after {
          content: '';
          position: absolute;
          top: -48px;
          left: -18px;
          width: 0;
          height: 0;
          border-left: 18px solid transparent;
          border-right: 18px solid transparent;
          border-top: 42px solid #fcd34d;
        }

        .wheel-scene {
          position: relative;
          width: 420px;
          height: 420px;
          perspective: 1000px;
        }

        .wheel {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          transform-style: preserve-3d;
          box-shadow: 
            0 0 0 12px #1a0a2e,
            0 0 0 18px #fbbf24,
            0 0 0 20px #1a0a2e,
            0 30px 80px rgba(0, 0, 0, 0.9),
            inset 0 0 40px rgba(0, 0, 0, 0.6);
        }

        .rim-tick {
          position: absolute;
          top: 0;
          left: 50%;
          width: 3px;
          height: 15px;
          background: linear-gradient(180deg, #fbbf24 0%, transparent 100%);
          transform-origin: 50% 210px;
          border-radius: 2px;
        }

        .wheel-segment {
          position: absolute;
          width: 50%;
          height: 50%;
          top: 50%;
          left: 50%;
          transform-origin: 0% 0%;
          clip-path: polygon(0 0, 100% 0, 0 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          border-left: 1px solid rgba(255, 255, 255, 0.1);
          transition: all 0.3s ease;
        }

        .wheel-segment.completed {
          opacity: 0.5;
          filter: grayscale(0.8);
        }

        .wheel-segment::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, 
            rgba(255, 255, 255, 0.2) 0%, 
            transparent 50%,
            rgba(0, 0, 0, 0.2) 100%
          );
          clip-path: polygon(0 0, 100% 0, 0 100%);
        }

        .segment-content {
          position: absolute;
          top: 25%;
          left: 25%;
          transform: rotate(${-segmentAngle / 2}deg);
          transform-origin: center;
          width: 120px;
          text-align: center;
        }

        .segment-text {
          display: block;
          color: white;
          font-weight: 800;
          font-size: 1rem;
          text-shadow: 
            0 2px 4px rgba(0, 0, 0, 0.9),
            0 0 8px rgba(0, 0, 0, 0.5);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          letter-spacing: 0.5px;
        }

        .wheel-center {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 100px;
          height: 100px;
          border-radius: 50%;
          z-index: 200;
        }

        .center-ring {
          position: absolute;
          inset: 0;
          background: linear-gradient(135deg, #1a0a2e 0%, #2a1a4e 100%);
          border-radius: 50%;
          border: 6px solid #fbbf24;
          box-shadow: 
            0 0 20px rgba(251, 191, 36, 0.6),
            inset 0 0 20px rgba(0, 0, 0, 0.8),
            inset 0 4px 8px rgba(255, 255, 255, 0.1);
        }

        .center-dot {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 35px;
          height: 35px;
          background: radial-gradient(circle, #fcd34d 0%, #fbbf24 100%);
          border-radius: 50%;
          box-shadow: 
            0 0 15px rgba(251, 191, 36, 0.8),
            inset 0 2px 4px rgba(255, 255, 255, 0.4);
          animation: centerPulse 2s ease-in-out infinite;
        }

        @keyframes centerPulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.1); }
        }

        .center-glow {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 120px;
          height: 120px;
          background: radial-gradient(circle, rgba(251, 191, 36, 0.3) 0%, transparent 70%);
          border-radius: 50%;
          animation: glowPulse 2s ease-in-out infinite;
          pointer-events: none;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: translate(-50%, -50%) scale(1); }
          50% { opacity: 1; transform: translate(-50%, -50%) scale(1.2); }
        }

        .wheel-controls {
          width: 100%;
          display: flex;
          justify-content: center;
        }

        .spin-button {
          padding: 1.2rem 2.5rem;
          font-size: 1.2rem;
          font-weight: 800;
          color: #1a0a2e;
          background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
          border: none;
          border-radius: 50px;
          cursor: pointer;
          transition: all 0.3s ease;
          box-shadow: 
            0 6px 20px rgba(251, 191, 36, 0.5),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2),
            inset 0 2px 4px rgba(255, 255, 255, 0.5);
          display: flex;
          align-items: center;
          gap: 0.7rem;
          letter-spacing: 0.5px;
          text-transform: uppercase;
        }

        .spin-button:hover:not(:disabled) {
          transform: translateY(-3px);
          box-shadow: 
            0 8px 30px rgba(251, 191, 36, 0.7),
            inset 0 -2px 4px rgba(0, 0, 0, 0.2),
            inset 0 2px 4px rgba(255, 255, 255, 0.5);
        }

        .spin-button:active:not(:disabled) {
          transform: translateY(-1px);
        }

        .spin-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: linear-gradient(135deg, #4b5563 0%, #374151 100%);
        }

        .spin-button .spin-icon {
          font-size: 1.8rem;
          animation: iconBounce 2s infinite;
        }

        @keyframes iconBounce {
          0%, 100% { transform: scale(1) rotate(0deg); }
          25% { transform: scale(1.2) rotate(10deg); }
          75% { transform: scale(1.2) rotate(-10deg); }
        }

        .spinner {
          width: 24px;
          height: 24px;
          border: 4px solid rgba(26, 10, 46, 0.3);
          border-top-color: #1a0a2e;
          border-radius: 50%;
          animation: buttonSpin 1s linear infinite;
        }

        @keyframes buttonSpin {
          to { transform: rotate(360deg); }
        }

        .selected-player {
          width: 100%;
          animation: fadeInScale 0.6s ease-out;
        }

        @keyframes fadeInScale {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .selected-badge {
          display: flex;
          align-items: center;
          gap: 1.5rem;
          padding: 2rem;
          background: linear-gradient(135deg, #1a0a2e 0%, #2a1a4e 100%);
          border: 3px solid #fbbf24;
          border-radius: 1.5rem;
          box-shadow: 
            0 10px 40px rgba(251, 191, 36, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }

        .badge-icon {
          font-size: 3rem;
          filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.6));
          animation: badgePulse 2s infinite;
        }

        @keyframes badgePulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.2); }
        }

        @media (max-width: 640px) {
          .wheel-wrapper {
            width: 320px;
            height: 320px;
          }

          .wheel-scene {
            width: 300px;
            height: 300px;
          }

          .segment-text {
            font-size: 0.8rem;
          }

          .spin-button {
            padding: 1rem 2rem;
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