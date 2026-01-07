// OAuth Configuration
// These are PUBLIC app IDs/client keys - safe to include in frontend code
// The actual secrets (app secrets) are stored securely in Supabase Edge Function secrets

export const oauthConfig = {
  facebook: {
    // Facebook App ID - get from https://developers.facebook.com/apps/
    appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    version: 'v18.0',
  },
  instagram: {
    // Instagram uses Facebook's OAuth - same app ID
    appId: import.meta.env.VITE_FACEBOOK_APP_ID || '',
    version: 'v18.0',
  },
  tiktok: {
    // TikTok Client Key - get from https://developers.tiktok.com/
    clientKey: import.meta.env.VITE_TIKTOK_CLIENT_KEY || 'aw8w56r0vkvd1g2d',
  },
  linkedin: {
    // LinkedIn Client ID - get from https://www.linkedin.com/developers/
    clientId: import.meta.env.VITE_LINKEDIN_CLIENT_ID || '77vd6ydvofvdur',
  },
};

// Check if OAuth is properly configured for a network
export function isNetworkConfigured(network: 'facebook' | 'instagram' | 'tiktok' | 'linkedin'): boolean {
  switch (network) {
    case 'facebook':
    case 'instagram':
      return !!oauthConfig.facebook.appId;
    case 'tiktok':
      return !!oauthConfig.tiktok.clientKey;
    case 'linkedin':
      return !!oauthConfig.linkedin.clientId;
    default:
      return false;
  }
}

// Get the Supabase URL for OAuth callbacks
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || '';
}

// Get OAuth redirect URI
export function getOAuthRedirectUri(): string {
  return `${getSupabaseUrl()}/functions/v1/oauth-callback`;
}
