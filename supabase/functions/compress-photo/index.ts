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
    const mimeType = fileRecord.metadata?.mimetype || 'image/jpeg'
    const uploaderName = fileRecord.metadata?.uploader_name || 'Guest User'

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      { auth: { persistSession: false } }
    )

    const pathSegments = filePathName.split('/')
    let roomUUID = pathSegments[0]
    const justTheFileName = pathSegments[pathSegments.length - 1]

    if (pathSegments.length === 1 || roomUUID.length < 10) {
      const { data: firstRoom } = await supabaseAdmin.from('rooms').select('id').limit(1).single()
      if (firstRoom) {
        roomUUID = firstRoom.id
      } else {
        throw new Error("No rooms exist in the database.")
      }
    }

    // 1. Download the raw file from the temporary upload bucket
    const { data: fileBlob, error: downloadError } = await supabaseAdmin
      .storage
      .from(bucketId)
      .download(filePathName)

    if (downloadError || !fileBlob) {
      throw new Error(`Download failed: ${downloadError?.message}`)
    }

    // 2. Upload FLAT to the root of permanent-photos (No room folder prefix!)
    const { error: uploadError } = await supabaseAdmin
      .storage
      .from('permanent-photos')
      .upload(justTheFileName, fileBlob, { // 👈 Changed filePathName to justTheFileName
        contentType: mimeType,
        upsert: true
      })

    if (uploadError) throw new Error(`Upload failed: ${uploadError.message}`)

    // 3. Clean up the source raw file from the temporary bucket
    await supabaseAdmin.storage.from(bucketId).remove([filePathName])

    // 4. Save metadata row cleanly into your database photos table
    const { error: dbInsertError } = await supabaseAdmin
      .from('photos')
      .insert({
        storage_path: justTheFileName, 
        uploader_name: uploaderName,   
        room_id: roomUUID
      })

    if (dbInsertError) throw new Error(`Database save failed: ${dbInsertError.message}`)

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (err) {
    console.error("Pipeline Error:", err.message)
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    })
  }
})