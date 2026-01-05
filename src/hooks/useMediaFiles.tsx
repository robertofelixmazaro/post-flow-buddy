import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import imageCompression from 'browser-image-compression';

export interface MediaFile {
  id: string;
  user_id: string;
  name: string;
  file_path: string;
  url: string;
  size: number;
  type: string;
  folder: string;
  tags: string[];
  created_at: string;
}

const compressionOptions = {
  maxSizeMB: 1,
  maxWidthOrHeight: 1920,
  useWebWorker: true,
};

async function compressImageIfNeeded(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') {
    return file;
  }
  
  try {
    const compressedFile = await imageCompression(file, compressionOptions);
    console.log(`Compressed ${file.name}: ${(file.size / 1024 / 1024).toFixed(2)}MB -> ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`);
    return compressedFile;
  } catch (error) {
    console.warn('Image compression failed, using original:', error);
    return file;
  }
}

export function useMediaFiles() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['media-files', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('media_files')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return (data as any[]).map(file => ({
        ...file,
        tags: file.tags || []
      })) as MediaFile[];
    },
    enabled: !!user,
  });
}

export function useUploadMedia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ file, folder, tags = [] }: { file: File; folder: string; tags?: string[] }) => {
      if (!user) throw new Error('User not authenticated');

      // Compress image if applicable
      const processedFile = await compressImageIfNeeded(file);

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, processedFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Save metadata
      const { data, error } = await supabase
        .from('media_files')
        .insert({
          user_id: user.id,
          name: file.name,
          file_path: filePath,
          url: urlData.publicUrl,
          size: processedFile.size,
          type: file.type.startsWith('video/') ? 'video' : 'image',
          folder: folder,
          tags: tags,
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
}

export function useUploadMultipleMedia() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ files, folder }: { files: File[]; folder: string }) => {
      if (!user) throw new Error('User not authenticated');

      const results = [];
      
      for (const file of files) {
        // Compress image if applicable
        const processedFile = await compressImageIfNeeded(file);

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        // Upload to storage
        const { error: uploadError } = await supabase.storage
          .from('media')
          .upload(filePath, processedFile);

        if (uploadError) {
          console.error(`Failed to upload ${file.name}:`, uploadError);
          continue;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('media')
          .getPublicUrl(filePath);

        // Save metadata
        const { data, error } = await supabase
          .from('media_files')
          .insert({
            user_id: user.id,
            name: file.name,
            file_path: filePath,
            url: urlData.publicUrl,
            size: processedFile.size,
            type: file.type.startsWith('video/') ? 'video' : 'image',
            folder: folder,
            tags: [],
          })
          .select()
          .single();

        if (!error && data) {
          results.push(data);
        }
      }

      return results;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
}

export function useUpdateMediaTags() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, tags }: { id: string; tags: string[] }) => {
      const { data, error } = await supabase
        .from('media_files')
        .update({ tags })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
}

export function useRenameMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, newName }: { id: string; newName: string }) => {
      const { data, error } = await supabase
        .from('media_files')
        .update({ name: newName })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
}

export function useReplaceMediaFile() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, file, oldFilePath }: { id: string; file: Blob; oldFilePath: string }) => {
      if (!user) throw new Error('User not authenticated');

      // Delete old file
      await supabase.storage.from('media').remove([oldFilePath]);

      // Upload new file
      const fileExt = oldFilePath.split('.').pop() || 'jpg';
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('media')
        .getPublicUrl(filePath);

      // Update metadata
      const { data, error } = await supabase
        .from('media_files')
        .update({
          file_path: filePath,
          url: urlData.publicUrl,
          size: file.size,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, filePath }: { id: string; filePath: string }) => {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('media')
        .remove([filePath]);

      if (storageError) throw storageError;

      // Delete metadata
      const { error } = await supabase
        .from('media_files')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['media-files'] });
    },
  });
}
