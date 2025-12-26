import React from 'react'
import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'
import useGameStore from '../../store/gameStore'

const PostRoundPhase = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { room } = useGameStore()

  // Auto-redirect to results after 2 seconds
  React.useEffect(() => {
    const timer = setTimeout(() => {
      console.log('🏆 Redirecting to results...')
      navigate(`/results/${roomId}`)
    }, 2000)

    return () => clearTimeout(timer)
  }, [roomId, navigate])

  return (
    <div className="min-h-[60vh] flex items-center justify-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center"
      >
        <div className="text-8xl mb-6 animate-bounce">🏆</div>
        <h2 className="text-4xl font-bold text-white mb-4">Game Complete!</h2>
        <p className="text-xl text-gray-400 mb-6">Calculating final results...</p>
        
        <div className="flex items-center justify-center gap-2">
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '0ms' }} />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '200ms' }} />
          <div className="w-3 h-3 bg-purple-500 rounded-full animate-pulse" style={{ animationDelay: '400ms' }} />
        </div>

        <p className="text-sm text-gray-500 mt-6">Redirecting to results...</p>
      </motion.div>
    </div>
  )
}

export default PostRoundPhase