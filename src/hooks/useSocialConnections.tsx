import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NetworkType } from '@/data/mockData';

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

// Helper to get OAuth client ID with validation
function getOAuthClientId(network: NetworkType): string | null {
  switch (network) {
    case 'facebook':
    case 'instagram':
      return import.meta.env.VITE_FACEBOOK_APP_ID || null;
    case 'tiktok':
      return import.meta.env.VITE_TIKTOK_CLIENT_KEY || null;
    case 'linkedin':
      return import.meta.env.VITE_LINKEDIN_CLIENT_ID || null;
    default:
      return null;
  }
}

// Check if OAuth is configured for a network
export function isOAuthConfigured(network: NetworkType): boolean {
  return !!getOAuthClientId(network);
}

// OAuth URLs for each platform
export function getOAuthUrl(network: NetworkType, userId?: string): string | null {
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
  
  const clientId = getOAuthClientId(network);
  
  // Return null if OAuth is not configured - caller should handle this
  if (!clientId) {
    console.warn(`OAuth not configured for ${network}. Please set the required environment variable.`);
    return null;
  }
  
  // Encode state with network and user info
  const state = btoa(JSON.stringify({ network, userId }));
  
  switch (network) {
    case 'facebook':
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list&state=${state}`;
    
    case 'instagram':
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,business_management&state=${state}`;
    
    case 'tiktok':
      return `https://www.tiktok.com/v2/auth/authorize?client_key=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user.info.basic,video.publish&state=${state}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/oauth/v2/authorization?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20w_member_social&state=${state}`;
    
    default:
      return null;
  }
}
