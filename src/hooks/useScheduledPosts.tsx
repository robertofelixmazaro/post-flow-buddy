import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface ScheduledPost {
  id: string;
  user_id: string;
  content: string;
  media_urls: string[] | null;
  networks: string[];
  scheduled_at: string;
  status: 'scheduled' | 'published' | 'failed' | 'cancelled';
  created_at: string;
  updated_at: string;
}

export interface CreatePostInput {
  content: string;
  media_urls?: string[];
  networks: string[];
  scheduled_at: string;
}

export function useScheduledPosts() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['scheduled-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      
      const { data, error } = await supabase
        .from('scheduled_posts')
        .select('*')
        .order('scheduled_at', { ascending: true });
      
      if (error) throw error;
      return data as ScheduledPost[];
    },
    enabled: !!user
  });
}

export function useCreatePost() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreatePostInput) => {
      if (!user) throw new Error('Usuário não autenticado');

      const { data, error } = await supabase
        .from('scheduled_posts')
        .insert([{
          user_id: user.id,
          content: input.content,
          media_urls: input.media_urls || null,
          networks: input.networks as ("facebook" | "instagram" | "linkedin" | "twitter")[],
          scheduled_at: input.scheduled_at,
          status: 'scheduled' as const
        }])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    }
  });
}

export function useUpdatePostStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'scheduled' | 'published' | 'failed' | 'cancelled' }) => {
      const { data, error } = await supabase
        .from('scheduled_posts')
        .update({ status })
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    }
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('scheduled_posts')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
    }
  });
}

/**
 * Real posts adapted to the calendar card shape (one entry per network).
 * Replaces the old mock list used by the calendar, day timeline and network stats.
 */
export function useCalendarPosts() {
  const query = useScheduledPosts();
  const posts: CalendarPost[] = (query.data || [])
    .filter((p) => p.status !== 'cancelled')
    .flatMap((p) => {
      const d = new Date(p.scheduled_at);
      const time = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
      return p.networks.map((network) => ({
        id: `${p.id}-${network}`,
        content: p.content,
        network: network as CalendarPost['network'],
        scheduledDate: d,
        scheduledTime: time,
        status: (p.status === 'published' ? 'published' : 'scheduled') as CalendarPost['status'],
        imageUrl: p.media_urls?.[0],
      }));
    });
  return { ...query, posts };
}

type CalendarPost = import('@/data/mockData').ScheduledPost;
