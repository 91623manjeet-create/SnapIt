# Snap It

A warm, immersive family photo capsule built with React, Tailwind CSS, and Supabase. Guests snap photos instantly — no submit button — and photos reveal together when the countdown hits zero.

## Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4 + Framer Motion + Lucide icons
- **Backend:** Supabase (PostgreSQL, Storage, Edge Functions, RLS)
- **Compression:** Deno Edge Function with `@imagemagick/magick-wasm`

## Quick Start (Local)

```bash
npm install
cp .env.example .env.local
# Fill in your Supabase URL and anon key
npm run dev
```

Open `http://localhost:5173/?room=00000000-0000-4000-8000-000000000001`

## Supabase Setup

### 1. Create a Supabase project

Go to [supabase.com/dashboard](https://supabase.com/dashboard) and create a new project.

### 2. Run migrations

Install the [Supabase CLI](https://supabase.com/docs/guides/cli), then:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase db push
```

Or paste the SQL from `supabase/migrations/` into the Supabase SQL Editor.

### 3. Deploy the Edge Function

```bash
supabase functions deploy compress-photo --no-verify-jwt
```

The function uses `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` automatically when deployed.

### 4. Wire the Storage Webhook

**Option A — Dashboard (recommended):**

1. Go to **Database → Webhooks → Create a new hook**
2. Table: `storage.objects`, Events: `INSERT`
3. Filter: `bucket_id = 'temp-raw-photos'`
4. Type: Supabase Edge Function → `compress-photo`

**Option B — SQL trigger:**

Run `supabase/migrations/20250618000001_storage_webhook_trigger.sql` after setting:

```sql
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
```

### 5. Create your event room

```sql
INSERT INTO public.rooms (name, reveal_at)
VALUES ('Smith Family Reunion', '2026-12-25 18:00:00+00')
RETURNING id;
```

Use the returned UUID in your app URL: `?room=<uuid>`

### 6. Enable Realtime (optional, for live gallery updates)

In Supabase Dashboard → **Database → Replication**, enable replication for the `photos` table.

## Upload Pipeline

```
User snaps photo
    ↓ (instant, no submit)
temp-raw-photos/{roomId}/{uuid}.ext
    ↓ (storage webhook)
compress-photo Edge Function
    ↓ magick-wasm: max 1080px, 75% JPEG quality
permanent-photos/{roomId}/{uuid}.jpg  +  photos table row
    ↓
temp file deleted immediately
```

## Environment Variables

| Variable | Description |
|---|---|
| `VITE_SUPABASE_URL` | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase anon/public key |
| `VITE_ROOM_ID` | Optional default room UUID |

## Deploy to Vercel

### 1. Push to GitHub

```bash
git init
git add .
git commit -m "Initial Snap It app"
git remote add origin https://github.com/YOU/snap-it.git
git push -u origin main
```

### 2. Import in Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework Preset: **Vite**
4. Add environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `VITE_ROOM_ID` (optional)
5. Deploy

`vercel.json` includes SPA rewrites so client-side routing works.

### 3. Share the link

Send guests: `https://your-app.vercel.app/?room=YOUR_ROOM_UUID`

## Project Structure

```
src/
├── components/     # Glassmorphism UI (Camera, Gallery, Countdown, etc.)
├── hooks/          # useRoom, useCountdown, usePhotos
├── lib/            # Supabase client
├── constants/      # Teaser notes & greetings
└── App.tsx         # Main layout & state orchestration

supabase/
├── migrations/     # Schema, RLS, storage policies
└── functions/
    └── compress-photo/   # magick-wasm compression pipeline
```

## Security Notes

- RLS ensures photos are **INSERT-only** before reveal and **SELECT-only** after `reveal_at`
- Raw uploads land in a private `temp-raw-photos` bucket and are deleted after compression
- Never expose `SUPABASE_SERVICE_ROLE_KEY` in frontend env vars
- The Edge Function runs with service role privileges server-side only

## License

MIT
