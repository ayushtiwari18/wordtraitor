import React, { useState, useEffect, useMemo, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import useGameStore from '../../store/gameStore'
import SpinningWheel from '../SpinningWheel'
import { supabase } from '../../lib/supabase.js'

const HintDropPhase = () => {
  // 🔧 CYCLE 4 FIX: Granular Zustand selectors (only re-render when specific data changes)
  const hints = useGameStore(state => state.hints)
  const participants = useGameStore(state => state.participants)
  const room = useGameStore(state => state.room)
  const myUserId = useGameStore(state => state.myUserId)
  const phaseTimer = useGameStore(state => state.phaseTimer)
  const isHost = useGameStore(state => state.isHost)
  const turnOrder = useGameStore(state => state.turnOrder)
  const roomId = useGameStore(state => state.roomId)
  const currentRound = useGameStore(state => state.currentRound)
  
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
  const [currentPlayer, setCurrentPlayer] = useState(null)
  
  // ✅ NEW: Load ALL hints from all rounds (including previous rounds)
  const [allRoundsHints, setAllRoundsHints] = useState([])
  const [hintsGroupedByRound, setHintsGroupedByRound] = useState({})

  // Load ALL hints from database (all rounds)
  const loadAllHints = useCallback(async () => {
    if (!roomId) return
    
    try {
      const { data, error } = await supabase
        .from('game_hints')
        .select(`
          *,
          user:room_participants!game_hints_user_id_fkey(username)
        `)
        .eq('room_id', roomId)
        .order('round_number', { ascending: true })
        .order('created_at', { ascending: true })

      if (error) throw error

      setAllRoundsHints(data || [])
      
      // Group hints by round
      const grouped = (data || []).reduce((acc, hint) => {
        if (!acc[hint.round_number]) {
          acc[hint.round_number] = []
        }
        acc[hint.round_number].push(hint)
        return acc
      }, {})
      
      setHintsGroupedByRound(grouped)
      console.log(`📋 Loaded hints from ${Object.keys(grouped).length} rounds`)
    } catch (error) {
      console.error('❌ Error loading all hints:', error)
    }
  }, [roomId])

  // Load hints when component mounts and when round changes
  useEffect(() => {
    console.log('💡 HintDropPhase mounted, loading all hints...')
    loadHints() // Current round hints (for turn-based logic)
    loadAllHints() // All rounds hints (for display)
  }, [loadHints, loadAllHints])

  // Reload all hints when current round changes
  useEffect(() => {
    if (currentRound) {
      loadAllHints()
    }
  }, [currentRound, loadAllHints])

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
      // Reload all hints to show new submission
      await loadAllHints()
    } catch (error) {
      console.error('Error submitting hint:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [hintText, isSubmitting, submitHint, loadAllHints])
  
  const handleRealModeNext = useCallback(async () => {
    if (isSubmitting) return
    
    setIsSubmitting(true)
    try {
      await submitRealModeNext()
      setHasSubmitted(true)
      await loadAllHints()
    } catch (error) {
      console.error('Error marking next:', error)
    } finally {
      setIsSubmitting(false)
    }
  }, [isSubmitting, submitRealModeNext, loadAllHints])

  const handleSpinComplete = useCallback((selectedPlayer) => {
    console.log('🎯 Wheel selected:', selectedPlayer.username)
    setCurrentSpeaker(selectedPlayer)
    setIsSpinning(false)
  }, [])

  const handleMarkComplete = useCallback(async () => {
    if (!currentSpeaker) return
    
    console.log('✅ Marking complete:', currentSpeaker.username)
    
    try {
      setIsSubmitting(true)
      const { roomId, currentRound } = useGameStore.getState()
      const { gameHelpers } = await import('../../lib/supabase')
      
      await gameHelpers.submitHint(roomId, currentSpeaker.user_id, '[VERBAL]', currentRound)
      await loadHints()
      await loadAllHints()
      
      setCurrentSpeaker(null)
      setIsSubmitting(false)
      
      console.log(`✅ Completion persisted for ${currentSpeaker.username}`)
    } catch (error) {
      console.error('❌ Error persisting completion:', error)
      setIsSubmitting(false)
    }
  }, [currentSpeaker, loadHints, loadAllHints])

  // 🔧 CYCLE 4 FIX: useMemo for expensive derived state
  const alivePlayers = useMemo(() => {
    return getAliveParticipants()
  }, [participants])
  
  const submittedCount = useMemo(() => hints.length, [hints.length])
  const totalCount = useMemo(() => alivePlayers.length, [alivePlayers.length])
  
  const isSilentMode = useMemo(() => room?.game_mode === 'SILENT', [room?.game_mode])
  const isRealMode = useMemo(() => room?.game_mode === 'REAL', [room?.game_mode])
  
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

  const timerColor = useMemo(() => {
    if (phaseTimer > 30) return 'text-purple-400'
    if (phaseTimer > 10) return 'text-yellow-400 animate-pulse'
    return 'text-red-400 animate-pulse'
  }, [phaseTimer])

  // ✅ NEW: Get previous rounds numbers (excluding current)
  const previousRounds = useMemo(() => {
    return Object.keys(hintsGroupedByRound)
      .map(Number)
      .filter(round => round < currentRound)
      .sort((a, b) => a - b)
  }, [hintsGroupedByRound, currentRound])

  return (
    <div className="max-w-4xl mx-auto p-6" data-testid="hint-drop-phase-container">
      {/* Header */}
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-white mb-2">
          {isRealMode ? '🎤 Speak Your Hint' : '💡 Drop Your Hint'}
        </h2>
        <p className="text-gray-400">
          {isSilentMode 
            ? `Round ${currentRound} - Same words continue! 🎯` 
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
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="mb-8">
          <SpinningWheel
            players={alivePlayers}
            completedPlayerIds={completedPlayerIds}
            onSpinComplete={handleSpinComplete}
            isHost={isHost}
            isSpinning={isSpinning}
          />

          {currentSpeaker && !isSpinning && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 bg-gradient-to-r from-purple-500/20 to-pink-500/20 border-2 border-purple-500 rounded-xl p-6 text-center">
              <p className="text-lg text-gray-300 mb-4">
                {currentSpeaker.user_id === myUserId 
                  ? "🎤 It's YOUR turn! Speak your hint to everyone"
                  : `👂 Listen to ${currentSpeaker.username}'s hint`
                }
              </p>

              {isHost && (
                <button onClick={handleMarkComplete} disabled={isSubmitting} className="px-8 py-3 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors flex items-center gap-2 mx-auto">
                  {isSubmitting ? 'Saving...' : (
                    <>
                      ✅ Done - Next Player
                      <ArrowRight className="w-5 h-5" />
                    </>
                  )}
                </button>
              )}

              {!isHost && <p className="text-sm text-gray-400">Waiting for host to advance...</p>}
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
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} data-testid="current-turn-player" className={`mb-6 p-4 rounded-xl border-2 text-center ${
            isMyTurn 
              ? 'bg-purple-500/20 border-purple-500'
              : 'bg-gray-800 border-gray-700'
          }`}>
          <p className="text-sm text-gray-400 mb-1">Current Turn</p>
          <p className="text-xl font-bold text-white">
            {isMyTurn ? '👉 YOUR TURN!' : `⏳ ${currentPlayer.username || 'Player'}' turn`}
          </p>
        </motion.div>
      )}

      {/* SILENT MODE: Hint Input */}
      {isSilentMode && !hasSubmitted && isMyTurn && (
        <motion.form initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} onSubmit={handleSubmit} className="mb-8">
          <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6 glow-purple-sm">
            <input type="text" value={hintText} onChange={(e) => setHintText(e.target.value)} placeholder="Choose wisely. Every word counts. 🎯" maxLength={30} data-testid="hint-input" className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-3 text-white text-lg focus:outline-none focus:border-purple-500 transition-colors placeholder:text-gray-600" disabled={isSubmitting} autoFocus />
            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-gray-400">Be vague enough to hide. Specific enough to fit in.</p>
              <button type="submit" data-testid="submit-hint-button" disabled={!hintText.trim() || isSubmitting} className="px-6 py-2 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-semibold text-white transition-colors">
                {isSubmitting ? 'Dropping...' : '📤 Drop Hint'}
              </button>
            </div>
          </div>
        </motion.form>
      )}

      {/* SILENT MODE: Waiting/Submitted Messages */}
      {isSilentMode && !isMyTurn && !hasSubmitted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="mb-8 bg-gray-800 border-2 border-gray-700 rounded-xl p-6 text-center" data-testid="waiting-for-turn">
          <div className="text-4xl mb-2">⏳</div>
          <p className="text-gray-400">Wait for your turn...</p>
          <p className="text-sm text-gray-500 mt-2">{currentPlayer ? `${currentPlayer.username} is giving their hint` : 'Waiting...'}</p>
        </motion.div>
      )}

      {isSilentMode && hasSubmitted && (
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} data-testid="hint-submitted-confirmation" className="mb-8 bg-green-500/20 border-2 border-green-500 rounded-xl p-6 text-center">
          <div className="text-4xl mb-2">✓</div>
          <p className="text-green-400 font-semibold">Hint submitted!</p>
          <p className="text-gray-400 text-sm mt-2">Waiting for other players...</p>
        </motion.div>
      )}

      {/* ✅ NEW: Show Previous Rounds Hints + Current Round Hints */}
      {isSilentMode && allRoundsHints.length > 0 && (
        <div data-testid="hint-list-all-rounds" className="mb-8 space-y-4">
          {/* Previous Rounds */}
          {previousRounds.map(roundNum => (
            <div key={`round-${roundNum}`} className="bg-gray-800/50 border border-gray-700 rounded-xl p-6">
              <h3 className="text-purple-400 font-semibold mb-3">📋 Round {roundNum} Hints (Previous)</h3>
              <div className="space-y-2">
                {hintsGroupedByRound[roundNum]?.map((hint, index) => {
                  const hintUser = participants.find(p => p.user_id === hint.user_id)
                  const isEliminated = !alivePlayers.some(p => p.user_id === hint.user_id)
                  
                  return (
                    <div key={hint.id || index} className={`flex items-center gap-3 p-3 rounded-lg ${
                      isEliminated ? 'bg-gray-900/50 opacity-60' : 'bg-gray-900'
                    }`}>
                      <span className="text-gray-500 font-mono text-sm">{index + 1}.</span>
                      <span className="text-white flex-1">{hint.hint_text}</span>
                      <span className="text-gray-500 text-xs">
                        {hintUser?.username || 'Unknown'} {isEliminated && '(Eliminated)'}
                      </span>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}

          {/* Current Round */}
          {hintsGroupedByRound[currentRound] && hintsGroupedByRound[currentRound].length > 0 && (
            <div className="bg-gray-800 border-2 border-purple-500 rounded-xl p-6">
              <h3 className="text-white font-semibold mb-4">💡 Round {currentRound} Hints (Current)</h3>
              <div className="space-y-2">
                {hintsGroupedByRound[currentRound].map((hint, index) => {
                  const hintUser = participants.find(p => p.user_id === hint.user_id)
                  
                  return (
                    <div key={hint.id || index} className="flex items-center gap-3 p-3 bg-gray-900 rounded-lg">
                      <span className="text-purple-400 font-mono">{index + 1}.</span>
                      <span className="text-white flex-1">{hint.hint_text}</span>
                      <span className="text-gray-400 text-xs">{hintUser?.username || 'Unknown'}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
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

      {/* SILENT MODE: Instructions */}
      {isSilentMode && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="mt-8 bg-blue-500/10 border border-blue-500 rounded-xl p-4">
          <h3 className="text-blue-400 font-semibold mb-2">💡 Strategy Tips</h3>
          <ul className="text-sm text-gray-300 space-y-1">
            <li>• <strong>Citizens:</strong> Give hints that confirm you have the real word</li>
            <li>• <strong>Traitors:</strong> Give hints vague enough to blend in</li>
            <li>• Avoid saying your exact word or giving it away</li>
            <li>• Watch others' hints closely - who seems suspicious?</li>
            {currentRound > 1 && <li>• <strong>Round {currentRound}:</strong> Review previous hints above to spot inconsistencies!</li>}
          </ul>
        </motion.div>
      )}
    </div>
  )
}

const PlayerStatusGrid = React.memo(({ alivePlayers, hints, myUserId, currentPlayer }) => {
  return (
    <div data-testid="player-status-grid" className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      <AnimatePresence>
        {alivePlayers.map((player) => {
          const hasSubmitted = hints.some(h => h.user_id === player.user_id)
          const isMe = player.user_id === myUserId
          const isCurrentTurn = currentPlayer?.user_id === player.user_id
          
          return (
            <motion.div key={player.user_id} initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} data-testid="player-status-item" className={`p-4 rounded-lg border-2 transition-all ${
                hasSubmitted
                  ? 'bg-green-500/10 border-green-500'
                  : isCurrentTurn
                  ? 'bg-purple-500/10 border-purple-500 ring-2 ring-purple-400 animate-pulse'
                  : 'bg-gray-800 border-gray-700'
              } ${isMe ? 'ring-2 ring-blue-500' : ''}`}>
              <div className="text-center">
                <div className="text-2xl mb-2">{hasSubmitted ? '✓' : isCurrentTurn ? '👉' : '⏳'}</div>
                <p className="text-sm text-gray-300 truncate">{player.username || `Player ${player.user_id.slice(0, 6)}`}</p>
                {isMe && <p className="text-xs text-blue-400 mt-1">You</p>}
                {isCurrentTurn && !hasSubmitted && <p className="text-xs text-purple-400 mt-1">Turn</p>}
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