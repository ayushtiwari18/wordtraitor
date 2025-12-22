import React, { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { Play, Users, Sparkles, Settings, ChevronDown, ChevronUp } from 'lucide-react'

const Home = () => {
  const navigate = useNavigate()
  const { createRoom, joinRoom } = useGameStore()
  const isMountedRef = useRef(true)

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // Basic settings
  const [gameMode, setGameMode] = useState('SILENT')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [wordPack, setWordPack] = useState('GENERAL')
  
  // Advanced settings
  const [traitorCount, setTraitorCount] = useState(1)
  const [whisperTime, setWhisperTime] = useState(30)
  const [hintDropTime, setHintDropTime] = useState(60)
  const [debateTime, setDebateTime] = useState(120)
  const [verdictTime, setVerdictTime] = useState(45)
  const [revealTime, setRevealTime] = useState(15)

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false
    }
  }, [])

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsJoining(true)
    try {
      console.log('🚪 Joining room with code:', roomCode)
      const room = await joinRoom(roomCode.toUpperCase())
      console.log('✅ Room joined:', room.id)
      
      if (!isMountedRef.current) return
      
      // Close modal and clear state
      setShowJoinModal(false)
      setRoomCode('')
      setError('')
      setIsJoining(false)
      
      // Small delay to ensure modal unmounts
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log('🚀 Navigating to:', `/lobby/${room.id}`)
          navigate(`/lobby/${room.id}`)
        }
      }, 50)
    } catch (err) {
      console.error('❌ Join error:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Failed to join room')
        setIsJoining(false)
      }
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setError('')
    setIsCreating(true)

    try {
      const customSettings = {
        traitorCount,
        timings: {
          WHISPER: whisperTime,
          HINT_DROP: hintDropTime,
          DEBATE: debateTime,
          VERDICT: verdictTime,
          REVEAL: revealTime
        }
      }
      
      console.log('🏠 Creating room with:', { gameMode, difficulty, wordPack, customSettings })
      const room = await createRoom(gameMode, difficulty, wordPack, customSettings)
      console.log('✅ Room created:', room)
      
      if (!room || !room.id) {
        throw new Error('Room creation failed - no room ID returned')
      }
      
      console.log('🎯 Room ID:', room.id)
      
      if (!isMountedRef.current) return
      
      // Close modal and clear state
      setShowCreateModal(false)
      setError('')
      setShowAdvanced(false)
      setIsCreating(false)
      
      // Small delay to ensure modal unmounts
      setTimeout(() => {
        if (isMountedRef.current) {
          console.log('🚀 Navigating to:', `/lobby/${room.id}`)
          navigate(`/lobby/${room.id}`)
        }
      }, 50)
      
    } catch (err) {
      console.error('❌ Create error:', err)
      if (isMountedRef.current) {
        setError(err.message || 'Failed to create room')
        setIsCreating(false)
      }
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 flex items-center justify-center px-4">
      <div className="max-w-4xl w-full">
        {/* Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <motion.div
            animate={{ 
              scale: [1, 1.1, 1],
              rotate: [0, 5, -5, 0]
            }}
            transition={{ 
              duration: 3,
              repeat: Infinity,
              repeatDelay: 2
            }}
            className="text-8xl mb-6"
          >
            🕵️
          </motion.div>
          <h1 className="text-6xl font-bold text-white mb-4">
            Word<span className="text-red-500">Traitor</span>
          </h1>
          <p className="text-xl text-gray-300 mb-2">
            Find the traitor before it's too late!
          </p>
          <p className="text-gray-400">
            A social deduction word game for 2-8 players
          </p>
        </motion.div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          <motion.button
            data-testid="create-room-button"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            onClick={() => setShowCreateModal(true)}
            className="group relative bg-gradient-to-br from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Sparkles className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Create Room</h3>
            <p className="text-purple-100">Start a new game with friends</p>
          </motion.button>

          <motion.button
            data-testid="join-room-button"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => setShowJoinModal(true)}
            className="group relative bg-gradient-to-br from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 rounded-2xl p-8 transition-all duration-300 hover:scale-105 hover:shadow-2xl"
          >
            <div className="absolute inset-0 bg-white/10 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity" />
            <Users className="w-12 h-12 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">Join Room</h3>
            <p className="text-blue-100">Enter a room code to join</p>
          </motion.button>
        </div>

        {/* How to Play */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-gray-800/50 backdrop-blur-sm border border-gray-700 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">🎯 How to Play</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">📝</div>
              <h4 className="text-white font-semibold mb-2">1. Get Your Word</h4>
              <p className="text-gray-400 text-sm">
                Each citizen gets the same word, but the traitor gets a different one
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <h4 className="text-white font-semibold mb-2">2. Give Hints</h4>
              <p className="text-gray-400 text-sm">
                Submit hints about your word without revealing it directly
              </p>
            </div>
            <div className="text-center">
              <div className="text-4xl mb-3">⚖️</div>
              <h4 className="text-white font-semibold mb-2">3. Find the Traitor</h4>
              <p className="text-gray-400 text-sm">
                Vote to eliminate the player you think is the traitor
              </p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Join Room Modal */}
      <AnimatePresence mode="wait">
        {showJoinModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Join Room</h2>
              <form onSubmit={handleJoinRoom}>
                <div className="mb-6">
                  <label className="block text-gray-300 mb-2">Room Code</label>
                  <input
                    data-testid="room-code-input"
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-center text-2xl font-bold tracking-widest focus:outline-none focus:border-purple-500"
                    autoFocus
                  />
                </div>
                {error && (
                  <div data-testid="error-message" className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowJoinModal(false)
                      setRoomCode('')
                      setError('')
                    }}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="join-button"
                    type="submit"
                    disabled={isJoining || !roomCode.trim()}
                    className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                  >
                    {isJoining ? 'Joining...' : 'Join Game'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Room Modal */}
      <AnimatePresence mode="wait">
        {showCreateModal && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
            >
              <h2 className="text-2xl font-bold text-white mb-6">Create Room</h2>
              <form onSubmit={handleCreateRoom}>
                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Game Mode</label>
                  <select
                    data-testid="game-mode-selector"
                    value={gameMode}
                    onChange={(e) => setGameMode(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="SILENT">Silent Mode (Text chat + hints)</option>
                    <option value="REAL">Real Mode (Voice chat)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Difficulty</label>
                  <select
                    data-testid="difficulty-selector"
                    value={difficulty}
                    onChange={(e) => setDifficulty(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="EASY">Easy (Similar words)</option>
                    <option value="MEDIUM">Medium (Moderate difference)</option>
                    <option value="HARD">Hard (Very different words)</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-gray-300 mb-2">Word Pack</label>
                  <select
                    data-testid="wordpack-selector"
                    value={wordPack}
                    onChange={(e) => setWordPack(e.target.value)}
                    className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                  >
                    <option value="GENERAL">General</option>
                    <option value="MOVIES">Movies</option>
                    <option value="TECH">Technology</option>
                    <option value="FOOD">Food</option>
                    <option value="NATURE">Nature</option>
                    <option value="SPORTS">Sports</option>
                  </select>
                </div>

                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="w-full mb-4 p-3 bg-gray-900 border border-gray-700 hover:border-purple-500 rounded-lg text-white flex items-center justify-between transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Settings className="w-4 h-4" />
                    Advanced Settings
                  </span>
                  {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden"
                    >
                      <div className="bg-gray-900 border border-gray-700 rounded-lg p-4 mb-4 space-y-4">
                        <div>
                          <label className="block text-gray-300 mb-2 text-sm">
                            Number of Traitors (1-3)
                          </label>
                          <input
                            type="number"
                            min="1"
                            max="3"
                            value={traitorCount}
                            onChange={(e) => setTraitorCount(parseInt(e.target.value) || 1)}
                            className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2 text-white focus:outline-none focus:border-purple-500"
                          />
                        </div>

                        <div>
                          <p className="text-gray-300 text-sm font-semibold mb-2">Phase Timings (seconds)</p>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <label className="text-gray-400 text-xs">Whisper Phase</label>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                value={whisperTime}
                                onChange={(e) => setWhisperTime(parseInt(e.target.value) || 30)}
                                className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-gray-400 text-xs">Hint Drop Phase</label>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                value={hintDropTime}
                                onChange={(e) => setHintDropTime(parseInt(e.target.value) || 60)}
                                className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-gray-400 text-xs">Debate Phase</label>
                              <input
                                type="number"
                                min="10"
                                max="600"
                                value={debateTime}
                                onChange={(e) => setDebateTime(parseInt(e.target.value) || 120)}
                                className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-gray-400 text-xs">Verdict Phase</label>
                              <input
                                type="number"
                                min="10"
                                max="300"
                                value={verdictTime}
                                onChange={(e) => setVerdictTime(parseInt(e.target.value) || 45)}
                                className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                            
                            <div className="flex items-center justify-between">
                              <label className="text-gray-400 text-xs">Reveal Phase</label>
                              <input
                                type="number"
                                min="5"
                                max="60"
                                value={revealTime}
                                onChange={(e) => setRevealTime(parseInt(e.target.value) || 15)}
                                className="w-20 bg-gray-800 border border-gray-700 rounded px-2 py-1 text-white text-sm focus:outline-none focus:border-purple-500"
                              />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <div data-testid="error-message" className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                    {error}
                  </div>
                )}

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateModal(false)
                      setError('')
                      setShowAdvanced(false)
                    }}
                    disabled={isCreating}
                    className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    data-testid="create-submit-button"
                    type="submit"
                    disabled={isCreating}
                    className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                  >
                    {isCreating ? 'Creating...' : 'Create Room'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home