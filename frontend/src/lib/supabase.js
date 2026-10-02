import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL ||
  'https://ictsktzsyuttqqoocvny.supabase.co';

const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdHNrdHpzeXV0dHFxb29jdm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzMzNTMsImV4cCI6MjEwMzE0OTM1M30.6oEIfLZmfNVojAdBR8j0WxV_ZjtMgLfY4UoncgUayQI';

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey);

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export function warmSupabaseConnection() {
  if (typeof document === 'undefined') return;

  const targets = [
    supabaseUrl ? new URL(supabaseUrl).origin : null,
    'https://accounts.google.com',
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
      /* ignore */
    }
  }
}
