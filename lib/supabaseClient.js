export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// يتم استيراد مفتاح دور الخدمة (Service Role Key) من ملف .env.local.
// هذا المفتاح يتم استخدامه فقط في وظائف الـ API (الواجهة الخلفية) التي تحتاج صلاحيات عالية.
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// يتم تهيئة عميل صلاحيات المسؤول
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    // تعطيل تجديد الـ Token التلقائي في بيئة الخادم
    autoRefreshToken: false,
    persistSession: false,
  },
});