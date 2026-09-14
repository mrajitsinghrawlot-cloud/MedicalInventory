export interface ExtractedBillItem {
  medicineName: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  freeQuantity?: number;
  purchasePrice: number; // Base cost price per unit BEFORE tax
  mrp: number; // Maximum Retail Price
  gstRate: number; // Total GST % (SGST% + CGST%)
}

export interface ExtractedPurchaseBill {
  vendorName?: string;
  billNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  subtotal?: number; // Total taxable amount before tax
  taxAmount?: number; // Total GST tax amount
  discountAmount?: number; // Total discount or scheme discount
  grandTotal?: number; // Final payable amount
  paymentMethod?: 'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'Credit Note';
  notes?: string;
  items: ExtractedBillItem[];
}

const STORAGE_KEY = 'medistock_gemini_api_key';

export function getStoredApiKey(): string {
  try {
    return localStorage.getItem(STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setStoredApiKey(apiKey: string): void {
  try {
    if (apiKey.trim()) {
      localStorage.setItem(STORAGE_KEY, apiKey.trim());
    } else {
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch (err) {
    console.error('Failed to store API key in localStorage', err);
  }
}

const FALLBACK_MODELS = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-lite-preview-02-05',
  'gemini-2.0-flash-exp',
  'gemini-1.5-flash-latest',
  'gemini-1.5-flash-8b',
  'gemini-1.5-flash-002',
  'gemini-1.5-flash-001',
  'gemini-flash-latest',
  'gemini-1.5-pro-latest',
  'gemini-1.5-pro-002',
  'gemini-1.5-pro'
];

/**
 * Fetch available multimodal vision models directly from user's Gemini API key
 */
export async function getSupportedModels(apiKey: string): Promise<string[]> {
  try {
    const cleanKey = apiKey.trim();
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(cleanKey)}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data?.models)) {
        const candidateModels: string[] = data.models
          .filter((m: any) => {
            const name = (m.name || '').toLowerCase();
            const isGemini = name.includes('gemini');
            const isNonVision = 
              name.includes('tts') || 
              name.includes('audio') || 
              name.includes('embedding') || 
              name.includes('gemma') || 
              name.includes('aqa') || 
              name.includes('imagen') || 
              name.includes('learnlm');
            const hasGenerate = Array.isArray(m.supportedGenerationMethods) && m.supportedGenerationMethods.includes('generateContent');
            return isGemini && !isNonVision && hasGenerate;
          })
          .map((m: any) => m.name.replace(/^models\//, ''));

        const priorityOrder = [
          'gemini-2.0-flash',
          'gemini-2.0-flash-lite',
          'gemini-2.0-flash-lite-preview-02-05',
          'gemini-2.0-flash-exp',
          'gemini-1.5-flash-latest',
          'gemini-1.5-flash-8b',
          'gemini-1.5-flash-002',
          'gemini-1.5-flash-001',
          'gemini-flash-latest',
          'gemini-1.5-pro-latest',
          'gemini-1.5-pro-002',
          'gemini-1.5-pro'
        ];

        const sorted = candidateModels.sort((a, b) => {
          const idxA = priorityOrder.indexOf(a);
          const idxB = priorityOrder.indexOf(b);
          if (idxA !== -1 && idxB !== -1) return idxA - idxB;
          if (idxA !== -1) return -1;
          if (idxB !== -1) return 1;
          return 0;
        });

        if (sorted.length > 0) {
          return sorted;
        }
      }
    }
  } catch (e) {
    console.warn('Could not list models from API, using fallback list', e);
  }

  return FALLBACK_MODELS;
}

export async function testApiKey(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API key is empty.' };
  }

  const cleanKey = apiKey.trim();
  const modelsToTry = await getSupportedModels(cleanKey);
  let lastErrorMessage = '';

  for (const model of modelsToTry) {
    try {
      const modelPath = model.startsWith('models/') ? model : `models/${model}`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(cleanKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Respond with "OK".' }]
              }
            ]
          })
        }
      );

      if (response.ok) {
        return { success: true, message: `Connected successfully to Google AI Studio (${model})!`, model };
      }

      const errorData = await response.json().catch(() => ({}));
      lastErrorMessage = errorData?.error?.message || `HTTP ${response.status}`;

      if (response.status === 400 && lastErrorMessage.includes('API_KEY_INVALID')) {
        return { success: false, message: 'Invalid API key. Please check your key from Google AI Studio.' };
      }
    } catch (err: any) {
      lastErrorMessage = err?.message || 'Network error';
    }
  }

  return { 
    success: false, 
    message: lastErrorMessage ? `Connection failed: ${lastErrorMessage}` : 'Could not connect to Gemini API. Please check your API key.' 
  };
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [header, base64] = result.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || file.type || 'image/jpeg';
      resolve({ base64, mimeType });
    };
    reader.onerror = (error) => reject(error);
    reader.readAsDataURL(file);
  });
}

