import { motion } from 'framer-motion'
import { User } from 'lucide-react'

const Avatar = ({
  src,
  alt,
  name,
  size = 'md',
  status,
  fallback,
  badge,
  ring = false,
  className = '',
  onClick
}) => {
  const sizes = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-24 h-24 text-3xl'
  }

  const statusSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
    xl: 'w-4 h-4',
    '2xl': 'w-6 h-6'
  }

  const statusColors = {
    online: 'bg-green-500',
    offline: 'bg-gray-500',
    away: 'bg-yellow-500',
    busy: 'bg-red-500'
  }

  const getInitials = (name) => {
    if (!name) return '?'
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const AvatarComponent = onClick ? motion.button : motion.div

  return (
    <AvatarComponent
      onClick={onClick}
      whileHover={onClick ? { scale: 1.05 } : {}}
      whileTap={onClick ? { scale: 0.95 } : {}}
      className={`
        relative inline-flex items-center justify-center
        ${sizes[size]} rounded-full overflow-hidden
        ${ring ? 'ring-2 ring-neon-cyan ring-offset-2 ring-offset-dark-bg' : ''}
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {src ? (
        <img 
          src={src} 
          alt={alt || name || 'Avatar'} 
          className="w-full h-full object-cover"
        />
      ) : fallback ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 text-white font-semibold">
          {fallback}
        </div>
      ) : name ? (
        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-neon-cyan/20 to-neon-purple/20 text-white font-semibold">
          {getInitials(name)}
        </div>
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-gray-700 text-gray-400">
          <User size={size === 'xs' ? 12 : size === 'sm' ? 16 : size === 'md' ? 20 : size === 'lg' ? 24 : 32} />
        </div>
      )}

      {/* Status Indicator */}
      {status && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className={`
            absolute bottom-0 right-0 ${statusSizes[size]}
            ${statusColors[status]} rounded-full
            border-2 border-dark-bg
            ${status === 'online' ? 'animate-pulse' : ''}
          `}
        />
      )}

      {/* Badge */}
      {badge && (
        <motion.span
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border-2 border-dark-bg"
        >
          {badge > 9 ? '9+' : badge}
        </motion.span>
      )}
    </AvatarComponent>
  )
}

// Avatar Group Component
export const AvatarGroup = ({ avatars = [], max = 3, size = 'md', className = '' }) => {
  const displayAvatars = avatars.slice(0, max)
  const remaining = Math.max(0, avatars.length - max)

  return (
    <div className={`flex items-center ${className}`}>
      {displayAvatars.map((avatar, index) => (
        <div key={index} className="-ml-2 first:ml-0">
          <Avatar {...avatar} size={size} ring />
        </div>
      ))}
      
      {remaining > 0 && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="-ml-2 flex items-center justify-center w-10 h-10 rounded-full bg-gray-700 text-white text-sm font-semibold ring-2 ring-dark-bg cursor-pointer"
        >
          +{remaining}
        </motion.div>
      )}
    </div>
  )
}

export default Avatar