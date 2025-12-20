import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'

const Button = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  icon: Icon,
  className = '',
  ...props
}) => {
  const baseStyles = 'font-heading font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2'
  
  const variants = {
    primary: 'bg-neon-cyan text-dark-bg hover:shadow-neon-cyan hover:-translate-y-0.5',
    secondary: 'bg-neon-purple text-white hover:shadow-neon-purple hover:-translate-y-0.5',
    outline: 'border-2 border-neon-cyan text-neon-cyan hover:bg-neon-cyan hover:text-dark-bg',
    ghost: 'text-neon-cyan hover:bg-neon-cyan hover:bg-opacity-10',
    danger: 'bg-red-600 text-white hover:bg-red-700'
  }
  
  const sizes = {
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
      onClick={onClick}
      disabled={isDisabled}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${sizes[size]}
        ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
        ${className}
      `}
      {...props}
    >
      {loading ? (
        <>
          <Loader2 className="animate-spin" size={20} />
          <span>Loading...</span>
        </>
      ) : (
        <>
          {Icon && <Icon size={20} />}
          {children}
        </>
      )}
    </motion.button>
  )
}

export default Button