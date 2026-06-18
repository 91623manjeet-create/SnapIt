import { AnimatePresence, motion } from 'framer-motion'
import { CheckCircle2, Loader2, X } from 'lucide-react'
import { useEffect } from 'react'

export type ToastStatus = 'uploading' | 'success' | 'error'

interface ToastProps {
  message: string
  status: ToastStatus
  onDismiss: () => void
}

export function Toast({ message, status, onDismiss }: ToastProps) {
  useEffect(() => {
    if (status === 'success' || status === 'error') {
      const timer = setTimeout(onDismiss, 4000)
      return () => clearTimeout(timer)
    }
  }, [status, onDismiss])

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 50, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[calc(100%-2rem)] max-w-md"
        role="status"
        aria-live="polite"
      >
        <div className="glass-strong rounded-3xl px-5 py-4 flex items-center gap-4">
          <div className="shrink-0">
            {status === 'uploading' && (
              <Loader2 className="w-7 h-7 text-snap-gold animate-spin" aria-hidden="true" />
            )}
            {status === 'success' && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <CheckCircle2 className="w-7 h-7 text-emerald-400" aria-hidden="true" />
              </motion.div>
            )}
            {status === 'error' && (
              <X className="w-7 h-7 text-red-400" aria-hidden="true" />
            )}
          </div>
          <p className="text-sm sm:text-base font-medium text-white/90 flex-1">{message}</p>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
