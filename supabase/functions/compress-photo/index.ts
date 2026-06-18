import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const TEMP_BUCKET = 'temp-raw-photos'
const PERMANENT_BUCKET = 'permanent-photos'
const SUPPORTED_CONTENT_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
])

function getRoomIdFromPath(path: string): string | null {
  const parts = path.split('/').filter(Boolean)
  return parts.length > 1 ? parts[0] : null
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  if (req.method === 'GET' || req.method === 'HEAD') {
    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  }

  try {
    const webhookBody = await req.json()
    console.log("Webhook body payload details:", webhookBody)

    const fileRecord = webhookBody?.record ?? webhookBody
    if (!fileRecord) {
      return new Response(JSON.stringify({ error: "Missing record context" }), { status: 400 })
    }

    const bucketId = fileRecord.bucket_id
    const filePathName = fileRecord.name
    if (!bucketId || !filePathName) {
      return new Response(JSON.stringify({ error: "Missing bucket or file path" }), { status: 400 })
    }

    if (bucketId !== TEMP_BUCKET) {
      return new Response(JSON.stringify({ ok: true, skipped: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: 'Missing Supabase function environment variables' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      })
    }

    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, { auth: { persistSession: false } })

    const { data: fileBlob, error: downloadError } = await supabaseAdmin
      .storage
      .from(bucketId)
      .download(filePathName)

    if (downloadError || !fileBlob) {
      throw new Error(`Failed downloading source file: ${downloadError?.message ?? 'Unknown download error'}`)
    }

    const contentType =
      fileBlob.type ||
      fileRecord.metadata?.mimetype ||
      fileRecord.metadata?.contentType ||
      'image/jpeg'

    if (!SUPPORTED_CONTENT_TYPES.has(contentType)) {
      return new Response(JSON.stringify({
        error: `Unsupported image type: ${contentType}. Please upload JPG, PNG, or WebP images.`,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const roomId =
      fileRecord.metadata?.room_id ??
      getRoomIdFromPath(filePathName) ??
      null
    const uploaderName = fileRecord.metadata?.uploader_name ?? 'Guest User'

    if (!roomId) {
      return new Response(JSON.stringify({ error: 'Missing room ID metadata' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      })
    }

    const { error: uploadError } = await supabaseAdmin
      .storage
      .from(PERMANENT_BUCKET)
      .upload(filePathName, fileBlob, {
        contentType: contentType,
        upsert: true
      })

    if (uploadError) throw uploadError

    const { error: dbInsertError } = await supabaseAdmin
      .from('photos')
      .insert({
        room_id: roomId,
        uploader_name: uploaderName,
        storage_path: filePathName,
      })

    if (dbInsertError) throw dbInsertError

    await supabaseAdmin.storage.from(bucketId).remove([filePathName])

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown edge function error'
    console.error("Critical Runtime Blocker:", message)
    return new Response(JSON.stringify({ error: message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500, // Return a 500 error instead of a 400 if a script error occurs
    })
  }
})
