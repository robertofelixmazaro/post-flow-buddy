import { createClient } from 'npm:@supabase/supabase-js@2';
import {
  ALLOWED_NETWORKS, Network, OAUTH_SCOPES, callbackUri, corsHeaders, getUserId, json,
  randomNonce, signState, MissingSecretError,
} from '../_shared/security.ts';

// Authenticated endpoint.
//  { action: "config" }            -> which networks are configured + public Meta App ID + callback URI
//  { action: "start", network }    -> creates a one-time signed state and returns the provider authorize URL

function providerConfigured(n: Network): boolean {
  switch (n) {
    case 'facebook':
    case 'instagram':
      return !!Deno.env.get('FACEBOOK_APP_ID') && !!Deno.env.get('FACEBOOK_APP_SECRET');
    case 'tiktok':
      return !!Deno.env.get('TIKTOK_CLIENT_KEY') && !!Deno.env.get('TIKTOK_CLIENT_SECRET');
    case 'linkedin':
      return !!Deno.env.get('LINKEDIN_CLIENT_ID') && !!Deno.env.get('LINKEDIN_CLIENT_SECRET');
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const admin = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);
  const userId = await getUserId(req, admin);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  let body: any;
  try { body = await req.json(); } catch { return json({ error: 'Invalid JSON' }, 400); }

  const securityReady = {
    tokenEncryption: (Deno.env.get('TOKEN_ENCRYPTION_KEY') || '').length >= 32,
    stateSigning: (Deno.env.get('OAUTH_STATE_SECRET') || '').length >= 32,
    frontendUrl: !!Deno.env.get('FRONTEND_URL'),
  };

  if (body?.action === 'config') {
    const configured = Object.fromEntries(ALLOWED_NETWORKS.map((n) => [n, providerConfigured(n)]));
    return json({
      configured,
      facebookAppId: Deno.env.get('FACEBOOK_APP_ID') || null, // public value
      redirectUri: callbackUri(),
      security: securityReady,
    });
  }

  if (body?.action !== 'start') return json({ error: 'Unknown action' }, 400);
  const network = body.network as Network;
  if (!ALLOWED_NETWORKS.includes(network)) return json({ error: 'Rede inválida' }, 400);
  if (!providerConfigured(network)) {
    return json({ error: `OAuth de ${network} não configurado no backend (faltam credenciais do provedor).` }, 400);
  }
  if (!securityReady.frontendUrl) return json({ error: 'FRONTEND_URL não configurado no backend.' }, 500);

  try {
    const nonce = randomNonce();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    const { error } = await admin.from('oauth_states').insert({
      nonce, user_id: userId, network, expires_at: expiresAt.toISOString(),
    });
    if (error) {
      console.error('oauth_states insert failed:', error.code);
      return json({ error: 'Armazenamento de state indisponível (migração de banco pendente).' }, 500);
    }
    const state = await signState({ n: nonce, u: userId, net: network, exp: Math.floor(expiresAt.getTime() / 1000) });
    const redirect = encodeURIComponent(callbackUri());
    const scope = encodeURIComponent(OAUTH_SCOPES[network]);
    const st = encodeURIComponent(state);

    let url: string;
    switch (network) {
      case 'facebook':
      case 'instagram':
        url = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${Deno.env.get('FACEBOOK_APP_ID')}&redirect_uri=${redirect}&scope=${scope}&response_type=code&state=${st}`;
        break;
      case 'tiktok':
        url = `https://www.tiktok.com/v2/auth/authorize/?client_key=${Deno.env.get('TIKTOK_CLIENT_KEY')}&redirect_uri=${redirect}&response_type=code&scope=${scope}&state=${st}`;
        break;
      case 'linkedin':
        url = `https://www.linkedin.com/oauth/v2/authorization?client_id=${Deno.env.get('LINKEDIN_CLIENT_ID')}&redirect_uri=${redirect}&response_type=code&scope=${scope}&state=${st}`;
        break;
    }
    return json({ url, redirectUri: callbackUri() });
  } catch (e) {
    if (e instanceof MissingSecretError) return json({ error: e.message }, 500);
    console.error('oauth-start error');
    return json({ error: 'Erro ao iniciar OAuth' }, 500);
  }
});
