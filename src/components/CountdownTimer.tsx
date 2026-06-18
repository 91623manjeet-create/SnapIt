import { motion } from 'framer-motion'
import { Lock } from 'lucide-react'
import { GlassCard } from './GlassCard'
import { padTime } from '@/hooks/useCountdown'

interface CountdownTimerProps {
  days: number
  hours: number
  minutes: number
  seconds: number
  roomName?: string
}

function TimeBlock({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <motion.div
        key={value}
        initial={{ y: -8, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
        className="glass rounded-3xl w-16 sm:w-20 h-16 sm:h-20 flex items-center justify-center"
      >
        <span className="text-2xl sm:text-3xl font-bold tabular-nums">{value}</span>
      </motion.div>
      <span className="text-[10px] sm:text-xs uppercase tracking-widest text-white/50 font-medium">
        {label}
      </span>
    </div>
  )
}

export function CountdownTimer({ days, hours, minutes, seconds, roomName }: CountdownTimerProps) {
  return (
    <GlassCard strong className="p-6 sm:p-8 w-full max-w-lg mx-auto">
      <div className="flex flex-col items-center gap-5">
        <div className="flex items-center gap-3 text-snap-gold">
          <Lock className="w-6 h-6" aria-hidden="true" />
          <span className="text-sm uppercase tracking-[0.2em] font-semibold">Gallery Locked</span>
        </div>

        {roomName && (
          <p className="text-white/70 text-sm font-medium">{roomName}</p>
        )}

        <p className="text-center text-white/60 text-sm max-w-xs">
          The family capsule opens soon. Keep snapping — your photos are safe inside!
        </p>

        <div className="flex items-center gap-3 sm:gap-4">
          {days > 0 && <TimeBlock value={padTime(days)} label="Days" />}
          <TimeBlock value={padTime(hours)} label="Hours" />
          <span className="text-2xl font-light text-white/30 pb-6">:</span>
          <TimeBlock value={padTime(minutes)} label="Min" />
          <span className="text-2xl font-light text-white/30 pb-6">:</span>
          <TimeBlock value={padTime(seconds)} label="Sec" />
        </div>
      </div>
    </GlassCard>
  )
}
