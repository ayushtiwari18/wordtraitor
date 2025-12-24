import { motion } from 'framer-motion'

const Skeleton = ({
  variant = 'text',
  width = '100%',
  height,
  count = 1,
  className = '',
  animated = true
}) => {
  const variants = {
    text: 'h-4 rounded',
    title: 'h-8 rounded',
    circle: 'rounded-full',
    rectangle: 'rounded-lg',
    card: 'h-48 rounded-xl'
  }

  const skeletons = Array.from({ length: count })

  return (
    <div className="space-y-3">
      {skeletons.map((_, index) => (
        <motion.div
          key={index}
          className={`
            bg-gradient-to-r from-gray-800 via-gray-700 to-gray-800
            ${variants[variant]}
            ${animated ? 'animate-shimmer' : ''}
            ${className}
          `}
          style={{
            width: typeof width === 'number' ? `${width}px` : width,
            height: height ? (typeof height === 'number' ? `${height}px` : height) : undefined,
            backgroundSize: '1000px 100%'
          }}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: index * 0.05 }}
        />
      ))}
    </div>
  )
}

// Preset skeleton layouts
export const SkeletonCard = ({ count = 1 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <div key={index} className="bg-dark-card rounded-xl p-6 border border-gray-800">
        <Skeleton variant="circle" width={60} height={60} className="mb-4" />
        <Skeleton variant="title" width="60%" className="mb-3" />
        <Skeleton variant="text" count={3} />
      </div>
    ))}
  </div>
)

export const SkeletonText = ({ lines = 3 }) => (
  <Skeleton variant="text" count={lines} />
)

export const SkeletonAvatar = ({ size = 40 }) => (
  <Skeleton variant="circle" width={size} height={size} />
)

export default Skeleton