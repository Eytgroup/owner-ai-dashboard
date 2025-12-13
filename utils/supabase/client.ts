// utils/supabase/client.ts
import { createBrowserClient } from '@supabase/auth-helpers-nextjs'; // <--- تغيير مصدر الاستيراد
import { Database } from '@/types/supabase'; // مسار الـ Types

// دالة لإنشاء عميل Supabase من بيئة المتصفح (Client Components)
export const createClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }
  
  // نستخدم createBrowserClient هنا لأننا في بيئة العميل
  return createBrowserClient<Database>(
    supabaseUrl,
    supabaseAnonKey
  );
};