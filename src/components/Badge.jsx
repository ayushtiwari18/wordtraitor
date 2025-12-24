import { motion } from 'framer-motion'
import { X } from 'lucide-react'

const Badge = ({
  children,
  variant = 'default',
  size = 'md',
  pill = false,
  dot = false,
  removable = false,
  onRemove,
  icon: Icon,
  className = '',
  animate = true,
  ...props
}) => {
  const variants = {
    default: 'bg-gray-700 text-gray-200',
    primary: 'bg-neon-cyan/20 text-neon-cyan border border-neon-cyan/30',
    secondary: 'bg-neon-purple/20 text-neon-purple border border-neon-purple/30',
    success: 'bg-green-500/20 text-green-400 border border-green-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border border-red-500/30',
    info: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
  }

  const sizes = {
    xs: 'text-xs px-2 py-0.5',
    sm: 'text-xs px-2.5 py-1',
    md: 'text-sm px-3 py-1',
    lg: 'text-base px-4 py-1.5'
  }

  const dotColors = {
    default: 'bg-gray-400',
    primary: 'bg-neon-cyan',
    secondary: 'bg-neon-purple',
    success: 'bg-green-400',
    warning: 'bg-yellow-400',
    danger: 'bg-red-400',
    info: 'bg-blue-400',
  }

  const BadgeComponent = animate ? motion.span : 'span'
  const animationProps = animate ? {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: 1, opacity: 1 },
    exit: { scale: 0, opacity: 0 },
    whileHover: { scale: 1.05 },
    transition: { type: 'spring', stiffness: 500, damping: 30 }
  } : {}

  return (
    <BadgeComponent
      className={`
        inline-flex items-center gap-1.5 font-medium
        ${pill ? 'rounded-full' : 'rounded-md'}
        ${variants[variant]}
        ${sizes[size]}
        ${removable ? 'pr-1' : ''}
        ${className}
      `}
      {...animationProps}
      {...props}
    >
      {dot && (
        <span className={`w-2 h-2 rounded-full ${dotColors[variant]} animate-pulse`} />
      )}
      
      {Icon && (
        <Icon size={size === 'xs' ? 12 : size === 'sm' ? 14 : 16} />
      )}
      
      <span>{children}</span>
      
      {removable && (
        <motion.button
          whileHover={{ scale: 1.2, rotate: 90 }}
          whileTap={{ scale: 0.9 }}
          onClick={(e) => {
            e.stopPropagation()
            onRemove?.()
          }}
          className="ml-1 hover:opacity-70 transition-opacity"
        >
          <X size={size === 'xs' ? 10 : size === 'sm' ? 12 : 14} />
        </motion.button>
      )}
    </BadgeComponent>
  )
}

export default Badge