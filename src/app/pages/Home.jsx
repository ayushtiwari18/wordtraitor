import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { Play, Users, Sparkles } from 'lucide-react'

const Home = () => {
  const navigate = useNavigate()
  const { createRoom, joinRoom, initializeGuest } = useGameStore()

  const [showJoinModal, setShowJoinModal] = useState(false)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [isJoining, setIsJoining] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [error, setError] = useState('')

  // Create room settings
  const [gameMode, setGameMode] = useState('SILENT')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [wordPack, setWordPack] = useState('GENERAL')

  const handleJoinRoom = async (e) => {
    e.preventDefault()
    setError('')
    
    if (!roomCode.trim()) {
      setError('Please enter a room code')
      return
    }

    setIsJoining(true)
    try {
      const room = await joinRoom(roomCode.toUpperCase())
      navigate(`/lobby/${room.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsJoining(false)
    }
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    setError('')
    setIsCreating(true)

    try {
      const room = await createRoom(gameMode, difficulty, wordPack)
      navigate(`/lobby/${room.id}`)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsCreating(false)
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
            A social deduction word game for 3-8 players
          </p>
        </motion.div>

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Room */}
          <motion.button
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

          {/* Join Room */}
          <motion.button
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
      {showJoinModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Join Room</h2>
            <form onSubmit={handleJoinRoom}>
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Room Code</label>
                <input
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
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
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
                  type="submit"
                  disabled={isJoining || !roomCode.trim()}
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                >
                  {isJoining ? 'Joining...' : 'Join Game'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 max-w-md w-full max-h-[90vh] overflow-y-auto"
          >
            <h2 className="text-2xl font-bold text-white mb-6">Create Room</h2>
            <form onSubmit={handleCreateRoom}>
              {/* Game Mode */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Game Mode</label>
                <select
                  value={gameMode}
                  onChange={(e) => setGameMode(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="SILENT">Silent Mode (No voice chat)</option>
                  <option value="REAL">Real Mode (With voice chat)</option>
                </select>
              </div>

              {/* Difficulty */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Difficulty</label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-purple-500"
                >
                  <option value="EASY">Easy (Similar words)</option>
                  <option value="MEDIUM">Medium (Moderate difference)</option>
                  <option value="HARD">Hard (Very different words)</option>
                </select>
              </div>

              {/* Word Pack */}
              <div className="mb-6">
                <label className="block text-gray-300 mb-2">Word Pack</label>
                <select
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

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false)
                    setError('')
                  }}
                  className="flex-1 py-3 bg-gray-700 hover:bg-gray-600 rounded-lg font-semibold text-white transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreating}
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
                >
                  {isCreating ? 'Creating...' : 'Create Room'}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  )
}

export default Home