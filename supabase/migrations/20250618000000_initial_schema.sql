-- Snap It: rooms, photos, RLS, storage buckets & policies

-- ─── Tables ───────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  reveal_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES public.rooms(id) ON DELETE CASCADE,
  uploader_name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS photos_room_id_idx ON public.photos(room_id);
CREATE INDEX IF NOT EXISTS photos_created_at_idx ON public.photos(created_at DESC);

-- ─── Row Level Security ───────────────────────────────────────────────────────

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;

-- Anyone can read room info (needed for countdown)
CREATE POLICY "Anyone can view rooms"
  ON public.rooms FOR SELECT
  TO anon, authenticated
  USING (true);

-- Anyone can insert photos (upload pipeline)
CREATE POLICY "Anyone can insert photos"
  ON public.photos FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Photos visible only after room reveal_at has passed
CREATE POLICY "Photos visible after reveal"
  ON public.photos FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.rooms
      WHERE rooms.id = photos.room_id
        AND NOW() >= rooms.reveal_at
    )
  );

-- ─── Storage Buckets ──────────────────────────────────────────────────────────

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('temp-raw-photos', 'temp-raw-photos', false, 52428800, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']),
  ('permanent-photos', 'permanent-photos', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- ─── Storage Policies: temp-raw-photos (anon upload) ─────────────────────────

CREATE POLICY "Anyone can upload raw photos"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'temp-raw-photos');

CREATE POLICY "Service role manages temp photos"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'temp-raw-photos')
  WITH CHECK (bucket_id = 'temp-raw-photos');

-- ─── Storage Policies: permanent-photos (public read) ──────────────────────────

CREATE POLICY "Public read permanent photos"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'permanent-photos');

CREATE POLICY "Service role manages permanent photos"
  ON storage.objects FOR ALL
  TO service_role
  USING (bucket_id = 'permanent-photos')
  WITH CHECK (bucket_id = 'permanent-photos');

-- ─── Seed a demo room (optional — adjust reveal_at for your event) ─────────────

INSERT INTO public.rooms (id, name, reveal_at)
VALUES (
  '00000000-0000-4000-8000-000000000001',
  'Family Reunion 2026',
  NOW() + INTERVAL '2 hours'
)
ON CONFLICT (id) DO NOTHING;
