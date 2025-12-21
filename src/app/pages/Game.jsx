import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Eye, EyeOff, Send, Users, Clock, AlertCircle, Crown, Target } from 'lucide-react'
import { useGameStore, GAME_PHASES } from '@/store/gameStore'
import { useGuestStore } from '@/store/guestStore'
import { useUIStore } from '@/store/uiStore'
import { formatTime } from '@/lib/utils'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'
import Button from '@/components/Button'
import ToastContainer from '@/components/Toast'

const Game = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { guestId, username } = useGuestStore()
  const { showSuccess, showError } = useUIStore()
  
  const {
    roomCode,
    participants,
    mySecret,
    myRole,
    myHint,
    myVote,
    currentPhase,
    phaseTimeLeft,
    hints,
    votes,
    status,
    currentRound,
    startPhase,
    submitHint,
    submitVote,
    leaveGame,
    isLoading
  } = useGameStore()
  
  const [hintInput, setHintInput] = useState('')
  const [selectedVote, setSelectedVote] = useState(null)
  const [showSecret, setShowSecret] = useState(false)
  
  useEffect(() => {
    if (!username) {
      navigate('/')
      return
    }
    
    // Check if game finished
    if (status === 'FINISHED') {
      navigate(`/results/${roomId}`)
    }
  }, [status, username, roomId, navigate])
  
  // Get alive participants
  const alivePlayers = participants.filter(p => p.is_alive)
  const deadPlayers = participants.filter(p => !p.is_alive)
  
  // Get phase info
  const getPhaseInfo = () => {
    switch (currentPhase) {
      case GAME_PHASES.WHISPER:
        return {
          title: 'The Whisper',
          subtitle: 'Remember your secret word...',
          color: 'text-purple-400'
        }
      case GAME_PHASES.HINT_DROP:
        return {
          title: 'Hint Drop',
          subtitle: 'Give a hint about your word',
          color: 'text-cyan-400'
        }
      case GAME_PHASES.DEBATE:
        return {
          title: 'The Debate',
          subtitle: 'Discuss and find the traitor',
          color: 'text-yellow-400'
        }
      case GAME_PHASES.VERDICT:
        return {
          title: 'The Verdict',
          subtitle: 'Vote for the traitor',
          color: 'text-red-400'
        }
      case GAME_PHASES.REVEAL:
        return {
          title: 'The Reveal',
          subtitle: 'See who was eliminated',
          color: 'text-orange-400'
        }
      default:
        return { title: '', subtitle: '', color: '' }
    }
  }
  
  const phaseInfo = getPhaseInfo()
  
  // Handle hint submission
  const handleSubmitHint = async () => {
    if (!hintInput.trim() || myHint) return
    
    await submitHint(hintInput)
    showSuccess('Hint submitted!')
    setHintInput('')
  }
  
  // Handle vote submission
  const handleSubmitVote = async () => {
    if (!selectedVote || myVote) return
    
    await submitVote(selectedVote)
    showSuccess('Vote submitted!')
  }
  
  // Handle leave
  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave the game?')) {
      await leaveGame()
      navigate('/')
    }
  }
  
  // Get participant by ID
  const getParticipant = (userId) => {
    return participants.find(p => p.user_id === userId)
  }
  
  if (!currentPhase) {
    return (
      <PageContainer>
        <AppHeader />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-white">Loading game...</p>
          </Card>
        </div>
      </PageContainer>
    )
  }
  
  return (
    <PageContainer>
      <AppHeader />
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-8">
        {/* Game Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-heading font-bold text-white mb-1">
                Round {currentRound}
              </h1>
              <p className="text-gray-400">Room: {roomCode}</p>
            </div>
            <Button variant="outline" size="sm" onClick={handleLeave}>
              Leave Game
            </Button>
          </div>
          
          {/* Phase Timer */}
          <Card glow className="text-center">
            <div className="flex items-center justify-center gap-6">
              <div>
                <h2 className={`text-2xl font-heading font-bold ${phaseInfo.color}`}>
                  {phaseInfo.title}
                </h2>
                <p className="text-gray-400 text-sm">{phaseInfo.subtitle}</p>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="text-neon-cyan" size={24} />
                <span className="text-4xl font-mono font-bold text-white">
                  {formatTime(phaseTimeLeft)}
                </span>
              </div>
            </div>
          </Card>
        </div>
        
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Main Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* My Secret Word */}
            <Card>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-heading font-bold text-white">
                  Your Secret
                </h3>
                <button
                  onClick={() => setShowSecret(!showSecret)}
                  className="text-gray-400 hover:text-white transition-colors"
                >
                  {showSecret ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
              
              <div className="text-center py-8">
                {showSecret ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                  >
                    <p className="text-5xl font-bold text-neon-cyan mb-2">
                      {mySecret}
                    </p>
                    <p className={`text-sm ${
                      myRole === 'TRAITOR' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {myRole === 'TRAITOR' ? '🎭 You are the TRAITOR' : '👥 You are a CITIZEN'}
                    </p>
                  </motion.div>
                ) : (
                  <p className="text-gray-500 text-lg">Click the eye to reveal</p>
                )}
              </div>
            </Card>
            
            {/* Phase Content */}
            <AnimatePresence mode="wait">
              {/* WHISPER Phase */}
              {currentPhase === GAME_PHASES.WHISPER && (
                <motion.div
                  key="whisper"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <div className="text-center py-12">
                      <AlertCircle className="text-purple-400 mx-auto mb-4" size={48} />
                      <h3 className="text-2xl font-bold text-white mb-2">
                        Memorize Your Word
                      </h3>
                      <p className="text-gray-400">
                        The hint phase begins soon. Think about what you'll say.
                      </p>
                    </div>
                  </Card>
                </motion.div>
              )}
              
              {/* HINT_DROP Phase */}
              {currentPhase === GAME_PHASES.HINT_DROP && (
                <motion.div
                  key="hint"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <h3 className="text-xl font-heading font-bold text-white mb-4">
                      Submit Your Hint
                    </h3>
                    
                    {myHint ? (
                      <div className="text-center py-8">
                        <div className="inline-block px-6 py-4 bg-dark-bg rounded-lg">
                          <p className="text-gray-400 text-sm mb-1">Your hint:</p>
                          <p className="text-2xl font-bold text-neon-cyan">"{myHint}"</p>
                        </div>
                        <p className="text-green-400 mt-4">✓ Hint submitted</p>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={hintInput}
                          onChange={(e) => setHintInput(e.target.value)}
                          placeholder="Give a one-line hint about your word..."
                          className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan resize-none"
                          rows={3}
                          maxLength={100}
                        />
                        <div className="flex items-center justify-between mt-3">
                          <span className="text-xs text-gray-500">
                            {hintInput.length}/100 characters
                          </span>
                          <Button
                            variant="primary"
                            size="sm"
                            icon={Send}
                            onClick={handleSubmitHint}
                            disabled={!hintInput.trim() || isLoading}
                          >
                            Submit Hint
                          </Button>
                        </div>
                      </div>
                    )}
                  </Card>
                </motion.div>
              )}
              
              {/* DEBATE Phase */}
              {currentPhase === GAME_PHASES.DEBATE && (
                <motion.div
                  key="debate"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <h3 className="text-xl font-heading font-bold text-white mb-4">
                      All Hints
                    </h3>
                    
                    <div className="space-y-3">
                      {hints.length > 0 ? (
                        hints.map((hint) => {
                          const player = getParticipant(hint.user_id)
                          return (
                            <motion.div
                              key={hint.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              className="p-4 bg-dark-bg rounded-lg"
                            >
                              <div className="flex items-start gap-3">
                                <img
                                  src={player?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player?.username}`}
                                  alt="Avatar"
                                  className="w-10 h-10 rounded-full"
                                />
                                <div className="flex-1">
                                  <p className="font-medium text-white">
                                    {player?.username || 'Unknown'}
                                  </p>
                                  <p className="text-gray-300 mt-1">"{hint.hint_text}"</p>
                                </div>
                              </div>
                            </motion.div>
                          )
                        })
                      ) : (
                        <p className="text-center text-gray-500 py-8">
                          Waiting for hints...
                        </p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
              
              {/* VERDICT Phase */}
              {currentPhase === GAME_PHASES.VERDICT && (
                <motion.div
                  key="verdict"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                >
                  <Card>
                    <h3 className="text-xl font-heading font-bold text-white mb-4">
                      Vote for the Traitor
                    </h3>
                    
                    {myVote ? (
                      <div className="text-center py-8">
                        <Target className="text-red-400 mx-auto mb-4" size={48} />
                        <p className="text-gray-400">You voted for:</p>
                        <p className="text-2xl font-bold text-white mt-2">
                          {getParticipant(myVote)?.username}
                        </p>
                        <p className="text-green-400 mt-4">✓ Vote submitted</p>
                      </div>
                    ) : (
                      <div className="grid sm:grid-cols-2 gap-3">
                        {alivePlayers
                          .filter(p => p.user_id !== guestId)
                          .map((player) => (
                            <button
                              key={player.user_id}
                              onClick={() => setSelectedVote(player.user_id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedVote === player.user_id
                                  ? 'border-red-500 bg-red-500/10'
                                  : 'border-gray-700 bg-dark-bg hover:border-red-400'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <img
                                  src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                                  alt="Avatar"
                                  className="w-12 h-12 rounded-full"
                                />
                                <p className="font-medium text-white">
                                  {player.username}
                                </p>
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                    
                    {!myVote && selectedVote && (
                      <Button
                        variant="primary"
                        onClick={handleSubmitVote}
                        disabled={isLoading}
                        className="w-full mt-4"
                      >
                        Confirm Vote
                      </Button>
                    )}
                  </Card>
                </motion.div>
              )}
              
              {/* REVEAL Phase */}
              {currentPhase === GAME_PHASES.REVEAL && (
                <motion.div
                  key="reveal"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                >
                  <Card className="text-center py-12">
                    <h3 className="text-2xl font-bold text-white mb-6">Vote Results</h3>
                    
                    <div className="space-y-4 max-w-md mx-auto">
                      {votes.length > 0 ? (
                        (() => {
                          const voteCounts = {}
                          votes.forEach(v => {
                            voteCounts[v.target_id] = (voteCounts[v.target_id] || 0) + 1
                          })
                          
                          return Object.entries(voteCounts)
                            .sort((a, b) => b[1] - a[1])
                            .map(([userId, count]) => {
                              const player = getParticipant(userId)
                              return (
                                <div key={userId} className="p-4 bg-dark-bg rounded-lg">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <img
                                        src={player?.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player?.username}`}
                                        alt="Avatar"
                                        className="w-10 h-10 rounded-full"
                                      />
                                      <span className="text-white font-medium">
                                        {player?.username}
                                      </span>
                                    </div>
                                    <span className="text-2xl font-bold text-neon-cyan">
                                      {count} vote{count !== 1 ? 's' : ''}
                                    </span>
                                  </div>
                                </div>
                              )
                            })
                        })()
                      ) : (
                        <p className="text-gray-500">No votes cast</p>
                      )}
                    </div>
                  </Card>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Players Sidebar */}
          <div className="space-y-6">
            {/* Alive Players */}
            <Card>
              <div className="flex items-center gap-2 mb-4">
                <Users className="text-green-400" size={20} />
                <h3 className="text-lg font-heading font-bold text-white">
                  Alive ({alivePlayers.length})
                </h3>
              </div>
              
              <div className="space-y-2">
                {alivePlayers.map((player) => (
                  <div
                    key={player.user_id}
                    className="flex items-center gap-3 p-2 bg-dark-bg rounded-lg"
                  >
                    <img
                      src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full"
                    />
                    <span className="text-white text-sm">{player.username}</span>
                    {player.user_id === guestId && (
                      <span className="ml-auto text-xs text-neon-cyan">(You)</span>
                    )}
                  </div>
                ))}
              </div>
            </Card>
            
            {/* Dead Players */}
            {deadPlayers.length > 0 && (
              <Card>
                <div className="flex items-center gap-2 mb-4">
                  <Crown className="text-gray-600" size={20} />
                  <h3 className="text-lg font-heading font-bold text-gray-400">
                    Eliminated ({deadPlayers.length})
                  </h3>
                </div>
                
                <div className="space-y-2">
                  {deadPlayers.map((player) => (
                    <div
                      key={player.user_id}
                      className="flex items-center gap-3 p-2 bg-dark-bg rounded-lg opacity-50"
                    >
                      <img
                        src={player.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${player.username}`}
                        alt="Avatar"
                        className="w-8 h-8 rounded-full grayscale"
                      />
                      <span className="text-gray-500 text-sm line-through">
                        {player.username}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default Game