import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('user_sessions').select('*').limit(1);
  console.log("Select:", data, error);
  if (data && data.length > 0) {
     const delRes = await supabase.from('user_sessions').delete().eq('id', data[0].id);
     console.log("Delete:", delRes);
  }
}
run();
