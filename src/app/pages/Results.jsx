import React, { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import useGameStore from '../../store/gameStore'
import { supabase } from '../../lib/supabase'
import confetti from 'canvas-confetti'

const Results = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  
  const { gameResults, participants, myUserId, mySecret, leaveRoom } = useGameStore()
  const [traitorDetails, setTraitorDetails] = useState(null) // ✨ NEW: Separate traitor state
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fire confetti
    setTimeout(() => {
      confetti({
        particleCount: 150,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#9333ea', '#ec4899', '#3b82f6', '#10b981']
      })
    }, 500)

    // Load traitor details
    loadTraitorDetails()
  }, [])

  // ✨ NEW: Proper traitor fetching with fallback
  const loadTraitorDetails = async () => {
    try {
      // ✅ BUG FIX #4: Handle both traitorIds (array) and traitorId (singular)
      const traitorIds = gameResults?.traitorIds || []
      const traitorId = traitorIds[0] || gameResults?.traitorId  // Backwards compatibility
      
      if (!traitorId) {
        console.error('❌ No traitor ID in game results')
        setLoading(false)
        return
      }

      console.log('🔍 Looking for traitor:', traitorId)
      console.log('👥 Participants:', participants.map(p => ({ id: p.user_id, name: p.username })))
      
      // First try participants array
      let traitor = participants.find(p => p.user_id === traitorId)
      
      // If not found, fetch from database
      if (!traitor) {
        console.log('⚠️ Traitor not in participants array, fetching from database...')
        
        const { data, error } = await supabase
          .from('room_participants')
          .select('user_id, username, is_alive, role')
          .eq('user_id', traitorId)
          .eq('room_id', roomId)
          .single()
        
        if (error) {
          console.error('❌ Error fetching traitor from DB:', error)
        } else if (data) {
          traitor = data
          console.log('✅ Fetched traitor from database:', traitor)
        }
      } else {
        console.log('✅ Found traitor in participants:', traitor)
      }
      
      setTraitorDetails(traitor)
      setLoading(false)
    } catch (error) {
      console.error('❌ Error loading traitor details:', error)
      setLoading(false)
    }
  }

  const handleNewGame = async () => {
    await leaveRoom()
    navigate('/')
  }

  const handleGoHome = async () => {
    await leaveRoom()
    navigate('/')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900">
        <div className="text-2xl text-purple-400 animate-pulse">Loading results...</div>
      </div>
    )
  }

  const winner = gameResults?.winner
  // ✅ BUG FIX #4: Use same logic as loadTraitorDetails for consistency
  const traitorIds = gameResults?.traitorIds || []
  const traitorId = traitorIds[0] || gameResults?.traitorId
  const wasITraitor = myUserId === traitorId
  const didIWin = (winner === 'TRAITOR' && wasITraitor) || (winner === 'CITIZENS' && !wasITraitor)

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-gray-900 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Winner Announcement - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ type: 'spring', duration: 1, bounce: 0.4 }}
          className="text-center mb-12"
        >
          <motion.div 
            className="text-9xl mb-6"
            animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            {winner === 'TRAITOR' ? '🕵️' : '🏆'}
          </motion.div>
          <h1 className="text-6xl font-bold text-white mb-4">
            {winner === 'TRAITOR' ? 'Traitor Wins!' : 'Citizens Win!'}
          </h1>
          
          {/* NEW: Personalized victory message */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            {didIWin ? (
              <div>
                <p className="text-3xl text-green-400 font-bold mb-2">✨ Victory! ✨</p>
                <p className="text-gray-400 text-lg">
                  {wasITraitor 
                    ? 'Deception is an art. You mastered it. 🎭'
                    : 'Justice prevails. The traitor has been caught! ⚖️'
                  }
                </p>
              </div>
            ) : (
              <div>
                <p className="text-3xl text-red-400 font-bold mb-2">😔 Defeat...</p>
                <p className="text-gray-400 text-lg">
                  {wasITraitor
                    ? 'You were exposed. Better luck deceiving next time. 🕵️'
                    : 'The traitor escaped. Trust was misplaced. 🚫'
                  }
                </p>
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Traitor Reveal - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 border-2 border-red-500 rounded-2xl p-8 mb-8 glow-red-sm"
        >
          <div className="text-center">
            <p className="text-gray-400 mb-3 text-lg">The traitor was...</p>
            <div className="flex items-center justify-center gap-4 mb-4">
              <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center text-3xl border-2 border-red-500">
                {traitorDetails?.username?.charAt(0).toUpperCase() || '?'}
              </div>
              <div className="text-left">
                <h2 className="text-4xl font-bold text-white">
                  {traitorDetails?.username || 'Unknown Player'}
                </h2>
                {wasITraitor && (
                  <p className="text-red-400 font-semibold text-lg">(That's you!) 😈</p>
                )}
              </div>
            </div>
            {mySecret && (
              <div className="mt-6 pt-6 border-t border-gray-700">
                <p className="text-gray-400 text-sm mb-2">Your role & word:</p>
                <div className="inline-block px-6 py-3 bg-gray-900 rounded-lg">
                  <span className={`font-bold ${
                    mySecret.role === 'TRAITOR' ? 'text-red-400' : 'text-blue-400'
                  }`}>
                    {mySecret.role === 'TRAITOR' ? '🕵️ TRAITOR' : '👤 CITIZEN'}
                  </span>
                  <span className="text-gray-400 mx-2">-</span>
                  <span className="text-purple-400 font-bold text-xl">
                    "{mySecret.secret_word}"
                  </span>
                </div>
              </div>
            )}
          </div>
        </motion.div>

        {/* Player List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gray-800 border-2 border-gray-700 rounded-2xl p-8 mb-8"
        >
          <h3 className="text-2xl font-bold text-white mb-6 text-center">Final Standings</h3>
          <div className="space-y-3">
            {participants.map((player) => {
              const isTraitor = player.user_id === traitorId
              const playerWon = (winner === 'TRAITOR' && isTraitor) || (winner === 'CITIZENS' && !isTraitor)
              
              return (
                <div
                  key={player.user_id}
                  className={`p-4 rounded-lg border-2 flex items-center justify-between ${
                    isTraitor
                      ? 'bg-red-500/10 border-red-500'
                      : 'bg-blue-500/10 border-blue-500'
                  } ${!player.is_alive ? 'opacity-50' : ''}`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isTraitor ? 'bg-red-500/20' : 'bg-blue-500/20'
                    }`}>
                      {player.username?.charAt(0).toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="text-white font-semibold">
                        {player.username || `Player ${player.user_id.slice(0, 6)}`}
                        {player.user_id === myUserId && ' (You)'}
                      </p>
                      <div className="flex items-center gap-2 text-sm">
                        {isTraitor ? (
                          <span className="text-red-400 font-semibold">🕵️ Traitor</span>
                        ) : (
                          <span className="text-blue-400 font-semibold">👤 Citizen</span>
                        )}
                        {playerWon && (
                          <span className="text-green-400">• 🏆 Winner</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {player.is_alive ? (
                      <span className="text-green-400 font-semibold">✓ Survived</span>
                    ) : (
                      <span className="text-red-400">❌ Eliminated</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>

        {/* NEW: Game Tips Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-blue-500/10 border-2 border-blue-500 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-xl font-bold text-blue-400 mb-4 text-center">💡 Strategy Tips for Next Game</h3>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-blue-400 font-bold mb-2">👤 As a Citizen:</p>
              <ul className="text-gray-300 space-y-1">
                <li>• Watch for vague or suspicious hints</li>
                <li>• Compare hints to find patterns</li>
                <li>• Traitors may give hints that fit multiple words</li>
                <li>• Trust your instincts but verify with others</li>
              </ul>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <p className="text-red-400 font-bold mb-2">🕵️ As a Traitor:</p>
              <ul className="text-gray-300 space-y-1">
                <li>• Give hints that could apply to both words</li>
                <li>• Blend in by matching others' hint style</li>
                <li>• Don't be too vague or you'll stand out</li>
                <li>• Accuse others strategically during voting</li>
              </ul>
            </div>
          </div>
        </motion.div>

        {/* Action Buttons - ENHANCED */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex gap-4 justify-center"
        >
          <button
            onClick={handleNewGame}
            className="px-8 py-4 bg-purple-600 hover:bg-purple-700 rounded-xl font-bold text-white text-lg transition-colors shadow-lg glow-purple-sm"
            title="Return home to create or join another game"
          >
            🎭 Play Again
          </button>
          <button
            onClick={handleGoHome}
            className="px-8 py-4 bg-gray-700 hover:bg-gray-600 rounded-xl font-bold text-white text-lg transition-colors"
          >
            🏠 Home
          </button>
        </motion.div>
        
        <p className="text-center text-gray-500 text-sm mt-4">
          🎮 Ready for another round of deception?
        </p>
      </div>
    </div>
  )
}

export default Results