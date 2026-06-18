-- Webhook trigger: fires compress-photo Edge Function on temp bucket upload
-- Replace YOUR_PROJECT_REF and YOUR_SERVICE_ROLE_KEY before running.
-- Alternatively, configure via Supabase Dashboard → Database → Webhooks.

CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_compress_photo()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.bucket_id = 'temp-raw-photos' THEN
    PERFORM net.http_post(
      url := current_setting('app.settings.supabase_url', true)
             || '/functions/v1/compress-photo',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer '
          || current_setting('app.settings.service_role_key', true)
      ),
      body := jsonb_build_object(
        'type', 'INSERT',
        'record', jsonb_build_object(
          'bucket_id', NEW.bucket_id,
          'name', NEW.name,
          'metadata', NEW.metadata
        )
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_temp_photo_upload ON storage.objects;

CREATE TRIGGER on_temp_photo_upload
  AFTER INSERT ON storage.objects
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_compress_photo();

-- Set these in Supabase SQL Editor (Settings → Database → Custom Postgres Config):
-- ALTER DATABASE postgres SET app.settings.supabase_url = 'https://YOUR_PROJECT_REF.supabase.co';
-- ALTER DATABASE postgres SET app.settings.service_role_key = 'YOUR_SERVICE_ROLE_KEY';
