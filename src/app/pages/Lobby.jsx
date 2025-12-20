import { useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Copy, Play, Users as UsersIcon, Settings as SettingsIcon } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'
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
  const { user } = useAuthStore()
  const { room, participants, loadRoom, startRound, loading } = useGameStore()
  const { showSuccess, showError } = useUIStore()
  
  useEffect(() => {
    if (roomId) {
      loadRoom(roomId)
    }
  }, [roomId])
  
  const handleCopyCode = async () => {
    if (room?.room_code) {
      const success = await copyToClipboard(room.room_code)
      if (success) {
        showSuccess('Room code copied to clipboard!')
      } else {
        showError('Failed to copy room code')
      }
    }
  }
  
  const handleStartGame = async () => {
    if (participants.length < 4) {
      showError('Need at least 4 players to start!')
      return
    }
    
    const result = await startRound(user.id)
    if (result.success) {
      navigate(`/game/${roomId}`)
    } else {
      showError(result.error)
    }
  }
  
  const isHost = user?.id === room?.host_id
  
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
                <div className="text-6xl font-bold font-mono text-neon-cyan tracking-widest">
                  {room?.room_code || '------'}
                </div>
                <Button variant="outline" size="sm" icon={Copy} onClick={handleCopyCode}>Copy</Button>
              </div>
              <div className="flex items-center justify-center gap-6 text-gray-400">
                <span>Mode: <span className="text-white">{room ? getGameModeDisplay(room.game_mode) : '-'}</span></span>
                <span>•</span>
                <span>Difficulty: <span className="text-white">{room ? getDifficultyDisplay(room.difficulty) : '-'}</span></span>
                <span>•</span>
                <span>Pack: <span className="text-white">{room ? getWordPackDisplay(room.word_pack) : '-'}</span></span>
              </div>
            </div>
          </Card>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <UsersIcon className="text-neon-cyan" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Players ({participants.length}/{room?.max_players || 8})</h2>
              </div>
              <div className="space-y-3">
                {participants.map((participant, index) => (
                  <motion.div key={participant.id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.1 }} className="flex items-center gap-3 p-3 bg-dark-bg rounded-lg">
                    <img src={participant.profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${participant.user_id}`} alt="Avatar" className="w-10 h-10 rounded-full" />
                    <div className="flex-1">
                      <p className="text-white font-medium">{participant.profile?.username || 'Player'}</p>
                      {participant.user_id === room?.host_id && <span className="text-xs text-neon-cyan">Host</span>}
                    </div>
                    {participant.is_alive && <span className="text-green-500 text-sm">Ready</span>}
                  </motion.div>
                ))}
                {participants.length === 0 && <p className="text-gray-500 text-center py-8">Waiting for players...</p>}
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
                    <li>One player gets a different word (the traitor)</li>
                    <li>Give one-line hints about your word</li>
                    <li>Discuss and vote who you think is the traitor</li>
                    <li>Catch the traitor to win!</li>
                  </ol>
                </div>
                <div className="pt-4 border-t border-gray-700">
                  <p className="text-sm text-gray-400 mb-2">Share this code with friends:</p>
                  <div className="flex gap-2">
                    <input type="text" readOnly value={`Join WordTraitor with code: ${room?.room_code || ''}`} className="flex-1 px-3 py-2 bg-dark-bg border border-gray-700 rounded text-white text-sm" />
                  </div>
                </div>
              </div>
            </Card>
          </div>
          
          {isHost && (
            <Card className="text-center">
              <h3 className="text-xl font-heading font-bold text-white mb-4">Ready to Start?</h3>
              <p className="text-gray-400 mb-6">You need at least 4 players to begin the game</p>
              <Button variant="primary" size="xl" icon={Play} onClick={handleStartGame} loading={loading} disabled={participants.length < 4} className="w-full md:w-auto">
                Start Game
              </Button>
            </Card>
          )}
          
          {!isHost && (
            <Card className="text-center">
              <p className="text-gray-400">Waiting for host to start the game...</p>
            </Card>
          )}
        </motion.div>
      </div>
    </PageContainer>
  )
}

export default Lobby