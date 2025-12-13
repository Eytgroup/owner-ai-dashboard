// app/components/InvoiceForm.jsx
'use client'; 

// ************************************************
// استيراد الدوال لحالة النموذج
// ************************************************
import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';

// ****************************
// مكوّن الزر
// ****************************
function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button 
      type="submit" 
      aria-disabled={pending} 
      className={`mt-4 w-full rounded-lg py-3 font-semibold text-white transition duration-150 ${
        pending ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'
      }`}
      disabled={pending}
    >
      {pending ? 'جاري الحفظ...' : 'حفظ وإرسال للتحليل'}
    </button>
  );
}

// ****************************
// المكوّن الرئيسي للنموذج
// ****************************
export default function InvoiceForm({ createTransaction }) {
  // استخدام useActionState لربط النموذج بالـ Server Action
  const [state, formAction] = useActionState(createTransaction, null);

  return (
    <form action={formAction} className="space-y-4 bg-white p-6 shadow-md rounded-lg">
      
      {/* 1. حقل اسم العميل */}
      <div>
        <label htmlFor="customerName" className="block text-sm font-medium text-gray-700">اسم العميل:</label>
        <input
          type="text"
          id="customerName"
          name="customerName"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        />
      </div>

      {/* 2. حقل إجمالي المبلغ */}
      <div>
        <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700">إجمالي المبلغ (SAR):</label>
        <input
          type="number"
          id="totalAmount"
          name="totalAmount"
          step="0.01"
          required
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        />
      </div>

      {/* 3. حقل الوصف الموجز */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700">وصف موجز للفاتورة:</label>
        <textarea
          id="description"
          name="description"
          rows="2"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        ></textarea>
      </div>

      {/* 4. حقل تفاصيل البنود */}
      <div>
        <label htmlFor="rawItemsData" className="block text-sm font-medium text-gray-700">تفاصيل البنود (لكل سطر بند):</label>
        <textarea
          id="rawItemsData"
          name="rawItemsData"
          rows="5"
          required
          placeholder="مثال: 
1 * خدمة استشارية * 500 SAR
2 * منتج س * 150 SAR"
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-green-500 focus:ring-green-500 p-2 border"
        ></textarea>
      </div>

      {/* عرض رسالة الخطأ في حالة الفشل */}
      {state?.error && (
        <p className="text-sm text-red-600">حدث خطأ: {state.error.message}</p>
      )}

      {/* زر الإرسال */}
      <SubmitButton />
    </form>
  );
}