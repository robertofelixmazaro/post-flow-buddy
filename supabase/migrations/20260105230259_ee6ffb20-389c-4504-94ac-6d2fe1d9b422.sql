-- Add RLS policy for updating media files (needed for tags update)
CREATE POLICY "Users can update their own media files"
ON public.media_files
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);