# Agenda Plus — engineering rules

- Provider tokens are encrypted only in backend functions with AES-GCM (`supabase/functions/_shared/security.ts`, secret TOKEN_ENCRYPTION_KEY); never encrypt or write tokens from the frontend — the browser can't keep a key secret.
- OAuth authorize URLs are built by the authenticated `oauth-start` function with an HMAC-signed, one-time, expiring state stored in `oauth_states`; the callback must verify and consume it — prevents CSRF/account-linking forgery.
- Provider client IDs/App IDs come from backend secrets via `oauth-start` (`action: config`), never hardcoded in `index.html` or `src/` — single source of truth per environment.
- `publish-post` requires a valid user JWT and filters the post by `user_id`; it claims the post atomically (`scheduled` → `processing`) before publishing — no anonymous path, no double publishing.
- UI shows only real data from the user's posts/logs/connections; when a metric source doesn't exist, show an empty or explanatory state instead of mock numbers.
- No insecure fallbacks: if a required secret or migration is missing, functions fail closed with a clear message.
