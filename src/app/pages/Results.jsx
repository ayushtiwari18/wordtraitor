import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameHelpers } from '../../lib/supabase'
import { motion } from 'framer-motion'
import { 
  Trophy, 
  Skull, 
  Home, 
  RotateCcw,
  Users,
  Target
} from 'lucide-react'
import confetti from 'canvas-confetti'

const Results = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [secrets, setSecrets] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [winner, setWinner] = useState(null)
  const [traitorInfo, setTraitorInfo] = useState(null)
  
  const myUserId = localStorage.getItem('guestId')
  
  useEffect(() => {
    loadResults()
  }, [roomId])
  
  const loadResults = async () => {
    try {
      // Get room data
      const roomData = await gameHelpers.getRoom(roomId)
      setRoom(roomData)
      
      // Get participants
      const participantsData = await gameHelpers.getParticipants(roomId)
      setParticipants(participantsData)
      
      // Determine winner
      const gameEnd = await gameHelpers.checkGameEnd(roomId)
      setWinner(gameEnd.winner)
      
      // Get traitor info
      if (gameEnd.traitorId) {
        const traitor = participantsData.find(p => p.user_id === gameEnd.traitorId)
        setTraitorInfo(traitor)
        
        // Trigger confetti if I'm on winning team
        const iAmTraitor = myUserId === gameEnd.traitorId
        const didIWin = 
          (gameEnd.winner === 'TRAITOR' && iAmTraitor) ||
          (gameEnd.winner === 'CITIZENS' && !iAmTraitor)
        
        if (didIWin) {
          triggerConfetti()
        }
      }
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load results:', error)
      setIsLoading(false)
    }
  }
  
  const triggerConfetti = () => {
    const duration = 3000
    const end = Date.now() + duration
    
    const colors = ['#8b5cf6', '#ec4899', '#3b82f6', '#10b981']
    
    ;(function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        colors: colors
      })
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        colors: colors
      })
      
      if (Date.now() < end) {
        requestAnimationFrame(frame)
      }
    })()
  }
  
  const handlePlayAgain = () => {
    navigate('/')
  }
  
  const handleGoHome = () => {
    navigate('/')
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading results...</div>
      </div>
    )
  }
  
  const iAmTraitor = myUserId === traitorInfo?.user_id
  const didIWin = 
    (winner === 'TRAITOR' && iAmTraitor) ||
    (winner === 'CITIZENS' && !iAmTraitor)
  
  const alivePlayers = participants.filter(p => p.is_alive)
  const eliminatedPlayers = participants.filter(p => !p.is_alive)
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
      <div className="max-w-4xl mx-auto">
        {/* Winner Announcement */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', duration: 1 }}
          className="text-center mb-12"
        >
          {didIWin ? (
            <Trophy className="w-32 h-32 mx-auto mb-6 text-yellow-400" />
          ) : (
            <Skull className="w-32 h-32 mx-auto mb-6 text-red-400" />
          )}
          
          <h1 className="text-6xl font-black mb-4">
            {didIWin ? 'VICTORY!' : 'DEFEAT'}
          </h1>
          
          <div className="text-3xl font-bold mb-2">
            {winner === 'TRAITOR' ? (
              <span className="text-red-400">The Traitor Wins!</span>
            ) : (
              <span className="text-green-400">Citizens Win!</span>
            )}
          </div>
          
          {traitorInfo && (
            <div className="mt-6 bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 inline-block">
              <p className="text-xl mb-2">The Traitor was:</p>
              <p className="text-4xl font-black text-red-400">{traitorInfo.username}</p>
            </div>
          )}
        </motion.div>
        
        {/* Game Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {/* Survivors */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6 text-green-400" />
              Survivors ({alivePlayers.length})
            </h2>
            
            <div className="space-y-3">
              {alivePlayers.map((player) => (
                <div
                  key={player.id}
                  className="bg-green-500/20 border border-green-500 p-3 rounded-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{player.username}</span>
                    {player.user_id === traitorInfo?.user_id && (
                      <span className="text-xs bg-red-500 px-2 py-1 rounded">TRAITOR</span>
                    )}
                    {player.user_id === myUserId && (
                      <span className="text-xs bg-purple-500 px-2 py-1 rounded">YOU</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
          
          {/* Eliminated */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20"
          >
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
              <Target className="w-6 h-6 text-red-400" />
              Eliminated ({eliminatedPlayers.length})
            </h2>
            
            <div className="space-y-3">
              {eliminatedPlayers.length > 0 ? (
                eliminatedPlayers.map((player) => (
                  <div
                    key={player.id}
                    className="bg-red-500/20 border border-red-500 p-3 rounded-lg"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{player.username}</span>
                      {player.user_id === traitorInfo?.user_id && (
                        <span className="text-xs bg-red-500 px-2 py-1 rounded">TRAITOR</span>
                      )}
                      {player.user_id === myUserId && (
                        <span className="text-xs bg-purple-500 px-2 py-1 rounded">YOU</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-center py-4">No one was eliminated</p>
              )}
            </div>
          </motion.div>
        </div>
        
        {/* Game Stats */}
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-8"
        >
          <h2 className="text-2xl font-bold mb-4">Game Stats</h2>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-purple-400">{participants.length}</p>
              <p className="text-sm text-gray-300">Total Players</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-blue-400">{room?.current_round || 1}</p>
              <p className="text-sm text-gray-300">Rounds Played</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-green-400">{room?.game_mode || 'SILENT'}</p>
              <p className="text-sm text-gray-300">Game Mode</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg text-center">
              <p className="text-3xl font-bold text-yellow-400">{room?.difficulty || 'MEDIUM'}</p>
              <p className="text-sm text-gray-300">Difficulty</p>
            </div>
          </div>
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col sm:flex-row gap-4 justify-center"
        >
          <button
            onClick={handlePlayAgain}
            className="flex items-center justify-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 px-8 py-4 rounded-xl font-bold text-lg hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            <RotateCcw className="w-6 h-6" />
            Play Again
          </button>
          
          <button
            onClick={handleGoHome}
            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
          >
            <Home className="w-6 h-6" />
            Home
          </button>
        </motion.div>
      </div>
    </div>
  )
}

export default Results
