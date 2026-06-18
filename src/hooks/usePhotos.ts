import { useCallback, useEffect, useState } from 'react'
import { getPublicPhotoUrl, supabase } from '@/lib/supabase'

export interface Photo {
  id: string
  room_id: string
  uploader_name: string
  storage_path: string
  created_at: string
  url: string
}

export function usePhotos(roomId: string | null, enabled: boolean) {
  const [photos, setPhotos] = useState<Photo[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchPhotos = useCallback(async (previewMode = false): Promise<Photo[]> => {
    if (!roomId) return []

    setLoading(true)
    setError(null)

    let query = supabase
      .from('photos')
      .select('id, room_id, uploader_name, storage_path, created_at')
      .eq('room_id', roomId)
      .order('created_at', { ascending: false })

    if (previewMode) {
      query = query.limit(6)
    }

    const { data, error: fetchError } = await query

    if (fetchError) {
      setError(fetchError.message)
      setPhotos([])
      setLoading(false)
      return []
    }

    const mapped: Photo[] = (data ?? []).map((photo: Omit<Photo, 'url'>) => ({
      ...photo,
      url: getPublicPhotoUrl(photo.storage_path),
    }))

    setPhotos(mapped)
    setLoading(false)
    return mapped
  }, [roomId])

  useEffect(() => {
    if (!roomId || !enabled) return
    fetchPhotos()
  }, [roomId, enabled, fetchPhotos])

  useEffect(() => {
    if (!roomId) return

    const channel = supabase
      .channel(`photos:${roomId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'photos',
          filter: `room_id=eq.${roomId}`,
        },
        () => {
          if (enabled) fetchPhotos()
        },
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [roomId, enabled, fetchPhotos])

  return { photos, loading, error, refetch: () => fetchPhotos(), fetchPreview: () => fetchPhotos(true) }
}
