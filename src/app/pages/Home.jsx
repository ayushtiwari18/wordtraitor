import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Plus, Users } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useGameStore } from '@/store/gameStore'
import { useUIStore } from '@/store/uiStore'
import { GAME_MODES, DIFFICULTY_LEVELS, WORD_PACKS } from '@/lib/constants'
import { getGameModeDisplay, getDifficultyDisplay, getWordPackDisplay } from '@/lib/utils'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Button from '@/components/Button'
import Card from '@/components/Card'
import Modal from '@/components/Modal'
import Input from '@/components/Input'
import ToastContainer from '@/components/Toast'

const Home = () => {
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const { createRoom, joinRoom } = useGameStore()
  const { showSuccess, showError } = useUIStore()
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomCode, setRoomCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [joining, setJoining] = useState(false)
  const [settings, setSettings] = useState({
    gameMode: GAME_MODES.SILENT,
    difficulty: DIFFICULTY_LEVELS.MEDIUM,
    wordPack: WORD_PACKS.GENERAL
  })
  
  const handleCreateRoom = async () => {
    try {
      setCreating(true)
      const result = await createRoom(user.id, settings.gameMode, settings.difficulty, settings.wordPack)
      if (result.success) {
        showSuccess(`Room created! Code: ${result.roomCode}`)
        setShowCreateModal(false)
        navigate(`/lobby/${result.roomId}`)
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError(error.message)
    } finally {
      setCreating(false)
    }
  }
  
  const handleJoinRoom = async () => {
    try {
      if (!roomCode || roomCode.length !== 6) {
        showError('Please enter a valid 6-character room code')
        return
      }
      setJoining(true)
      const result = await joinRoom(roomCode.toUpperCase(), user.id)
      if (result.success) {
        showSuccess('Joined room successfully!')
        setShowJoinModal(false)
        navigate(`/lobby/${result.roomId}`)
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError(error.message)
    } finally {
      setJoining(false)
    }
  }
  
  return (
    <PageContainer>
      <AppHeader />
      <ToastContainer />
      <div className="container mx-auto px-4 py-12">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-16">
          <motion.h1 animate={{ textShadow: ['0 0 20px rgba(0,255,255,0.5)', '0 0 40px rgba(138,43,226,0.5)', '0 0 20px rgba(0,255,255,0.5)'] }} transition={{ duration: 3, repeat: Infinity }} className="text-6xl md:text-7xl font-heading font-black text-white mb-4">WordTraitor</motion.h1>
          <p className="text-xl md:text-2xl text-gray-300 mb-2">One word apart. One traitor among you.</p>
          <p className="text-gray-400 max-w-2xl mx-auto">A real-time multiplayer social deduction game where clever hints and sharp observations win the day.</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto mb-16">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
            <Card hover glow className="h-full">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-neon-cyan/20 rounded-full flex items-center justify-center"><Plus size={32} className="text-neon-cyan" /></div>
                <h3 className="text-2xl font-heading font-bold text-white mb-2">Create Circle</h3>
                <p className="text-gray-400 mb-6">Start a new game and invite your friends</p>
                <Button variant="primary" size="lg" onClick={() => setShowCreateModal(true)} className="w-full">Create Room</Button>
              </div>
            </Card>
          </motion.div>
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
            <Card hover glow className="h-full">
              <div className="text-center py-8">
                <div className="w-16 h-16 mx-auto mb-4 bg-neon-purple/20 rounded-full flex items-center justify-center"><Users size={32} className="text-neon-purple" /></div>
                <h3 className="text-2xl font-heading font-bold text-white mb-2">Join Circle</h3>
                <p className="text-gray-400 mb-6">Enter a room code to join existing game</p>
                <Button variant="secondary" size="lg" onClick={() => setShowJoinModal(true)} className="w-full">Join Room</Button>
              </div>
            </Card>
          </motion.div>
        </div>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-heading font-bold text-white text-center mb-8">How to Play</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[{step:1,title:'Receive Word',desc:'Everyone gets a secret word—except the traitor gets a slightly different one'},{step:2,title:'Give Hints',desc:'Each player submits one-line hints about their word without revealing it'},{step:3,title:'Vote & Win',desc:'Discuss, identify the traitor, and vote. Catch them to win!'}].map((item)=>(<Card key={item.step} className="text-center"><div className="w-12 h-12 mx-auto mb-4 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center text-2xl font-bold text-white">{item.step}</div><h4 className="text-xl font-heading font-bold text-white mb-2">{item.title}</h4><p className="text-gray-400 text-sm">{item.desc}</p></Card>))}
          </div>
        </motion.div>
      </div>
      <Modal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} title="Create New Circle" size="md">
        <div className="space-y-6">
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Game Mode</label><div className="grid grid-cols-2 gap-2">{Object.values(GAME_MODES).map((mode)=>(<button key={mode} onClick={()=>setSettings(prev=>({...prev,gameMode:mode}))} className={`p-3 rounded-lg border transition-all ${settings.gameMode===mode?'border-neon-cyan bg-neon-cyan/10 text-neon-cyan':'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{getGameModeDisplay(mode)}</button>))}</div></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Difficulty</label><div className="grid grid-cols-3 gap-2">{Object.values(DIFFICULTY_LEVELS).map((level)=>(<button key={level} onClick={()=>setSettings(prev=>({...prev,difficulty:level}))} className={`p-3 rounded-lg border transition-all ${settings.difficulty===level?'border-neon-cyan bg-neon-cyan/10 text-neon-cyan':'border-gray-700 text-gray-400 hover:border-gray-600'}`}>{getDifficultyDisplay(level)}</button>))}</div></div>
          <div><label className="block text-sm font-medium text-gray-300 mb-2">Word Pack</label><select value={settings.wordPack} onChange={(e)=>setSettings(prev=>({...prev,wordPack:e.target.value}))} className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-neon-cyan">{Object.values(WORD_PACKS).map((pack)=>(<option key={pack} value={pack}>{getWordPackDisplay(pack)}</option>))}</select></div>
          <Button variant="primary" size="lg" onClick={handleCreateRoom} loading={creating} className="w-full">Create Circle</Button>
        </div>
      </Modal>
      <Modal isOpen={showJoinModal} onClose={() => setShowJoinModal(false)} title="Join Circle" size="sm">
        <div className="space-y-6"><Input label="Room Code" type="text" placeholder="Enter 6-character code" value={roomCode} onChange={(e)=>setRoomCode(e.target.value.toUpperCase())} maxLength={6} className="text-center text-2xl tracking-widest" /><Button variant="primary" size="lg" onClick={handleJoinRoom} loading={joining} className="w-full">Join Circle</Button></div>
      </Modal>
    </PageContainer>
  )
}

export default Home