import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Trophy, Home, RotateCcw, Users } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import { useNavigate } from 'react-router-dom'
import Button from '../Button'
import confetti from 'canvas-confetti'

const GameOver = () => {
  const { room, participants, myUserId, eliminated, leaveRoom } = useGameStore()
  const navigate = useNavigate()
  const [showConfetti, setShowConfetti] = useState(false)

  const winner = room?.winner // 'CITIZENS' or 'TRAITOR'
  const traitor = participants.find(p => p.role === 'TRAITOR')
  const isWinner = 
    (winner === 'CITIZENS' && participants.find(p => p.user_id === myUserId)?.role === 'CITIZEN') ||
    (winner === 'TRAITOR' && participants.find(p => p.user_id === myUserId)?.role === 'TRAITOR')

  // Trigger confetti for winners
  useEffect(() => {
    if (isWinner && !showConfetti) {
      setShowConfetti(true)
      
      // Fire confetti
      const duration = 3000
      const animationEnd = Date.now() + duration
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 }

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now()
        if (timeLeft <= 0) {
          clearInterval(interval)
          return
        }

        confetti({
          ...defaults,
          particleCount: 50,
          origin: { x: Math.random(), y: Math.random() - 0.2 }
        })
      }, 250)

      return () => clearInterval(interval)
    }
  }, [isWinner, showConfetti])

  const handleLeaveRoom = async () => {
    await leaveRoom()
    navigate('/')
  }

  const handlePlayAgain = async () => {
    await leaveRoom()
    navigate('/lobby')
  }

  return (
    <div className="min-h-screen bg-dark-bg flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
        className="max-w-2xl w-full"
      >
        {/* Trophy/Result Header */}
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="text-center mb-8"
        >
          <motion.div
            animate={{ 
              rotate: [0, 10, -10, 10, 0],
              scale: [1, 1.1, 1, 1.1, 1]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-8xl mb-4"
          >
            {winner === 'CITIZENS' ? '🏆' : '🔪'}
          </motion.div>
          
          <motion.h1
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className={`text-5xl font-heading font-bold mb-4 ${
              winner === 'CITIZENS' ? 'text-green-400' : 'text-red-400'
            }`}
          >
            {winner === 'CITIZENS' ? 'Citizens Win!' : 'Traitor Wins!'}
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className={`text-2xl font-bold ${
              isWinner ? 'text-neon-cyan' : 'text-gray-400'
            }`}
          >
            {isWinner ? 'You won! 🎉' : 'Better luck next time!'}
          </motion.p>
        </motion.div>

        {/* Result Details */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="bg-dark-card border border-gray-800 rounded-xl p-8 mb-6"
        >
          {/* Traitor Reveal */}
          <div className="mb-6">
            <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
              <span>🕵️</span>
              The traitor was...
            </h3>
            <div className="bg-gradient-to-r from-red-900/50 to-purple-900/50 border-2 border-red-500 rounded-lg p-6 flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-red-500/30 flex items-center justify-center text-3xl">
                {traitor?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="flex-1">
                <p className="text-2xl font-bold text-white">
                  {traitor?.username || 'Unknown'}
                </p>
                <p className="text-gray-400">Secret word: <span className="text-purple-400 font-semibold">{traitor?.secret_word || 'N/A'}</span></p>
              </div>
              <div className="text-4xl">🎭</div>
            </div>
          </div>

          {/* Eliminated Player */}
          {eliminated && (
            <div className="mb-6">
              <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                <span>💀</span>
                Eliminated Player
              </h3>
              <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
                <p className="text-white">
                  <span className="font-bold">{eliminated.username || 'Unknown'}</span>
                  {' '}
                  <span className={eliminated.role === 'TRAITOR' ? 'text-red-400' : 'text-blue-400'}>
                    ({eliminated.role})
                  </span>
                  {' - '}
                  <span className="text-purple-400">{eliminated.secret_word}</span>
                </p>
              </div>
            </div>
          )}

          {/* Game Stats */}
          <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-700">
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Total Players</p>
              <p className="text-3xl font-bold text-white">{participants.length}</p>
            </div>
            <div className="text-center">
              <p className="text-gray-400 text-sm mb-1">Round</p>
              <p className="text-3xl font-bold text-white">{room?.current_round || 1}</p>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="flex gap-4"
        >
          <Button
            variant="primary"
            icon={RotateCcw}
            onClick={handlePlayAgain}
            className="flex-1"
          >
            Play Again
          </Button>
          <Button
            variant="outline"
            icon={Home}
            onClick={handleLeaveRoom}
            className="flex-1"
          >
            Home
          </Button>
        </motion.div>

        {/* Players List */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
          className="mt-6 bg-dark-card border border-gray-800 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Users size={20} />
            All Players
          </h3>
          <div className="space-y-2">
            {participants.map((player, index) => (
              <motion.div
                key={player.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 1 + index * 0.1 }}
                className={`p-3 rounded-lg flex items-center justify-between ${
                  player.role === 'TRAITOR' 
                    ? 'bg-red-500/10 border border-red-500/30' 
                    : 'bg-gray-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    player.role === 'TRAITOR' ? 'bg-red-500/30' : 'bg-gray-700'
                  }`}>
                    {player.username?.charAt(0).toUpperCase() || '?'}
                  </div>
                  <div>
                    <p className="text-white font-medium">{player.username || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{player.secret_word}</p>
                  </div>
                </div>
                <span className={`text-sm font-semibold ${
                  player.role === 'TRAITOR' ? 'text-red-400' : 'text-blue-400'
                }`}>
                  {player.role}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  )
}

export default GameOver