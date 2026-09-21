import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error(
    'Missing Supabase environment variables: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set.'
  );
}

// Use a placeholder URL to prevent createClient from throwing on empty strings.
// The app will show an error state but won't crash on a white screen.
const safeUrl = supabaseUrl || 'https://placeholder.supabase.co';
const safeKey = supabaseAnonKey || 'placeholder-key';

// Explicit auth options = sessions survive reloads and OAuth redirects are parsed
// automatically from the URL. (These values match supabase-js defaults, but being
// explicit keeps behaviour stable across library upgrades.)
export const supabase = createClient(safeUrl, safeKey, {
  auth: {
    persistSession: true,      // keep the session in localStorage across reloads
    autoRefreshToken: true,    // refresh the access token before it expires
    detectSessionInUrl: true,  // finish the Google OAuth redirect automatically
  },
});

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

/**
 * Warm up DNS/TLS for the hosts involved in sign-in so the Google redirect
 * does not pay the full connection cost when the user taps the button.
 * Call this as early as possible (app boot + Login page mount).
 */
export function warmSupabaseConnection() {
  if (typeof document === 'undefined') return;

  const targets = [
    // Supabase auth API + realtime gateway
    supabaseUrl ? new URL(supabaseUrl).origin : null,
    'https://accounts.google.com', // OAuth consent screen
    'https://apis.google.com',
  ].filter(Boolean);

  for (const origin of targets) {
    try {
      if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) continue;
      const link = document.createElement('link');
      link.rel = 'preconnect';
      link.href = origin;
      link.crossOrigin = 'anonymous';
      document.head.appendChild(link);
    } catch {
      /* invalid URL — skip */
    }
  }
}

