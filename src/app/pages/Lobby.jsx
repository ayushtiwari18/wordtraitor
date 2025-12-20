import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Play, Users as UsersIcon, Settings as SettingsIcon, LogOut } from 'lucide-react'
import { useGuestStore } from '@/store/guestStore'
import { useUIStore } from '@/store/uiStore'
import { copyToClipboard, getGameModeDisplay, getDifficultyDisplay, getWordPackDisplay } from '@/lib/utils'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Button from '@/components/Button'
import Card from '@/components/Card'
import ToastContainer from '@/components/Toast'

const Lobby = () => {
  const { roomId } = useParams()
  const navigate = useNavigate()
  const { guestId, username, avatar } = useGuestStore()
  const { showSuccess, showError } = useUIStore()
  
  const [room, setRoom] = useState(null)
  const [participants, setParticipants] = useState([])
  
  useEffect(() => {
    if (!username) {
      navigate('/')
      return
    }
    
    const pendingRoom = localStorage.getItem('pendingRoom')
    if (pendingRoom) {
      const roomData = JSON.parse(pendingRoom)
      if (roomData.code === roomId) {
        setRoom({
          room_code: roomData.code,
          game_mode: roomData.settings.gameMode,
          difficulty: roomData.settings.difficulty,
          word_pack: roomData.settings.wordPack,
          host_id: roomData.host,
          max_players: 8
        })
        setParticipants([{
          id: guestId,
          user_id: guestId,
          username: username,
          avatar: avatar,
          is_alive: true,
          isHost: true
        }])
      }
    } else {
      setRoom({
        room_code: roomId,
        game_mode: 'silent',
        difficulty: 'medium',
        word_pack: 'general',
        host_id: 'other_player',
        max_players: 8
      })
      setParticipants([{
        id: guestId,
        user_id: guestId,
        username: username,
        avatar: avatar,
        is_alive: true,
        isHost: false
      }])
    }
  }, [roomId, username, guestId])
  
  const handleCopyCode = async () => {
    if (room?.room_code) {
      const success = await copyToClipboard(room.room_code)
      if (success) {
        showSuccess('Room code copied!')
      } else {
        showError('Failed to copy')
      }
    }
  }
  
  const handleStartGame = () => {
    if (participants.length < 4) {
      showError('Need at least 4 players!')
      return
    }
    showSuccess('Starting game...')
    navigate(`/game/${roomId}`)
  }
  
  const handleLeaveRoom = () => {
    localStorage.removeItem('pendingRoom')
    navigate('/')
  }
  
  const isHost = username === room?.host_id
  
  if (!room) {
    return <PageContainer><div className="text-white text-center py-12">Loading...</div></PageContainer>
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
                <div className="text-6xl font-bold font-mono text-neon-cyan tracking-widest">{room.room_code}</div>
                <Button variant="outline" size="sm" icon={Copy} onClick={handleCopyCode}>Copy</Button>
              </div>
              <div className="flex items-center justify-center gap-6 text-gray-400 flex-wrap">
                <span>Mode: <span className="text-white">{getGameModeDisplay(room.game_mode)}</span></span>
                <span className="hidden sm:inline">•</span>
                <span>Difficulty: <span className="text-white">{getDifficultyDisplay(room.difficulty)}</span></span>
                <span className="hidden sm:inline">•</span>
                <span>Pack: <span className="text-white">{getWordPackDisplay(room.word_pack)}</span></span>
              </div>
            </div>
          </Card>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <UsersIcon className="text-neon-cyan" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Players ({participants.length}/{room.max_players})</h2>
              </div>
              <div className="space-y-3">
                {participants.map((p,i)=>(
                  <motion.div key={p.id} initial={{opacity:0,x:-20}} animate={{opacity:1,x:0}} transition={{delay:i*0.1}} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
                    <img src={p.avatar} alt="Avatar" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{p.username}</p>
                      {p.isHost && <span className="text-xs text-neon-cyan">Host</span>}
                    </div>
                    <span className="text-green-500 text-sm">Ready</span>
                  </motion.div>
                ))}
                {participants.length<4 && <div className="text-center py-4 text-gray-500"><p>Waiting for {4-participants.length} more player{4-participants.length!==1?'s':''}...</p><p className="text-xs mt-2">Share the code!</p></div>}
              </div>
            </Card>
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <SettingsIcon className="text-neon-purple" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Game Info</h2>
              </div>
              <div className="space-y-4">
                <div><h3 className="text-sm text-gray-400 mb-1">How to Play</h3><ol className="text-white text-sm space-y-2 list-decimal list-inside"><li>Everyone receives a secret word</li><li>One player gets different word (traitor)</li><li>Give hints about your word</li><li>Discuss and vote for traitor</li><li>Catch the traitor to win!</li></ol></div>
                <div className="pt-4 border-t border-gray-700"><p className="text-sm text-gray-400 mb-2">Share code:</p><input type="text" readOnly value={`Join WordTraitor: ${room.room_code}`} className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded text-white text-sm" /></div>
              </div>
            </Card>
          </div>
          <div className="flex gap-4">
            {isHost && <Card className="text-center flex-1"><h3 className="text-xl font-heading font-bold text-white mb-4">Ready to Start?</h3><p className="text-gray-400 mb-6">Need 4+ players</p><Button variant="primary" size="xl" icon={Play} onClick={handleStartGame} disabled={participants.length<4} className="w-full">Start Game</Button></Card>}
            {!isHost && <Card className="text-center flex-1"><p className="text-gray-400 mb-4">Waiting for host...</p><div className="flex items-center justify-center gap-2"><div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" /><div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{animationDelay:'0.2s'}} /><div className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse" style={{animationDelay:'0.4s'}} /></div></Card>}
            <Button variant="outline" icon={LogOut} onClick={handleLeaveRoom} className="self-center">Leave</Button>
          </div>
        </motion.div>
      </div>
    </PageContainer>
  )
}

export default Lobby