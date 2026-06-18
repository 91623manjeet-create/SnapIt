import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import {
  ImageMagick,
  initializeImageMagick,
  MagickFormat,
  MagickGeometry,
} from "npm:@imagemagick/magick-wasm@0.0.30";

const TEMP_BUCKET = "temp-raw-photos";
const PERMANENT_BUCKET = "permanent-photos";
const MAX_DIMENSION = 1080;
const JPEG_QUALITY = 75;

let magickReady: Promise<void> | null = null;

function ensureMagick(): Promise<void> {
  if (!magickReady) {
    magickReady = (async () => {
      const wasmUrl = import.meta.resolve(
        "npm:@imagemagick/magick-wasm@0.0.30/dist/magick.wasm",
      );
      const wasmBytes = await Deno.readFile(new URL(wasmUrl, import.meta.url));
      await initializeImageMagick(wasmBytes);
    })();
  }
  return magickReady;
}

interface StorageRecord {
  bucket_id: string;
  name: string;
  metadata?: Record<string, string>;
}

interface WebhookPayload {
  type?: string;
  record?: StorageRecord;
  bucket_id?: string;
  name?: string;
  metadata?: Record<string, string>;
}

function extractRecord(payload: WebhookPayload): StorageRecord | null {
  if (payload.record?.bucket_id && payload.record?.name) {
    return payload.record;
  }
  if (payload.bucket_id && payload.name) {
    return {
      bucket_id: payload.bucket_id,
      name: payload.name,
      metadata: payload.metadata,
    };
  }
  return null;
}

async function compressImage(rawBytes: Uint8Array): Promise<Uint8Array> {
  await ensureMagick();

  return ImageMagick.read(rawBytes, (img) => {
    const width = img.width;
    const height = img.height;

    if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
      const geometry = new MagickGeometry(MAX_DIMENSION, MAX_DIMENSION);
      geometry.ignoreAspectRatio = false;
      img.resize(geometry);
    }

    img.quality = JPEG_QUALITY;
    return img.write(MagickFormat.Jpeg, (data) => data);
  });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "authorization, content-type",
      },
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const payload: WebhookPayload = await req.json();
    const record = extractRecord(payload);

    if (!record || record.bucket_id !== TEMP_BUCKET) {
      return new Response(
        JSON.stringify({ error: "Not a temp-raw-photos upload" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const rawPath = record.name;
    const pathParts = rawPath.split("/");
    const roomId = pathParts[0];
    const uploaderName = record.metadata?.uploader_name ?? "Anonymous";

    if (!roomId) {
      return new Response(JSON.stringify({ error: "Missing room_id in path" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const { data: rawFile, error: downloadError } = await supabase.storage
      .from(TEMP_BUCKET)
      .download(rawPath);

    if (downloadError || !rawFile) {
      throw new Error(`Download failed: ${downloadError?.message}`);
    }

    const rawBytes = new Uint8Array(await rawFile.arrayBuffer());
    const compressedBytes = await compressImage(rawBytes);

    const fileId = crypto.randomUUID();
    const permanentPath = `${roomId}/${fileId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(PERMANENT_BUCKET)
      .upload(permanentPath, compressedBytes, {
        contentType: "image/jpeg",
        cacheControl: "31536000",
        upsert: false,
      });

    if (uploadError) {
      throw new Error(`Permanent upload failed: ${uploadError.message}`);
    }

    const { error: insertError } = await supabase.from("photos").insert({
      room_id: roomId,
      uploader_name: uploaderName,
      storage_path: permanentPath,
    });

    if (insertError) {
      await supabase.storage.from(PERMANENT_BUCKET).remove([permanentPath]);
      throw new Error(`DB insert failed: ${insertError.message}`);
    }

    await supabase.storage.from(TEMP_BUCKET).remove([rawPath]);

    return new Response(
      JSON.stringify({
        success: true,
        storage_path: permanentPath,
        compressed_size: compressedBytes.byteLength,
      }),
      { headers: { "Content-Type": "application/json" } },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("compress-photo error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
