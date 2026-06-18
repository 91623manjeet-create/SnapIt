import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Set them in .env.local',
  )
}

export const supabase = createClient(
  supabaseUrl ?? 'https://placeholder.supabase.co',
  supabaseAnonKey ?? 'placeholder-key',
)

export const TEMP_BUCKET = 'temp-raw-photos'
export const PERMANENT_BUCKET = 'permanent-photos'

export function getPublicPhotoUrl(storagePath: string): string {
  const { data } = supabase.storage.from(PERMANENT_BUCKET).getPublicUrl(storagePath)
  return data.publicUrl
}

export function getRoomIdFromUrl(): string | null {
  const params = new URLSearchParams(window.location.search)
  return params.get('room')
}
