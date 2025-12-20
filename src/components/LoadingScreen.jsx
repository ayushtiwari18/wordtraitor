import { motion } from 'framer-motion'

const LoadingScreen = () => {
  return (
    <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-center">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 180, 360]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="w-20 h-20 mx-auto mb-8"
        >
          <div className="w-full h-full border-4 border-neon-cyan border-t-transparent rounded-full" />
        </motion.div>
        
        <motion.h2
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="text-2xl font-heading font-bold text-white"
        >
          Loading WordTraitor...
        </motion.h2>
      </div>
    </div>
  )
}

export default LoadingScreen