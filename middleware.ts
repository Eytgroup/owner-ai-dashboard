// middleware.ts - التحول إلى استخدام مكتبة Supabase JS الأصلية

import { createClient } from '@supabase/supabase-js'; // نستخدم المكتبة الأصلية
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error("CRITICAL ERROR: Supabase Keys are missing for Middleware.");
    return res; 
  }

  // 1. إنشاء عميل Supabase عادي
  const supabase = createClient(
    supabaseUrl, 
    supabaseAnonKey,
    {
      auth: {
        // نضبط الخيارات لنتعامل مع الكوكيز يدوياً
        persistSession: false, 
      },
    }
  );

  // 2. تحديث الجلسة يدوياً عبر الكوكيز 
  const { data: { session }, error } = await supabase.auth.getSession();

  // 3. (اختياري) يمكنك هنا إضافة منطق إعادة التوجيه للتحقق من المصادقة

  // 4. تمرير الاستجابة
  return res;
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};