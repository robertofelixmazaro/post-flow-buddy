import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { NetworkType } from '@/data/mockData';
import { oauthConfig, isNetworkConfigured, getOAuthRedirectUri } from '@/config/oauth';

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

// Check if OAuth is configured for a network - uses centralized config
export function isOAuthConfigured(network: NetworkType): boolean {
  return isNetworkConfigured(network as any);
}

// OAuth URLs for each platform - uses centralized config
export function getOAuthUrl(network: NetworkType, userId?: string): string | null {
  const redirectUri = getOAuthRedirectUri();
  
  // Return null if OAuth is not configured
  if (!isOAuthConfigured(network)) {
    console.warn(`OAuth not configured for ${network}.`);
    return null;
  }
  
  // Encode state with network and user info
  const state = btoa(JSON.stringify({ network, userId }));
  
  switch (network) {
    case 'facebook':
      return `https://www.facebook.com/${oauthConfig.facebook.version}/dialog/oauth?client_id=${oauthConfig.facebook.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list&state=${state}`;
    
    case 'instagram':
      return `https://www.facebook.com/${oauthConfig.instagram.version}/dialog/oauth?client_id=${oauthConfig.instagram.appId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list,business_management&state=${state}`;
    
    case 'tiktok':
      return `https://www.tiktok.com/v2/auth/authorize?client_key=${oauthConfig.tiktok.clientKey}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=user.info.basic,video.publish&state=${state}`;
    
    case 'linkedin':
      return `https://www.linkedin.com/oauth/v2/authorization?client_id=${oauthConfig.linkedin.clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid%20profile%20w_member_social&state=${state}`;
    
    default:
      return null;
  }
}
