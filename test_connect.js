import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://dhdapdedccrcfalslhld.supabase.co';
const supabaseAnonKey = 'sb_publishable_Qy4zSQT6xCQuqmuH7yQEmQ__phGqmJi';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  console.log('🔄 กำลังทดสอบการเชื่อมต่อกับ Supabase...');
  
  try {
    const { data, error, status } = await supabase
      .from('global_settings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ การเชื่อมต่อล้มเหลว! รายละเอียด:', error.message);
      return;
    }

    console.log('✅ เชื่อมต่อสำเร็จ!');
    console.log('📶 สถานะ HTTP:', status);
    console.log('📦 ข้อมูลที่ดึงได้จากตาราง global_settings:', data);
    
  } catch (err) {
    console.error('❌ เกิดข้อผิดพลาดที่ไม่คาดคิด:', err);
  }
}

testConnection();
