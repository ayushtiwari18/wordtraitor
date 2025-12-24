import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import SpinningWheel from '../SpinningWheel'

const HintDropPhase = () => {
  // 🔧 CYCLE 4 FIX: Granular Zustand selectors (only re-render when specific data changes)
  const hints = useGameStore(state => state.hints)
  const participants = useGameStore(state => state.participants)
  const room = useGameStore(state => state.room)
  const myUserId = useGameStore(state => state.myUserId)
  const phaseTimer = useGameStore(state => state.phaseTimer)
  const isHost = useGameStore(state => state.isHost)
  const turnOrder = useGameStore(state => state.turnOrder)
  
  // Function selectors (these don't cause re-renders)
  const submitHint = useGameStore(state => state.submitHint)
  const submitRealModeNext = useGameStore(state => state.submitRealModeNext)
  const loadHints = useGameStore(state => state.loadHints)
  const getAliveParticipants = useGameStore(state => state.getAliveParticipants)
  
  const [hintText, setHintText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [hasSubmitted, setHasSubmitted] = useState(false)
  const [isSpinning, setIsSpinning] = useState(false)
  const [completedPlayerIds, setCompletedPlayerIds] = useState([])
  const [currentSpeaker, setCurrentSpeaker] = useState(null)
  const [currentPlayer, setCurrentPlayer] = useState(null)  // ✅ BUG FIX #7: Local state instead of derived

  // Load hints when component mounts (critical for REAL mode sync)
  useEffect(() => {
    console.log('💡 HintDropPhase mounted, loading hints...')
    loadHints()
  }, [loadHints])

  // 🔧 CYCLE 3 FIX: Validate turnOrder in separate useEffect (not during render)
  useEffect(() => {
    const { gamePhase, syncGameStartWithRetry } = useGameStore.getState()
    
    if (gamePhase === 'HINT_DROP' && (!turnOrder || turnOrder.length === 0)) {
      console.log('⚠️ Turn order empty in HINT_DROP, auto-syncing...')
      
      ;(async () => {
        try {
          await syncGameStartWithRetry()
          console.log('✅ Turn order sync completed')
        } catch (error) {
          console.error('❌ Turn order sync failed:', error)
        }
      })()
    }
  }, [turnOrder])

  // ✅ BUG FIX #7: Move getCurrentTurnPlayer to useEffect (no setState during render)
  useEffect(() => {
    if (!turnOrder || turnOrder.length === 0) {
      setCurrentPlayer(null)
      return
    }
    
    const currentTurnIndex = hints.length % turnOrder.length
    const currentUserId = turnOrder[currentTurnIndex]
    const player = participants.find(p => p.user_id === currentUserId)
    setCurrentPlayer(player || null)
  }, [turnOrder, hints.length, participants])

  useEffect(() => {
    const myHint = hints.find(h => h.user_id === myUserId)
    setHasSubmitted(!!myHint)
  }, [hints, myUserId])

  // ✅ BUG FIX #2: Sync completedPlayerIds from hints (for REAL mode persistence & Player 2 sync)
  useEffect(() => {
    if (room?.game_mode === 'REAL') {
      // Extract user IDs who have submitted [VERBAL] hints
      const completed = hints.map(h => h.user_id)
      setCompletedPlayerIds(completed)
      console.log(`🔄 REAL mode: ${completed.length} players have completed turns`)
    }
  }, [hints, room?.game_mode])

  // 🔧 CYCLE 4 FIX: useCallback for stable function references
  const handleSubmit = useCallback(async (e) => {
    e.preventDefault()
    if (!hintText.trim() || isSubmitting) return

    setIsSubmitting(true)
    try {
      await submitHint(hintText.trim())
      setHintText('')
      setHasSubmitted(true)
    } catch (error) {
      console.error('Error submitting hint:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [hintText, isSubmitting, submitHint])
  
  const handleRealModeNext = useCallback(async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitRealModeNext()
      setHasSubmitted(true)
    } catch (error) {
      console.error('Error marking next:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, submitRealModeNext])

  const handleSpinComplete = useCallback((selectedPlayer) => {
    console.log('🎯 Wheel selected:', selectedPlayer.username)
    setCurrentSpeaker(selectedPlayer)
    setIsSpinning(false)
  }, [])

  const handleMarkComplete = useCallback(async () => {
    if (!currentSpeaker) return
    
    console.log('✅ Marking complete:', currentSpeaker.username)
    
    // ✅ FIX: Persist completion via database (submit [VERBAL] hint)
    try {
      setIsSubmitting(true)
      const { roomId, currentRound } = useGameStore.getState()
      const { gameHelpers } = await import('../../lib/supabase')
      
      // Submit [VERBAL] hint to mark player as complete
      await gameHelpers.submitHint(roomId, currentSpeaker.user_id, '[VERBAL]', currentRound)
      
      // Reload hints to update UI
      await loadHints()
      
      setCurrentSpeaker(null)
      setIsSubmitting(false)
      
      console.log(`✅ Completion persisted for ${currentSpeaker.username}`)
      
      // ✅ BUG FIX #1: REMOVED manual advancePhase() call
      // The interval's canAdvancePhaseEarly() already handles this!
      // Previously this caused DEBATE to be skipped because:
      // 1. Interval detected completion -> advanced HINT_DROP to DEBATE
      // 2. This setTimeout fired 1.5s later -> advanced DEBATE to VERDICT (BUG!)
      // Now we trust the interval system to handle phase transitions.
      
    } catch (error) {
      console.error('❌ Error persisting completion:', error)
      setIsSubmitting(false)
    }
  }, [currentSpeaker, loadHints])

  // 🔧 CYCLE 4 FIX: useMemo for expensive derived state
  const alivePlayers = useMemo(() => {
    return getAliveParticipants()
  }, [participants])
  
  const submittedCount = useMemo(() => hints.length, [hints.length])
  const totalCount = useMemo(() => alivePlayers.length, [alivePlayers.length])
  
  const isSilentMode = useMemo(() => room?.game_mode === 'SILENT', [room?.game_mode])
  const isRealMode = useMemo(() => room?.game_mode === 'REAL', [room?.game_mode])
  
  // 🔧 CYCLE 4 FIX: Memoize turn calculations
  const currentTurnIndex = useMemo(
    () => hints.length % (turnOrder?.length || 1),
    [hints.length, turnOrder?.length]
  )
  
  const currentUserId = useMemo(
    () => turnOrder?.[currentTurnIndex],
    [turnOrder, currentTurnIndex]
  )
  
  const isMyTurn = useMemo(
    () => currentUserId === myUserId,
    [currentUserId, myUserId]
  )

  // NEW: Timer urgency color
  const timerColor = useMemo(() => {
    if (phaseTimer > 30) return 'text-purple-400'
    if (phaseTimer > 10) return 'text-yellow-400 animate-pulse'
    return 'text-red-400 animate-pulse'
  }, [phaseTimer])

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="hint-drop-phase-container">
      {/* Header - ENHANCED */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {isRealMode ? '🎤 Speak Your Hint' : '💡 Drop Your Hint'}
        </h2>
        <p className="text-gray-400">
          {isSilentMode 
            ? 'One word. One chance. Make it count. 🎯' 
            : 'Speak your hint out loud when the wheel selects you'
          }
        </p>
        <div className="mt-4 flex items-center justify-center gap-2">
          {isSilentMode && (
            <>
              <div data-testid="phase-timer" className={`text-2xl font-bold ${timerColor}`}>{phaseTimer}s</div>
              <div className="text-gray-400">|</div>
            </>
          )}
          <div data-testid="hint-progress" className="text-sm text-gray-400">
            {isRealMode 
              ? `${completedPlayerIds.length}/${totalCount} players spoken`
              : `${submittedCount}/${totalCount} hints submitted`
            }
          </div>
        </div>
      </div>

      {/* ✨ REAL MODE - Spinning Wheel */}
      {isRealMode && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8"
        >
          <SpinningWheel
            players={alivePlayers}
            completedPlayerIds={completedPlayerIds}
            onSpinComplete={handleSpinComplete}
            isHost={isHost}
            isSpinning={isSpinning}
          />

          {currentSpeaker && !isSpinning && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-xl p-6 text-center"
            >
              <p className="text-lg text-gray-300 mb-4">
                {currentSpeaker.user_id === myUserId 
                  ? '🎤 It\'s YOUR turn! Speak your hint to everyone'
                  : `👂 Listen to ${currentSpeaker.username}\'s hint`
                }
              </p>

              {isHost && (
                <button
                  onClick={handleMarkComplete}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center gap-2 mx-auto"
                >
                  {isSubmitting ? 'Saving...' : (
                    <>
                      ✅ Done - Next Player
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}

              {!isHost && (
                <p className="text-sm text-gray-400">
                  Waiting for host to advance...
                </p>
              )}
            </motion.div>
          )}

          <div className="mt-6 bg-blue-500/10 border border-blue-500 rounded-xl p-4">
            <h3 className="text-blue-400 font-semibold mb-2">🎯 How It Works</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Host spins the wheel to select the next speaker</li>
              <li>• Selected player speaks their hint out loud (voice chat)</li>
              <li>• Host clicks "Done" when ready for the next player</li>
              <li>• Each player speaks exactly once (no repeats)</li>
              <li>• After everyone speaks, phase advances automatically!</li>
            </ul>
          </div>
        </motion.div>
      )}

      {/* SILENT MODE: Turn Indicator */}
      {isSilentMode && currentPlayer && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          data-testid="current-turn-player"
          className={`mb-6 p-4 rounded-xl border-2 text-center ${
            isMyTurn 
              ? 'bg-purple-500/20 border-purple-500'
              : 'bg-gray-800 border-gray-700'
          }`}
        >
          <p className="text-sm text-gray-400 mb-1">Current Turn</p>
          <p className="text-xl font-bold text-white">
            {isMyTurn ? '👉 YOUR TURN!' : `⏳ ${currentPlayer.username || 'Player'}\' turn`}
          </p>
        </motion.div>
      )}

      {/* SILENT MODE: Hint Input - ENHANCED */}
      {isSilentMode && !hasSubmitted && isMyTurn && (
        <motion.form
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          onSubmit={handleSubmit}
          className="mb-8"
        >
          <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 glow-purple-sm">
            <input
              type="text"
              value={hintText}
              onChange={(e) => setHintText(e.target.value)}
              placeholder="Choose wisely. Every word counts. 🎯"
              maxLength={30}
              data-testid="hint-input"
              className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">
                Be vague enough to hide. Specific enough to fit in.
              </p>
              <button
                type="submit"
                data-testid="submit-hint-button"
                disabled={!hintText.trim() || isSubmitting}
                className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors"
              >
                {isSubmitting ? 'Dropping...' : '📤 Drop Hint'}
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* SILENT MODE: Waiting Message - ENHANCED */}
      {isSilentMode && !isMyTurn && !hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="mb-8 bg-gray-800 border-2 border-gray-700 rounded-xl p-6 text-center"
          data-testid="waiting-for-turn"
        >
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-400">Wait for your turn...</p>
          <p className="text-sm text-gray-500 mt-2">
            {currentPlayer ? `${currentPlayer.username} is giving their hint` : 'Waiting...'}
          </p>
          <p className="text-xs text-gray-600 mt-2">Analyzing their hints... 🔍</p>
        </motion.div>
      )}

      {/* SILENT MODE: Submitted Confirmation */}
      {isSilentMode && hasSubmitted && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          data-testid="hint-submitted-confirmation"
          className="mb-8 bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center"
        >
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-400 font-semibold">Hint submitted!</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for other players...</p>
        </motion.div>
      )}

      {/* SILENT MODE: Hint List */}
      {isSilentMode && hints.length > 0 && (
        <div data-testid="hint-list" className="mb-8 bg-gray-800 border border-gray-700 rounded-xl p-6">
          <h3 className="text-white font-semibold mb-4">📝 Hints So Far</h3>
          <div className="space-y-2">
            {hints.map((hint, index) => (
              <div key={hint.id || index} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                <span className="text-purple-400 font-mono">{index + 1}.</span>
                <span className="text-white">{hint.hint_text}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SILENT MODE: Player Status Grid */}
      {isSilentMode && (
        <PlayerStatusGrid 
          alivePlayers={alivePlayers}
          hints={hints}
          myUserId={myUserId}
          currentPlayer={currentPlayer}
        />
      )}

      {/* SILENT MODE: Instructions - ENHANCED */}
      {isSilentMode && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-8 bg-blue-500/10 border border-blue-500 rounded-xl p-4"
        >
          <h3 className="text-blue-400 font-semibold mb-2">💡 Strategy Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Citizens:</strong> Give hints that confirm you have the real word</li>
            <li>• <strong>Traitors:</strong> Give hints vague enough to blend in</li>
            <li>• Avoid saying your exact word or giving it away</li>
            <li>• Watch others' hints closely - who seems suspicious?</li>
          </ul>
        </motion.div>
      )}
    </div>
  )
}

// 🔧 CYCLE 4 FIX: Extract PlayerStatusGrid to separate component for easier memoization
const PlayerStatusGrid = React.memo(({ alivePlayers, hints, myUserId, currentPlayer }) => {
  return (
    <div data-testid="player-status-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <AnimatePresence>
        {alivePlayers.map((player) => {
          const hasSubmitted = hints.some(h => h.user_id === player.user_id)
          const isMe = player.user_id === myUserId
          const isCurrentTurn = currentPlayer?.user_id === player.user_id
          
          return (
            <motion.div
              key={player.user_id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              data-testid="player-status-item"
              className={`p-4 rounded-lg border-2 transition-all ${
                hasSubmitted
                  ? 'bg-green-500/10 border-green-500'
                  : isCurrentTurn
                  ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-400 animate-pulse'
                  : 'bg-gray-800 border-gray-700'
              } ${isMe ? 'ring-2 ring-blue-500' : ''}`}
            >
              <div className="text-center">
                <div className="text-2xl mb-2">
                  {hasSubmitted ? '✓' : isCurrentTurn ? '👉' : '⏳'}
                </div>
                <p className="text-sm text-gray-300 truncate">
                  {player.username || `Player ${player.user_id.slice(0, 6)}`}
                </p>
                {isMe && <p className="text-xs text-blue-400 mt-1">You</p>}
                {isCurrentTurn && !hasSubmitted && (
                  <p className="text-xs text-purple-400 mt-1">Turn</p>
                )}
              </div>
            </motion.div>
          )
        })}
      </AnimatePresence>
    </div>
  )
})

PlayerStatusGrid.displayName = 'PlayerStatusGrid'

export default HintDropPhase