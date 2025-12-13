// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
    // إعداد env لضمان قراءة متغيرات الخادم (SUPABASE_*) في الـ Middleware
    env: {
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY,
    },
    // هنا يمكن إضافة أي إعدادات أخرى كانت موجودة لديك
  };
  
  module.exports = nextConfig;