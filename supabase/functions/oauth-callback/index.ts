import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encryption key should be stored securely
const ENCRYPTION_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || 'default-key-change-in-production';

async function encryptToken(token: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const key = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');

    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${frontendUrl}/configuracoes?error=${error}`);
    }

    if (!code || !state) {
      return Response.redirect(`${frontendUrl}/configuracoes?error=missing_params`);
    }

    // Parse state to get network and user_id
    let network: string;
    let userId: string = '';
    
    try {
      const stateData = JSON.parse(atob(state));
      network = stateData.network;
      userId = stateData.userId || '';
    } catch {
      network = state;
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;

    let accountData: {
      account_id: string;
      account_name: string;
      account_username?: string;
      access_token: string;
      refresh_token?: string;
      expires_in?: number;
      page_id?: string;
      page_name?: string;
      permissions?: string[];
    };

    switch (network) {
      case 'facebook':
      case 'instagram': {
        const fbAppId = Deno.env.get('FACEBOOK_APP_ID');
        const fbAppSecret = Deno.env.get('FACEBOOK_APP_SECRET');
        
        if (!fbAppId || !fbAppSecret) {
          throw new Error('Facebook credentials not configured');
        }
        
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${code}`;
        
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error.message);
        }

        const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.access_token}`;
        const userInfoResponse = await fetch(userInfoUrl);
        const userInfo = await userInfoResponse.json();

        if (network === 'facebook') {
          const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`;
          const pagesResponse = await fetch(pagesUrl);
          const pagesData = await pagesResponse.json();

          const page = pagesData.data?.[0];
          accountData = {
            account_id: userInfo.id,
            account_name: userInfo.name,
            page_id: page?.id,
            page_name: page?.name,
            access_token: page?.access_token || tokenData.access_token,
            expires_in: tokenData.expires_in,
            permissions: ['pages_manage_posts', 'pages_read_engagement'],
          };
        } else {
          const igAccountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=id,name,instagram_business_account{id,username}&access_token=${tokenData.access_token}`;
          const igResponse = await fetch(igAccountsUrl);
          const igData = await igResponse.json();

          const page = igData.data?.find((p: any) => p.instagram_business_account);
          if (!page) {
            throw new Error('No Instagram Business Account found. Make sure your Instagram account is connected to a Facebook Page.');
          }

          accountData = {
            account_id: page.instagram_business_account.id,
            account_name: page.instagram_business_account.username,
            account_username: page.instagram_business_account.username,
            page_id: page.id,
            page_name: page.name,
            access_token: tokenData.access_token,
            expires_in: tokenData.expires_in,
            permissions: ['instagram_basic', 'instagram_content_publish'],
          };
        }
        break;
      }

      case 'tiktok': {
        const clientKey = Deno.env.get('TIKTOK_CLIENT_KEY');
        const clientSecret = Deno.env.get('TIKTOK_CLIENT_SECRET');
        
        if (!clientKey || !clientSecret) {
          throw new Error('TikTok credentials not configured');
        }

        const tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            client_key: clientKey,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: redirectUri,
          }),
        });

        const tokenData = await tokenResponse.json();
        console.log('TikTok token response:', { hasToken: !!tokenData.access_token });

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }

        const userResponse = await fetch(
          'https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,avatar_url,username',
          { headers: { 'Authorization': `Bearer ${tokenData.access_token}` } }
        );
        const userData = await userResponse.json();

        accountData = {
          account_id: tokenData.open_id || userData.data?.user?.open_id,
          account_name: userData.data?.user?.display_name || 'TikTok User',
          account_username: userData.data?.user?.username,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          permissions: ['user.info.basic', 'video.publish'],
        };
        break;
      }

      case 'linkedin': {
        const linkedinClientId = Deno.env.get('LINKEDIN_CLIENT_ID');
        const linkedinClientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');
        
        if (!linkedinClientId || !linkedinClientSecret) {
          throw new Error('LinkedIn credentials not configured');
        }

        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: linkedinClientId,
            client_secret: linkedinClientSecret
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }

        const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userInfo = await userInfoResponse.json();

        accountData = {
          account_id: userInfo.sub,
          account_name: userInfo.name,
          account_username: userInfo.email,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in,
          permissions: ['openid', 'profile', 'w_member_social'],
        };
        break;
      }

      default:
        throw new Error(`Unsupported network: ${network}`);
    }

    if (!userId) {
      throw new Error('User not authenticated');
    }

    const encryptedAccessToken = await encryptToken(accountData.access_token);
    const encryptedRefreshToken = accountData.refresh_token 
      ? await encryptToken(accountData.refresh_token) 
      : null;

    const tokenExpiresAt = accountData.expires_in 
      ? new Date(Date.now() + accountData.expires_in * 1000).toISOString()
      : null;

    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        network: network,
        account_id: accountData.account_id,
        account_name: accountData.account_name,
        account_username: accountData.account_username || null,
        page_id: accountData.page_id || null,
        page_name: accountData.page_name || null,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        permissions: accountData.permissions || [],
        connected_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,network,account_id'
      });

    if (dbError) {
      console.error('Database error:', dbError);
      throw dbError;
    }

    console.log(`Social connection saved for ${network}`);
    return Response.redirect(`${frontendUrl}/configuracoes?connected=${network}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
    return Response.redirect(`${frontendUrl}/configuracoes?error=${encodeURIComponent(errorMessage)}`);
  }
});
