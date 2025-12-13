// app/new-invoice/actions.ts
'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { createClient } from '../../utils/supabase/server'; 

// !!! الرجاء التأكد من أن هذا الـ UUID صحيح !!!
const TEMP_USER_ID = '33aa9cfd-a760-41db-86c8-fbe72a0d2022'; 

// **********************************************
// الدالة الرئيسية لإنشاء الفاتورة
// تقبل وسيطين: prevState و formData
// **********************************************
export async function createTransaction(_: any, formData: FormData) { 
  // قراءة البيانات من النموذج
  const customerName = formData.get('customerName') as string;
  const totalAmount = parseFloat(formData.get('totalAmount') as string);
  const description = formData.get('description') as string;
  const rawItemsData = formData.get('rawItemsData') as string;

  const supabase = createClient();

  try {
    // 1. أ. محاولة جلب العميل أولاً (SELECT)
    let { data: customerData, error: customerError } = await supabase
      .from('customers')
      .select('id')
      .eq('name', customerName)
      .maybeSingle();

    if (customerError) {
      console.error('Customer select error:', customerError);
      throw new Error('Failed to query customer data.');
    }

    let customerId;

    // 1. ب. إذا لم نجد العميل، نقوم بإدخاله (INSERT)
    if (!customerData) {
      const { data: insertData, error: insertError } = await supabase
        .from('customers')
        .insert({ name: customerName, owner_id: TEMP_USER_ID })
        .select('id')
        .single();

      if (insertError || !insertData) {
        console.error('Customer insert error:', insertError);
        throw new Error('Failed to create new customer.');
      }
      customerId = insertData.id;
    } else {
      // إذا وجد العميل، نستخدم الـ ID الخاص به
      customerId = customerData.id;
    }

    // 2. إدخال الفاتورة (Transaction)
    const { data: transactionData, error: transactionError } = await supabase
      .from('transactions')
      .insert({
        customer_id: customerId,
        owner_id: TEMP_USER_ID,
        total_amount: totalAmount,
        description: description,
        raw_items_data: rawItemsData,
        // status يكون "PENDING" تلقائياً
      })
      .select('id')
      .single();

    if (transactionError || !transactionData) {
      console.error('Transaction insert error:', transactionError);
      throw new Error('Failed to create transaction.');
    }

    console.log('Transaction created successfully:', transactionData);

    // إعادة توجيه إلى الصفحة الرئيسية بعد نجاح الإدخال
    revalidatePath('/'); 
    redirect('/');

  } catch (e) {
    console.error('Critical Error in Server Action:', e);
    return { error: { message: e instanceof Error ? e.message : 'An unknown error occurred' } };
  }
}