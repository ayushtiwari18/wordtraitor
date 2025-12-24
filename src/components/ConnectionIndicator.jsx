import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Wifi, WifiOff, RefreshCw } from 'lucide-react'

/**
 * Connection Status Indicator
 * 
 * Shows real-time connection health:
 * - Connected (green): Realtime working perfectly
 * - Reconnecting (yellow): Attempting to reconnect
 * - Disconnected (red): No connection
 */
const ConnectionIndicator = ({ 
  isConnected, 
  subscriptionState, 
  showDetails = false,
  className = '' 
}) => {
  // Determine status
  const getStatus = () => {
    if (subscriptionState === 'connected' || isConnected) {
      return {
        color: 'green',
        icon: Wifi,
        text: 'Connected',
        dotClass: 'bg-green-400',
        textClass: 'text-green-400',
        description: 'Real-time updates active'
      }
    }
    
    if (subscriptionState === 'connecting') {
      return {
        color: 'yellow',
        icon: RefreshCw,
        text: 'Connecting...',
        dotClass: 'bg-yellow-400',
        textClass: 'text-yellow-400',
        description: 'Establishing connection',
        animate: true
      }
    }
    
    return {
      color: 'red',
      icon: WifiOff,
      text: 'Disconnected',
      dotClass: 'bg-red-400',
      textClass: 'text-red-400',
      description: 'No real-time updates'
    }
  }

  const status = getStatus()
  const Icon = status.icon

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Status Dot (Minimal) */}
      <div className="relative">
        <motion.div
          className={`w-2 h-2 rounded-full ${status.dotClass}`}
          animate={status.animate ? {
            scale: [1, 1.3, 1],
            opacity: [1, 0.6, 1]
          } : {}}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        />
        {/* Pulse Ring */}
        {status.color === 'green' && (
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-green-400"
            initial={{ scale: 1, opacity: 0.8 }}
            animate={{ scale: 2.5, opacity: 0 }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: "easeOut"
            }}
          />
        )}
      </div>

      {/* Status Text (Optional) */}
      {showDetails && (
        <div className="flex items-center gap-1.5">
          <Icon 
            className={`w-4 h-4 ${status.textClass} ${status.animate ? 'animate-spin' : ''}`}
          />
          <div>
            <p className={`text-xs font-semibold ${status.textClass}`}>
              {status.text}
            </p>
            {status.description && (
              <p className="text-[10px] text-gray-500">
                {status.description}
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ConnectionIndicator

/**
 * Usage Examples:
 * 
 * // Minimal (just dot):
 * <ConnectionIndicator 
 *   isConnected={isConnected} 
 *   subscriptionState={subscriptionState}
 * />
 * 
 * // With details:
 * <ConnectionIndicator 
 *   isConnected={isConnected} 
 *   subscriptionState={subscriptionState}
 *   showDetails={true}
 * />
 */