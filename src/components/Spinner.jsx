import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const Spinner = ({
  size = 'md',
  variant = 'cyan',
  text,
  className = ''
}) => {
  const sizes = {
    xs: 'w-4 h-4',
    sm: 'w-6 h-6',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  }

  const variants = {
    cyan: 'text-neon-cyan',
    purple: 'text-neon-purple',
    white: 'text-white',
    gray: 'text-gray-400'
  }

  const textSizes = {
    xs: 'text-xs',
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl'
  }

  return (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        className={`${sizes[size]} ${variants[variant]}`}
      >
        <Loader2 className="w-full h-full" />
      </motion.div>
      
      {text && (
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 1.5, repeat: Infinity }}
          className={`${textSizes[size]} ${variants[variant]} font-medium`}
        >
          {text}
        </motion.p>
      )}
    </div>
  )
}

export default Spinner