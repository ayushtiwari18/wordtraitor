import { useState } from 'react'
import { motion } from 'framer-motion'
import { Mail, Lock, User, LogIn, UserPlus } from 'lucide-react'
import { useAuthStore } from '@/store/authStore'
import { useUIStore } from '@/store/uiStore'
import { isValidEmail, isValidUsername } from '@/lib/utils'
import Button from '@/components/Button'
import Input from '@/components/Input'
import PageContainer from '@/components/PageContainer'

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false)
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  })
  const [errors, setErrors] = useState({})
  
  const { signIn, signUp, loading } = useAuthStore()
  const { showSuccess, showError } = useUIStore()
  
  const validate = () => {
    const newErrors = {}
    
    if (!isValidEmail(formData.email)) {
      newErrors.email = 'Invalid email address'
    }
    
    if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }
    
    if (isSignUp && !isValidUsername(formData.username)) {
      newErrors.username = 'Username must be 3-20 characters (letters, numbers, underscore)'
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault()
    
    if (!validate()) return
    
    try {
      if (isSignUp) {
        const result = await signUp(formData.email, formData.password, formData.username)
        if (result.success) {
          showSuccess('Account created! Welcome to WordTraitor!')
        } else {
          showError(result.error || 'Sign up failed')
        }
      } else {
        const result = await signIn(formData.email, formData.password)
        if (result.success) {
          showSuccess('Welcome back!')
        } else {
          showError(result.error || 'Sign in failed')
        }
      }
    } catch (error) {
      showError(error.message)
    }
  }
  
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }))
    if (errors[e.target.name]) {
      setErrors(prev => ({ ...prev, [e.target.name]: '' }))
    }
  }
  
  return (
    <PageContainer>
      <div className="min-h-screen flex items-center justify-center px-4 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-8">
            <motion.div
              animate={{
                scale: [1, 1.05, 1],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-neon-cyan to-neon-purple rounded-2xl flex items-center justify-center shadow-neon-cyan"
            >
              <span className="text-4xl font-bold text-white">W</span>
            </motion.div>
            
            <h1 className="text-4xl font-heading font-bold text-white mb-2">
              WordTraitor
            </h1>
            <p className="text-gray-400 text-lg">
              One word apart. One traitor among you.
            </p>
          </div>
          
          <div className="bg-dark-card rounded-xl p-8 border border-gray-800 shadow-2xl">
            <div className="flex gap-2 mb-6">
              <Button
                variant={!isSignUp ? 'primary' : 'ghost'}
                onClick={() => setIsSignUp(false)}
                className="flex-1"
              >
                Sign In
              </Button>
              <Button
                variant={isSignUp ? 'primary' : 'ghost'}
                onClick={() => setIsSignUp(true)}
                className="flex-1"
              >
                Sign Up
              </Button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              {isSignUp && (
                <Input
                  label="Username"
                  name="username"
                  type="text"
                  placeholder="Enter username"
                  value={formData.username}
                  onChange={handleChange}
                  error={errors.username}
                  icon={User}
                />
              )}
              
              <Input
                label="Email"
                name="email"
                type="email"
                placeholder="Enter email"
                value={formData.email}
                onChange={handleChange}
                error={errors.email}
                icon={Mail}
              />
              
              <Input
                label="Password"
                name="password"
                type="password"
                placeholder="Enter password"
                value={formData.password}
                onChange={handleChange}
                error={errors.password}
                icon={Lock}
              />
              
              <Button
                type="submit"
                variant="primary"
                size="lg"
                loading={loading}
                icon={isSignUp ? UserPlus : LogIn}
                className="w-full mt-6"
              >
                {isSignUp ? 'Create Account' : 'Sign In'}
              </Button>
            </form>
          </div>
          
          <p className="text-center text-gray-500 text-sm mt-6">
            By continuing, you agree to our Terms of Service and Privacy Policy
          </p>
        </motion.div>
      </div>
    </PageContainer>
  )
}

export default Auth