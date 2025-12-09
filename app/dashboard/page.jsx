'use client'; // ضروري لأن هذا الكود يستخدم React Hooks (مثل useState و useEffect)

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabaseClient'; // استيراد عميل Supabase العام

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // دالة لجلب الطلبات من قاعدة البيانات
  const fetchOrders = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('date_created', { ascending: false }); // ترتيب تنازلي حسب الأحدث

    if (error) {
      console.error('Error fetching orders:', error.message);
      setError('Failed to load orders.');
    } else {
      setOrders(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();

    // إعداد اشتراك (Subscription) للاستماع لتغييرات قاعدة البيانات في الوقت الفعلي
    const subscription = supabase
      .channel('orders_channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        // إضافة الطلب الجديد إلى القائمة الحالية
        setOrders((currentOrders) => [payload.new, ...currentOrders]);
      })
      .subscribe();

    return () => {
      // إيقاف الاشتراك عند إغلاق المكون
      subscription.unsubscribe();
    };
  }, []);

  // دالة لتشغيل وظيفة AI Code Generator
  const generateAccountingCode = async (order) => {
    if (order.accounting_code) {
      alert('This order has already been processed by the AI.');
      return;
    }

    const buttonElement = document.getElementById(`btn-${order.id}`);
    if (buttonElement) {
      buttonElement.innerText = 'Processing...';
      buttonElement.disabled = true;
    }

    try {
      // استدعاء واجهة برمجة تطبيقات Gemini AI التي أنشأناها
      const response = await fetch('/api/ai-code-generator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderDetails: order.line_items }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate code from AI API.');
      }

      const aiData = await response.json();
      
      // حفظ نتائج الذكاء الاصطناعي مرة أخرى في قاعدة البيانات
      const { error: updateError } = await supabase
        .from('orders')
        .update({
          accounting_code: aiData.accounting_notes,
          financial_summary: aiData,
          processed_at: new Date().toISOString(),
        })
        .eq('id', order.id);

      if (updateError) {
        throw new Error('Failed to save AI results to database.');
      }

      alert('Accounting code generated and saved successfully!');
      fetchOrders(); // إعادة جلب البيانات لتحديث العرض

    } catch (e) {
      console.error('AI Processing Error:', e);
      alert('An error occurred during AI processing: ' + e.message);
    } finally {
      if (buttonElement) {
        buttonElement.innerText = 'Generate Accounting Code';
        buttonElement.disabled = false;
      }
    }
  };

  if (loading) return <div className="text-center p-8">Loading dashboard...</div>;
  if (error) return <div className="text-center p-8 text-red-600">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-4xl font-bold text-gray-800 mb-8 border-b pb-4">AI Owner Dashboard</h1>
      
      <div className="space-y-6">
        {orders.map((order) => (
          <div key={order.id} className="bg-white p-6 shadow-lg rounded-lg border-l-4 border-indigo-500 hover:shadow-xl transition duration-300">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-semibold text-gray-700">Order #{order.order_id}</h2>
              <span className={`px-3 py-1 text-sm font-medium rounded-full ${order.status === 'processing' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800'}`}>
                {order.status}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-gray-600 border-t pt-4">
              <p><strong>Total:</strong> ${parseFloat(order.total_amount).toFixed(2)}</p>
              <p><strong>Date:</strong> {new Date(order.date_created).toLocaleDateString()}</p>
              <p className="col-span-2"><strong>Items:</strong> {order.line_items?.map(item => `${item.name} (x${item.quantity})`).join(', ')}</p>
            </div>

            <div className="mt-4 pt-4 border-t">
              {order.accounting_code ? (
                <div className="bg-green-50 p-3 rounded-md">
                  <p className="text-green-700 font-medium">✅ AI Accounting Note:</p>
                  <p className="text-sm italic">{order.accounting_code}</p>
                </div>
              ) : (
                <button
                  id={`btn-${order.id}`}
                  onClick={() => generateAccountingCode(order)}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded transition duration-150 ease-in-out disabled:opacity-50"
                >
                  Generate Accounting Code
                </button>
              )}
            </div>
            
            {order.financial_summary && (
              <div className="mt-4 p-3 bg-gray-100 rounded-md text-sm">
                <p><strong>Summary:</strong> Revenue ${order.financial_summary.total_revenue.toFixed(2)} | COGS ${order.financial_summary.cost_of_goods_sold.toFixed(2)}</p>
              </div>
            )}

          </div>
        ))}
      </div>
      
      {orders.length === 0 && !loading && (
        <div className="text-center p-10 bg-white rounded-lg shadow-md">
          <p className="text-gray-500">No orders found. Waiting for first Webhook notification from WooCommerce.</p>
        </div>
      )}
    </div>
  );
};

export default Dashboard;