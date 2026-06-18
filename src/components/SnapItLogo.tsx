import { motion } from 'framer-motion'
import { Sparkles } from 'lucide-react'

export function SnapItLogo() {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="text-center"
    >
      <div className="inline-flex items-center gap-2 mb-2">
        <Sparkles className="w-5 h-5 text-snap-gold" aria-hidden="true" />
        <span className="text-xs uppercase tracking-[0.3em] text-white/60 font-medium">
          Family Capsule
        </span>
        <Sparkles className="w-5 h-5 text-snap-gold" aria-hidden="true" />
      </div>
      <h1 className="text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-glow">
        Snap It
      </h1>
    </motion.div>
  )
}
