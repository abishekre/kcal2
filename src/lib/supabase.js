import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Where Supabase should send the user back after magic-link / email
 * confirmation / password-reset flows.
 *
 * Prefers an explicit VITE_SITE_URL so links generated from ANY environment
 * (a preview deploy, an old open tab, etc.) point at your canonical app;
 * falls back to the current origin for local dev.
 *
 * IMPORTANT: whatever this resolves to must ALSO be added to your Supabase
 * project's Authentication → URL Configuration → Redirect URLs allowlist, and
 * the project's Site URL must be your production URL. Otherwise Supabase
 * ignores this value and falls back to its default Site URL
 * (http://localhost:3000), which is the usual cause of "magic link redirects
 * to localhost".
 */
export const getAuthRedirectUrl = () =>
  import.meta.env.VITE_SITE_URL || window.location.origin;
