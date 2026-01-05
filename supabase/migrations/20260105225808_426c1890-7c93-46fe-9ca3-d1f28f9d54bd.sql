-- Add tags column to media_files table
ALTER TABLE public.media_files ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}';

-- Create index for tags search
CREATE INDEX IF NOT EXISTS idx_media_files_tags ON public.media_files USING GIN(tags);