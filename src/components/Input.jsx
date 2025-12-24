import { forwardRef, useState } from 'react'
import { Eye, EyeOff, AlertCircle, Check } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

const Input = forwardRef(({
  label,
  error,
  success,
  helperText,
  icon: Icon,
  type = 'text',
  maxLength,
  showCharCount = false,
  className = '',
  containerClassName = '',
  floating = false,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const [isFocused, setIsFocused] = useState(false)
  const [value, setValue] = useState(props.value || '')

  const isPassword = type === 'password'
  const inputType = isPassword && showPassword ? 'text' : type

  const handleChange = (e) => {
    setValue(e.target.value)
    if (props.onChange) {
      props.onChange(e)
    }
  }

  return (
    <div className={`w-full ${containerClassName}`}>
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <motion.div 
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10"
            animate={{ scale: isFocused ? 1.1 : 1 }}
            transition={{ type: 'spring', stiffness: 400 }}
          >
            <Icon size={20} />
          </motion.div>
        )}
        
        {/* Input */}
        <input
          ref={ref}
          type={inputType}
          value={value}
          onChange={handleChange}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={maxLength}
          className={`
            w-full px-4 py-3 bg-dark-bg border rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${isPassword ? 'pr-11' : ''}
            ${error ? 'border-red-500 focus:ring-red-500/30 focus:border-red-500' : 
              success ? 'border-green-500 focus:ring-green-500/30 focus:border-green-500' : 
              'border-gray-700 focus:ring-neon-cyan/30 focus:border-neon-cyan'}
            ${floating && !label ? 'pt-6' : ''}
            ${className}
          `}
          placeholder={floating ? ' ' : props.placeholder}
          {...props}
        />

        {/* Floating Label */}
        {floating && label && (
          <motion.label
            className={`
              absolute left-3 pointer-events-none transition-all duration-200
              ${Icon ? 'left-11' : 'left-3'}
              ${isFocused || value ? 'text-xs -top-2 bg-dark-bg px-1' : 'text-base top-1/2 -translate-y-1/2'}
              ${error ? 'text-red-500' : success ? 'text-green-500' : isFocused ? 'text-neon-cyan' : 'text-gray-400'}
            `}
            animate={{
              y: isFocused || value ? -20 : 0,
              scale: isFocused || value ? 0.85 : 1
            }}
          >
            {label}
          </motion.label>
        )}

        {/* Regular Label */}
        {!floating && label && (
          <label className="block text-sm font-medium text-gray-300 mb-2">
            {label}
          </label>
        )}

        {/* Password Toggle */}
        {isPassword && (
          <motion.button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </motion.button>
        )}

        {/* Status Icon */}
        {(error || success) && !isPassword && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {error && <AlertCircle size={20} className="text-red-500" />}
            {success && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 400 }}
              >
                <Check size={20} className="text-green-500" />
              </motion.div>
            )}
          </div>
        )}
      </div>

      {/* Helper Text / Error / Character Count */}
      <div className="flex justify-between items-start mt-2">
        <AnimatePresence mode="wait">
          {error && (
            <motion.p
              key="error"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-red-500 flex items-center gap-1"
            >
              <AlertCircle size={14} />
              {error}
            </motion.p>
          )}
          {!error && success && (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-green-500 flex items-center gap-1"
            >
              <Check size={14} />
              {success}
            </motion.p>
          )}
          {!error && !success && helperText && (
            <motion.p
              key="helper"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-sm text-gray-400"
            >
              {helperText}
            </motion.p>
          )}
        </AnimatePresence>

        {showCharCount && maxLength && (
          <p className={`text-xs ${
            value.length >= maxLength ? 'text-red-500' : 
            value.length >= maxLength * 0.8 ? 'text-yellow-500' : 
            'text-gray-500'
          }`}>
            {value.length}/{maxLength}
          </p>
        )}
      </div>
    </div>
  )
})

Input.displayName = 'Input'

export default Input