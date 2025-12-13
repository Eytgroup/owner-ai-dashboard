// src/utils/supabase/server.ts
import { createServerClient } from '@supabase/auth-helpers-nextjs'; // <--- تم تغيير مصدر الاستيراد
import { cookies } from 'next/headers';
import { Database } from '@/types/supabase'; // افترضنا أنك أنشأت ملف Types

// دالة لجلب البيانات من Supabase من بيئة الخادم (Server Components/Server Actions)
export const createClient = () => {
  const cookieStore = cookies();
  
  // يجب أن تكون متغيرات البيئة معرفة في ملف .env.local
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient<Database>(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value;
        },
        set(name: string, value: string, options) {
          try {
            cookieStore.set({ name, value, ...options });
          } catch (error) {
            // يمكن أن يحدث خطأ إذا تم استدعاء هذا من Server Component
          }
        },
        remove(name: string, options) {
          try {
            cookieStore.set({ name, value: '', ...options });
          } catch (error) {
            // يمكن أن يحدث خطأ إذا تم استدعاء هذا من Server Component
          }
        },
      },
    }
  );
};