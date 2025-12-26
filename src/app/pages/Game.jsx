import React, { useEffect, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { useGameMusic } from '../../hooks/useGameMusic'
import ConnectionIndicator from '../../components/ConnectionIndicator'
import WhisperPhase from '../../components/game/WhisperPhase'
import HintDropPhase from '../../components/game/HintDropPhase'
import DebateVotingPhase from '../../components/game/DebateVotingPhase'
import RevealPhase from '../../components/game/RevealPhase'
import PostRoundPhase from '../../components/game/PostRoundPhase'

const Game = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const isNavigatingRef = useRef(false)
  
  const { 
    room, 
    gamePhase,
    participants,
    mySecret,
    loadRoom,
    isLoading,
    error,
    myUserId,
    getAliveParticipants,
    leaveRoom,
    isConnected,
    subscriptionState
  } = useGameStore()

  // 🎵 Enable music for current game phase
  useGameMusic(gamePhase, true)

  useEffect(() => {
    if (!roomId) {
      navigate('/')
      return
    }

    console.log('🎮 Loading game room:', roomId)
    
    loadRoom(roomId).catch(err => {
      console.error('❌ Error loading game room:', err)
      navigate('/')
    })

    // ✅ FIX: Use pagehide for cleanup
    const handlePageHide = (e) => {
      if (!isNavigatingRef.current && !e.persisted) {
        console.log('👋 Browser/tab closing, cleaning up player...')
        const cleanup = async () => {
          try {
            await leaveRoom()
          } catch (error) {
            console.error('⚠️ Cleanup failed:', error)
          }
        }
        cleanup()
      }
    }

    window.addEventListener('pagehide', handlePageHide)

    return () => {
      console.log('👋 Game component unmounting')
      window.removeEventListener('pagehide', handlePageHide)
    }
  }, [])

  // 🔧 SAFETY NET: Force sync if game is playing but we have no secret
  useEffect(() => {
    if (
      room?.status === 'PLAYING' && 
      gamePhase && 
      !mySecret && 
      participants.length > 0
    ) {
      console.log('🚨 SAFETY NET: Game is PLAYING but no secret! Force syncing...')
      
      const syncWithDelay = async () => {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        try {
          await useGameStore.getState().syncGameStartWithRetry()
          console.log('✅ Safety net sync completed')
        } catch (error) {
          console.error('❌ Safety net sync failed:', error)
        }
      }
      
      syncWithDelay()
    }
  }, [room?.status, gamePhase, mySecret, participants.length])

  // ❌ REMOVED: Old redirect to Results page
  // NEW: POST_ROUND phase is shown inside Game.jsx
  // useEffect(() => {
  //   if (showResults) {
  //     console.log('🏆 Game ended, navigating to results')
  //     isNavigatingRef.current = true
  //     navigate(`/results/${roomId}`)
  //   }
  // }, [showResults, roomId])

  const handleLeave = async () => {
    if (confirm('Are you sure you want to leave the game?')) {
      console.log('🚺 Manually leaving game')
      isNavigatingRef.current = true
      await leaveRoom()
      navigate('/')
    }
  }

  // ✅ UPDATED: Render phases including POST_ROUND (game end)
  const renderPhase = () => {
    switch (gamePhase) {
      case 'WHISPER':
        return <WhisperPhase />
      case 'HINT_DROP':
        return <HintDropPhase />
      case 'DEBATE_VOTING':
        return <DebateVotingPhase />
      case 'REVEAL':
        return <RevealPhase />
      case 'POST_ROUND': // ✅ NEW: Game end screen (replaces Results page)
        return <PostRoundPhase />
      default:
        return (
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center">
              <div className="text-6xl mb-4 animate-pulse">⌛</div>
              <p className="text-xl text-gray-400">Waiting for game to start...</p>
              <p className="text-sm text-gray-500 mt-2">Current phase: {gamePhase || 'None'}</p>
            </div>
          </div>
        )
    }
  }

  const alivePlayers = getAliveParticipants()

  if (isLoading && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-2xl text-purple-400 animate-pulse">Loading game...</div>
      </div>
    )
  }

  if (error && !room) {
    return (
      <div className="min-h-screen flex items-center justify-center">
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
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900" data-testid="game-container">
      {/* Top Bar - ✅ Hide on POST_ROUND */}
      {gamePhase !== 'POST_ROUND' && (
        <div className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 sticky top-0 z-50">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            {/* Left: Room Info */}
            <div className="flex items-center gap-4">
              <div>
                <p className="text-sm text-gray-400">Room Code</p>
                <p className="text-xl font-bold text-white" data-testid="game-room-code">{room?.room_code}</p>
              </div>
              {gamePhase && (
                <div className="px-4 py-2 bg-purple-500/20 border border-purple-500 rounded-lg" data-testid="game-phase-indicator">
                  <p className="text-sm text-purple-400 font-semibold uppercase">
                    {gamePhase.replace('_', ' ')}
                  </p>
                </div>
              )}
              <ConnectionIndicator 
                isConnected={isConnected} 
                subscriptionState={subscriptionState}
                showLabel={false}
                className="ml-2"
              />
            </div>

            {/* Center: Players Alive */}
            <div className="hidden md:flex items-center gap-2" data-testid="players-alive-counter">
              <span className="text-gray-400">👥</span>
              <span className="text-white font-semibold">
                {alivePlayers.length}/{participants.length} alive
              </span>
            </div>

            {/* Right: Leave Button */}
            <button
              onClick={handleLeave}
              data-testid="leave-game-button"
              className="px-4 py-2 bg-red-600/20 hover:bg-red-600/30 border border-red-500 rounded-lg text-red-400 font-semibold transition-colors"
            >
              🚺 Leave
            </button>
          </div>
        </div>
      )}

      {/* Main Game Area */}
      <div className="py-8" data-testid="game-phase-content">
        <AnimatePresence mode="wait">
          <motion.div
            key={gamePhase}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {renderPhase()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Players Sidebar - Mobile - ✅ Hide on POST_ROUND */}
      {gamePhase !== 'POST_ROUND' && (
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900/90 backdrop-blur-sm border-t border-gray-800 p-4">
          <div className="flex items-center justify-center gap-2 text-sm">
            <span className="text-gray-400">👥 Players:</span>
            <span className="text-white font-semibold">
              {alivePlayers.length}/{participants.length} alive
            </span>
            <ConnectionIndicator 
              isConnected={isConnected} 
              subscriptionState={subscriptionState}
              showLabel={false}
              className="ml-2"
            />
          </div>
        </div>
      )}
    </div>
  )
}

export default Game