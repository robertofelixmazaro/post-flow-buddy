import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export interface SocialConnection {
  id: string;
  user_id: string;
  network: 'instagram' | 'facebook' | 'twitter' | 'linkedin';
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

// OAuth URLs for each platform
export function getOAuthUrl(network: string): string {
  const baseUrl = `${window.location.origin}`;
  const redirectUri = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/oauth-callback`;
  
  switch (network) {
    case 'facebook':
      // Meta OAuth - requires Facebook App ID
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=pages_manage_posts,pages_read_engagement,pages_show_list&state=${network}`;
    
    case 'instagram':
      // Instagram uses Facebook OAuth with instagram permissions
      return `https://www.facebook.com/v18.0/dialog/oauth?client_id=YOUR_APP_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=instagram_basic,instagram_content_publish,pages_show_list&state=${network}`;
    
    case 'twitter':
      // X/Twitter OAuth 2.0
      return `https://twitter.com/i/oauth2/authorize?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=tweet.read%20tweet.write%20users.read&state=${network}&code_challenge=challenge&code_challenge_method=plain`;
    
    case 'linkedin':
      // LinkedIn OAuth
      return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=YOUR_CLIENT_ID&redirect_uri=${encodeURIComponent(redirectUri)}&scope=w_member_social&state=${network}`;
    
    default:
      return '#';
  }
}
