import { useEffect, useState } from 'react'

interface Countdown {
  days: number
  hours: number
  minutes: number
  seconds: number
  totalMs: number
  isUnlocked: boolean
}

function computeCountdown(revealAt: string): Countdown {
  const target = new Date(revealAt).getTime()
  const now = Date.now()
  const totalMs = target - now

  if (totalMs <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isUnlocked: true }
  }

  const seconds = Math.floor((totalMs / 1000) % 60)
  const minutes = Math.floor((totalMs / (1000 * 60)) % 60)
  const hours = Math.floor((totalMs / (1000 * 60 * 60)) % 24)
  const days = Math.floor(totalMs / (1000 * 60 * 60 * 24))

  return { days, hours, minutes, seconds, totalMs, isUnlocked: false }
}

export function useCountdown(revealAt: string | undefined) {
  const [countdown, setCountdown] = useState<Countdown>(() =>
    revealAt ? computeCountdown(revealAt) : { days: 0, hours: 0, minutes: 0, seconds: 0, totalMs: 0, isUnlocked: false },
  )

  useEffect(() => {
    if (!revealAt) return

    setCountdown(computeCountdown(revealAt))
    const interval = setInterval(() => {
      setCountdown(computeCountdown(revealAt))
    }, 1000)

    return () => clearInterval(interval)
  }, [revealAt])

  return countdown
}

export function padTime(value: number): string {
  return value.toString().padStart(2, '0')
}
