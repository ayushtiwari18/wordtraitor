import { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Trophy, Target, Award } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import PageContainer from '@/components/PageContainer'
import AppHeader from '@/components/AppHeader'
import Card from '@/components/Card'
import Button from '@/components/Button'
import Input from '@/components/Input'
import ToastContainer from '@/components/Toast'

const Profile = () => {
  const { profile, updateProfile } = useAuthStore()
  const { showSuccess, showError } = useUIStore()
  const [editing, setEditing] = useState(false)
  const [username, setUsername] = useState(profile?.username || '')
  const [saving, setSaving] = useState(false)
  
  const handleSave = async () => {
    try {
      setSaving(true)
      const result = await updateProfile({ username })
      if (result.success) {
        showSuccess('Profile updated successfully!')
        setEditing(false)
      } else {
        showError(result.error)
      }
    } catch (error) {
      showError(error.message)
    } finally {
      setSaving(false)
    }
  }
  
  const stats = {
    gamesPlayed: 42,
    winRate: 67,
    timesCaughtAsTraitor: 8,
    timesSuccessfulAsTraitor: 15,
    bestHints: 23
  }
  
  return (
    <PageContainer>
      <AppHeader />
      <ToastContainer />
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
            <Card glow className="text-center mb-8">
              <img src={profile?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile?.username}`} alt="Avatar" className="w-32 h-32 rounded-full mx-auto mb-4 border-4 border-neon-cyan" />
              {editing ? (
                <div className="max-w-sm mx-auto">
                  <Input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" className="mb-4" />
                  <div className="flex gap-2 justify-center">
                    <Button variant="primary" onClick={handleSave} loading={saving}>Save</Button>
                    <Button variant="outline" onClick={() => setEditing(false)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <>
                  <h1 className="text-4xl font-heading font-bold text-white mb-2">{profile?.username || 'Player'}</h1>
                  <Button variant="outline" size="sm" icon={User} onClick={() => setEditing(true)}>Edit Profile</Button>
                </>
              )}
            </Card>
          </motion.div>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <Trophy className="text-neon-cyan" size={24} />
                  <h2 className="text-2xl font-heading font-bold text-white">Statistics</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Games Played</span>
                    <span className="text-2xl font-bold text-white">{stats.gamesPlayed}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Win Rate</span>
                    <span className="text-2xl font-bold text-neon-cyan">{stats.winRate}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Best Hints</span>
                    <span className="text-2xl font-bold text-neon-purple">{stats.bestHints}</span>
                  </div>
                </div>
              </Card>
            </motion.div>
            
            <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }}>
              <Card>
                <div className="flex items-center gap-3 mb-4">
                  <Target className="text-neon-purple" size={24} />
                  <h2 className="text-2xl font-heading font-bold text-white">Traitor Stats</h2>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Times Caught</span>
                    <span className="text-2xl font-bold text-red-500">{stats.timesCaughtAsTraitor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Times Successful</span>
                    <span className="text-2xl font-bold text-green-500">{stats.timesSuccessfulAsTraitor}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Success Rate</span>
                    <span className="text-2xl font-bold text-white">{Math.round((stats.timesSuccessfulAsTraitor / (stats.timesCaughtAsTraitor + stats.timesSuccessfulAsTraitor)) * 100)}%</span>
                  </div>
                </div>
              </Card>
            </motion.div>
          </div>
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
            <Card>
              <div className="flex items-center gap-3 mb-4">
                <Award className="text-neon-cyan" size={24} />
                <h2 className="text-2xl font-heading font-bold text-white">Achievements</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {['First Win', 'Traitor Master', 'Hint Expert', 'Perfect Game', 'Social Butterfly', 'Detective', 'Comeback King', 'Speedrunner'].map((achievement, index) => (
                  <div key={achievement} className="p-4 bg-dark-bg rounded-lg text-center hover:bg-gray-800 transition-colors">
                    <div className="w-12 h-12 mx-auto mb-2 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-full flex items-center justify-center">
                      <Trophy size={24} className="text-white" />
                    </div>
                    <p className="text-xs text-white font-medium">{achievement}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </PageContainer>
  )
}

export default Profile