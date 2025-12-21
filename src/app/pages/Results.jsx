import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Trophy, Skull, Home, RotateCcw, Crown, Users } from 'lucide-react'
import { useGameStore } from '@/store/gameStore'
import { useGuestStore } from '@/store/guestStore'
import { gameHelpers } from '@/lib/supabase'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'
import Button from '@/components/Button'

const Results = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { guestId, username } = useGuestStore()
  const { winner, traitorId, participants, myRole, resetGame } = useGameStore()
  
  const [traitorInfo, setTraitorInfo] = useState(null)
  const [loading, setLoading] = useState(true)
  
  useEffect(() => {
    if (!username) {
      navigate('/')
      return
    }
    
    loadResults()
  }, [roomId])
  
  const loadResults = async () => {
    try {
      // Get traitor participant info
      if (traitorId) {
        const traitor = participants.find(p => p.user_id === traitorId)
        setTraitorInfo(traitor)
      }
      setLoading(false)
    } catch (error) {
      console.error('Load results error:', error)
      setLoading(false)
    }
  }
  
  const handlePlayAgain = () => {
    resetGame()
    navigate('/')
  }
  
  const handleGoHome = () => {
    resetGame()
    navigate('/')
  }
  
  // Determine if current player won
  const didIWin = () => {
    if (myRole === 'TRAITOR') {
      return winner === 'TRAITOR'
    } else {
      return winner === 'CITIZENS'
    }
  }
  
  const iWon = didIWin()
  
  if (loading) {
    return (
      <PageContainer>
        <AppHeader />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-white">Loading results...</p>
          </Card>
        </div>
      </PageContainer>
    )
  }
  
  return (
    <PageContainer>
      <AppHeader />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-3xl mx-auto"
        >
          {/* Winner Announcement */}
          <Card glow className="text-center mb-8">
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              transition={{ delay: 0.2 }}
            >
              {iWon ? (
                <>
                  <Trophy className="text-yellow-400 mx-auto mb-4" size={64} />
                  <h1 className="text-5xl font-heading font-bold text-yellow-400 mb-2">
                    VICTORY!
                  </h1>
                  <p className="text-2xl text-white mb-4">
                    {myRole === 'TRAITOR' ? 'You deceived them all!' : 'Justice prevails!'}
                  </p>
                </>
              ) : (
                <>
                  <Skull className="text-red-400 mx-auto mb-4" size={64} />
                  <h1 className="text-5xl font-heading font-bold text-red-400 mb-2">
                    DEFEAT
                  </h1>
                  <p className="text-2xl text-white mb-4">
                    {myRole === 'TRAITOR' ? 'You were caught!' : 'The traitor escaped!'}
                  </p>
                </>
              )}
              
              <div className="inline-block px-6 py-3 bg-dark-bg rounded-lg mt-4">
                <p className="text-gray-400 text-sm mb-1">Winner</p>
                <p className="text-3xl font-bold text-neon-cyan">
                  {winner === 'TRAITOR' ? '🎭 Traitor' : '👥 Citizens'}
                </p>
              </div>
            </motion.div>
          </Card>
          
          {/* Traitor Reveal */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="mb-8">
              <h2 className="text-2xl font-heading font-bold text-white text-center mb-6">
                The Traitor Was...
              </h2>
              
              {traitorInfo && (
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="text-center"
                >
                  <div className="inline-block p-6 bg-gradient-to-br from-red-500/20 to-purple-500/20 rounded-xl border-2 border-red-500">
                    <img
                      src={traitorInfo.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${traitorInfo.username}`}
                      alt="Traitor"
                      className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-red-500"
                    />
                    <p className="text-3xl font-bold text-white mb-2">
                      {traitorInfo.username}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      <Crown className="text-red-400" size={20} />
                      <span className="text-red-400 font-medium">The Word Traitor</span>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
          
          {/* Player Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <Card className="mb-8">
              <div className="flex items-center gap-2 mb-6">
                <Users className="text-neon-cyan" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">
                  Final Standings
                </h2>
              </div>
              
              <div className="space-y-3">
                {participants
                  .sort((a, b) => {
                    // Traitor first, then alive players, then eliminated
                    if (a.user_id === traitorId) return -1
                    if (b.user_id === traitorId) return 1
                    if (a.is_alive && !b.is_alive) return -1
                    if (!a.is_alive && b.is_alive) return 1
                    return 0
                  })
                  .map((player, index) => (
                    <motion.div
                      key={player.user_id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 1 + index * 0.1 }}
                      className={`p-4 rounded-lg border-2 ${
                        player.user_id === traitorId
                          ? 'bg-red-500/10 border-red-500'
                          : player.is_alive
                          ? 'bg-green-500/10 border-green-500'
                          : 'bg-gray-500/10 border-gray-500'
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0">
                          <img
                            src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                            alt="Avatar"
                            className={`w-12 h-12 rounded-full ${
                              !player.is_alive ? 'grayscale opacity-50' : ''
                            }`}
                          />
                        </div>
                        
                        <div className="flex-1">
                          <p className="text-lg font-bold text-white">
                            {player.username}
                            {player.user_id === guestId && (
                              <span className="ml-2 text-sm text-neon-cyan">(You)</span>
                            )}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            {player.user_id === traitorId && (
                              <span className="text-xs px-2 py-1 bg-red-500/20 text-red-400 rounded">
                                Traitor
                              </span>
                            )}
                            {player.is_alive ? (
                              <span className="text-xs px-2 py-1 bg-green-500/20 text-green-400 rounded">
                                Survived
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-1 bg-gray-500/20 text-gray-400 rounded">
                                Eliminated
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
              </div>
            </Card>
          </motion.div>
          
          {/* Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.5 }}
            className="flex gap-4 justify-center"
          >
            <Button
              variant="primary"
              size="lg"
              icon={RotateCcw}
              onClick={handlePlayAgain}
            >
              Play Again
            </Button>
            <Button
              variant="outline"
              size="lg"
              icon={Home}
              onClick={handleGoHome}
            >
              Back to Home
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </PageContainer>
  )
}

export default Results