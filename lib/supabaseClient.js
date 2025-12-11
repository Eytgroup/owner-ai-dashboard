// استخدام الطريقة الأصلية مع تغيير بسيط لكسر دورة الـ Cache
import { createClient } from '@supabase/supabase-js'; 

const SUPABASE_CACHE_BREAKER = 'v2'; // <--- هذا السطر هو مفتاح الحل

// مفاتيح Supabase من متغيرات البيئة
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 1. عميل الواجهة الأمامية (Public Client)
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// 2. عميل المدير (Admin Client)
export const supabaseAdmin = createClient(
  supabaseUrl,
  supabaseServiceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);
