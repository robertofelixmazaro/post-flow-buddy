import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders, encryptToken, getUserId, json, MissingSecretError } from '../_shared/security.ts';

// Authenticated endpoint used by the Facebook JS SDK flow.
// The browser sends the Page access token it received from Meta; the backend
// verifies it with Meta (issued for OUR app, valid, matches the page) and
// stores it encrypted. The browser never writes tokens to the database.

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userId = await getUserId(req, admin);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }
  const { network, pageId, pageAccessToken, instagramAccountId } = body || {};

  if (network !== 'facebook' && network !== 'instagram') return json({ error: 'Rede inválida' }, 400);
  if (typeof pageId !== 'string' || !/^\d{1,30}$/.test(pageId)) return json({ error: 'pageId inválido' }, 400);
  if (typeof pageAccessToken !== 'string' || pageAccessToken.length < 20 || pageAccessToken.length > 2000) {
    return json({ error: 'Token inválido' }, 400);
  }
  if (network === 'instagram' && (typeof instagramAccountId !== 'string' || !/^\d{1,30}$/.test(instagramAccountId))) {
    return json({ error: 'instagramAccountId inválido' }, 400);
  }

  const appId = Deno.env.get('FACEBOOK_APP_ID');
  const appSecret = Deno.env.get('FACEBOOK_APP_SECRET');
  if (!appId || !appSecret) return json({ error: 'Meta App não configurado no backend' }, 500);

  try {
    // 1) Token must be valid and issued for this app
    const debug = await (await fetch(
      `https://graph.facebook.com/v18.0/debug_token?input_token=${encodeURIComponent(pageAccessToken)}&access_token=${appId}|${appSecret}`,
    )).json();
    const d = debug?.data;
    if (!d?.is_valid || String(d.app_id) !== String(appId)) {
      return json({ error: 'Token da Meta inválido ou emitido para outro app.' }, 400);
    }

    // 2) Token must belong to the given page
    const page = await (await fetch(
      `https://graph.facebook.com/v18.0/${pageId}?fields=id,name,instagram_business_account{id,username,name}&access_token=${encodeURIComponent(pageAccessToken)}`,
    )).json();
    if (page.error || page.id !== pageId) return json({ error: 'Página não corresponde ao token.' }, 400);

    let row: Record<string, unknown>;
    if (network === 'facebook') {
      row = { account_id: page.id, account_name: page.name, page_id: page.id, page_name: page.name,
        permissions: ['pages_manage_posts', 'pages_read_engagement'] };
    } else {
      const ig = page.instagram_business_account;
      if (!ig || ig.id !== instagramAccountId) return json({ error: 'Conta Instagram não vinculada a esta Página.' }, 400);
      row = { account_id: ig.id, account_name: ig.name || ig.username, account_username: ig.username,
        page_id: page.id, page_name: page.name, permissions: ['instagram_basic', 'instagram_content_publish'] };
    }

    const expiresAt = d.expires_at && d.expires_at > 0 ? new Date(d.expires_at * 1000).toISOString() : null;

    const { error } = await admin.from('social_connections').upsert({
      user_id: userId,
      network,
      ...row,
      access_token_encrypted: await encryptToken(pageAccessToken),
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id,network,account_id' });

    if (error) {
      console.error('save-meta-connection upsert failed:', error.code, error.message);
      return json({ error: `Erro ao salvar conexão: ${error.message}` }, 500);
    }
    return json({ success: true });
  } catch (e) {
    if (e instanceof MissingSecretError) return json({ error: e.message }, 500);
    console.error('save-meta-connection error:', e instanceof Error ? e.message : 'unknown');
    return json({ error: 'Erro ao validar conexão com a Meta' }, 500);
  }
});
