import { motion } from 'framer-motion'
import { ImageIcon, Loader2 } from 'lucide-react'
import type { Photo } from '@/hooks/usePhotos'
import { GlassCard } from './GlassCard'

interface PhotoGalleryProps {
  photos: Photo[]
  loading: boolean
  roomName?: string
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, scale: 0.9, y: 20 },
  show: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { type: 'spring' as const, stiffness: 300, damping: 24 },
  },
}

export function PhotoGallery({ photos, loading, roomName }: PhotoGalleryProps) {
  if (loading) {
    return (
      <GlassCard className="p-12 flex flex-col items-center gap-4 max-w-lg mx-auto">
        <Loader2 className="w-10 h-10 text-snap-gold animate-spin" aria-hidden="true" />
        <p className="text-white/60 text-sm">Opening the family capsule…</p>
      </GlassCard>
    )
  }

  if (photos.length === 0) {
    return (
      <GlassCard className="p-12 flex flex-col items-center gap-4 max-w-lg mx-auto">
        <ImageIcon className="w-12 h-12 text-white/30" aria-hidden="true" />
        <p className="text-white/60 text-center">
          The capsule is open, but no snaps yet!
          <br />
          Be the first to capture a moment.
        </p>
      </GlassCard>
    )
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <h2 className="text-2xl sm:text-3xl font-bold text-glow mb-1">
          {roomName ?? 'Family Gallery'}
        </h2>
        <p className="text-white/50 text-sm">{photos.length} snap{photos.length !== 1 ? 's' : ''} captured</p>
      </motion.div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4"
      >
        {photos.map((photo) => (
          <motion.div
            key={photo.id}
            variants={itemVariants}
            whileHover={{ scale: 1.03, y: -4 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="relative aspect-square rounded-3xl overflow-hidden glass group"
          >
            <img
              src={photo.url}
              alt={`Photo by ${photo.uploader_name}`}
              loading="lazy"
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/60 to-transparent">
              <span className="inline-block backdrop-blur-md bg-white/15 border border-white/20 rounded-2xl px-3 py-1 text-xs sm:text-sm font-medium text-white shadow-lg">
                {photo.uploader_name}
              </span>
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}
