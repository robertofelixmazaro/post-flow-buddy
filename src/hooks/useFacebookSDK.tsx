import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';

declare global {
  interface Window {
    FB: {
      init: (params: {
        appId: string;
        cookie: boolean;
        xfbml: boolean;
        version: string;
      }) => void;
      login: (
        callback: (response: FacebookLoginResponse) => void,
        options?: { scope: string; return_scopes?: boolean }
      ) => void;
      logout: (callback?: () => void) => void;
      getLoginStatus: (callback: (response: FacebookLoginResponse) => void) => void;
      api: (
        path: string,
        method: string | object,
        params?: object | ((response: any) => void),
        callback?: (response: any) => void
      ) => void;
      AppEvents: {
        logPageView: () => void;
      };
    };
    __FB_APP_ID__?: string;
  }
}

interface FacebookAuthResponse {
  accessToken: string;
  expiresIn: number;
  signedRequest: string;
  userID: string;
  grantedScopes?: string;
}

interface FacebookLoginResponse {
  status: 'connected' | 'not_authorized' | 'unknown';
  authResponse: FacebookAuthResponse | null;
}

interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
}

interface InstagramAccount {
  id: string;
  username: string;
  name?: string;
}

export function useFacebookSDK() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const appId = import.meta.env.VITE_FACEBOOK_APP_ID;

  useEffect(() => {
    if (!appId) {
      console.warn('VITE_FACEBOOK_APP_ID not configured');
      return;
    }

    // Set the app ID for the SDK
    window.__FB_APP_ID__ = appId;

    const handleSDKReady = () => {
      setIsReady(true);
    };

    // Check if SDK is already loaded
    if (window.FB) {
      // Re-init with our app ID
      window.FB.init({
        appId,
        cookie: true,
        xfbml: true,
        version: 'v18.0'
      });
      setIsReady(true);
    } else {
      window.addEventListener('fb-sdk-ready', handleSDKReady);
    }

    return () => {
      window.removeEventListener('fb-sdk-ready', handleSDKReady);
    };
  }, [appId]);

  const loginWithFacebook = useCallback(async (type: 'facebook' | 'instagram' = 'facebook') => {
    if (!window.FB || !isReady) {
      setError('Facebook SDK não está pronto');
      return { success: false, error: 'SDK not ready' };
    }

    if (!user) {
      setError('Usuário não autenticado');
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    const scope = type === 'instagram'
      ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management'
      : 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile';

    return new Promise<{ success: boolean; error?: string }>((resolve) => {
      window.FB.login(
        async (response) => {
          if (response.status === 'connected' && response.authResponse) {
            try {
              const result = await handleSuccessfulLogin(response.authResponse, type);
              resolve(result);
            } catch (err: any) {
              setError(err.message);
              resolve({ success: false, error: err.message });
            }
          } else {
            setError('Login cancelado ou não autorizado');
            resolve({ success: false, error: 'Login cancelled' });
          }
          setIsLoading(false);
        },
        { scope, return_scopes: true }
      );
    });
  }, [isReady, user]);

  const handleSuccessfulLogin = async (
    authResponse: FacebookAuthResponse,
    type: 'facebook' | 'instagram'
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { accessToken, userID, expiresIn } = authResponse;

    // Get user info
    const userInfo = await new Promise<any>((resolve) => {
      window.FB.api('/me', { fields: 'id,name' }, resolve);
    });

    if (type === 'facebook') {
      // Get pages the user manages
      const pagesResponse = await new Promise<any>((resolve) => {
        window.FB.api('/me/accounts', { fields: 'id,name,access_token,category' }, resolve);
      });

      if (!pagesResponse.data || pagesResponse.data.length === 0) {
        return { success: false, error: 'Nenhuma página encontrada. Você precisa ter uma Página do Facebook.' };
      }

      // Use the first page (you could let user choose)
      const page: FacebookPage = pagesResponse.data[0];

      // Save connection to database
      await saveConnection({
        network: 'facebook',
        accessToken: page.access_token,
        accountId: userID,
        accountName: userInfo.name,
        pageId: page.id,
        pageName: page.name,
        expiresIn
      });

      return { success: true };
    } else {
      // Instagram - need to get Instagram Business Account linked to a page
      const pagesResponse = await new Promise<any>((resolve) => {
        window.FB.api(
          '/me/accounts',
          { fields: 'id,name,access_token,instagram_business_account{id,username,name}' },
          resolve
        );
      });

      if (!pagesResponse.data || pagesResponse.data.length === 0) {
        return { success: false, error: 'Nenhuma página encontrada.' };
      }

      // Find page with Instagram account
      const pageWithInstagram = pagesResponse.data.find(
        (p: any) => p.instagram_business_account
      );

      if (!pageWithInstagram) {
        return {
          success: false,
          error: 'Nenhuma conta Instagram Business vinculada. Vincule sua conta Instagram a uma Página do Facebook.'
        };
      }

      const igAccount: InstagramAccount = pageWithInstagram.instagram_business_account;

      await saveConnection({
        network: 'instagram',
        accessToken: pageWithInstagram.access_token,
        accountId: igAccount.id,
        accountName: igAccount.name || igAccount.username,
        accountUsername: igAccount.username,
        pageId: pageWithInstagram.id,
        pageName: pageWithInstagram.name,
        expiresIn
      });

      return { success: true };
    }
  };

  const saveConnection = async (data: {
    network: 'facebook' | 'instagram';
    accessToken: string;
    accountId: string;
    accountName?: string;
    accountUsername?: string;
    pageId?: string;
    pageName?: string;
    expiresIn: number;
  }) => {
    if (!user) throw new Error('User not authenticated');

    // Simple XOR encryption (same as oauth-callback)
    const encryptToken = (token: string): string => {
      const key = 'lovable-social-key';
      let result = '';
      for (let i = 0; i < token.length; i++) {
        result += String.fromCharCode(token.charCodeAt(i) ^ key.charCodeAt(i % key.length));
      }
      return btoa(result);
    };

    const tokenExpiresAt = new Date(Date.now() + data.expiresIn * 1000).toISOString();

    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: user.id,
        network: data.network,
        account_id: data.accountId,
        account_name: data.accountName || null,
        account_username: data.accountUsername || null,
        page_id: data.pageId || null,
        page_name: data.pageName || null,
        access_token_encrypted: encryptToken(data.accessToken),
        token_expires_at: tokenExpiresAt,
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,network'
      });

    if (dbError) {
      throw new Error(`Erro ao salvar conexão: ${dbError.message}`);
    }

    // Invalidate queries to refresh the connections list
    queryClient.invalidateQueries({ queryKey: ['social-connections'] });
  };

  const logout = useCallback(() => {
    if (window.FB) {
      window.FB.logout();
    }
  }, []);

  return {
    isReady,
    isLoading,
    error,
    isConfigured: !!appId,
    loginWithFacebook,
    logout
  };
}
