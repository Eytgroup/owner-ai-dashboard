import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseClient'; // @/lib/supabaseClient يجب أن يشير إلى الملف الذي أنشأته سابقاً

// احصل على المفتاح السري للـ Webhook من ملف .env.local
const webhookSecret = process.env.WOOCOMMERCE_WEBHOOK_SECRET;

// دالة مساعدة للتحقق من التوقيع الأمني (HMAC-SHA256)
function verifyWebhookSignature(rawBody, signature, secret) {
  // إنشاء التوقيع المتوقع بناءً على الجسم الخام والسر
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(rawBody);
  const hash = `sha256=${hmac.digest('hex')}`;
  
  // مقارنة آمنة للتوقيع المرسل بالتوقيع المتوقع
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(signature));
}

// معالج طلب POST لـ App Router
export async function POST(request) {
  // 1. قراءة الجسم الخام للطلب لأغراض التحقق الأمني
  const rawBody = await request.text(); 
  
  // 2. استخراج التوقيع ونوع الـ Webhook من الهيدر
  const signature = request.headers.get('x-wc-webhook-signature');
  const topic = request.headers.get('x-wc-webhook-topic');
  const event = request.headers.get('x-wc-webhook-event');

  // تجاهل أنواع Webhook التي لا نحتاجها
  if (topic !== 'order.created' || event !== 'created') {
    return NextResponse.json({ message: 'Ignoring non-order-created webhook' }, { status: 202 });
  }

  // 3. التحقق الأمني
  if (!signature || !verifyWebhookSignature(rawBody, signature, webhookSecret)) {
    console.error('Webhook verification failed!');
    return NextResponse.json({ message: 'Unauthorized: Invalid signature' }, { status: 401 });
  }

  try {
    // تحويل الجسم الخام إلى JSON (آمن الآن)
    const data = JSON.parse(rawBody);
    
    // 4. استخلاص البيانات الأساسية للطلب
    const { id, total, status, line_items, date_created } = data;

    // 5. إدخال بيانات الطلب إلى جدول 'orders' في Supabase
    const { error } = await supabaseAdmin.from('orders').insert([
      {
        order_id: id,
        total_amount: total,
        status: status,
        line_items: line_items, // حفظ عناصر السطر لمعالجتها لاحقًا بواسطة AI
        date_created: new Date(date_created).toISOString(),
      },
    ]);

    if (error) {
      console.error('Supabase insert error:', error.message);
      return NextResponse.json({ message: 'Failed to insert data into database' }, { status: 500 });
    }

    // 6. نجاح العملية
    return NextResponse.json({ message: 'Webhook received and data saved successfully' }, { status: 200 });
  } catch (e) {
    console.error('Error processing webhook:', e.message);
    return NextResponse.json({ message: 'Internal Server Error during processing' }, { status: 500 });
  }
}