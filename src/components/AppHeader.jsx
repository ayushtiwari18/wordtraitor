import { Link, useNavigate } from 'react-router-dom'
import { Settings, User, Home as HomeIcon } from 'lucide-react'
import { useGuestStore } from '@/store/guestStore'
import Button from './Button'

const AppHeader = ({ showNav = true }) => {
  const { username, avatar } = useGuestStore()
  const navigate = useNavigate()
  
  return (
    <header className="bg-dark-card/50 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">W</span>
            </div>
            <span className="text-2xl font-heading font-bold text-white hidden sm:block">WordTraitor</span>
          </Link>
          
          {showNav && username && (
            <nav className="flex items-center gap-2">
              <div className="flex items-center gap-2 mr-4">
                {avatar && <img src={avatar} alt="Avatar" className="w-8 h-8 rounded-full" />}
                <span className="text-white font-medium hidden sm:inline">{username}</span>
              </div>
              
              <Link to="/home">
                <Button variant="ghost" size="sm" icon={HomeIcon}>
                  <span className="hidden sm:inline">Home</span>
                </Button>
              </Link>
              
              <Link to="/settings">
                <Button variant="ghost" size="sm" icon={Settings}>
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader