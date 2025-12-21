import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Clock, Eye, MessageSquare, Vote, Trophy } from 'lucide-react'
import { useGuestStore } from '@/store/guestStore'
import { useGameStore, GAME_PHASES } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'
import { formatTime } from '@/lib/utils'
import PageContainer from '@/components/PageContainer'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Input from '@/components/Input'
import ToastContainer from '@/components/Toast'

const PhaseIndicator = ({ phase, timeLeft }) => {
  const phaseInfo = {
    [GAME_PHASES.WHISPER]: { name: 'The Whisper', icon: Eye, color: 'neon-purple' },
    [GAME_PHASES.HINT_DROP]: { name: 'The Hint Drop', icon: MessageSquare, color: 'neon-cyan' },
    [GAME_PHASES.DEBATE]: { name: 'The Debate', icon: MessageSquare, color: 'neon-purple' },
    [GAME_PHASES.VERDICT]: { name: 'The Verdict', icon: Vote, color: 'red-500' },
    [GAME_PHASES.REVEAL]: { name: 'The Reveal', icon: Trophy, color: 'neon-cyan' }
  }
  
  const info = phaseInfo[phase] || phaseInfo[GAME_PHASES.WHISPER]
  const Icon = info.icon
  
  return (
    <Card glow className="text-center mb-6">
      <div className="flex items-center justify-center gap-4">
        <Icon className={`text-${info.color}`} size={32} />
        <div>
          <h2 className="text-3xl font-heading font-bold text-white">{info.name}</h2>
          <div className="flex items-center justify-center gap-2 mt-2">
            <Clock className="text-gray-400" size={20} />
            <span className={`text-2xl font-bold ${timeLeft <= 10 ? 'text-red-500 animate-pulse' : 'text-white'}`}>
              {formatTime(timeLeft)}
            </span>
          </div>
        </div>
      </div>
    </Card>
  )
}

