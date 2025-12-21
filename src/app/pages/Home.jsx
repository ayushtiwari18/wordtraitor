import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Play, Users, Settings } from 'lucide-react'
import { useGuestStore } from '@/store/guestStore'
import { useUIStore } from '@/store/uiStore'
import { gameHelpers, isSupabaseConfigured } from '@/lib/supabase'
import { isValidRoomCode } from '@/lib/utils'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Modal from '@/components/Modal'
import ToastContainer from '@/components/Toast'

const Home = () => {
  const navigate = useNavigate()
  const { username, setUsername: saveUsername } = useGuestStore()
  const { showSuccess, showError } = useUIStore()
  
  const [showUsernameModal, setShowUsernameModal] = useState(false)
  const [usernameInput, setUsernameInput] = useState('')
  const [pendingAction, setPendingAction] = useState(null)
  
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [gameMode, setGameMode] = useState('SILENT')
  const [difficulty, setDifficulty] = useState('MEDIUM')
  const [wordPack, setWordPack] = useState('GENERAL')
  const [creating, setCreating] = useState(false)
  
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [roomCodeInput, setRoomCodeInput] = useState('')
  const [joining, setJoining] = useState(false)
  
  useEffect(() => {
    // Check Supabase configuration on mount
    if (!isSupabaseConfigured()) {
      showError('Supabase not configured. Please add your credentials to .env')
    }
  }, [])
  
  const handleCreateClick = () => {
    if (!username) {
      setPendingAction('create')
      setShowUsernameModal(true)
    } else {
      setShowCreateModal(true)
    }
  }
  
  const handleJoinClick = () => {
    if (!username) {
      setPendingAction('join')
      setShowUsernameModal(true)
    } else {
      setShowJoinModal(true)
    }
  }
  
  const handleUsernameSubmit = async () => {
    if (usernameInput.length < 3) {
      showError('Username must be at least 3 characters')
      return
    }
    
    await saveUsername(usernameInput)
    showSuccess(`Welcome, ${usernameInput}!`)
    setShowUsernameModal(false)
    
    if (pendingAction === 'create') {
      setShowCreateModal(true)
    } else if (pendingAction === 'join') {
      setShowJoinModal(true)
    }
    
    setPendingAction(null)
  }
  
  const handleCreateRoom = async () => {
    if (!username) return
    
    if (!isSupabaseConfigured()) {
      showError('Supabase not configured')
      return
    }
    
    try {
      setCreating(true)
      
      const { guestId, avatar } = useGuestStore.getState()
      const room = await gameHelpers.createRoom(guestId, username, gameMode, difficulty, wordPack)
      
      showSuccess('Room created!')
      setShowCreateModal(false)
      navigate(`/lobby/${room.room_code}`)
    } catch (error) {
      console.error('Create room error:', error)
      showError(error.message || 'Failed to create room')
    } finally {
      setCreating(false)
    }
  }
  
  const handleJoinRoom = async () => {
    if (!username || !roomCodeInput) return
    
    if (!isValidRoomCode(roomCodeInput)) {
      showError('Invalid room code format')
      return
    }
    
    if (!isSupabaseConfigured()) {
      showError('Supabase not configured')
      return
    }
    
    try {
      setJoining(true)
      
      // Just navigate to lobby, joining happens there
      showSuccess('Joining room...')
      setShowJoinModal(false)
      navigate(`/lobby/${roomCodeInput.toUpperCase()}`)
    } catch (error) {
      console.error('Join room error:', error)
      showError(error.message || 'Failed to join room')
    } finally {
      setJoining(false)
    }
  }
  
  return (
    <PageContainer>
      <AppHeader />
      <ToastContainer />
      
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Hero Section */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-6xl font-heading font-bold bg-gradient-to-r from-neon-cyan to-neon-purple bg-clip-text text-transparent mb-4">
              WordTraitor
            </h1>
            <p className="text-xl text-gray-400 mb-2">
              One word apart. One traitor among you.
            </p>
            <p className="text-sm text-gray-500">
              A social deduction word game for 4-12 players
            </p>
          </motion.div>
          
          {/* Action Cards */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card
                hover
                className="h-full cursor-pointer"
                onClick={handleCreateClick}
              >
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neon-cyan/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Play className="text-neon-cyan" size={32} />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-white mb-2">
                    Create Circle
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Start a new game and invite friends
                  </p>
                  <Button variant="primary" size="lg" icon={Play}>
                    Create Room
                  </Button>
                </div>
              </Card>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card
                hover
                className="h-full cursor-pointer"
                onClick={handleJoinClick}
              >
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-neon-purple/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="text-neon-purple" size={32} />
                  </div>
                  <h2 className="text-2xl font-heading font-bold text-white mb-2">
                    Join Circle
                  </h2>
                  <p className="text-gray-400 mb-6">
                    Enter a room code to join
                  </p>
                  <Button variant="outline" size="lg" icon={Users}>
                    Join Room
                  </Button>
                </div>
              </Card>
            </motion.div>
          </div>
          
          {/* How to Play */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card>
              <h2 className="text-2xl font-heading font-bold text-white mb-6 text-center">
                How to Play
              </h2>
              
              <div className="grid sm:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="w-12 h-12 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-purple-400">1</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">The Whisper</h3>
                  <p className="text-sm text-gray-400">
                    Everyone gets a secret word. One player gets a different word - they're the traitor!
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-cyan-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-cyan-400">2</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">Drop Hints</h3>
                  <p className="text-sm text-gray-400">
                    Give hints about your word without revealing it. Be careful not to expose yourself!
                  </p>
                </div>
                
                <div className="text-center">
                  <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-3">
                    <span className="text-2xl font-bold text-red-400">3</span>
                  </div>
                  <h3 className="font-bold text-white mb-2">Find the Traitor</h3>
                  <p className="text-sm text-gray-400">
                    Discuss, debate, and vote to eliminate the traitor. But be careful - they're hiding among you!
                  </p>
                </div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
      
      {/* Username Modal */}
      <Modal
        isOpen={showUsernameModal}
        onClose={() => setShowUsernameModal(false)}
        title="Choose Your Username"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Pick a username to identify yourself in the game
          </p>
          <input
            type="text"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            placeholder="Enter username (3-20 characters)"
            className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
            maxLength={20}
            onKeyPress={(e) => e.key === 'Enter' && handleUsernameSubmit()}
            autoFocus
          />
          <Button
            variant="primary"
            onClick={handleUsernameSubmit}
            disabled={usernameInput.length < 3}
            className="w-full"
          >
            Start Playing
          </Button>
        </div>
      </Modal>
      
      {/* Create Room Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create Game Room"
      >
        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Game Mode
            </label>
            <select
              value={gameMode}
              onChange={(e) => setGameMode(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
            >
              <option value="SILENT">Silent Circle</option>
              <option value="REAL">Real Circle</option>
              <option value="FLASH">Flash Round</option>
              <option value="AFTER_DARK">After Dark</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Difficulty
            </label>
            <select
              value={difficulty}
              onChange={(e) => setDifficulty(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
            >
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Word Pack
            </label>
            <select
              value={wordPack}
              onChange={(e) => setWordPack(e.target.value)}
              className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white focus:outline-none focus:border-neon-cyan"
            >
              <option value="GENERAL">General</option>
              <option value="MOVIES">Movies</option>
              <option value="TECH">Tech</option>
              <option value="TRAVEL">Travel</option>
              <option value="FOOD">Food</option>
            </select>
          </div>
          
          <Button
            variant="primary"
            onClick={handleCreateRoom}
            disabled={creating}
            className="w-full"
          >
            {creating ? 'Creating...' : 'Create Room'}
          </Button>
        </div>
      </Modal>
      
      {/* Join Room Modal */}
      <Modal
        isOpen={showJoinModal}
        onClose={() => setShowJoinModal(false)}
        title="Join Game Room"
      >
        <div className="space-y-4">
          <p className="text-gray-400 text-sm">
            Enter the 6-character room code to join
          </p>
          <input
            type="text"
            value={roomCodeInput}
            onChange={(e) => setRoomCodeInput(e.target.value.toUpperCase())}
            placeholder="Enter room code"
            className="w-full px-4 py-3 bg-dark-bg border border-gray-700 rounded-lg text-white text-center text-2xl font-mono tracking-widest placeholder-gray-500 focus:outline-none focus:border-neon-cyan"
            maxLength={6}
            onKeyPress={(e) => e.key === 'Enter' && handleJoinRoom()}
            autoFocus
          />
          <Button
            variant="primary"
            onClick={handleJoinRoom}
            disabled={roomCodeInput.length !== 6 || joining}
            className="w-full"
          >
            {joining ? 'Joining...' : 'Join Room'}
          </Button>
        </div>
      </Modal>
    </PageContainer>
  )
}

export default Home