import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

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

      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload to storage
      const { error: uploadError } = await supabase.storage
        .from('media')
        .upload(filePath, file);

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
          size: file.size,
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
