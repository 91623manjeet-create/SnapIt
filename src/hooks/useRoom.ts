import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export interface Room {
  id: string
  name: string
  reveal_at: string
}

export function useRoom(roomId: string | null) {
  const [room, setRoom] = useState<Room | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!roomId) {
      setLoading(false)
      setError('No room specified. Add ?room=<uuid> to the URL.')
      return
    }

    let cancelled = false

    async function fetchRoom() {
      setLoading(true)
      setError(null)

      const { data, error: fetchError } = await supabase
        .from('rooms')
        .select('id, name, reveal_at')
        .eq('id', roomId)
        .single()

      if (cancelled) return

      if (fetchError) {
        setError(fetchError.message)
        setRoom(null)
      } else {
        setRoom(data)
      }
      setLoading(false)
    }

    fetchRoom()
    return () => {
      cancelled = true
    }
  }, [roomId])

  return { room, loading, error }
}
