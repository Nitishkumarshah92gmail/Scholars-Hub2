const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = (process.env.SUPABASE_URL || '').trim();
// Use service_role key for backend (needed for storage uploads and bypassing RLS)
const supabaseKey = (process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || '').trim();

let supabase = null;

if (!supabaseUrl || !supabaseKey) {
  console.error('⚠️  Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY/SUPABASE_ANON_KEY environment variables');
  console.error('   SUPABASE_URL set:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
  console.error('   SUPABASE_ANON_KEY set:', !!process.env.SUPABASE_ANON_KEY);
  console.error('   Server will start but database operations will fail.');
} else {
  try {
    supabase = createClient(supabaseUrl, supabaseKey);
    console.log('✅ Supabase client initialized successfully');
  } catch (err) {
    console.error('❌ Failed to initialize Supabase client:', err.message);
    supabase = null;
  }
}

module.exports = supabase;
