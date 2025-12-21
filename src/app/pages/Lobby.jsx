import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Play, Users as UsersIcon, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { useGuestStore } from '@/store/guestStore'
import { useUIStore } from '@/store/uiStore'
import { useGameStore } from '@/store/gameStore'
import { gameHelpers } from '@/lib/supabase'
import { copyToClipboard, getGameModeDisplay, getDifficultyDisplay, getWordPackDisplay } from '@/lib/utils'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Button from '@/components/Button'
import Card from '@/components/Card'
import ToastContainer from '@/components/Toast'

const Lobby = () => {
  const { roomCode } = useParams()
  const navigate = useNavigate()
  const { guestId, username, avatar } = useGuestStore()
  const { showSuccess, showError } = useUIStore()
  const {
    roomId,
    hostId,
    gameMode,
    difficulty,
    wordPack,
    participants,
    status,
    initRoom,
    setParticipants,
    subscribeToRoom,
    unsubscribe,
    startGame,
    isLoading
  } = useGameStore()
  
  const [room, setRoom] = useState(null)
  const [loadingRoom, setLoadingRoom] = useState(true)
  
  useEffect(() => {
    if (!username) {
      navigate('/')
      return
    }
    
    loadRoom()
    
    return () => {
      unsubscribe()
    }
  }, [roomCode, username])
  
  useEffect(() => {
    if (status === 'PLAYING') {
      // Game started, navigate to game page
      navigate(`/game/${roomId}`)
    }
  }, [status, roomId])
  
  const loadRoom = async () => {
    try {
      // Check if room exists in Supabase
      const { data: rooms, error } = await gameHelpers.supabase
        .from('game_rooms')
        .select('*')
        .eq('room_code', roomCode.toUpperCase())
        .single()
      
      if (error || !rooms) {
        // Room not in database, check localStorage for pending room
        const pendingRoom = localStorage.getItem('pendingRoom')
        if (pendingRoom) {
          const roomData = JSON.parse(pendingRoom)
          if (roomData.code === roomCode) {
            // Create room in Supabase
            const newRoom = await gameHelpers.createRoom(
              guestId,
              username,
              roomData.settings.gameMode,
              roomData.settings.difficulty,
              roomData.settings.wordPack
            )
            
            setRoom(newRoom)
            initRoom(newRoom)
            
            // Load participants
            const participants = await gameHelpers.getParticipants(newRoom.id)
            setParticipants(participants)
            
            // Subscribe to real-time updates
            subscribeToRoom(newRoom.id)
            
            localStorage.removeItem('pendingRoom')
          } else {
            showError('Room not found')
            navigate('/')
          }
        } else {
          showError('Room not found')
          navigate('/')
        }
      } else {
        // Room exists in database
        setRoom(rooms)
        initRoom(rooms)
        
        // Check if already joined
        const participants = await gameHelpers.getParticipants(rooms.id)
        const alreadyJoined = participants.some(p => p.user_id === guestId)
        
        if (!alreadyJoined) {
          // Join room
          await gameHelpers.joinRoom(roomCode, guestId, username)
          const updatedParticipants = await gameHelpers.getParticipants(rooms.id)
          setParticipants(updatedParticipants)
        } else {
          setParticipants(participants)
        }
        
        // Subscribe to real-time updates
        subscribeToRoom(rooms.id)
      }
      
      setLoadingRoom(false)
    } catch (error) {
      console.error('Load room error:', error)
      showError(error.message || 'Failed to load room')
      setLoadingRoom(false)
    }
  }
  
  const handleCopyCode = async () => {
    const success = await copyToClipboard(roomCode)
    if (success) {
      showSuccess('Room code copied!')
    } else {
      showError('Failed to copy')
    }
  }
  
  const handleStartGame = async () => {
    if (participants.length < 4) {
      showError('Need at least 4 players!')
      return
    }
    
    if (hostId !== guestId) {
      showError('Only the host can start the game')
      return
    }
    
    try {
      await startGame()
      showSuccess('Starting game...')
    } catch (error) {
      showError(error.message || 'Failed to start game')
    }
  }
  
  const handleLeaveRoom = async () => {
    try {
      if (roomId) {
        await gameHelpers.leaveRoom(roomId, guestId)
      }
      unsubscribe()
      localStorage.removeItem('pendingRoom')
      navigate('/')
    } catch (error) {
      console.error('Leave room error:', error)
      navigate('/')
    }
  }
  
  const isHost = guestId === hostId
  
  if (loadingRoom) {
    return (
      <PageContainer>
        <AppHeader />
        <div className="flex items-center justify-center min-h-screen">
          <Card className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-neon-cyan mx-auto mb-4" />
            <p className="text-white">Loading lobby...</p>
          </Card>
        </div>
      </PageContainer>
    )
  }
  
  if (!room) {
    return null
  }
  
  return (
    <PageContainer>
      <AppHeader />
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl mx-auto">
          <Card glow className="mb-8">
            <div className="text-center">
              <h1 className="text-4xl font-heading font-bold text-white mb-4">Game Lobby</h1>
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className="text-6xl font-bold font-mono text-neon-cyan tracking-widest">{roomCode}</div>
                <Button variant="outline" size="sm" icon={Copy} onClick={handleCopyCode}>Copy</Button>
              </div>
              <div className="flex items-center justify-center gap-6 text-gray-400 flex-wrap">
                <span>Mode: <span className="text-white">{getGameModeDisplay(gameMode)}</span></span>
                <span className="hidden sm:inline">•</span>
                <span>Difficulty: <span className="text-white">{getDifficultyDisplay(difficulty)}</span></span>
                <span className="hidden sm:inline">•</span>
                <span>Pack: <span className="text-white">{getWordPackDisplay(wordPack)}</span></span>
              </div>
            </div>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <UsersIcon className="text-neon-cyan" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Players ({participants.length}/8)</h2>
              </div>
              <div className="space-y-3">
                {participants.map((p, i) => (
                  <motion.div
                    key={p.user_id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg"
                  >
                    <img
                      src={p.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.username}`}
                      alt="Avatar"
                      className="w-10 h-10 rounded-full"
                    />
                    <div className="flex-1">
                      <p className="text-white font-medium">{p.username}</p>
                      {p.user_id === hostId && <span className="text-xs text-neon-cyan">Host</span>}
                    </div>
                    <span className="text-green-500 text-sm">Ready</span>
                  </motion.div>
                ))}
                {participants.length < 4 && (
                  <div className="text-center py-4 text-gray-500">
                    <p>Waiting for {4 - participants.length} more player{4 - participants.length !== 1 ? 's' : ''}...</p>
                    <p className="text-xs mt-2">Share the code!</p>
                  </div>
                )}
              </div>
            </Card>
            
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <SettingsIcon className="text-neon-purple" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Game Info</h2>
              </div>
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm text-gray-400 mb-1">How to Play</h3>
                  <ol className="text-white text-sm space-y-2 list-decimal list-inside">
                    <li>Everyone receives a secret word</li>
                    <li>One player gets different word (traitor)</li>
                    <li>Give hints about your word</li>
                    <li>Discuss and vote for traitor</li>
                    <li>Catch the traitor to win!</li>
                  </ol>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Share code:</p>
                  <input
                    type="text"
                    readOnly
                    value={`Join WordTraitor: ${roomCode}`}
                    className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded text-white text-sm"
                  />
                </div>
              </div>
            </Card>
          </div>
          
          <div className="flex gap-4">
            {isHost && (
              <Card className="text-center flex-1">
                <h3 className="text-xl font-heading font-bold text-white mb-4">Ready to Start?</h3>
                <p className="text-gray-400 mb-6">Need 4+ players</p>
                <Button
                  variant="primary"
                  size="xl"
                  icon={Play}
                  onClick={handleStartGame}
                  disabled={participants.length < 4 || isLoading}
                  className="w-full"
                >
                  {isLoading ? 'Starting...' : 'Start Game'}
                </Button>
              </Card>
            )}
            {!isHost && (
              <Card className="text-center flex-1">
                <p className="text-gray-400 mb-4">Waiting for host...</p>
                <div className="flex items-center justify-center gap-2">
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" />
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0.2s' }} />
                  <div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{ animationDelay: '0.4s' }} />
                </div>
              </Card>
            )}
            <Button variant="outline" icon={LogOut} onClick={handleLeaveRoom} className="self-center">
              Leave
            </Button>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  )
}

export default Lobby