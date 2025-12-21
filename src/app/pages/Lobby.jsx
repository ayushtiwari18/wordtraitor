import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { Copy, Check, Users, Settings } from 'lucide-react'

const Lobby = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const { 
    room, 
    participants,
    isHost,
    myUserId,
    loadRoom,
    startGame,
    leaveRoom,
    isLoading,
    error,
    isConnected
  } = useGameStore()

  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [hasLoaded, setHasLoaded] = useState(false)

  // Load room data once on mount
  useEffect(() => {
    console.log('🏠 Lobby mounted with roomId:', roomId)
    
    // Safety check
    if (!roomId) {
      console.error('❌ No roomId provided! Redirecting to home...')
      navigate('/')
      return
    }

    // Prevent duplicate loading
    if (hasLoaded) {
      console.log('⏭️ Room already loaded, skipping...')
      return
    }
    
    console.log('📡 Loading room data for:', roomId)
    setHasLoaded(true)
    
    loadRoom(roomId)
      .then(() => {
        console.log('✅ Room loaded successfully')
      })
      .catch(err => {
        console.error('❌ Error loading room:', err)
        navigate('/')
      })

    // Cleanup function
    return () => {
      console.log('👋 Lobby unmounting...')
      // Only leave if still in LOBBY status (not if game started)
      if (room?.status === 'LOBBY') {
        console.log('🚪 Leaving lobby...')
        leaveRoom()
      }
    }
  }, []) // Empty dependency - only run once on mount

  // Navigate to game when started
  useEffect(() => {
    if (room?.status === 'PLAYING') {
      console.log('🎮 Game started! Navigating to game page...')
      navigate(`/game/${roomId}`)
    }
  }, [room?.status])

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStartGame = async () => {
    console.log('🚀 Starting game with', participants.length, 'players')
    
    if (participants.length < 2) {
      alert('Need at least 2 players to start!')
      return
    }

    setIsStarting(true)
    try {
      await startGame()
      console.log('✅ Game start request sent')
    } catch (error) {
      console.error('❌ Error starting game:', error)
      alert('Failed to start game: ' + error.message)
      setIsStarting(false)
    }
  }

  const handleLeave = async () => {
    console.log('👋 Leaving room...')
    await leaveRoom()
    navigate('/')
  }

  // Loading state
  if (isLoading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-2xl text-purple-400 animate-pulse">Loading lobby...</div>
      </div>
    )
  }

  // Error state
  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  // Show debug info if no room loaded
  if (!room && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-yellow-400 mb-4">Room not found</p>
          <p className="text-gray-400 mb-4">Room ID: {roomId || 'undefined'}</p>
          <button
            onClick={() => navigate('/')}
            className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold"
          >
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Game Lobby</h1>
          <p className="text-gray-400">Waiting for players to join...</p>
          
          {/* Connection Status */}
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
            }`} />
            <span className="text-sm text-gray-400">
              {isConnected ? 'Connected' : 'Connecting...'}
            </span>
          </div>
        </motion.div>

        {/* Room Code Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-gray-800 border-2 border-purple-500 rounded-2xl p-8 mb-8 text-center"
        >
          <p className="text-gray-400 mb-3">Share this code with your friends:</p>
          <div className="flex items-center justify-center gap-4">
            <div className="text-5xl font-bold text-white tracking-widest">
              {room?.room_code || '------'}
            </div>
            <button
              onClick={handleCopyCode}
              disabled={!room?.room_code}
              className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg transition-colors"
              title="Copy code"
            >
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
          {copied && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-green-400 text-sm mt-3"
            >
              ✓ Copied to clipboard!
            </motion.p>
          )}
        </motion.div>

        {/* Game Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Game Settings</h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Game Mode</p>
              <p className="text-white font-semibold">{room?.game_mode || 'SILENT'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Difficulty</p>
              <p className="text-white font-semibold">{room?.difficulty || 'MEDIUM'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Word Pack</p>
              <p className="text-white font-semibold">{room?.word_pack || 'GENERAL'}</p>
            </div>
          </div>
        </motion.div>

        {/* Players List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Players</h3>
            </div>
            <div className="text-sm text-gray-400">
              {participants.length}/{room?.max_players || 8}
            </div>
          </div>
          
          <div className="space-y-3">
            <AnimatePresence>
              {participants.map((player, index) => (
                <motion.div
                  key={player.user_id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.1 }}
                  className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                    player.user_id === myUserId
                      ? 'bg-purple-500/10 border-purple-500'
                      : 'bg-gray-900 border-gray-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-lg font-bold">
                      {player.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {player.username || `Player ${player.user_id.slice(0, 6)}`}
                      </p>
                      {player.user_id === room?.host_id && (
                        <p className="text-yellow-400 text-xs font-semibold">👑 Host</p>
                      )}
                    </div>
                  </div>
                  {player.user_id === myUserId && (
                    <div className="text-sm text-purple-400 font-semibold">You</div>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Waiting for Players */}
          {participants.length < 2 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-center"
            >
              <p className="text-yellow-400 font-semibold">
                ⚠️ Need at least 2 players to start
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Waiting for {2 - participants.length} more player(s)...
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex gap-4"
        >
          {isHost ? (
            <button
              onClick={handleStartGame}
              disabled={participants.length < 2 || isStarting}
              className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-colors shadow-lg"
            >
              {isStarting ? 'Starting...' : '🚀 Start Game'}
            </button>
          ) : (
            <div className="flex-1 py-4 bg-gray-700 rounded-xl font-bold text-gray-400 text-lg text-center">
              ⏳ Waiting for host to start...
            </div>
          )}
          
          <button
            onClick={handleLeave}
            className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white transition-colors"
          >
            🚪 Leave
          </button>
        </motion.div>

        {/* Instructions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-8 text-center text-gray-400 text-sm"
        >
          <p>💡 Share the room code with a friend to test multiplayer!</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Lobby