import { createClient } from 'npm:@supabase/supabase-js@2';
import { encryptToken, verifyState, callbackUri, MissingSecretError } from '../_shared/security.ts';

// Public endpoint called by the OAuth provider (no user JWT available here).
// Trust is established by the HMAC-signed, one-time, expiring `state`
// created by the authenticated `oauth-start` function.

const SETTINGS_PATH = '/configuracoes';

function back(frontendUrl: string | undefined, params: Record<string, string>): Response {
  if (!frontendUrl) {
    return new Response('FRONTEND_URL não configurado no backend. Volte ao app e tente novamente.', {
      status: 500, headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });
  }
  const qs = new URLSearchParams(params).toString();
  return Response.redirect(`${frontendUrl.replace(/\/$/, '')}${SETTINGS_PATH}?${qs}`, 302);
}

Deno.serve(async (req) => {
  const frontendUrl = Deno.env.get('FRONTEND_URL') || undefined;
  if (req.method !== 'GET') return back(frontendUrl, { error: 'invalid_request' });

  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const state = url.searchParams.get('state');
  const providerError = url.searchParams.get('error');

  if (providerError) {
    return back(frontendUrl, {
      error: providerError.slice(0, 100),
      error_description: (url.searchParams.get('error_description') || '').slice(0, 300),
    });
  }
  if (!state) return back(frontendUrl, { error: 'missing_state' });
  if (!code || code.length < 10 || code.length > 5000) return back(frontendUrl, { error: 'invalid_code' });

  try {
    const payload = await verifyState(state);
    if (!payload) return back(frontendUrl, { error: 'invalid_state' });

    const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

    // Consume the nonce atomically (one-time use, not expired, bound to user + network)
    const { data: consumed, error: consumeErr } = await admin
      .from('oauth_states')
      .update({ used_at: new Date().toISOString() })
      .eq('nonce', payload.n)
      .is('used_at', null)
      .gt('expires_at', new Date().toISOString())
      .select('user_id, network')
      .maybeSingle();

    if (consumeErr || !consumed || consumed.user_id !== payload.u || consumed.network !== payload.net) {
      return back(frontendUrl, { error: 'invalid_state' });
    }

    const userId = consumed.user_id as string;
    const network = consumed.network as string;
    const redirectUri = callbackUri();

    let acc: {
      account_id: string; account_name: string; account_username?: string;
      access_token: string; refresh_token?: string; expires_in?: number;
      page_id?: string; page_name?: string; permissions?: string[];
    };

    switch (network) {
      case 'facebook':
      case 'instagram': {
        const appId = Deno.env.get('FACEBOOK_APP_ID');
        const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
        if (!appId || !appSecret) return back(frontendUrl, { error: 'oauth_not_configured' });

        const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${appId}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${appSecret}&code=${encodeURIComponent(code)}`);
        const token = await tokenRes.json();
        if (token.error) throw new Error(`Meta: ${token.error.message}`);

        const me = await (await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${token.access_token}`)).json();
        const pages = await (await fetch(`https://graph.facebook.com/v18.0/me/accounts?fields=id,name,access_token,instagram_business_account{id,username}&access_token=${token.access_token}`)).json();

        if (network === 'facebook') {
          const page = pages.data?.[0];
          if (!page) throw new Error('Nenhuma Página do Facebook encontrada para esta conta.');
          acc = {
            account_id: page.id, account_name: me.name, page_id: page.id, page_name: page.name,
            access_token: page.access_token, permissions: ['pages_manage_posts', 'pages_read_engagement'],
          };
        } else {
          const page = pages.data?.find((p: any) => p.instagram_business_account);
          if (!page) throw new Error('Nenhuma conta Instagram Business/Creator vinculada a uma Página do Facebook.');
          acc = {
            account_id: page.instagram_business_account.id,
            account_name: page.instagram_business_account.username,
            account_username: page.instagram_business_account.username,
            page_id: page.id, page_name: page.name,
            access_token: page.access_token, permissions: ['instagram_basic', 'instagram_content_publish'],
          };
        }
        break;
      }

      case 'tiktok': {
        const key = Deno.env.get('TIKTOK_CLIENT_KEY');
        const secret = Deno.env.get('TIKTOK_CLIENT_SECRET');
        if (!key || !secret) return back(frontendUrl, { error: 'oauth_not_configured' });
        const tokenRes = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ client_key: key, client_secret: secret, code, grant_type: 'authorization_code', redirect_uri: redirectUri }),
        });
        const token = await tokenRes.json();
        if (token.error && token.error !== 'ok') throw new Error(`TikTok: ${token.error_description || token.error}`);
        const user = await (await fetch('https://open.tiktokapis.com/v2/user/info/?fields=open_id,display_name,username', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        })).json();
        acc = {
          account_id: token.open_id || user.data?.user?.open_id,
          account_name: user.data?.user?.display_name || 'TikTok',
          account_username: user.data?.user?.username,
          access_token: token.access_token, refresh_token: token.refresh_token, expires_in: token.expires_in,
          permissions: ['user.info.basic', 'video.publish'],
        };
        break;
      }

      case 'linkedin': {
        const id = Deno.env.get('LINKEDIN_CLIENT_ID');
        const secret = Deno.env.get('LINKEDIN_CLIENT_SECRET');
        if (!id || !secret) return back(frontendUrl, { error: 'oauth_not_configured' });
        const tokenRes = await fetch('https://www.linkedin.com/oauth/v2/accessToken', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri, client_id: id, client_secret: secret }),
        });
        const token = await tokenRes.json();
        if (token.error) throw new Error(`LinkedIn: ${token.error_description || token.error}`);
        const info = await (await fetch('https://api.linkedin.com/v2/userinfo', {
          headers: { Authorization: `Bearer ${token.access_token}` },
        })).json();
        acc = {
          account_id: info.sub, account_name: info.name,
          access_token: token.access_token, refresh_token: token.refresh_token, expires_in: token.expires_in,
          permissions: ['openid', 'profile', 'w_member_social'],
        };
        break;
      }

      default:
        return back(frontendUrl, { error: 'unsupported_network' });
    }

    if (!acc.account_id || !acc.access_token) throw new Error('Resposta do provedor incompleta.');

    const { error: dbError } = await admin.from('social_connections').upsert({
      user_id: userId,
      network,
      account_id: acc.account_id,
      account_name: acc.account_name || null,
      account_username: acc.account_username || null,
      page_id: acc.page_id || null,
      page_name: acc.page_name || null,
      access_token_encrypted: await encryptToken(acc.access_token),
      refresh_token_encrypted: acc.refresh_token ? await encryptToken(acc.refresh_token) : null,
      token_expires_at: acc.expires_in ? new Date(Date.now() + acc.expires_in * 1000).toISOString() : null,
      permissions: acc.permissions || [],
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,network,account_id' });

    if (dbError) {
      console.error('social_connections upsert failed:', dbError.code, dbError.message);
      return back(frontendUrl, { error: 'save_failed' });
    }
    console.log(`OAuth connection saved: network=${network}`);
    return back(frontendUrl, { connected: network });
  } catch (e) {
    if (e instanceof MissingSecretError) return back(frontendUrl, { error: 'server_config_error' });
    const msg = e instanceof Error ? e.message : 'unknown_error';
    console.error('OAuth callback error:', msg);
    return back(frontendUrl, { error: msg.slice(0, 300) });
  }
});
