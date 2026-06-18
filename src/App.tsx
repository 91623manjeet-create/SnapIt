import { AnimatePresence, motion } from 'framer-motion'
import { Eye, Sparkles } from 'lucide-react'
import { useCallback, useState } from 'react'
import { CameraUI } from '@/components/CameraUI'
import { CountdownTimer } from '@/components/CountdownTimer'
import { FooterGreeting } from '@/components/FooterGreeting'
import { getRandomPeekNote, PeekModal } from '@/components/PeekModal'
import { PhotoGallery } from '@/components/PhotoGallery'
import { SnapItLogo } from '@/components/SnapItLogo'
import { MeshBackground } from '@/components/MeshBackground'
import { Toast, type ToastStatus } from '@/components/Toast'
import { GlassCard } from '@/components/GlassCard'
import { useCountdown } from '@/hooks/useCountdown'
import { usePhotos } from '@/hooks/usePhotos'
import type { Photo } from '@/hooks/usePhotos'
import { useRoom } from '@/hooks/useRoom'
import { getRoomIdFromUrl } from '@/lib/supabase'

interface ToastState {
  message: string
  status: ToastStatus
}

export default function App() {
  const roomId = getRoomIdFromUrl() ?? import.meta.env.VITE_ROOM_ID ?? null
  const { room, loading: roomLoading, error: roomError } = useRoom(roomId)
  const countdown = useCountdown(room?.reveal_at)
  const { photos, loading: photosLoading, fetchPreview } = usePhotos(roomId, countdown.isUnlocked)

  const [peekOpen, setPeekOpen] = useState(false)
  const [peekNote, setPeekNote] = useState('')
  const [previewPhotos, setPreviewPhotos] = useState<Photo[]>([])
  const [toast, setToast] = useState<ToastState | null>(null)

  const handleToast = useCallback((message: string, status: ToastStatus) => {
    setToast({ message, status })
  }, [])

  const dismissToast = useCallback(() => setToast(null), [])

  const handlePeek = async () => {
    setPeekNote(getRandomPeekNote())
    const result = await fetchPreview()
    setPreviewPhotos(result)
    setPeekOpen(true)
  }

  if (roomLoading) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <MeshBackground />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
        >
          <Sparkles className="w-10 h-10 text-snap-gold" />
        </motion.div>
      </div>
    )
  }

  if (roomError || !room) {
    return (
      <div className="min-h-dvh flex items-center justify-center p-6">
        <MeshBackground />
        <GlassCard className="p-8 max-w-md text-center">
          <h2 className="text-xl font-bold mb-2">Room Not Found</h2>
          <p className="text-white/60 text-sm">{roomError ?? 'Unable to load this family capsule.'}</p>
        </GlassCard>
      </div>
    )
  }

  return (
    <div className="min-h-dvh relative">
      <MeshBackground />

      <main className="relative z-10 px-4 pt-8 pb-28 sm:pt-12 max-w-5xl mx-auto flex flex-col items-center gap-8 sm:gap-10">
        <SnapItLogo />

        <AnimatePresence mode="wait">
          {countdown.isUnlocked ? (
            <motion.div
              key="gallery"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="w-full flex flex-col gap-8"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.2 }}
                className="flex justify-center"
              >
                <div className="inline-flex items-center gap-2 glass rounded-full px-5 py-2 text-sm text-emerald-300">
                  <Sparkles className="w-4 h-4" aria-hidden="true" />
                  Gallery Unlocked!
                </div>
              </motion.div>

              <PhotoGallery photos={photos} loading={photosLoading} roomName={room.name} />
            </motion.div>
          ) : (
            <motion.div
              key="locked"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ type: 'spring', stiffness: 200, damping: 25 }}
              className="w-full flex flex-col gap-6"
            >
              <CountdownTimer
                days={countdown.days}
                hours={countdown.hours}
                minutes={countdown.minutes}
                seconds={countdown.seconds}
                roomName={room.name}
              />

              <motion.button
                type="button"
                onClick={handlePeek}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: 'spring', stiffness: 400, damping: 22 }}
                className="mx-auto flex items-center gap-2 glass rounded-3xl px-6 py-3.5 text-sm font-semibold text-white/80 hover:text-white hover:bg-white/15 transition-colors"
              >
                <Eye className="w-5 h-5" aria-hidden="true" />
                Peek into the Gallery
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        {roomId && <CameraUI roomId={roomId} onToast={handleToast} />}
      </main>

      <FooterGreeting />

      <PeekModal isOpen={peekOpen} onClose={() => setPeekOpen(false)} note={peekNote} previewPhotos={previewPhotos} />

      {toast && (
        <Toast message={toast.message} status={toast.status} onDismiss={dismissToast} />
      )}
    </div>
  )
}
