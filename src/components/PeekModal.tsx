import { AnimatePresence, motion } from 'framer-motion'
import { EyeOff, X } from 'lucide-react'
import { PEEK_TEASER_NOTES } from '@/constants/teasers'

interface PeekModalProps {
  isOpen: boolean
  onClose: () => void
  note: string
}

export function PeekModal({ isOpen, onClose, note }: PeekModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-md mx-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="peek-modal-title"
          >
            <div className="glass-strong rounded-4xl p-8 text-center relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-2xl hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-snap-rose/20 border border-snap-rose/30 mb-5">
                <EyeOff className="w-8 h-8 text-snap-rose" aria-hidden="true" />
              </div>

              <h2 id="peek-modal-title" className="text-xl font-bold mb-3">
                Not So Fast!
              </h2>

              <p className="text-white/80 text-base leading-relaxed">{note}</p>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function getRandomPeekNote(): string {
  return PEEK_TEASER_NOTES[Math.floor(Math.random() * PEEK_TEASER_NOTES.length)]
}
