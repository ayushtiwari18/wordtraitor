import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import { useState } from 'react'

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  iconPosition = 'left',
  className = '',
  fullWidth = false,
  ...props
}) => {
  const [ripples, setRipples] = useState([])

  const handleClick = (e) => {
    if (disabled || loading) return

    // Create ripple effect
    const button = e.currentTarget
    const rect = button.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = e.clientX - rect.left - size / 2
    const y = e.clientY - rect.top - size / 2

    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    }

    setRipples(prev => [...prev, newRipple])
    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)

    if (onClick) {
      onClick(e)
    }
  }

  const baseStyles = 'font-heading font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 relative overflow-hidden'
  
  const variants = {
    primary: 'bg-gradient-to-r from-neon-cyan to-cyan-500 text-dark-bg hover:shadow-lg hover:shadow-neon-cyan/50 hover:-translate-y-0.5 active:translate-y-0',
    secondary: 'bg-gradient-to-r from-neon-purple to-purple-600 text-white hover:shadow-lg hover:shadow-neon-purple/50 hover:-translate-y-0.5 active:translate-y-0',
    outline: 'border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-dark-bg hover:shadow-lg hover:shadow-neon-cyan/30',
    ghost: 'text-neon-cyan hover:bg-neon-cyan/10 hover:shadow-md',
    danger: 'bg-gradient-to-r from-red-600 to-red-700 text-white hover:from-red-700 hover:to-red-800 hover:shadow-lg hover:shadow-red-500/50',
    success: 'bg-gradient-to-r from-green-600 to-green-700 text-white hover:from-green-700 hover:to-green-800 hover:shadow-lg hover:shadow-green-500/50'
  }
  
  const sizes = {
    xs: 'px-3 py-1.5 text-xs',
    sm: 'px-4 py-2 text-sm',
    md: 'px-6 py-3 text-base',
    lg: 'px-8 py-4 text-lg',
    xl: 'px-10 py-5 text-xl'
  }
  
  const isDisabled = disabled || loading
  
  return (
    <motion.button
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      onClick={handleClick}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${fullWidth ? 'w-full' : ''}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {/* Ripple effects */}
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none animate-ripple"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
            animation: 'ripple 0.6s ease-out'
          }}
        />
      ))}

      {loading ? (
        <>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          >
            <Loader2 size={20} />
          </motion.div>
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && (
            <motion.div
              whileHover={{ scale: 1.2, rotate: 5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Icon size={20} />
            </motion.div>
          )}
          <span>{children}</span>
          {Icon && iconPosition === 'right' && (
            <motion.div
              whileHover={{ scale: 1.2, rotate: -5 }}
              transition={{ type: 'spring', stiffness: 400 }}
            >
              <Icon size={20} />
            </motion.div>
          )}
        </>
      )}
    </motion.button>
  )
}

export default Button