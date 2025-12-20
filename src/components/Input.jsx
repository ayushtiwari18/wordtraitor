import { forwardRef } from 'react'

const Input = forwardRef(({
  label,
  error,
  icon: Icon,
  className = '',
  ...props
}, ref) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-300 mb-2">
          {label}
        </label>
      )}
      
      <div className="relative">
        {Icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            <Icon size={20} />
          </div>
        )}
        
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 bg-dark-bg border rounded-lg
            text-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-neon-cyan focus:border-transparent
            transition-all duration-200
            ${Icon ? 'pl-11' : ''}
            ${error ? 'border-red-500' : 'border-gray-700'}
            ${className}
          `}
          {...props}
        />
      </div>
      
      {error && (
        <p className="mt-2 text-sm text-red-500">
          {error}
        </p>
      )}
    </div>
  )
})

Input.displayName = 'Input'

export default Input