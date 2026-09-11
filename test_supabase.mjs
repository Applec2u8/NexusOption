import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const env = fs.readFileSync('.env', 'utf8');
const urlMatch = env.match(/VITE_SUPABASE_URL=(.*)/);
const keyMatch = env.match(/VITE_SUPABASE_PUBLISHABLE_KEY=(.*)/);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : '';
const supabaseKey = keyMatch ? keyMatch[1].trim() : '';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Testing Supabase connection...");
  
  // Test insert into user_sessions
  // Provide a dummy UUID for user_id to see if it fails due to fkey or RLS.
  // We'll first query a valid user_id from profiles.
  const { data: profileData, error: profileError } = await supabase.from('profiles').select('id').limit(1);
  if (profileError || !profileData || profileData.length === 0) {
      console.log("Failed to get a valid user", profileError);
      return;
  }
  const testUserId = profileData[0].id;
  console.log("Using user_id:", testUserId);

  console.log("--- Testing Insert user_sessions ---");
  const { data: insertSess, error: errSess } = await supabase.from('user_sessions').insert({
    user_id: testUserId,
    device_name: 'Test Device',
    os_name: 'Test OS',
    browser_name: 'Test Browser',
    ip_address: '127.0.0.1'
  }).select('id');
  console.log("Insert Session Error:", errSess);
  console.log("Insert Session Data:", insertSess);

  if (insertSess && insertSess.length > 0) {
      const insertedId = insertSess[0].id;
      console.log("--- Testing Delete user_sessions ---");
      const { data: delSess, error: errDel } = await supabase.from('user_sessions').delete().eq('id', insertedId);
      console.log("Delete Session Error:", errDel);
  }

  console.log("--- Testing Insert user_login_history ---");
  const { data: insertHist, error: errHist } = await supabase.from('user_login_history').insert({
    user_id: testUserId,
    device_name: 'Test Device',
    os_name: 'Test OS',
    browser_name: 'Test Browser',
    ip_address: '127.0.0.1'
  });
  console.log("Insert History Error:", errHist);
}

run();
