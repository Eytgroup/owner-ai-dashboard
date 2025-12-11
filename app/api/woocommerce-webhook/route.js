import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabaseAdmin } from '@/lib/supabaseClient'; 

// ** الحل النهائي لـ 401: استخدام المفتاح السري مباشرةً لتجنب مشاكل Vercel ENV **
const webhookSecret = 'N3wWcS3cr3T89';

// ----------------------------------------------------------------
// [الكود المعدل لحل مشكلة 401 في Vercel - يستخدم Base64]
// ----------------------------------------------------------------
function verifyWebhookSignature(rawBody, signature, secret) {
  // 1. التحقق الأساسي
  if (!secret || !signature) {
    return false;
  }

  const secretKey = Buffer.from(secret || '', 'utf8');

  // 2. إنشاء التوقيع المتوقع باستخدام base64 (هو ما تتوقعه WooCommerce)
  const hmac = crypto.createHmac('sha256', secretKey);
  hmac.update(rawBody);
  const expectedHash = hmac.digest('base64'); // <--- النقطة الحاسمة: استخدام base64

  // 3. فصل التوقيع المستلم (يأتي بصيغة: sha256=BASE64_HASH)
  // نتأكد من أننا نقارن الجزء الذي يلي علامة التساوي
  const signatureParts = signature.split('=');
  const receivedHash = signatureParts.length > 1 ? signatureParts[1] : signature;

  // 4. مقارنة آمنة
  try {
    return crypto.timingSafeEqual(
      Buffer.from(receivedHash, 'base64'), 
      Buffer.from(expectedHash, 'base64') 
    );
  } catch (e) {
    console.error("Error during timingSafeEqual:", e);
    return false;
  }
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
    // يجب التأكد أن الجدول في Supabase هو 'transactions' وليس 'orders' كما اتفقنا في التصميم
    const { id, total, status, line_items, date_created } = data;
     
     // 5. ربط المستخدم: سنفترض مؤقتاً أنه يتم استخدام User ID ثابت حتى يتم بناء نظام تسجيل الدخول.
     // يجب تعديل هذا لاحقاً لربط الطلب بالمستخدم الصحيح.
     const temp_user_id = 'YOUR_DEFAULT_ADMIN_UUID'; 

    // 6. إدخال بيانات الطلب إلى جدول 'transactions' في Supabase
    const { error } = await supabaseAdmin.from('transactions').insert([
      {
        user_id: temp_user_id, // استخدام المعرف المؤقت
        transaction_type: 'invoice',
        total_amount: total,
        date: new Date(date_created).toISOString(), 
        status: status,
        description: `WooCommerce Order #${id}`,
         raw_data: data, // حفظ البيانات الخام (line_items موجودة هنا)
      },
    ]);

    if (error) {
      console.error('Supabase insert error:', error.message);
      return NextResponse.json({ message: 'Failed to insert data into database' }, { status: 500 });
    }

    // 7. نجاح العملية
    return NextResponse.json({ message: 'Webhook received and data saved successfully' }, { status: 200 });
  } catch (e) {
    console.error('Error processing webhook:', e.message);
    return NextResponse.json({ message: 'Internal Server Error during processing' }, { status: 500 });
  }
}

