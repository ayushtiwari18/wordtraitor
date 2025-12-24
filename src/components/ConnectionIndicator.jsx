import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'

const ConnectionIndicator = ({ isConnected, subscriptionState, showLabel = true, className = '' }) => {
  // Determine connection status
  const getStatus = () => {
    if (subscriptionState === 'connected' && isConnected) {
      return { color: 'bg-green-400', label: 'Connected', icon: '✓' }
    }
    if (subscriptionState === 'connecting' || subscriptionState === 'disconnected') {
      return { color: 'bg-yellow-400', label: 'Connecting...', icon: '⌛' }
    }
    return { color: 'bg-red-400', label: 'Disconnected', icon: '⚠' }
  }

  const status = getStatus()
  const isHealthy = status.color === 'bg-green-400'

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="relative">
        {/* Status dot */}
        <motion.div
          className={`w-2 h-2 rounded-full ${status.color}`}
          animate={isHealthy ? {
            scale: [1, 1.2, 1],
            opacity: [1, 0.8, 1]
          } : {}}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        
        {/* Pulse ring when connected */}
        {isHealthy && (
          <motion.div
            className="absolute inset-0 rounded-full bg-green-400"
            initial={{ scale: 1, opacity: 0.6 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </div>

      {/* Label */}
      {showLabel && (
        <AnimatePresence mode="wait">
          <motion.span
            key={status.label}
            initial={{ opacity: 0, x: -5 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 5 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-gray-400 font-medium"
          >
            {status.icon} {status.label}
          </motion.span>
        </AnimatePresence>
      )}
    </div>
  )
}

export default ConnectionIndicator