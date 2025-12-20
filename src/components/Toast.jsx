import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, XCircle, Info, X } from 'lucide-react'
import { useEffect } from 'react'
import { useUIStore } from '@/store/uiStore'

const Toast = ({ id, type = 'info', message, duration = 3000 }) => {
  const removeToast = useUIStore(state => state.removeToast)
  
  useEffect(() => {
    if (duration) {
      const timer = setTimeout(() => {
        removeToast(id)
      }, duration)
      
      return () => clearTimeout(timer)
    }
  }, [id, duration, removeToast])
  
  const icons = {
    success: <CheckCircle size={20} className="text-green-500" />,
    error: <XCircle size={20} className="text-red-500" />,
    info: <Info size={20} className="text-blue-500" />
  }
  
  const styles = {
    success: 'border-green-500/50 bg-green-500/10',
    error: 'border-red-500/50 bg-red-500/10',
    info: 'border-blue-500/50 bg-blue-500/10'
  }
  
  return (
    <motion.div
      initial={{ opacity: 0, y: -20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -20, scale: 0.95 }}
      className={`
        flex items-center gap-3 p-4 rounded-lg border
        bg-dark-card shadow-lg min-w-[300px] max-w-md
        ${styles[type]}
      `}
    >
      {icons[type]}
      <p className="flex-1 text-sm text-white">{message}</p>
      <button
        onClick={() => removeToast(id)}
        className="text-gray-400 hover:text-white transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

const ToastContainer = () => {
  const toasts = useUIStore(state => state.toasts)
  
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      <AnimatePresence>
        {toasts.map(toast => (
          <Toast key={toast.id} {...toast} />
        ))}
      </AnimatePresence>
    </div>
  )
}

export default ToastContainer