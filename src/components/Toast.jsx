import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react'
import { useEffect } from 'react'

const Toast = ({
  message,
  type = 'info',
  isOpen,
  onClose,
  duration = 5000,
  position = 'top-right',
  showIcon = true,
  action,
  actionLabel = 'Undo'
}) => {
  useEffect(() => {
    if (isOpen && duration) {
      const timer = setTimeout(() => {
        onClose()
      }, duration)

      return () => clearTimeout(timer)
    }
  }, [isOpen, duration, onClose])

  const positions = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2'
  }

  const variants = {
    info: {
      bg: 'bg-gradient-to-r from-blue-600 to-blue-700',
      icon: Info,
      color: 'text-blue-300'
    },
    success: {
      bg: 'bg-gradient-to-r from-green-600 to-green-700',
      icon: CheckCircle,
      color: 'text-green-300'
    },
    error: {
      bg: 'bg-gradient-to-r from-red-600 to-red-700',
      icon: AlertCircle,
      color: 'text-red-300'
    },
    warning: {
      bg: 'bg-gradient-to-r from-yellow-600 to-yellow-700',
      icon: AlertTriangle,
      color: 'text-yellow-300'
    }
  }

  const variant = variants[type]
  const Icon = variant.icon

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: position.includes('top') ? -50 : 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9, x: position.includes('right') ? 100 : position.includes('left') ? -100 : 0 }}
          transition={{ type: 'spring', duration: 0.5, bounce: 0.3 }}
          className={`fixed ${positions[position]} z-50 max-w-md w-full pointer-events-auto`}
        >
          <motion.div
            className={`
              ${variant.bg} text-white rounded-lg shadow-2xl
              border border-white/20 backdrop-blur-sm
              p-4 flex items-start gap-3
            `}
            whileHover={{ scale: 1.02 }}
          >
            {/* Icon */}
            {showIcon && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', delay: 0.1 }}
                className="flex-shrink-0"
              >
                <Icon size={24} />
              </motion.div>
            )}

            {/* Content */}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium leading-relaxed">{message}</p>
              
              {action && (
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action}
                  className="mt-2 text-xs font-semibold underline hover:no-underline"
                >
                  {actionLabel}
                </motion.button>
              )}
            </div>

            {/* Close Button */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="flex-shrink-0 text-white/70 hover:text-white transition-colors"
            >
              <X size={18} />
            </motion.button>

            {/* Progress Bar */}
            {duration && (
              <motion.div
                className="absolute bottom-0 left-0 h-1 bg-white/30 rounded-b-lg"
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: duration / 1000, ease: 'linear' }}
              />
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

export default Toast