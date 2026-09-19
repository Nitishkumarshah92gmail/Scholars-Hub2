import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ictskzsyuttqqoocvny.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImljdHNrdHpzeXV0dHFxb29jdm55Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc1NzMzNTMsImV4cCI6MjEwMzE0OTM1M30.6oEIfLZmfNVojAdBR8j0WxV_ZjtMgLfY4UoncgUayQI';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
