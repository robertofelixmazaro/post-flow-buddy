-- Pending migration (Agenda Plus security hardening). NON-destructive.
-- Could not be applied automatically: database migration tool is blocked by an approval preference.
ALTER TYPE public.network_type ADD VALUE IF NOT EXISTS 'tiktok';
ALTER TYPE public.post_status ADD VALUE IF NOT EXISTS 'processing';

CREATE TABLE IF NOT EXISTS public.oauth_states (
  nonce text PRIMARY KEY,
  user_id uuid NOT NULL,
  network text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  used_at timestamptz
);
GRANT ALL ON public.oauth_states TO service_role;
ALTER TABLE public.oauth_states ENABLE ROW LEVEL SECURITY;

-- Tokens readable/writable only by backend functions
REVOKE ALL ON public.social_connections FROM anon;
REVOKE SELECT, INSERT, UPDATE ON public.social_connections FROM authenticated;
GRANT SELECT (id, user_id, network, account_id, account_name, account_username, page_id, page_name, token_expires_at, permissions, connected_at, updated_at) ON public.social_connections TO authenticated;
GRANT DELETE ON public.social_connections TO authenticated;
GRANT ALL ON public.social_connections TO service_role;
