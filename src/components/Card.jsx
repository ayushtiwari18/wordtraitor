import { motion } from 'framer-motion'
import Spinner from './Spinner'

const Card = ({
  children,
  className = '',
  variant = 'default',
  hover = false,
  glow = false,
  onClick,
  loading = false,
  header,
  footer,
  ...props
}) => {
  const variants = {
    default: 'bg-dark-card border-gray-800',
    primary: 'bg-gradient-to-br from-neon-cyan/10 to-transparent border-neon-cyan/30',
    secondary: 'bg-gradient-to-br from-neon-purple/10 to-transparent border-neon-purple/30',
    success: 'bg-gradient-to-br from-green-500/10 to-transparent border-green-500/30',
    danger: 'bg-gradient-to-br from-red-500/10 to-transparent border-red-500/30',
    outline: 'bg-transparent border-gray-700',
  }

  const glowVariants = {
    default: 'shadow-lg shadow-gray-900/50',
    primary: 'shadow-lg shadow-neon-cyan/20',
    secondary: 'shadow-lg shadow-neon-purple/20',
    success: 'shadow-lg shadow-green-500/20',
    danger: 'shadow-lg shadow-red-500/20',
  }

  const baseStyles = 'rounded-xl border'
  const glowStyles = glow ? glowVariants[variant] : ''
  const hoverStyles = hover ? 'hover:border-opacity-50 transition-all duration-300 cursor-pointer' : ''
  const clickableStyles = onClick ? 'active:scale-[0.98]' : ''
  
  const CardComponent = onClick ? motion.button : motion.div
  
  return (
    <CardComponent
      whileHover={hover ? { y: -4, scale: 1.02, transition: { duration: 0.2 } } : {}}
      whileTap={onClick ? { scale: 0.98 } : {}}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${glowStyles}
        ${hoverStyles}
        ${clickableStyles}
        ${onClick ? 'w-full text-left' : ''}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Spinner size="lg" variant={variant === 'primary' ? 'cyan' : 'purple'} />
        </div>
      ) : (
        <>
          {header && (
            <div className="px-6 pt-6 pb-4 border-b border-gray-800">
              {header}
            </div>
          )}
          
          <div className="p-6">
            {children}
          </div>

          {footer && (
            <div className="px-6 pb-6 pt-4 border-t border-gray-800">
              {footer}
            </div>
          )}
        </>
      )}
    </CardComponent>
  )
}

export default Card