import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useGameStore } from '../../store/gameStore'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Clock, 
  Users, 
  MessageSquare, 
  Vote, 
  Eye,
  Send,
  AlertCircle,
  UserX
} from 'lucide-react'

const Game = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const {
    room,
    participants,
    myUserId,
    myUsername,
    mySecret,
    phase,
    phaseTimeLeft,
    hints,
    votes,
    isLoading,
    error,
    initializeGame,
    decrementTimer,
    submitHint,
    submitVote,
    cleanup,
    getAliveParticipants,
    hasVoted,
    hasSubmittedHint
  } = useGameStore()
  
  const [hintInput, setHintInput] = useState('')
  const [selectedVoteTarget, setSelectedVoteTarget] = useState(null)
  
  // Initialize game on mount
  useEffect(() => {
    const userId = localStorage.getItem('guestId')
    const username = localStorage.getItem('guestName')
    
    if (!userId || !username) {
      navigate('/')
      return
    }
    
    initializeGame(roomId, userId, username)
    
    return () => {
      cleanup()
    }
  }, [roomId])
  
  // Timer countdown
  useEffect(() => {
    if (!room || room.status !== 'PLAYING') return
    
    const timer = setInterval(() => {
      decrementTimer()
    }, 1000)
    
    return () => clearInterval(timer)
  }, [room, decrementTimer])
  
  // Check if game finished
  useEffect(() => {
    if (room?.status === 'FINISHED') {
      navigate(`/results/${roomId}`)
    }
  }, [room?.status, roomId, navigate])
  
  // Handle hint submission
  const handleSubmitHint = async (e) => {
    e.preventDefault()
    if (!hintInput.trim() || hasSubmittedHint()) return
    
    await submitHint(hintInput.trim())
    setHintInput('')
  }
  
  // Handle vote submission
  const handleSubmitVote = async () => {
    if (!selectedVoteTarget || hasVoted()) return
    
    await submitVote(selectedVoteTarget)
    setSelectedVoteTarget(null)
  }
  
  const aliveParticipants = getAliveParticipants()
  const votableParticipants = aliveParticipants.filter(p => p.user_id !== myUserId)
  
  if (isLoading && !room) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading game...</div>
      </div>
    )
  }
  
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="bg-red-500/20 border border-red-500 text-white p-6 rounded-lg">
          <AlertCircle className="w-8 h-8 mb-2" />
          <p>{error}</p>
        </div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white">
      {/* Header */}
      <header className="bg-black/30 backdrop-blur-md border-b border-white/10 p-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">WordTraitor</h1>
            <p className="text-sm text-gray-300">Room: {room?.room_code}</p>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5" />
              <span>{aliveParticipants.length} alive</span>
            </div>
            
            <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="text-2xl font-mono">
                {Math.floor(phaseTimeLeft / 60)}:{String(phaseTimeLeft % 60).padStart(2, '0')}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="max-w-7xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel - Players */}
        <div className="lg:col-span-1">
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="w-6 h-6" />
              Players
            </h2>
            
            <div className="space-y-3">
              {participants.map((participant) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-3 rounded-lg border ${
                    !participant.is_alive 
                      ? 'bg-red-500/20 border-red-500/50 opacity-50' 
                      : participant.user_id === myUserId
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{participant.username}</span>
                    {!participant.is_alive && (
                      <UserX className="w-5 h-5 text-red-400" />
                    )}
                    {participant.user_id === myUserId && (
                      <span className="text-xs bg-green-500 px-2 py-1 rounded">You</span>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
        
        {/* Center Panel - Phase Content */}
        <div className="lg:col-span-2">
          <AnimatePresence mode="wait">
            {phase === 'WHISPER' && (
              <WhisperPhase key="whisper" mySecret={mySecret} />
            )}
            
            {phase === 'HINT_DROP' && (
              <HintDropPhase 
                key="hint-drop"
                hintInput={hintInput}
                setHintInput={setHintInput}
                handleSubmitHint={handleSubmitHint}
                hasSubmittedHint={hasSubmittedHint()}
                hints={hints}
                participants={participants}
              />
            )}
            
            {phase === 'DEBATE' && (
              <DebatePhase 
                key="debate"
                hints={hints}
                participants={participants}
              />
            )}
            
            {phase === 'VERDICT' && (
              <VerdictPhase 
                key="verdict"
                selectedVoteTarget={selectedVoteTarget}
                setSelectedVoteTarget={setSelectedVoteTarget}
                handleSubmitVote={handleSubmitVote}
                hasVoted={hasVoted()}
                votableParticipants={votableParticipants}
                votes={votes}
              />
            )}
            
            {phase === 'REVEAL' && (
              <RevealPhase 
                key="reveal"
                votes={votes}
                participants={participants}
              />
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  )
}

// WHISPER Phase Component
const WhisperPhase = ({ mySecret }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center"
  >
    <Eye className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
    <h2 className="text-3xl font-bold mb-4">Whisper Phase</h2>
    <p className="text-gray-300 mb-8">Memorize your secret word</p>
    
    <div className="bg-gradient-to-r from-purple-500 to-pink-500 p-8 rounded-2xl">
      <p className="text-sm uppercase tracking-wider mb-2 text-purple-200">Your Role</p>
      <p className="text-2xl font-bold mb-4">{mySecret?.role || 'Loading...'}</p>
      
      <p className="text-sm uppercase tracking-wider mb-2 text-purple-200">Your Word</p>
      <p className="text-5xl font-black">{mySecret?.secret_word || '...'}</p>
    </div>
    
    {mySecret?.role === 'TRAITOR' && (
      <div className="mt-6 bg-red-500/20 border border-red-500 p-4 rounded-lg">
        <p className="text-red-200">⚠️ You are the TRAITOR! Give hints for your word without being obvious.</p>
      </div>
    )}
  </motion.div>
)

// HINT_DROP Phase Component
const HintDropPhase = ({ hintInput, setHintInput, handleSubmitHint, hasSubmittedHint, hints, participants }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
  >
    <MessageSquare className="w-12 h-12 mb-4 text-blue-400" />
    <h2 className="text-3xl font-bold mb-4">Hint Drop Phase</h2>
    <p className="text-gray-300 mb-6">Submit a one-word hint about your secret word</p>
    
    {!hasSubmittedHint ? (
      <form onSubmit={handleSubmitHint} className="mb-8">
        <div className="flex gap-3">
          <input
            type="text"
            value={hintInput}
            onChange={(e) => setHintInput(e.target.value)}
            placeholder="Enter your hint..."
            maxLength={20}
            className="flex-1 bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
          <button
            type="submit"
            disabled={!hintInput.trim()}
            className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-lg font-semibold flex items-center gap-2 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            <Send className="w-5 h-5" />
            Submit
          </button>
        </div>
      </form>
    ) : (
      <div className="bg-green-500/20 border border-green-500 p-4 rounded-lg mb-8">
        <p className="text-green-200">✓ Your hint has been submitted! Wait for others...</p>
      </div>
    )}
    
    <div className="space-y-3">
      <h3 className="text-xl font-bold">Submitted Hints ({hints.length})</h3>
      {hints.map((hint) => {
        const participant = participants.find(p => p.user_id === hint.user_id)
        return (
          <motion.div
            key={hint.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 border border-white/10 p-4 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{participant?.username || 'Unknown'}</span>
              <span className="text-2xl font-bold text-purple-300">{hint.hint_text}</span>
            </div>
          </motion.div>
        )
      })}
    </div>
  </motion.div>
)

// DEBATE Phase Component
const DebatePhase = ({ hints, participants }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
  >
    <MessageSquare className="w-12 h-12 mb-4 text-orange-400" />
    <h2 className="text-3xl font-bold mb-4">Debate Phase</h2>
    <p className="text-gray-300 mb-6">Discuss the hints and identify suspicious players</p>
    
    <div className="bg-yellow-500/20 border border-yellow-500 p-4 rounded-lg mb-6">
      <p className="text-yellow-200">💬 Use this time to discuss! Voting starts next.</p>
    </div>
    
    <div className="space-y-3">
      <h3 className="text-xl font-bold">All Hints</h3>
      {hints.map((hint) => {
        const participant = participants.find(p => p.user_id === hint.user_id)
        return (
          <div
            key={hint.id}
            className="bg-white/5 border border-white/10 p-4 rounded-lg"
          >
            <div className="flex justify-between items-center">
              <span className="font-medium">{participant?.username || 'Unknown'}</span>
              <span className="text-2xl font-bold text-purple-300">{hint.hint_text}</span>
            </div>
          </div>
        )
      })}
    </div>
  </motion.div>
)

// VERDICT Phase Component
const VerdictPhase = ({ selectedVoteTarget, setSelectedVoteTarget, handleSubmitVote, hasVoted, votableParticipants, votes }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20"
  >
    <Vote className="w-12 h-12 mb-4 text-red-400" />
    <h2 className="text-3xl font-bold mb-4">Verdict Phase</h2>
    <p className="text-gray-300 mb-6">Vote for who you think is the TRAITOR</p>
    
    {!hasVoted ? (
      <div className="space-y-4 mb-8">
        {votableParticipants.map((participant) => (
          <button
            key={participant.id}
            onClick={() => setSelectedVoteTarget(participant.user_id)}
            className={`w-full p-4 rounded-lg border-2 transition-all ${
              selectedVoteTarget === participant.user_id
                ? 'bg-red-500 border-red-400'
                : 'bg-white/5 border-white/10 hover:bg-white/10'
            }`}
          >
            <span className="font-medium text-lg">{participant.username}</span>
          </button>
        ))}
        
        <button
          onClick={handleSubmitVote}
          disabled={!selectedVoteTarget}
          className="w-full bg-gradient-to-r from-red-500 to-pink-500 px-6 py-4 rounded-lg font-bold text-lg hover:from-red-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          Confirm Vote
        </button>
      </div>
    ) : (
      <div className="bg-green-500/20 border border-green-500 p-4 rounded-lg mb-8">
        <p className="text-green-200">✓ Your vote has been cast! Wait for results...</p>
      </div>
    )}
    
    <div className="bg-white/5 p-4 rounded-lg">
      <p className="text-sm text-gray-300">Votes submitted: {votes.length}/{votableParticipants.length + 1}</p>
    </div>
  </motion.div>
)

// REVEAL Phase Component
const RevealPhase = ({ votes, participants }) => {
  const voteCounts = {}
  votes.forEach(vote => {
    voteCounts[vote.target_id] = (voteCounts[vote.target_id] || 0) + 1
  })
  
  let maxVotes = 0
  let eliminatedId = null
  Object.entries(voteCounts).forEach(([id, count]) => {
    if (count > maxVotes) {
      maxVotes = count
      eliminatedId = id
    }
  })
  
  const eliminatedPlayer = participants.find(p => p.user_id === eliminatedId)
  
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 text-center"
    >
      <AlertCircle className="w-16 h-16 mx-auto mb-4 text-yellow-400" />
      <h2 className="text-3xl font-bold mb-4">Reveal Phase</h2>
      <p className="text-gray-300 mb-8">The votes have been counted...</p>
      
      {eliminatedPlayer ? (
        <div className="bg-red-500/20 border border-red-500 p-8 rounded-2xl">
          <p className="text-xl mb-2">Eliminated:</p>
          <p className="text-4xl font-bold mb-4">{eliminatedPlayer.username}</p>
          <p className="text-lg">Received {maxVotes} vote{maxVotes !== 1 ? 's' : ''}</p>
        </div>
      ) : (
        <div className="bg-yellow-500/20 border border-yellow-500 p-8 rounded-2xl">
          <p className="text-xl">No clear majority - No one eliminated!</p>
        </div>
      )}
      
      <div className="mt-6 space-y-2">
        <h3 className="text-xl font-bold">Vote Results</h3>
        {Object.entries(voteCounts).map(([targetId, count]) => {
          const target = participants.find(p => p.user_id === targetId)
          return (
            <div key={targetId} className="bg-white/5 p-3 rounded-lg flex justify-between">
              <span>{target?.username}</span>
              <span className="font-bold">{count} vote{count !== 1 ? 's' : ''}</span>
            </div>
          )
        })}
      </div>
    </motion.div>
  )
}

export default Game
