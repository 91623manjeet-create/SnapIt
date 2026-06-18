import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const webhookBody = await req.json()
    const fileRecord = webhookBody.record
    
    if (!fileRecord) {
      return new Response(JSON.stringify({ error: "Missing record context" }), { status: 400 })
    }

    const bucketId = fileRecord.bucket_id
    const filePathName = fileRecord.name 

    // Extract room UUID from path (e.g., "room-uuid/photo.jpg" -> "room-uuid")
    const pathSegments = filePathName.split('/')
    const dynamicRoomId = pathSegments[0]

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    // 1. Download raw file
    const { data: fileBlob, error: downloadError } = await supabaseAdmin
      .storage
      .from(bucketId)
      .download(filePathName)

    if (downloadError || !fileBlob) throw new Error("Storage download failed")

    // 2. Upload to permanent bucket
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('permanent-photos')
      .upload(filePathName, fileBlob, {
        contentType: 'image/jpeg',
        upsert: true
      })

    if (uploadError) throw uploadError

    // 3. Remove raw file from temp bucket
    await supabaseAdmin.storage.from(bucketId).remove([filePathName])

    // 4. Save metadata row into the photos table dynamically
    const { error: dbInsertError } = await supabaseAdmin
      .from('photos')
      .insert({
        storage_path: filePathName,
        uploader_name: 'Guest User',
        room_id: dynamicRoomId // Extracted dynamically!
      })

    if (dbInsertError) throw dbInsertError

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("Runtime Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})