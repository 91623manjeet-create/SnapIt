import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  strong?: boolean
  onClick?: () => void
}

export function GlassCard({ children, className = '', strong = false, onClick }: GlassCardProps) {
  const Component = onClick ? motion.button : motion.div

  return (
    <Component
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 260, damping: 24 }}
      whileHover={onClick ? { scale: 1.02, y: -2 } : undefined}
      whileTap={onClick ? { scale: 0.98 } : undefined}
      className={`rounded-4xl ${strong ? 'glass-strong' : 'glass'} ${className}`}
    >
      {children}
    </Component>
  )
}
