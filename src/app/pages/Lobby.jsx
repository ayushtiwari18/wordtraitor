import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { Copy, Check, Users, Settings, Bot } from 'lucide-react'

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
    isConnected,
    isTestMode
  } = useGameStore()

  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)

  useEffect(() => {
    if (roomId && !isTestMode) {
      loadRoom(roomId).catch(err => {
        console.error('Error loading room:', err)
        navigate('/')
      })
    }

    // Cleanup on unmount
    return () => {
      if (room?.status === 'LOBBY') {
        leaveRoom()
      }
    }
  }, [roomId])

  // Navigate to game when started
  useEffect(() => {
    if (room?.status === 'PLAYING') {
      navigate(`/game/${roomId}`)
    }
  }, [room?.status, roomId])

  const handleCopyCode = () => {
    if (room?.room_code) {
      navigator.clipboard.writeText(room.room_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleStartGame = async () => {
    if (!isTestMode && participants.length < 3) {
      alert('Need at least 3 players to start!')
      return
    }

    setIsStarting(true)
    try {
      await startGame()
      // Navigation will happen automatically via useEffect above
    } catch (error) {
      console.error('Error starting game:', error)
      alert('Failed to start game: ' + error.message)
      setIsStarting(false)
    }
  }

  const handleLeave = async () => {
    await leaveRoom()
    navigate('/')
  }

  if (isLoading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-2xl text-purple-400 animate-pulse">Loading lobby...</div>
      </div>
    )
  }

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Test Mode Banner */}
        {isTestMode && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 bg-gradient-to-r from-green-500/30 to-emerald-500/30 border-2 border-green-500 rounded-xl p-4"
          >
            <div className="flex items-center justify-center gap-3">
              <Bot className="w-6 h-6 text-green-400 animate-pulse" />
              <div className="text-center">
                <p className="text-green-400 font-bold text-lg">TEST MODE ACTIVE</p>
                <p className="text-green-300 text-sm">Playing with 4 AI Bots • No database needed</p>
              </div>
              <Bot className="w-6 h-6 text-green-400 animate-pulse" />
            </div>
          </motion.div>
        )}

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl font-bold text-white mb-2">
            {isTestMode ? '🤖 Test Lobby' : '🎮 Game Lobby'}
          </h1>
          <p className="text-gray-400">
            {isTestMode ? 'Practice with AI bots' : 'Waiting for players to join...'}
          </p>
          
          {/* Connection Status */}
          {!isTestMode && (
            <div className="mt-4 flex items-center justify-center gap-2">
              <div className={`w-2 h-2 rounded-full ${
                isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
              }`} />
              <span className="text-sm text-gray-400">
                {isConnected ? 'Connected' : 'Connecting...'}
              </span>
            </div>
          )}
        </motion.div>

        {/* Room Code Card */}
        {!isTestMode && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gray-800 border-2 border-purple-500 rounded-2xl p-8 mb-8 text-center"
          >
            <p className="text-gray-400 mb-3">Share this code with your friends:</p>
            <div className="flex items-center justify-center gap-4">
              <div className="text-5xl font-bold text-white tracking-widest">
                {room?.room_code}
              </div>
              <button
                onClick={handleCopyCode}
                className="p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
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
        )}

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
              {participants.map((player, index) => {
                const isBot = player.username?.startsWith('Bot ')
                return (
                  <motion.div
                    key={player.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                    className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                      player.user_id === myUserId
                        ? 'bg-purple-500/10 border-purple-500'
                        : isBot
                        ? 'bg-green-500/10 border-green-700'
                        : 'bg-gray-900 border-gray-700'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold ${
                        isBot ? 'bg-green-500/20' : 'bg-purple-500/20'
                      }`}>
                        {isBot ? '🤖' : (player.username?.charAt(0).toUpperCase() || '?')}
                      </div>
                      <div>
                        <p className="text-white font-semibold">
                          {player.username || `Player ${player.user_id.slice(0, 6)}`}
                        </p>
                        {player.user_id === room?.host_id && (
                          <p className="text-yellow-400 text-xs font-semibold">👑 Host</p>
                        )}
                        {isBot && (
                          <p className="text-green-400 text-xs font-semibold">AI Bot</p>
                        )}
                      </div>
                    </div>
                    {player.user_id === myUserId && (
                      <div className="text-sm text-purple-400 font-semibold">You</div>
                    )}
                  </motion.div>
                )
              })}
            </AnimatePresence>
          </div>

          {/* Waiting for Players */}
          {!isTestMode && participants.length < 3 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-center"
            >
              <p className="text-yellow-400 font-semibold">
                ⚠️ Need at least 3 players to start
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Waiting for {3 - participants.length} more player(s)...
              </p>
            </motion.div>
          )}

          {/* Test Mode Ready */}
          {isTestMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-6 p-4 bg-green-500/10 border border-green-500 rounded-lg text-center"
            >
              <p className="text-green-400 font-semibold">
                ✅ Ready to test! All bots loaded.
              </p>
              <p className="text-gray-400 text-sm mt-1">
                Bots will auto-submit hints and votes
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
              disabled={(!isTestMode && participants.length < 3) || isStarting}
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
          {isTestMode ? (
            <p>🤖 Test mode: Bots will automatically play after you. Check console (F12) for logs!</p>
          ) : (
            <p>💡 Share the room code with friends so they can join!</p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

export default Lobby