import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { useOAuthConfig } from './useSocialConnections';

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

export interface FacebookPage {
  id: string;
  name: string;
  access_token: string;
  category: string;
  instagram_business_account?: {
    id: string;
    username: string;
    name?: string;
  };
}

export interface PageSelectionData {
  type: 'facebook' | 'instagram';
  pages: FacebookPage[];
  userInfo: { id: string; name: string };
  expiresIn: number;
}

export function useFacebookSDK() {
  const [isReady, setIsReady] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pageSelectionData, setPageSelectionData] = useState<PageSelectionData | null>(null);
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Public Meta App ID comes from the backend configuration (single source of truth)
  const { data: oauthCfg } = useOAuthConfig();
  const appId = oauthCfg?.facebookAppId || '';

  useEffect(() => {
    if (!appId) {
      console.warn('Facebook App ID not configured');
      return;
    }

    // Set the app ID for the SDK
    window.__FB_APP_ID__ = appId;
    
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const markReady = () => {
      if (!window.FB) return;

      // Ensure the SDK is initialized (safe to call; FB will no-op if already initialized)
      try {
        window.FB.init({
          appId,
          cookie: true,
          xfbml: true,
          version: 'v18.0',
        });
      } catch {
        // ignore - sometimes FB is already initialized and can throw depending on load timing
      }

      console.log('Facebook SDK is ready');
      setIsReady(true);
      if (intervalId) {
        clearInterval(intervalId);
        intervalId = null;
      }
    };

    // Check if SDK is already loaded and initialized
    if (window.FB) {
      console.log('FB SDK already available');
      markReady();
      return;
    }
    
    // Wait for SDK to load
    const handleSDKReady = () => {
      console.log('fb-sdk-ready event received');
      if (window.FB) {
        markReady();
      }
    };
    
    window.addEventListener('fb-sdk-ready', handleSDKReady);
    
    // Also check periodically in case event was missed (max 10 seconds)
    let attempts = 0;
    const maxAttempts = 20;
    
    intervalId = setInterval(() => {
      attempts++;
      if (window.FB) {
        console.log('FB SDK detected via interval check');
        markReady();
      } else if (attempts >= maxAttempts) {
        console.warn('FB SDK failed to load after 10 seconds');
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    }, 500);

    return () => {
      window.removeEventListener('fb-sdk-ready', handleSDKReady);
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [appId]);

  const loginWithFacebook = useCallback(async (type: 'facebook' | 'instagram' = 'facebook') => {
    if (!window.FB) {
      const errorMsg = 'Facebook SDK não foi carregado. Recarregue a página.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!isReady) {
      const errorMsg = 'Facebook SDK ainda está inicializando. Aguarde um momento.';
      setError(errorMsg);
      return { success: false, error: errorMsg };
    }

    if (!user) {
      setError('Usuário não autenticado');
      return { success: false, error: 'User not authenticated' };
    }

    setIsLoading(true);
    setError(null);

    const scope =
      type === 'instagram'
        ? 'instagram_basic,instagram_content_publish,pages_show_list,pages_read_engagement,business_management'
        : 'pages_manage_posts,pages_read_engagement,pages_show_list,public_profile';

    // FB.login às vezes não chama o callback (popup bloqueado/iframe). Evitamos "spinner infinito" com timeout.
    return new Promise<{ success: boolean; error?: string; needsPageSelection?: boolean }>((resolve) => {
      let finished = false;

      const finish = (result: { success: boolean; error?: string; needsPageSelection?: boolean }) => {
        if (finished) return;
        finished = true;
        setIsLoading(false);
        resolve(result);
      };

      const timeoutId = window.setTimeout(() => {
        const msg =
          'Não foi possível abrir o login do Facebook/Instagram (popup bloqueado ou ambiente incorporado).';
        setError(msg);
        finish({ success: false, error: msg });
      }, 30000);

      try {
        window.FB.login(
          (response) => {
            // Mantém o callback como função "normal" (não-async) para evitar erros do SDK.
            void (async () => {
              window.clearTimeout(timeoutId);

              if (response.status === 'connected' && response.authResponse) {
                try {
                  const result = await fetchPagesForSelection(response.authResponse, type);
                  finish(result);
                } catch (err: any) {
                  const msg = err?.message || 'Erro ao buscar páginas';
                  setError(msg);
                  finish({ success: false, error: msg });
                }
                return;
              }

              const msg = 'Login cancelado ou não autorizado';
              setError(msg);
              finish({ success: false, error: msg });
            })();
          },
          { scope, return_scopes: true }
        );
      } catch (err: any) {
        window.clearTimeout(timeoutId);
        const msg = err?.message || 'Erro ao iniciar login do Facebook';
        setError(msg);
        finish({ success: false, error: msg });
      }
    });
  }, [isReady, user]);

  const fetchPagesForSelection = async (
    authResponse: FacebookAuthResponse,
    type: 'facebook' | 'instagram'
  ): Promise<{ success: boolean; error?: string; needsPageSelection?: boolean }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { expiresIn } = authResponse;

    // Get user info
    const userInfo = await new Promise<any>((resolve) => {
      window.FB.api('/me', { fields: 'id,name' }, resolve);
    });

    // Get pages with Instagram info
    const pagesResponse = await new Promise<any>((resolve) => {
      window.FB.api(
        '/me/accounts',
        { fields: 'id,name,access_token,category,instagram_business_account{id,username,name}' },
        resolve
      );
    });

    if (!pagesResponse.data || pagesResponse.data.length === 0) {
      return { 
        success: false, 
        error: type === 'instagram' 
          ? 'Nenhuma página encontrada. Vincule sua conta Instagram a uma Página do Facebook.'
          : 'Nenhuma página encontrada. Você precisa ter uma Página do Facebook.' 
      };
    }

    let availablePages: FacebookPage[] = pagesResponse.data;

    // For Instagram, filter only pages with Instagram accounts
    if (type === 'instagram') {
      availablePages = pagesResponse.data.filter((p: any) => p.instagram_business_account);
      
      if (availablePages.length === 0) {
        return {
          success: false,
          error: 'Nenhuma conta Instagram Business vinculada. Vincule sua conta Instagram a uma Página do Facebook.'
        };
      }
    }

    // If only one page, auto-select it
    if (availablePages.length === 1) {
      return await selectPage(availablePages[0], type, userInfo, expiresIn);
    }

    // Multiple pages - show selection dialog
    setPageSelectionData({
      type,
      pages: availablePages,
      userInfo,
      expiresIn
    });

    return { success: true, needsPageSelection: true };
  };

  const selectPage = async (
    page: FacebookPage,
    type: 'facebook' | 'instagram',
    userInfo: { id: string; name: string },
    expiresIn: number
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      if (type === 'facebook') {
        await saveConnection({
          network: 'facebook',
          accessToken: page.access_token,
          accountId: userInfo.id,
          accountName: userInfo.name,
          pageId: page.id,
          pageName: page.name,
          expiresIn
        });
      } else {
        // Instagram
        const igAccount = page.instagram_business_account!;
        await saveConnection({
          network: 'instagram',
          accessToken: page.access_token,
          accountId: igAccount.id,
          accountName: igAccount.name || igAccount.username,
          accountUsername: igAccount.username,
          pageId: page.id,
          pageName: page.name,
          expiresIn
        });
      }

      setPageSelectionData(null);
      return { success: true };
    } catch (err: any) {
      return { success: false, error: err.message };
    }
  };

  const confirmPageSelection = useCallback(async (page: FacebookPage) => {
    if (!pageSelectionData) return { success: false, error: 'No selection data' };

    setIsLoading(true);
    const result = await selectPage(
      page,
      pageSelectionData.type,
      pageSelectionData.userInfo,
      pageSelectionData.expiresIn
    );
    setIsLoading(false);

    return result;
  }, [pageSelectionData]);

  const cancelPageSelection = useCallback(() => {
    setPageSelectionData(null);
  }, []);

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

    // The backend validates the token with Meta and stores it encrypted.
    const { data: res, error } = await supabase.functions.invoke('save-meta-connection', {
      body: {
        network: data.network,
        pageId: data.pageId,
        pageAccessToken: data.accessToken,
        instagramAccountId: data.network === 'instagram' ? data.accountId : undefined,
      },
    });

    if (error || !res?.success) {
      let msg = res?.error || error?.message || 'Erro ao salvar conexão';
      try {
        const ctx = await (error as any)?.context?.json?.();
        if (ctx?.error) msg = ctx.error;
      } catch { /* ignore */ }
      throw new Error(msg);
    }

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
    logout,
    pageSelectionData,
    confirmPageSelection,
    cancelPageSelection
  };
}
