// app/new-invoice/page.jsx

'use client'; // ضروري لأن النموذج يتفاعل مع المستخدم

// *** تصحيح المسار النسبي: نخرج من مجلد new-invoice وندخل مجلد components ***
import InvoiceForm from '../components/InvoiceForm'; 

import { createTransaction } from './actions'; // التأكد من الاستيراد الصحيح

export default function NewInvoicePage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold mb-6">إنشاء فاتورة مبيعات جديدة</h1>
      <InvoiceForm createTransaction={createTransaction} />
    </div>
  );
}
