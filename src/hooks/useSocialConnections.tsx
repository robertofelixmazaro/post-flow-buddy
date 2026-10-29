import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NetworkType } from '@/data/mockData';

// Only non-sensitive metadata. Tokens never leave the backend.
export interface SocialConnection {
  id: string;
  user_id: string;
  network: NetworkType;
  account_id: string;
  account_name: string | null;
  account_username: string | null;
  page_id: string | null;
  page_name: string | null;
  connected_at: string;
}

export interface OAuthConfig {
  configured: Record<string, boolean>;
  facebookAppId: string | null;
  redirectUri: string;
  security: { tokenEncryption: boolean; stateSigning: boolean; frontendUrl: boolean };
}

export function useSocialConnections() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['social-connections', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('social_connections')
        .select('id, user_id, network, account_id, account_name, account_username, page_id, page_name, connected_at');
      if (error) throw error;
      return data as SocialConnection[];
    },
    enabled: !!user
  });
}

/** Which providers are configured on the backend (no secrets returned). */
export function useOAuthConfig() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['oauth-config', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('oauth-start', { body: { action: 'config' } });
      if (error) throw error;
      return data as OAuthConfig;
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

/** Asks the backend for a signed, one-time OAuth authorize URL. */
export async function requestOAuthUrl(network: NetworkType): Promise<{ url?: string; error?: string }> {
  const { data, error } = await supabase.functions.invoke('oauth-start', { body: { action: 'start', network } });
  if (error) {
    let msg = error.message;
    try {
      const ctx = await (error as any).context?.json?.();
      if (ctx?.error) msg = ctx.error;
    } catch { /* ignore */ }
    return { error: msg };
  }
  return { url: data?.url };
}

export function useDisconnectSocial() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: string) => {
      const { error } = await supabase
        .from('social_connections')
        .delete()
        .eq('id', connectionId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['social-connections'] });
    }
  });
}
