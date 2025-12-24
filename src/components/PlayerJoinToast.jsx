import React, { useEffect } from 'react'
import { motion } from 'framer-motion'

const PlayerJoinToast = ({ username, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose()
    }, 3000) // Auto-dismiss after 3 seconds

    return () => clearTimeout(timer)
  }, [onClose])

  return (
    <motion.div 
      className="fixed top-4 right-4 bg-gray-800 border-2 border-cyan-400 glow-cyan-sm rounded-lg p-4 shadow-2xl z-50 max-w-xs"
      initial={{ x: 300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 300, opacity: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
    >
      <p className="text-white font-bold mb-1">
        {username} entered the room 👀
      </p>
      <p className="text-xs text-gray-400">
        Trust level decreased 📉
      </p>
    </motion.div>
  )
}

export default PlayerJoinToast
