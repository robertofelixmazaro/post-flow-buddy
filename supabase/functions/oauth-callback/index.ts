import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Encryption key should be stored securely
const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') || 'default-key-change-in-production';

async function encryptToken(token: string): Promise<string> {
  // In production, use proper encryption (e.g., AES-256-GCM)
  // This is a simplified example - implement proper encryption
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const key = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  // XOR-based obfuscation (replace with proper encryption in production)
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // network type
    const error = url.searchParams.get('error');

    if (error) {
      console.error('OAuth error:', error);
      return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/configuracoes?error=${error}`);
    }

    if (!code || !state) {
      return new Response(
        JSON.stringify({ error: 'Missing code or state parameter' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get user from authorization header
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;

    if (authHeader) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      userId = user?.id || null;
    }

    let tokenResponse;
    let accountData;

    // Exchange code for tokens based on platform
    switch (state) {
      case 'facebook':
      case 'instagram': {
        const fbAppId = Deno.env.get('META_APP_ID');
        const fbAppSecret = Deno.env.get('META_APP_SECRET');
        const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
        
        // Exchange code for access token
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${code}`;
        
        tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error.message);
        }

        // Get user info
        const userInfoUrl = `https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${tokenData.access_token}`;
        const userInfoResponse = await fetch(userInfoUrl);
        const userInfo = await userInfoResponse.json();

        // Get pages (for Facebook) or Instagram accounts
        if (state === 'facebook') {
          const pagesUrl = `https://graph.facebook.com/v18.0/me/accounts?access_token=${tokenData.access_token}`;
          const pagesResponse = await fetch(pagesUrl);
          const pagesData = await pagesResponse.json();

          if (pagesData.data && pagesData.data.length > 0) {
            const page = pagesData.data[0];
            accountData = {
              account_id: userInfo.id,
              account_name: userInfo.name,
              page_id: page.id,
              page_name: page.name,
              access_token: page.access_token, // Page access token for posting
            };
          }
        } else {
          // Instagram - get Instagram Business Account
          const igAccountsUrl = `https://graph.facebook.com/v18.0/me/accounts?fields=instagram_business_account{id,name,username}&access_token=${tokenData.access_token}`;
          const igResponse = await fetch(igAccountsUrl);
          const igData = await igResponse.json();

          if (igData.data && igData.data.length > 0) {
            const page = igData.data.find((p: any) => p.instagram_business_account);
            if (page) {
              accountData = {
                account_id: page.instagram_business_account.id,
                account_name: page.instagram_business_account.name,
                account_username: page.instagram_business_account.username,
                page_id: page.id,
                access_token: tokenData.access_token,
              };
            }
          }
        }
        break;
      }

      case 'twitter': {
        const twitterClientId = Deno.env.get('TWITTER_CLIENT_ID');
        const twitterClientSecret = Deno.env.get('TWITTER_CLIENT_SECRET');
        const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;
        
        // Exchange code for tokens
        const tokenUrl = 'https://api.twitter.com/2/oauth2/token';
        const basicAuth = btoa(`${twitterClientId}:${twitterClientSecret}`);
        
        tokenResponse = await fetch(tokenUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Authorization': `Basic ${basicAuth}`
          },
          body: new URLSearchParams({
            code,
            grant_type: 'authorization_code',
            client_id: twitterClientId!,
            redirect_uri: redirectUri,
            code_verifier: 'challenge'
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }

        // Get user info
        const userInfoUrl = 'https://api.twitter.com/2/users/me';
        const userInfoResponse = await fetch(userInfoUrl, {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userInfo = await userInfoResponse.json();

        accountData = {
          account_id: userInfo.data.id,
          account_name: userInfo.data.name,
          account_username: userInfo.data.username,
          access_token: tokenData.access_token,
          refresh_token: tokenData.refresh_token,
          expires_in: tokenData.expires_in
        };
        break;
      }

      case 'linkedin': {
        const linkedinClientId = Deno.env.get('LINKEDIN_CLIENT_ID');
        const linkedinClientSecret = Deno.env.get('LINKEDIN_CLIENT_SECRET');
        const redirectUri = `${supabaseUrl}/functions/v1/oauth-callback`;

        tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: redirectUri,
            client_id: linkedinClientId!,
            client_secret: linkedinClientSecret!
          })
        });

        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          throw new Error(tokenData.error_description || tokenData.error);
        }

        // Get user info
        const userInfoResponse = await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { 'Authorization': `Bearer ${tokenData.access_token}` }
        });
        const userInfo = await userInfoResponse.json();

        accountData = {
          account_id: userInfo.sub,
          account_name: userInfo.name,
          access_token: tokenData.access_token,
          expires_in: tokenData.expires_in
        };
        break;
      }

      default:
        throw new Error(`Unsupported network: ${state}`);
    }

    if (!accountData || !userId) {
      throw new Error('Failed to get account data or user not authenticated');
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(accountData.access_token);
    const encryptedRefreshToken = accountData.refresh_token 
      ? await encryptToken(accountData.refresh_token) 
      : null;

    // Calculate token expiration
    const tokenExpiresAt = accountData.expires_in 
      ? new Date(Date.now() + accountData.expires_in * 1000).toISOString()
      : null;

    // Store connection in database
    const { error: dbError } = await supabase
      .from('social_connections')
      .upsert({
        user_id: userId,
        network: state,
        account_id: accountData.account_id,
        account_name: accountData.account_name,
        account_username: accountData.account_username || null,
        page_id: accountData.page_id || null,
        page_name: accountData.page_name || null,
        access_token_encrypted: encryptedAccessToken,
        refresh_token_encrypted: encryptedRefreshToken,
        token_expires_at: tokenExpiresAt,
        permissions: [],
        connected_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,network,account_id'
      });

    if (dbError) {
      throw dbError;
    }

    // Redirect back to settings with success
    return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/configuracoes?connected=${state}`);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.redirect(`${Deno.env.get('FRONTEND_URL') || 'http://localhost:5173'}/configuracoes?error=${encodeURIComponent(errorMessage)}`);
  }
});
