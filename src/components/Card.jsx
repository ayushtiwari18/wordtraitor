import { motion } from 'framer-motion'

const Card = ({
  children,
  className = '',
  hover = false,
  glow = false,
  onClick,
  ...props
}) => {
  const baseStyles = 'bg-dark-card rounded-xl p-6 border border-gray-800'
  const glowStyles = glow ? 'shadow-lg shadow-neon-cyan/20' : ''
  const hoverStyles = hover ? 'hover:border-neon-cyan hover:shadow-neon-cyan/30 cursor-pointer' : ''
  
  const CardComponent = onClick ? motion.button : motion.div
  
  return (
    <CardComponent
      whileHover={hover ? { y: -4, transition: { duration: 0.2 } } : {}}
      onClick={onClick}
      className={`
        ${baseStyles}
        ${glowStyles}
        ${hoverStyles}
        ${className}
      `}
      {...props}
    >
      {children}
    </CardComponent>
  )
}

export default Card