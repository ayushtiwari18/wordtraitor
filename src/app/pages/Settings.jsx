import { Volume2, VolumeX, Sparkles, SparklesIcon, User } from 'lucide-react'
import { useGuestStore } from '@/store/guestStore'
import { useUIStore } from '@/store/uiStore'
import { useNavigate } from 'react-router-dom'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'
import Button from '@/components/Button'
import ToastContainer from '@/components/Toast'

const Settings = () => {
  const { username, clearGuest } = useGuestStore()
  const { soundEnabled, particlesEnabled, toggleSound, toggleParticles, showSuccess } = useUIStore()
  const navigate = useNavigate()
  
  const handleToggleSound = () => {
    toggleSound()
    showSuccess(soundEnabled ? 'Sound disabled' : 'Sound enabled')
  }
  
  const handleToggleParticles = () => {
    toggleParticles()
    showSuccess(particlesEnabled ? 'Particles disabled' : 'Particles enabled')
  }
  
  const handleChangeUsername = () => {
    clearGuest()
    showSuccess('Username cleared. Set new one on home page.')
    navigate('/')
  }
  
  return (
    <PageContainer>
      <AppHeader />
      <ToastContainer />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-4xl font-heading font-bold text-white text-center mb-8">Settings</h1>
          
          <Card className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Account</h2>
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
              <div className="flex items-center gap-3">
                <User className="text-neon-cyan" size={24} />
                <div>
                  <p className="text-white font-medium">Username</p>
                  <p className="text-sm text-gray-400">Currently: {username || 'Not set'}</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={handleChangeUsername}>Change</Button>
            </div>
          </Card>
          
          <Card className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Audio</h2>
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
              <div className="flex items-center gap-3">
                {soundEnabled ? <Volume2 className="text-neon-cyan" size={24} /> : <VolumeX className="text-gray-500" size={24} />}
                <div>
                  <p className="text-white font-medium">Sound Effects</p>
                  <p className="text-sm text-gray-400">Game sounds and notifications</p>
                </div>
              </div>
              <button onClick={handleToggleSound} className={`relative w-14 h-8 rounded-full transition-colors ${soundEnabled?'bg-neon-cyan':'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${soundEnabled?'translate-x-6':''}`} />
              </button>
            </div>
          </Card>
          
          <Card className="mb-6">
            <h2 className="text-2xl font-heading font-bold text-white mb-6">Visual</h2>
            <div className="flex items-center justify-between p-4 bg-dark-bg rounded-lg">
              <div className="flex items-center gap-3">
                {particlesEnabled ? <Sparkles className="text-neon-purple" size={24} /> : <SparklesIcon className="text-gray-500" size={24} />}
                <div>
                  <p className="text-white font-medium">Particle Effects</p>
                  <p className="text-sm text-gray-400">Animated visual effects</p>
                </div>
              </div>
              <button onClick={handleToggleParticles} className={`relative w-14 h-8 rounded-full transition-colors ${particlesEnabled?'bg-neon-purple':'bg-gray-700'}`}>
                <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform ${particlesEnabled?'translate-x-6':''}`} />
              </button>
            </div>
          </Card>
          
          <Card>
            <h2 className="text-2xl font-heading font-bold text-white mb-6">About</h2>
            <div className="space-y-4 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">Version</span><span className="text-white">0.1.0</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Build</span><span className="text-white">Alpha</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Repository</span><a href="https://github.com/ayushtiwari18/wordtraitor" target="_blank" rel="noopener noreferrer" className="text-neon-cyan hover:underline">GitHub</a></div>
            </div>
          </Card>
        </div>
      </div>
    </PageContainer>
  )
}

export default Settings