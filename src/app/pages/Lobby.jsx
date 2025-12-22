import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { Copy, Check, Users, Settings, ChevronDown, ChevronUp, Clock } from 'lucide-react'

const Lobby = () => {
  const params = useParams()
  const navigate = useNavigate()
  
  // Extract roomId from params OR pathname
  const roomId = params.roomId || params.roomCode || window.location.pathname.split('/')[2]
  
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
    customTimings,
    traitorCount
  } = useGameStore()

  const [copied, setCopied] = useState(false)
  const [isStarting, setIsStarting] = useState(false)
  const [showAdvanced, setShowAdvanced] = useState(false)

  // Load room data ONCE on mount
  useEffect(() => {
    console.log('🏠 Lobby mounted with roomId:', roomId)
    
    if (!roomId || roomId === 'undefined') {
      console.error('❌ Invalid roomId, redirecting home')
      navigate('/')
      return
    }

    loadRoom(roomId)
      .then(() => console.log('✅ Room loaded'))
      .catch(err => {
        console.error('❌ Load error:', err)
        navigate('/')
      })

    return () => {
      console.log('👋 Lobby unmounting (no auto leave)')
      // IMPORTANT: no leaveRoom() here at all
    }
  }, []) // keep dependency array empty

  // Navigate when game starts
  useEffect(() => {
    if (room?.status === 'PLAYING') {
      console.log('🎮 Navigating to game')
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
    if (participants.length < 2) {
      alert('Need at least 2 players!')
      return
    }

    setIsStarting(true)
    try {
      await startGame()
    } catch (error) {
      console.error('❌ Start error:', error)
      alert('Failed: ' + error.message)
      setIsStarting(false)
    }
  }

  const handleLeave = async () => {
    await leaveRoom()
    navigate('/')
  }

  const hasCustomSettings = customTimings !== null || traitorCount > 1

  if (isLoading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-2xl text-purple-400 animate-pulse">Loading...</div>
      </div>
    )
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">❌</div>
          <p className="text-xl text-red-400 mb-4">{error}</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  if (!room && !isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <p className="text-xl text-yellow-400 mb-4">Room not found</p>
          <button onClick={() => navigate('/')} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg font-semibold">
            Go Home
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">🎮 Game Lobby</h1>
          <p className="text-gray-400">Waiting for players...</p>
          <div className="mt-4 flex items-center justify-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
            <span className="text-sm text-gray-400">{isConnected ? 'Connected' : 'Connecting...'}</span>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="bg-gray-800 border-2 border-purple-500 rounded-2xl p-8 mb-8 text-center">
          <p className="text-gray-400 mb-3">Share this code:</p>
          <div className="flex items-center justify-center gap-4">
            <div data-testid="room-code" className="text-5xl font-bold text-white tracking-widest">{room?.room_code || '------'}</div>
            <button onClick={handleCopyCode} disabled={!room?.room_code} className="p-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 rounded-lg transition-colors">
              {copied ? <Check className="w-6 h-6" /> : <Copy className="w-6 h-6" />}
            </button>
          </div>
          {copied && <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-400 text-sm mt-3">✓ Copied!</motion.p>}
        </motion.div>

        {/* Basic Settings */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-4">
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-purple-400" />
            <h3 className="text-xl font-bold text-white">Game Settings</h3>
            {hasCustomSettings && (
              <span className="ml-auto px-2 py-1 bg-purple-500/20 border border-purple-500 rounded text-xs text-purple-400 font-semibold">
                ⚙️ Custom
              </span>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Mode</p>
              <p data-testid="game-mode" className="text-white font-semibold">{room?.game_mode || 'SILENT'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Difficulty</p>
              <p data-testid="difficulty" className="text-white font-semibold">{room?.difficulty || 'MEDIUM'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Word Pack</p>
              <p data-testid="word-pack" className="text-white font-semibold">{room?.word_pack || 'GENERAL'}</p>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-gray-400 text-sm mb-1">Traitors</p>
              <p className="text-white font-semibold flex items-center gap-1">
                {traitorCount}
                {traitorCount > 1 && <span className="text-xs text-purple-400">✨</span>}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Advanced Settings (Collapsible) */}
        {hasCustomSettings && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }} 
            transition={{ delay: 0.25 }}
            className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-8"
          >
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full flex items-center justify-between text-white hover:text-purple-400 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                <span className="font-semibold">Phase Timings</span>
              </div>
              {showAdvanced ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
            </button>
            
            <AnimatePresence>
              {showAdvanced && customTimings && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="overflow-hidden"
                >
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-4 pt-4 border-t border-gray-700">
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Whisper Phase</p>
                      <p className="text-white font-semibold">{customTimings.WHISPER || 30}s</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Hint Drop</p>
                      <p className="text-white font-semibold">{customTimings.HINT_DROP || 60}s</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Debate</p>
                      <p className="text-white font-semibold">{customTimings.DEBATE || 120}s</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Verdict</p>
                      <p className="text-white font-semibold">{customTimings.VERDICT || 45}s</p>
                    </div>
                    <div className="bg-gray-900 rounded-lg p-3">
                      <p className="text-gray-400 text-xs mb-1">Reveal</p>
                      <p className="text-white font-semibold">{customTimings.REVEAL || 15}s</p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Players */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-5 h-5 text-purple-400" />
              <h3 className="text-xl font-bold text-white">Players</h3>
            </div>
            <div className="text-sm text-gray-400">{participants.length}/{room?.max_players || 8}</div>
          </div>
          
          <div data-testid="participants-list" className="space-y-3">
            <AnimatePresence>
              {participants.filter(p => p && p.user_id).map((player, index) => (
                <motion.div 
                  key={player.user_id} 
                  data-testid="participant-item"
                  initial={{ opacity: 0, x: -20 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  exit={{ opacity: 0, x: 20 }} 
                  transition={{ delay: index * 0.1 }} 
                  className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                    player.user_id === myUserId ? 'bg-purple-500/10 border-purple-500' : 'bg-gray-900 border-gray-700'}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-purple-500/20 rounded-full flex items-center justify-center text-lg font-bold">
                      {player.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">{player.username || `Player ${player.user_id.slice(0, 6)}`}</p>
                      {player.user_id === room?.host_id && <p data-testid="is-host" className="text-yellow-400 text-xs font-semibold">👑 Host</p>}
                    </div>
                  </div>
                  {player.user_id === myUserId && <div className="text-sm text-purple-400 font-semibold">You</div>}
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {participants.length < 2 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 p-4 bg-yellow-500/10 border border-yellow-500 rounded-lg text-center">
              <p className="text-yellow-400 font-semibold">⚠️ Need at least 2 players</p>
              <p className="text-gray-400 text-sm mt-1">Waiting for {2 - participants.length} more...</p>
            </motion.div>
          )}
        </motion.div>

        {/* Action Buttons */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="flex gap-4">
          {isHost ? (
            <button 
              data-testid="start-game-button"
              onClick={handleStartGame} 
              disabled={participants.length < 2 || isStarting} 
              className="flex-1 py-4 bg-green-600 hover:bg-green-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-xl font-bold text-white text-lg transition-colors shadow-lg">
              {isStarting ? 'Starting...' : '🚀 Start Game'}
            </button>
          ) : (
            <div className="flex-1 py-4 bg-gray-700 rounded-xl font-bold text-gray-400 text-lg text-center">⏳ Waiting for host...</div>
          )}
          <button onClick={handleLeave} className="px-6 py-4 bg-red-600 hover:bg-red-700 rounded-xl font-bold text-white transition-colors">🚺 Leave</button>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-8 text-center text-gray-400 text-sm">
          <p>💡 Share the code with friends to start playing!</p>
        </motion.div>
      </div>
    </div>
  )
}

export default Lobby