const Game = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { guestId, username } = useGuestStore()
  const { showSuccess, showError } = useUIStore()
  const {
    currentPhase,
    phaseTimeLeft,
    roundNumber,
    players,
    myRole,
    myWord,
    hints,
    votes,
    eliminatedPlayers,
    gameOver,
    winner,
    initializeGame,
    decrementTimer,
    submitHint,
    submitVote
  } = useGameStore()
  
  const [hintInput, setHintInput] = useState('')
  const [selectedPlayer, setSelectedPlayer] = useState(null)
  const [hasSubmittedHint, setHasSubmittedHint] = useState(false)
  const [hasVoted, setHasVoted] = useState(false)
  
  useEffect(() => {
    if (!username) {
      navigate('/')
      return
    }
    
    // Load room data and initialize game
    const pendingRoom = localStorage.getItem('pendingRoom')
    if (pendingRoom) {
      const roomData = JSON.parse(pendingRoom)
      if (roomData.code === roomId) {
        // Mock players (in real app, get from Supabase)
        const mockPlayers = [
          { id: guestId, username: username, avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}` },
          { id: 'player2', username: 'Alice', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alice' },
          { id: 'player3', username: 'Bob', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Bob' },
          { id: 'player4', username: 'Charlie', avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Charlie' }
        ]
        
        initializeGame(roomData.code, roomData.settings, mockPlayers, guestId)
      }
    }
  }, [roomId])
  
  // Timer countdown
  useEffect(() => {
    if (!currentPhase || gameOver) return
    
    const timer = setInterval(() => {
      decrementTimer()
    }, 1000)
    
    return () => clearInterval(timer)
  }, [currentPhase, gameOver])
  
  // Navigate to results when game over
  useEffect(() => {
    if (gameOver) {
      setTimeout(() => {
        navigate(`/results/${roomId}`)
      }, 3000)
    }
  }, [gameOver])
  
  const handleSubmitHint = () => {
    if (!hintInput || hintInput.length < 3) {
      showError('Hint must be at least 3 characters')
      return
    }
    submitHint(guestId, hintInput)
    setHasSubmittedHint(true)
    showSuccess('Hint submitted!')
    setHintInput('')
  }
  
  const handleVote = (playerId) => {
    if (playerId === guestId) {
      showError('You cannot vote for yourself!')
      return
    }
    submitVote(guestId, playerId)
    setSelectedPlayer(playerId)
    setHasVoted(true)
    showSuccess('Vote submitted!')
  }
  
  const alivePlayers = players.filter(p => !p.isEliminated)
  const currentHints = hints.filter(h => h.round === roundNumber)
  
  if (!currentPhase) {
    return <PageContainer><div className="text-white text-center py-12">Loading game...</div></PageContainer>
  }
  
  return (
    <PageContainer>
      <ToastContainer />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="text-white">
              <span className="text-sm text-gray-400">Room:</span> <span className="font-mono font-bold text-neon-cyan">{roomId}</span>
            </div>
            <div className="text-white">
              <span className="text-sm text-gray-400">Round:</span> <span className="font-bold">{roundNumber}</span>
            </div>
          </div>
          
          <PhaseIndicator phase={currentPhase} timeLeft={phaseTimeLeft} />
          
          <div className="grid md:grid-cols-3 gap-6">
            {/* Left: Player List */}
            <Card>
              <h3 className="text-xl font-heading font-bold text-white mb-4">Players ({alivePlayers.length})</h3>
              <div className="space-y-2">
                {players.map(player => (
                  <motion.div
                    key={player.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center gap-2 p-2 rounded-lg ${
                      player.isEliminated ? 'opacity-50 bg-gray-800' : 'bg-dark-bg'
                    } ${selectedPlayer === player.id ? 'ring-2 ring-neon-cyan' : ''}`}
                    onClick={() => currentPhase === GAME_PHASES.VERDICT && !hasVoted && handleVote(player.id)}
                    style={{ cursor: currentPhase === GAME_PHASES.VERDICT && !player.isEliminated && player.id !== guestId ? 'pointer' : 'default' }}
                  >
                    <img src={player.avatar} alt="Avatar" className="w-8 h-8 rounded-full" />
                    <div className="flex-1">
                      <p className="text-white text-sm font-medium">{player.username}</p>
                      {player.isEliminated && <p className="text-xs text-red-500">Eliminated</p>}
                    </div>
                    {player.id === guestId && <span className="text-xs text-neon-cyan">You</span>}
                  </motion.div>
                ))}
              </div>
            </Card>
            
            {/* Center: Main Game Area */}
            <Card className="md:col-span-2">
              <AnimatePresence mode="wait">
                {/* WHISPER PHASE */}
                {currentPhase === GAME_PHASES.WHISPER && (
                  <motion.div key="whisper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="text-center py-12">
                    <Eye className="text-neon-purple mx-auto mb-4" size={64} />
                    <h3 className="text-2xl font-heading font-bold text-white mb-4">Your Secret Word</h3>
                    <div className="text-6xl font-bold text-neon-cyan mb-6">{myWord}</div>
                    <div className={`inline-block px-6 py-3 rounded-full ${myRole === 'traitor' ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                      You are: <span className="font-bold">{myRole === 'traitor' ? 'THE TRAITOR' : 'A WORD KEEPER'}</span>
                    </div>
                    <p className="text-gray-400 mt-6 max-w-md mx-auto">Memorize your word. The hint phase begins soon!</p>
                  </motion.div>
                )}
                
                {/* HINT DROP PHASE */}
                {currentPhase === GAME_PHASES.HINT_DROP && (
                  <motion.div key="hint" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <h3 className="text-2xl font-heading font-bold text-white mb-4">Submit Your Hint</h3>
                    <div className="mb-4 p-4 bg-dark-bg rounded-lg">
                      <p className="text-sm text-gray-400 mb-1">Your word:</p>
                      <p className="text-2xl font-bold text-neon-cyan">{myWord}</p>
                    </div>
                    
                    {!hasSubmittedHint ? (
                      <div className="space-y-4">
                        <Input
                          value={hintInput}
                          onChange={(e) => setHintInput(e.target.value)}
                          placeholder="Enter a one-line hint about your word..."
                          maxLength={100}
                        />
                        <Button variant="primary" size="lg" onClick={handleSubmitHint} className="w-full">
                          Submit Hint
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Trophy className="text-green-500" size={32} />
                        </div>
                        <p className="text-green-500 font-bold">Hint Submitted!</p>
                        <p className="text-gray-400 text-sm mt-2">Waiting for other players...</p>
                      </div>
                    )}
                    
                    {currentHints.length > 0 && (
                      <div className="mt-6">
                        <h4 className="text-white font-bold mb-3">Submitted Hints: {currentHints.length}/{alivePlayers.length}</h4>
                        <div className="space-y-2">
                          {currentHints.map((hint, i) => (
                            <div key={i} className="p-3 bg-dark-bg rounded-lg">
                              <p className="text-sm text-gray-400">{players.find(p => p.id === hint.playerId)?.username}</p>
                              <p className="text-white">Hint submitted ✓</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* DEBATE PHASE */}
                {currentPhase === GAME_PHASES.DEBATE && (
                  <motion.div key="debate" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <h3 className="text-2xl font-heading font-bold text-white mb-4">Discussion Time</h3>
                    <div className="space-y-3 mb-6">
                      {currentHints.map((hint, i) => {
                        const player = players.find(p => p.id === hint.playerId)
                        return (
                          <div key={i} className="p-4 bg-dark-bg rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <img src={player?.avatar} alt="" className="w-6 h-6 rounded-full" />
                              <span className="text-white font-bold">{player?.username}</span>
                            </div>
                            <p className="text-gray-300 italic">"{hint.hint}"</p>
                          </div>
                        )
                      })}
                    </div>
                    <div className="text-center p-6 bg-neon-purple/10 rounded-lg border border-neon-purple/30">
                      <p className="text-white mb-2">Discuss the hints and identify suspicious players</p>
                      <p className="text-sm text-gray-400">Voting begins in {formatTime(phaseTimeLeft)}</p>
                    </div>
                  </motion.div>
                )}
                
                {/* VERDICT PHASE */}
                {currentPhase === GAME_PHASES.VERDICT && (
                  <motion.div key="verdict" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
                    <h3 className="text-2xl font-heading font-bold text-white mb-4">Vote for the Traitor</h3>
                    {!hasVoted ? (
                      <div>
                        <p className="text-gray-400 mb-4">Click on a player's name in the left panel to vote</p>
                        <div className="grid grid-cols-2 gap-3">
                          {alivePlayers.filter(p => p.id !== guestId).map(player => (
                            <button
                              key={player.id}
                              onClick={() => handleVote(player.id)}
                              className={`p-4 rounded-lg border-2 transition-all ${
                                selectedPlayer === player.id
                                  ? 'border-neon-cyan bg-neon-cyan/10'
                                  : 'border-gray-700 hover:border-gray-600'
                              }`}
                            >
                              <img src={player.avatar} alt="" className="w-12 h-12 rounded-full mx-auto mb-2" />
                              <p className="text-white font-bold">{player.username}</p>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Vote className="text-green-500 mx-auto mb-4" size={64} />
                        <p className="text-green-500 font-bold text-xl">Vote Cast!</p>
                        <p className="text-gray-400 mt-2">Waiting for other players...</p>
                        <p className="text-sm text-gray-500 mt-4">Votes: {votes.length}/{alivePlayers.length}</p>
                      </div>
                    )}
                  </motion.div>
                )}
                
                {/* REVEAL PHASE */}
                {currentPhase === GAME_PHASES.REVEAL && eliminatedPlayers.length > 0 && (
                  <motion.div key="reveal" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="text-center py-12">
                    <Trophy className="text-neon-cyan mx-auto mb-4" size={64} />
                    <h3 className="text-3xl font-heading font-bold text-white mb-4">Player Eliminated!</h3>
                    <div className="mb-6">
                      <img src={eliminatedPlayers[eliminatedPlayers.length - 1]?.avatar} alt="" className="w-24 h-24 rounded-full mx-auto mb-4 border-4 border-red-500" />
                      <p className="text-2xl font-bold text-white mb-2">{eliminatedPlayers[eliminatedPlayers.length - 1]?.username}</p>
                      <p className="text-gray-400">Their word was:</p>
                      <p className="text-4xl font-bold text-neon-purple mt-2">{eliminatedPlayers[eliminatedPlayers.length - 1]?.word}</p>
                    </div>
                    {gameOver && (
                      <div className="mt-6 p-6 bg-gradient-to-r from-neon-cyan/20 to-neon-purple/20 rounded-lg">
                        <p className="text-3xl font-bold text-white mb-2">
                          {winner === 'keepers' ? 'Word Keepers Win!' : 'The Traitor Wins!'}
                        </p>
                        <p className="text-gray-400">Redirecting to results...</p>
                      </div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </div>
      </div>
    </PageContainer>
  )
}

export default Game