require('dotenv').config();
const supabase = require('./config/supabase');

async function test() {
  const { count: profileCount, error: pErr } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true });
  
  const { count: postCount, error: poErr } = await supabase
    .from('posts')
    .select('id', { count: 'exact', head: true });

  console.log('Profiles:', profileCount, 'Error:', pErr);
  console.log('Posts:', postCount, 'Error:', poErr);
}

test();
