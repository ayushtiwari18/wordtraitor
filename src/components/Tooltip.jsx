import { motion, AnimatePresence } from 'framer-motion'
import { useState, useRef } from 'react'

const Tooltip = ({
  children,
  content,
  position = 'top',
  delay = 200,
  arrow = true,
  className = '',
  disabled = false
}) => {
  const [isVisible, setIsVisible] = useState(false)
  const timeoutRef = useRef(null)

  const positions = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }

  const arrowPositions = {
    top: 'top-full left-1/2 -translate-x-1/2 -mt-1 border-t-gray-900 border-x-transparent border-b-transparent',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 -mb-1 border-b-gray-900 border-x-transparent border-t-transparent',
    left: 'left-full top-1/2 -translate-y-1/2 -ml-1 border-l-gray-900 border-y-transparent border-r-transparent',
    right: 'right-full top-1/2 -translate-y-1/2 -mr-1 border-r-gray-900 border-y-transparent border-l-transparent'
  }

  const handleMouseEnter = () => {
    if (disabled) return
    timeoutRef.current = setTimeout(() => {
      setIsVisible(true)
    }, delay)
  }

  const handleMouseLeave = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    setIsVisible(false)
  }

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {children}

      <AnimatePresence>
        {isVisible && content && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.15 }}
            className={`
              absolute ${positions[position]} z-50
              bg-gray-900 text-white text-sm
              px-3 py-2 rounded-lg shadow-xl
              whitespace-nowrap pointer-events-none
              border border-gray-700
              ${className}
            `}
          >
            {content}
            
            {arrow && (
              <div 
                className={`
                  absolute w-0 h-0
                  border-4 ${arrowPositions[position]}
                `}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Tooltip