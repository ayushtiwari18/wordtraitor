import { Link, useNavigate } from 'react-router-dom'
import { Settings, User, LogOut } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import Button from './Button'

const AppHeader = ({ showNav = true }) => {
  const { profile, signOut } = useAuthStore()
  const navigate = useNavigate()
  
  const handleSignOut = async () => {
    await signOut()
    navigate('/auth')
  }
  
  return (
    <header className="bg-dark-card/50 backdrop-blur-sm border-b border-gray-800">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          {/* Logo */}
          <Link to="/home" className="flex items-center gap-2">
            <div className="w-10 h-10 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-lg flex items-center justify-center">
              <span className="text-2xl font-bold text-white">W</span>
            </div>
            <span className="text-2xl font-heading font-bold text-white hidden sm:block">
              WordTraitor
            </span>
          </Link>
          
          {/* Navigation */}
          {showNav && (
            <nav className="flex items-center gap-2">
              <Link to="/profile">
                <Button variant="ghost" size="sm" icon={User}>
                  <span className="hidden sm:inline">{profile?.username}</span>
                </Button>
              </Link>
              
              <Link to="/settings">
                <Button variant="ghost" size="sm" icon={Settings}>
                  <span className="hidden sm:inline">Settings</span>
                </Button>
              </Link>
              
              <Button 
                variant="ghost" 
                size="sm" 
                icon={LogOut}
                onClick={handleSignOut}
              >
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </nav>
          )}
        </div>
      </div>
    </header>
  )
}

export default AppHeader