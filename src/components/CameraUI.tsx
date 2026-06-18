import { motion } from 'framer-motion'
import { Camera, User } from 'lucide-react'
import { useCallback, useRef, useState } from 'react'
import { UPLOADER_STORAGE_KEY } from '@/constants/teasers'
import { TEMP_BUCKET, supabase } from '@/lib/supabase'
import { GlassCard } from './GlassCard'
import type { ToastStatus } from './Toast'

interface CameraUIProps {
  roomId: string
  onToast: (message: string, status: ToastStatus) => void
}

export function CameraUI({ roomId, onToast }: CameraUIProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [uploaderName, setUploaderName] = useState(() => {
    return localStorage.getItem(UPLOADER_STORAGE_KEY) ?? ''
  })
  const [isUploading, setIsUploading] = useState(false)

  const handleNameChange = (value: string) => {
    setUploaderName(value)
    localStorage.setItem(UPLOADER_STORAGE_KEY, value)
  }

  const handleFileChange = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0]
      if (!file) return

      if (!uploaderName.trim()) {
        onToast('Please enter your name before snapping!', 'error')
        event.target.value = ''
        return
      }

      setIsUploading(true)
      onToast('Snap It Captured! Saving to the family capsule…', 'uploading')

      const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
      const fileId = crypto.randomUUID()
      const storagePath = `${roomId}/${fileId}.${ext}`

      const { error } = await supabase.storage.from(TEMP_BUCKET).upload(storagePath, file, {
        cacheControl: '3600',
        upsert: false,
        contentType: file.type,
        metadata: {
          room_id: roomId,
          uploader_name: uploaderName.trim(),
        },
      })

      setIsUploading(false)
      event.target.value = ''

      if (error) {
        onToast(`Upload failed: ${error.message}`, 'error')
      } else {
        onToast('Snap It Captured! Saved to the family capsule!', 'success')
      }
    },
    [roomId, uploaderName, onToast],
  )

  return (
    <GlassCard strong className="p-6 sm:p-8 w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-6">
        <div className="w-full">
          <label htmlFor="uploader-name" className="flex items-center gap-2 text-sm text-white/60 mb-2 font-medium">
            <User className="w-4 h-4" aria-hidden="true" />
            Your Name
          </label>
          <input
            id="uploader-name"
            type="text"
            value={uploaderName}
            onChange={(e) => handleNameChange(e.target.value)}
            placeholder="Who's snapping?"
            className="w-full rounded-3xl bg-white/10 border border-white/20 px-5 py-3.5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-snap-rose/50 transition-shadow"
            maxLength={50}
          />
        </div>

        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          id="camera-input"
          className="sr-only"
          onChange={handleFileChange}
          disabled={isUploading}
        />

        <motion.label
          htmlFor="camera-input"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          className={`
            relative cursor-pointer select-none
            w-36 h-36 sm:w-44 sm:h-44 rounded-full
            flex items-center justify-center
            bg-gradient-to-br from-snap-rose/40 to-snap-lavender/40
            border-4 border-white/30 shadow-2xl
            ${isUploading ? 'opacity-60 pointer-events-none' : ''}
          `}
          aria-label="Take a photo"
        >
          <div className="absolute inset-2 rounded-full border-2 border-white/20" />
          <div className="absolute inset-4 rounded-full bg-white/5 backdrop-blur-sm" />
          <Camera className="w-12 h-12 sm:w-14 sm:h-14 text-white drop-shadow-lg relative z-10" />
          <motion.div
            className="absolute inset-0 rounded-full border-2 border-snap-gold/50"
            animate={{ scale: [1, 1.08, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
        </motion.label>

        <p className="text-sm text-white/50 text-center">
          Tap the shutter to snap — no submit needed, it uploads instantly!
        </p>
      </div>
    </GlassCard>
  )
}
