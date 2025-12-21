import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { gameHelpers, realtimeHelpers } from '../../lib/supabase'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Copy, 
  Check, 
  LogOut, 
  Play,
  Settings,
  Crown,
  User
} from 'lucide-react'
import toast, { Toaster } from 'react-hot-toast'

const Lobby = () => {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [copied, setCopied] = useState(false)
  const [realtimeChannel, setRealtimeChannel] = useState(null)
  
  const myUserId = localStorage.getItem('guestId')
  const myUsername = localStorage.getItem('guestName')
  const isHost = room?.host_id === myUserId
  
  useEffect(() => {
    if (!myUserId || !myUsername) {
      navigate('/')
      return
    }
    
    loadLobbyData()
    
    return () => {
      if (realtimeChannel) {
        realtimeHelpers.unsubscribe(realtimeChannel)
      }
    }
  }, [roomCode])
  
  const loadLobbyData = async () => {
    try {
      // Find room by code
      const { data: rooms, error } = await gameHelpers.supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()
      
      if (error) throw error
      
      setRoom(rooms)
      
      // Get participants
      const participantsData = await gameHelpers.getParticipants(rooms.id)
      setParticipants(participantsData)
      
      // Setup real-time
      setupRealtime(rooms.id)
      
      setIsLoading(false)
    } catch (error) {
      console.error('Failed to load lobby:', error)
      toast.error('Failed to load lobby')
      navigate('/')
    }
  }
  
  const setupRealtime = (roomId) => {
    const channel = realtimeHelpers.subscribeToRoom(roomId, {
      onRoomUpdate: async (payload) => {
        console.log('Room update:', payload)
        const updatedRoom = payload.new
        setRoom(updatedRoom)
        
        // If game started, navigate to game
        if (updatedRoom.status === 'PLAYING') {
          navigate(`/game/${roomId}`)
        }
      },
      
      onParticipantUpdate: async (payload) => {
        console.log('Participant update:', payload)
        const participantsData = await gameHelpers.getParticipants(roomId)
        setParticipants(participantsData)
      },
      
      onHintSubmitted: () => {},
      onVoteSubmitted: () => {}
    })
    
    setRealtimeChannel(channel)
  }
  
  const handleCopyCode = () => {
    navigator.clipboard.writeText(roomCode)
    setCopied(true)
    toast.success('Room code copied!')
    setTimeout(() => setCopied(false), 2000)
  }
  
  const handleLeave = async () => {
    try {
      await gameHelpers.leaveRoom(room.id, myUserId)
      navigate('/')
    } catch (error) {
      console.error('Failed to leave room:', error)
      toast.error('Failed to leave room')
    }
  }
  
  const handleStartGame = async () => {
    if (participants.length < 3) {
      toast.error('Need at least 3 players to start!')
      return
    }
    
    try {
      toast.loading('Starting game...')
      
      // Start game
      await gameHelpers.startGame(room.id)
      
      // Assign roles and words
      await gameHelpers.assignRoles(
        room.id,
        participants,
        room.difficulty,
        room.word_pack
      )
      
      toast.dismiss()
      toast.success('Game started!')
      
      // Navigate to game
      navigate(`/game/${room.id}`)
    } catch (error) {
      console.error('Failed to start game:', error)
      toast.dismiss()
      toast.error('Failed to start game')
    }
  }
  
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center">
        <div className="text-white text-xl">Loading lobby...</div>
      </div>
    )
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-indigo-900 to-blue-900 text-white p-6">
      <Toaster position="top-center" />
      
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <motion.h1 
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="text-5xl font-black mb-4"
          >
            Lobby
          </motion.h1>
          
          {/* Room Code */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="inline-flex items-center gap-3 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-3 rounded-2xl"
          >
            <span className="text-sm text-gray-300">Room Code:</span>
            <span className="text-3xl font-mono font-bold tracking-wider">{roomCode}</span>
            <button
              onClick={handleCopyCode}
              className="p-2 bg-white/10 rounded-lg hover:bg-white/20 transition-colors"
            >
              {copied ? <Check className="w-5 h-5 text-green-400" /> : <Copy className="w-5 h-5" />}
            </button>
          </motion.div>
        </div>
        
        {/* Game Settings */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-6 h-6" />
            <h2 className="text-2xl font-bold">Game Settings</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-1">Game Mode</p>
              <p className="text-xl font-bold text-purple-300">{room.game_mode}</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-1">Difficulty</p>
              <p className="text-xl font-bold text-blue-300">{room.difficulty}</p>
            </div>
            
            <div className="bg-white/5 p-4 rounded-lg">
              <p className="text-sm text-gray-300 mb-1">Word Pack</p>
              <p className="text-xl font-bold text-pink-300">{room.word_pack}</p>
            </div>
          </div>
        </motion.div>
        
        {/* Players List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white/10 backdrop-blur-md rounded-2xl p-6 border border-white/20 mb-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <Users className="w-6 h-6" />
              <h2 className="text-2xl font-bold">Players</h2>
            </div>
            <span className="text-xl font-bold">
              {participants.length}/{room.max_players}
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <AnimatePresence>
              {participants.map((participant, index) => (
                <motion.div
                  key={participant.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: index * 0.05 }}
                  className={`p-4 rounded-lg border-2 ${
                    participant.user_id === room.host_id
                      ? 'bg-yellow-500/20 border-yellow-500'
                      : participant.user_id === myUserId
                      ? 'bg-green-500/20 border-green-500'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6" />
                      </div>
                      <span className="font-bold text-lg">{participant.username}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      {participant.user_id === room.host_id && (
                        <div className="bg-yellow-500 px-2 py-1 rounded flex items-center gap-1">
                          <Crown className="w-4 h-4" />
                          <span className="text-xs font-bold">Host</span>
                        </div>
                      )}
                      {participant.user_id === myUserId && (
                        <div className="bg-green-500 px-2 py-1 rounded">
                          <span className="text-xs font-bold">You</span>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {participants.length < 3 && (
            <div className="mt-4 bg-yellow-500/20 border border-yellow-500 p-4 rounded-lg">
              <p className="text-yellow-200 text-center">
                ⚠️ Need at least 3 players to start the game
              </p>
            </div>
          )}
        </motion.div>
        
        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-4"
        >
          <button
            onClick={handleLeave}
            className="flex-1 flex items-center justify-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 px-6 py-4 rounded-xl font-bold text-lg hover:bg-white/20 transition-all"
          >
            <LogOut className="w-6 h-6" />
            Leave Lobby
          </button>
          
          {isHost && (
            <button
              onClick={handleStartGame}
              disabled={participants.length < 3}
              className="flex-1 flex items-center justify-center gap-2 bg-gradient-to-r from-green-500 to-emerald-500 px-6 py-4 rounded-xl font-bold text-lg hover:from-green-600 hover:to-emerald-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Play className="w-6 h-6" />
              Start Game
            </button>
          )}
        </motion.div>
        
        {!isHost && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-4 text-center text-gray-300"
          >
            <p>Waiting for host to start the game...</p>
          </motion.div>
        )}
      </div>
    </div>
  )
}

export default Lobby
