import { motion, AnimatePresence } from 'framer-motion'
import { ChevronDown, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

const Dropdown = ({
  label,
  options = [],
  value,
  onChange,
  placeholder = 'Select an option',
  disabled = false,
  error,
  icon: Icon,
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const dropdownRef = useRef(null)

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  const selectedOption = options.find(opt => opt.value === value)
  const filteredOptions = options.filter(opt => 
    opt.label.toLowerCase().includes(searchTerm.toLowerCase())
  )

  const handleSelect = (option) => {
    onChange(option.value)
    setIsOpen(false)
    setSearchTerm('')
  }

  return (
    <div className="w-full" ref={dropdownRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}

      <div className="relative">
        {/* Trigger Button */}
        <motion.button
          type="button"
          onClick={() => !disabled && setIsOpen(!isOpen)}
          disabled={disabled}
          whileHover={!disabled ? { scale: 1.01 } : {}}
          whileTap={!disabled ? { scale: 0.99 } : {}}
          className={`
            w-full px-4 py-3 bg-dark-bg border rounded-lg
            text-white text-left
            focus:outline-none focus:ring-2 transition-all duration-200
            flex items-center justify-between gap-2
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-500 focus:ring-red-500/30' : 
              isOpen ? 'border-neon-cyan focus:ring-neon-cyan/30' : 'border-gray-700 focus:ring-neon-cyan/30'}
            ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
            ${className}
          `}
        >
          {Icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
              <Icon size={20} />
            </div>
          )}

          <span className={selectedOption ? 'text-white' : 'text-gray-500'}>
            {selectedOption?.label || placeholder}
          </span>

          <motion.div
            animate={{ rotate: isOpen ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown size={20} className="text-gray-400" />
          </motion.div>
        </motion.button>

        {/* Dropdown Menu */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ type: 'spring', duration: 0.3 }}
              className="absolute z-50 w-full mt-2 bg-dark-card border border-gray-700 rounded-lg shadow-2xl shadow-neon-cyan/10 overflow-hidden"
            >
              {/* Search Input */}
              {options.length > 5 && (
                <div className="p-2 border-b border-gray-700">
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search..."
                    className="w-full px-3 py-2 bg-dark-bg border border-gray-700 rounded-lg text-white text-sm focus:outline-none focus:border-neon-cyan transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>
              )}

              {/* Options List */}
              <div className="max-h-60 overflow-y-auto">
                {filteredOptions.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-500 text-sm">
                    No options found
                  </div>
                ) : (
                  filteredOptions.map((option, index) => (
                    <motion.button
                      key={option.value}
                      type="button"
                      onClick={() => handleSelect(option)}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.03 }}
                      whileHover={{ backgroundColor: 'rgba(6, 182, 212, 0.1)' }}
                      className={`
                        w-full px-4 py-3 text-left text-sm transition-colors
                        flex items-center justify-between gap-2
                        ${option.value === value ? 'bg-neon-cyan/10 text-neon-cyan' : 'text-white hover:bg-gray-800'}
                      `}
                    >
                      <span>{option.label}</span>
                      {option.value === value && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: 'spring' }}
                        >
                          <Check size={16} className="text-neon-cyan" />
                        </motion.div>
                      )}
                    </motion.button>
                  ))
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Error Message */}
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-2 text-sm text-red-500"
        >
          {error}
        </motion.p>
      )}
    </div>
  )
}

export default Dropdown