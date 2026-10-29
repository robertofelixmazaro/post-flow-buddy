// Shared security helpers for edge functions.
// - AES-256-GCM authenticated encryption for provider tokens (TOKEN_ENCRYPTION_KEY)
// - HMAC-SHA256 signed OAuth state (OAUTH_STATE_SECRET)
// No insecure fallbacks: if a secret is missing, functions fail closed.

const enc = new TextEncoder();
const dec = new TextDecoder();

function b64urlEncode(bytes: Uint8Array): string {
  let s = '';
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(str: string): Uint8Array {
  const pad = str.length % 4 === 0 ? '' : '='.repeat(4 - (str.length % 4));
  const bin = atob(str.replace(/-/g, '+').replace(/_/g, '/') + pad);
  return Uint8Array.from(bin, (c) => c.charCodeAt(0));
}

export class MissingSecretError extends Error {
  constructor(name: string) {
    super(`Secret ${name} não configurado no backend`);
    this.name = 'MissingSecretError';
  }
}

function requireSecret(name: string): string {
  const v = Deno.env.get(name);
  if (!v || v.length < 32) throw new MissingSecretError(name);
  return v;
}

let aesKeyPromise: Promise<CryptoKey> | null = null;
function getAesKey(): Promise<CryptoKey> {
  if (!aesKeyPromise) {
    const secret = requireSecret('TOKEN_ENCRYPTION_KEY');
    aesKeyPromise = crypto.subtle
      .digest('SHA-256', enc.encode(secret))
      .then((raw) => crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt']));
  }
  return aesKeyPromise;
}

/** Encrypts a token. Output format: "v1.<iv>.<ciphertext+tag>" (base64url). */
export async function encryptToken(plain: string): Promise<string> {
  const key = await getAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = new Uint8Array(await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain)));
  return `v1.${b64urlEncode(iv)}.${b64urlEncode(ct)}`;
}

/** Decrypts a token produced by encryptToken. Legacy (XOR) values are rejected. */
export async function decryptToken(stored: string): Promise<string> {
  const parts = stored.split('.');
  if (parts.length !== 3 || parts[0] !== 'v1') {
    throw new Error('LEGACY_TOKEN_FORMAT');
  }
  const key = await getAesKey();
  const pt = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: b64urlDecode(parts[1]) },
    key,
    b64urlDecode(parts[2]),
  );
  return dec.decode(pt);
}

async function hmacKey(): Promise<CryptoKey> {
  const secret = requireSecret('OAUTH_STATE_SECRET');
  return crypto.subtle.importKey('raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export interface StatePayload {
  n: string; // nonce (one-time, stored in oauth_states)
  u: string; // user id
  net: string; // network
  exp: number; // unix seconds
}

export async function signState(payload: StatePayload): Promise<string> {
  const body = b64urlEncode(enc.encode(JSON.stringify(payload)));
  const sig = new Uint8Array(await crypto.subtle.sign('HMAC', await hmacKey(), enc.encode(body)));
  return `${body}.${b64urlEncode(sig)}`;
}

export async function verifyState(state: string): Promise<StatePayload | null> {
  const [body, sig] = state.split('.');
  if (!body || !sig) return null;
  const ok = await crypto.subtle.verify('HMAC', await hmacKey(), b64urlDecode(sig), enc.encode(body));
  if (!ok) return null;
  try {
    const p = JSON.parse(dec.decode(b64urlDecode(body))) as StatePayload;
    if (typeof p.n !== 'string' || typeof p.u !== 'string' || typeof p.net !== 'string' || typeof p.exp !== 'number') return null;
    if (p.exp < Math.floor(Date.now() / 1000)) return null;
    return p;
  } catch {
    return null;
  }
}

export function randomNonce(): string {
  return b64urlEncode(crypto.getRandomValues(new Uint8Array(24)));
}

export const ALLOWED_NETWORKS = ['facebook', 'instagram', 'tiktok', 'linkedin'] as const;
export type Network = typeof ALLOWED_NETWORKS[number];

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

export function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
}

/** Validates the caller's JWT and returns the user id, or null. */
export async function getUserId(req: Request, supabaseAdmin: any): Promise<string | null> {
  const auth = req.headers.get('Authorization');
  if (!auth?.startsWith('Bearer ')) return null;
  const token = auth.slice(7);
  const { data, error } = await supabaseAdmin.auth.getClaims(token);
  if (error || !data?.claims?.sub || data.claims.role !== 'authenticated') return null;
  return data.claims.sub as string;
}

export const OAUTH_SCOPES: Record<Network, string> = {
  facebook: 'pages_manage_posts,pages_read_engagement,pages_show_list',
  instagram: 'instagram_basic,instagram_content_publish,pages_show_list,business_management',
  tiktok: 'user.info.basic,video.publish',
  linkedin: 'openid profile w_member_social',
};

export function callbackUri(): string {
  return `${Deno.env.get('SUPABASE_URL')}/functions/v1/oauth-callback`;
}
