import { createClient } from "https://esm.sh/@supabase/supabase-js@2.89.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Use dedicated encryption key, fall back to service role key
const ENCRYPTION_KEY = Deno.env.get('TOKEN_ENCRYPTION_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

async function encryptToken(token: string): Promise<string> {
  if (!ENCRYPTION_KEY) {
    throw new Error('Encryption key not configured');
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(token);
  const key = encoder.encode(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  
  const encrypted = new Uint8Array(data.length);
  for (let i = 0; i < data.length; i++) {
    encrypted[i] = data[i] ^ key[i % key.length];
  }
  
  return btoa(String.fromCharCode(...encrypted));
}

// ============ SECURITY VALIDATIONS ============

// Validate state parameter format and content (CSRF protection)
function validateState(state: string): { network: string; userId: string } | null {
  try {
    const decoded = JSON.parse(atob(state));
    
    // Validate required fields exist and are strings
    if (!decoded.network || typeof decoded.network !== 'string') {
      console.error('Invalid state: missing or invalid network');
      return null;
    }
    
    if (!decoded.userId || typeof decoded.userId !== 'string') {
      console.error('Invalid state: missing or invalid userId');
      return null;
    }
    
    // Validate network is one of the allowed values
    const allowedNetworks = ['facebook', 'instagram', 'tiktok', 'linkedin'];
    if (!allowedNetworks.includes(decoded.network)) {
      console.error('Invalid state: unknown network', decoded.network);
      return null;
    }
    
    // Validate userId format (UUID v4)
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(decoded.userId)) {
      console.error('Invalid state: userId is not a valid UUID');
      return null;
    }
    
    return { network: decoded.network, userId: decoded.userId };
  } catch (error) {
    console.error('Failed to parse state parameter:', error);
    return null;
  }
}

// Validate authorization code format
function validateAuthCode(code: string): boolean {
  if (!code || typeof code !== 'string') {
    return false;
  }
  
  // Auth codes should be reasonable length
  if (code.length < 10 || code.length > 5000) {
    console.error('Authorization code has invalid length:', code.length);
    return false;
  }
  
  return true;
}

// Rate limiting using in-memory map (resets on cold start)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60000; // 1 minute window
  const maxRequests = 10; // Max 10 requests per minute per user
  
  const record = rateLimitMap.get(identifier);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }
  
  if (record.count >= maxRequests) {
    console.warn('Rate limit exceeded for:', identifier);
    return false;
  }
  
  record.count++;
  return true;
}

// Verify user exists in the database
async function verifyUserExists(supabase: any, userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .single();
    
    if (error || !data) {
      console.error('User verification failed:', error?.message || 'User not found');
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('User verification error:', error);
    return false;
  }
}

// ============ MAIN HANDLER ============

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const frontendUrl = Deno.env.get('FRONTEND_URL') || 'https://lovable.dev';
  const settingsPath = '/settings';

  try {
    // Only accept GET requests for OAuth callbacks
    if (req.method !== 'GET') {
      console.error('Invalid HTTP method:', req.method);
      return Response.redirect(`${frontendUrl}${settingsPath}?error=invalid_request`, 302);
    }

    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state');
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    // Handle OAuth errors from provider
    if (error) {
      console.error('OAuth error from provider:', error, errorDescription);
      return Response.redirect(
        `${frontendUrl}${settingsPath}?error=${encodeURIComponent(error)}&error_description=${encodeURIComponent(errorDescription || '')}`,
        302
      );
    }

    // SECURITY: Validate state parameter (CSRF protection)
    if (!state) {
      console.error('Missing state parameter - possible CSRF attempt');
      return Response.redirect(`${frontendUrl}${settingsPath}?error=missing_state`, 302);
    }

    const stateData = validateState(state);
    if (!stateData) {
      console.error('Invalid state parameter - possible CSRF attempt');
      return Response.redirect(`${frontendUrl}${settingsPath}?error=invalid_state`, 302);
    }

    const { network, userId } = stateData;

    // SECURITY: Rate limiting check
    if (!checkRateLimit(userId)) {
      console.error('Rate limit exceeded for user:', userId);
      return Response.redirect(`${frontendUrl}${settingsPath}?error=rate_limit_exceeded`, 302);
    }

    // SECURITY: Validate authorization code
    if (!code) {
      console.error('Missing authorization code');
      return Response.redirect(`${frontendUrl}${settingsPath}?error=missing_code`, 302);
    }

    if (!validateAuthCode(code)) {
      console.error('Invalid authorization code format');
      return Response.redirect(`${frontendUrl}${settingsPath}?error=invalid_code`, 302);
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    if (!supabaseUrl || !supabaseServiceKey) {
      console.error('Supabase configuration missing');
      return Response.redirect(`${frontendUrl}${settingsPath}?error=server_config_error`, 302);
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // SECURITY: Verify user exists in database before proceeding
    const userExists = await verifyUserExists(supabase, userId);
    if (!userExists) {
      console.error('User not found in database:', userId);
      return Response.redirect(`${frontendUrl}${settingsPath}?error=unauthorized`, 302);
    }

    console.log(`Processing OAuth callback for network: ${network}, userId: ${userId}`);

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
          console.error('Facebook/Instagram OAuth not configured');
          return Response.redirect(`${frontendUrl}${settingsPath}?error=oauth_not_configured`, 302);
        }
        
        const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${fbAppId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${fbAppSecret}&code=${encodeURIComponent(code)}`;
        
        const tokenResponse = await fetch(tokenUrl);
        const tokenData = await tokenResponse.json();

        if (tokenData.error) {
          console.error('Facebook token exchange error:', tokenData.error);
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
          console.error('TikTok OAuth not configured');
          return Response.redirect(`${frontendUrl}${settingsPath}?error=oauth_not_configured`, 302);
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
          console.error('LinkedIn OAuth not configured');
          return Response.redirect(`${frontendUrl}${settingsPath}?error=oauth_not_configured`, 302);
        }

        const tokenResponse = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({
            grant_type: 'authorization_code',
            code: code,
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
        console.error('Unsupported network:', network);
        return Response.redirect(`${frontendUrl}${settingsPath}?error=unsupported_network`, 302);
    }

    // Encrypt tokens before storing
    const encryptedAccessToken = await encryptToken(accountData.access_token);
    const encryptedRefreshToken = accountData.refresh_token 
      ? await encryptToken(accountData.refresh_token) 
      : null;

    const tokenExpiresAt = accountData.expires_in 
      ? new Date(Date.now() + accountData.expires_in * 1000).toISOString()
      : null;

    // Store connection in database
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

    console.log(`Social connection saved successfully for ${network}, user: ${userId}`);
    return Response.redirect(`${frontendUrl}${settingsPath}?connected=${network}`, 302);

  } catch (error) {
    console.error('OAuth callback error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return Response.redirect(`${frontendUrl}${settingsPath}?error=${encodeURIComponent(errorMessage)}`, 302);
  }
});