export async function extractPurchaseBillFromImage(
  file: File,
  customApiKey?: string
): Promise<ExtractedPurchaseBill> {
  const apiKey = customApiKey?.trim() || getStoredApiKey();

  if (!apiKey) {
    throw new Error('Google AI Studio API key not found. Please provide or configure your free API key in Settings.');
  }

  const { base64, mimeType } = await fileToBase64(file);

  const systemInstruction = `You are a specialized Indian Pharmaceutical Accounting and GST Invoice OCR Assistant.
You have deep expertise in Marg ERP, Busy, Tally, Dot-matrix, and Thermal invoices from Indian wholesale medicine distributors.

CRITICAL MATHEMATICAL RULES FOR ACCURACY:
1. PURCHASE RATE (TAX EXCLUSIVE):
   - In Indian pharma invoices, the "RATE" column represents the Base Cost Price (EXCLUDING GST).
   - The "N.Rate" or "Net Rate" column is the rate AFTER adding GST (e.g. Rate 59.32 + 18% GST = Net Rate 70.00).
   - YOU MUST ALWAYS EXTRACT THE TAX-EXCLUSIVE BASE RATE as "purchasePrice" (e.g., 59.32, NOT 70.00).
   - If only Net Rate is available: purchasePrice = NetRate / (1 + gstRate/100).
   - If line has a trade or scheme discount, purchasePrice should be the effective discounted base rate per unit: (Line Amount before GST) / quantity.

2. GST RATE CALCULATION:
   - In Indian invoices, GST is split into "SGST" and "CGST".
   - Total GST % = SGST % + CGST % (e.g., SGST 9% + CGST 9% = 18% GST; SGST 2.5% + CGST 2.5% = 5% GST; SGST 6% + CGST 6% = 12% GST; SGST 14% + CGST 14% = 28% GST).
   - Never extract only one half (e.g., 9% SGST + 9% CGST is 18%, NOT 9%).

3. EXPIRY DATE NORMALIZATION:
   - Convert shorthand MM/YY or MM/YYYY to last day of the month YYYY-MM-DD:
     * "11/29" -> "2029-11-30"
     * "7/27" -> "2027-07-31"
     * "2/28" -> "2028-02-29"
     * "1/26" or "2/36" -> "2026-01-31" or "2036-02-29"
     * "12/28" -> "2028-12-31"

4. BILL SUMMARY TOTALS:
   - Extract "subtotal" (Taxable Sub Total), "taxAmount" (Total SGST + CGST), "discountAmount" (Scheme Discount / Cash Discount), and "grandTotal" (Grand Total / Party Total) directly from the summary table at the bottom.

5. QUANTITY & BATCHES:
   - quantity: Exact integer or decimal quantity billed.
   - freeQuantity: Any free/bonus units (e.g. "+5", "+1").
   - batchNumber: Batch/Lot code (e.g. "WA744", "B023F25", "A2026", "ENC26021", "A1920", "BD03125").

Return ONLY valid JSON matching this schema:
{
  "vendorName": "Distributor Name (e.g. SHRI LAXMI TRADING COMPANY, SUNCITY ENTERPRISES, JYOTI ENTERPRISES)",
  "billNumber": "Invoice Number (e.g. CA26/27/4323, SE/015917, CS002997)",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "subtotal": 3583.67,
  "taxAmount": 286.72,
  "discountAmount": 0.0,
  "grandTotal": 3870.0,
  "paymentMethod": "Cash",
  "notes": "Verified against wholesale distributor invoice",
  "items": [
    {
      "medicineName": "Full Medicine Name & Pack (e.g. MAXO COMBI(80), ENO SACHET(60), S D ASHOKARIS 450ml)",
      "batchNumber": "WA744",
      "expiryDate": "2029-11-30",
      "quantity": 2,
      "freeQuantity": 0,
      "purchasePrice": 59.32,
      "mrp": 80.00,
      "gstRate": 18
    }
  ]
}`;

  const payload = {
    contents: [
      {
        parts: [
          { text: systemInstruction },
          {
            inline_data: {
              mime_type: mimeType,
              data: base64
            }
          }
        ]
      }
    ],
    generationConfig: {
      response_mime_type: 'application/json',
      temperature: 0.0
    }
  };

  const models = await getSupportedModels(apiKey);
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const modelPath = model.startsWith('models/') ? model : `models/${model}`;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/${modelPath}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `Status ${response.status}`;
        console.warn(`Model ${model} returned error (${response.status}): ${errMsg}. Trying next model...`);
        lastError = new Error(errMsg);
        continue;
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        console.warn(`Model ${model} returned empty candidates. Trying next model...`);
        continue;
      }

      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/g, '')
        .trim();

      const parsed: ExtractedPurchaseBill = JSON.parse(cleanJson);

      if (!Array.isArray(parsed.items)) {
        parsed.items = [];
      }

      parsed.items = parsed.items.map((item) => {
        const qty = Number(item.quantity) || 1;
        const price = Number(item.purchasePrice) || 50;
        const gst = Number(item.gstRate) !== undefined ? Number(item.gstRate) : 12;
        const mrp = Number(item.mrp) || Number(price * 1.35);

        return {
          medicineName: item.medicineName || 'Medical Item',
          batchNumber: item.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
          expiryDate: item.expiryDate || '2028-12-31',
          quantity: qty,
          freeQuantity: Number(item.freeQuantity) || 0,
          purchasePrice: Math.round(price * 100) / 100,
          mrp: Math.round(mrp * 100) / 100,
          gstRate: gst
        };
      });

      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} execution error:`, err);
    }
  }

  throw lastError || new Error('Failed to extract invoice data. Please verify your Gemini API key in Settings.');
}
