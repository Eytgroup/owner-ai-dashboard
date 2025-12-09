import { NextResponse } from 'next/server';
import { GoogleGenAI } from '@google/genai';

// يتم الحصول على المفتاح السري من ملف .env.local
const apiKey = process.env.GEMINI_API_KEY;

// التحقق من وجود المفتاح
if (!apiKey) {
  throw new Error('GEMINI_API_KEY environment variable is not set.');
}

// تهيئة عميل Gemini
const ai = new GoogleGenAI({ apiKey });

// تعريف الدالة المساعدة لإنشاء المطالبة (Prompt)
function createPrompt(orderDetails) {
  return `
    You are an AI specialized in analyzing e-commerce orders and generating structured JSON accounting summaries.
    Analyze the following WooCommerce order data (line_items array) and extract the required financial details.
    
    Required Output Format: JSON object with the following keys:
    - total_revenue: (Numeric total amount of goods sold before tax/shipping).
    - total_tax: (Numeric total tax collected).
    - cost_of_goods_sold: (Estimate 50% of total_revenue for COGS, as the actual cost is unknown).
    - item_summary: (A simplified array of objects, containing 'name' and 'quantity' for each item).
    - accounting_notes: (A single sentence summary of the order for accounting purposes).

    Order Data (JSON string): 
    ${JSON.stringify(orderDetails)}
    
    Ensure the output is ONLY the final, clean JSON object. Do not include any introductory or concluding text.
    `;
}

// معالج طلب POST لـ App Router
export async function POST(request) {
  try {
    const { orderDetails } = await request.json();

    if (!orderDetails) {
      return NextResponse.json({ message: 'Missing orderDetails in request body' }, { status: 400 });
    }

    const prompt = createPrompt(orderDetails);

    // استدعاء نموذج Gemini
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash', // نموذج فعال وسريع
      contents: [prompt],
      config: {
        // نطلب أن يكون الرد في صيغة JSON
        responseMimeType: 'application/json',
      },
    });

    // الرد يجب أن يكون JSON نظيف
    const aiResponseText = response.text.trim();
    
    return NextResponse.json(JSON.parse(aiResponseText), { status: 200 });

  } catch (error) {
    console.error('Error in Gemini AI API:', error);
    // في حالة وجود خطأ، قد يكون بسبب عدم القدرة على تحليل الـ JSON من النموذج
    return NextResponse.json({ message: 'Failed to process AI request', error: error.message }, { status: 500 });
  }
}