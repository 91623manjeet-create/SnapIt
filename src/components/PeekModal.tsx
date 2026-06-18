import { AnimatePresence, motion } from 'framer-motion'
import { ImageIcon, X } from 'lucide-react'
import type { Photo } from '@/hooks/usePhotos'
import { PEEK_TEASER_NOTES } from '@/constants/teasers'

interface PeekModalProps {
  isOpen: boolean
  onClose: () => void
  note: string
  previewPhotos: Photo[]
}

export function PeekModal({ isOpen, onClose, note, previewPhotos }: PeekModalProps) {
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
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-50 max-w-lg mx-auto"
            role="dialog"
            aria-modal="true"
            aria-labelledby="peek-modal-title"
          >
            <div className="glass-strong rounded-4xl p-6 sm:p-8 text-center relative">
              <button
                type="button"
                onClick={onClose}
                className="absolute top-4 right-4 p-2 rounded-2xl hover:bg-white/10 transition-colors"
                aria-label="Close"
              >
                <X className="w-5 h-5 text-white/60" />
              </button>

              {previewPhotos.length > 0 ? (
                <>
                  <h2 id="peek-modal-title" className="text-xl font-bold mb-2">
                    Sneak Peek
                  </h2>
                  <p className="text-white/60 text-sm mb-5">
                    {previewPhotos.length} preview{previewPhotos.length !== 1 ? 's' : ''} available
                  </p>
                  <div className="grid grid-cols-3 gap-2 mb-5">
                    {previewPhotos.map((photo) => (
                      <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden">
                        <img
                          src={photo.url}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 backdrop-blur-md bg-black/30" />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-white/50" />
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-white/50 text-xs leading-relaxed italic">
                    The full gallery unlocks when the countdown hits zero!
                  </p>
                </>
              ) : (
                <>
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-snap-rose/20 border border-snap-rose/30 mb-5">
                    <ImageIcon className="w-8 h-8 text-snap-rose" aria-hidden="true" />
                  </div>
                  <h2 id="peek-modal-title" className="text-xl font-bold mb-3">
                    Not So Fast!
                  </h2>
                  <p className="text-white/80 text-base leading-relaxed">{note}</p>
                </>
              )}
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
