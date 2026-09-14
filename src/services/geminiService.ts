export interface ExtractedBillItem {
  medicineName: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  freeQuantity?: number;
  purchasePrice: number;
  mrp: number;
  gstRate?: number;
}

export interface ExtractedPurchaseBill {
  vendorName?: string;
  billNumber?: string;
  invoiceDate?: string; // YYYY-MM-DD
  dueDate?: string; // YYYY-MM-DD
  discountAmount?: number;
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

      // If key itself is forbidden/invalid across API, report it
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

  const systemInstruction = `You are an expert Indian Pharmaceutical Wholesale Billing and GST Invoice OCR Assistant.
Analyze the provided medical distributor/wholesaler purchase invoice, delivery challan, or tax invoice photo/document (e.g. Marg ERP, Busy, Tally, dot-matrix, or printed invoices like Shri Laxmi Trading, Suncity Enterprises, Jyoti Enterprises).

Extract all structured fields with maximum precision.

RULES FOR INDIAN PHARMA INVOICES:
1. Vendor/Supplier: Find Distributor Name at the very top (e.g., "SHRI LAXMI TRADING COMPANY", "SUNCITY ENTERPRISES", "JYOTI ENTERPRISES").
2. Invoice Number & Date: Find Invoice No (e.g. "CA26/27/4323", "SE/015917", "PB-XXXX") and Date. Normalize Date to YYYY-MM-DD (e.g., 12-09-2026 -> 2026-09-12).
3. Due Date: If missing, set to 30 days after invoiceDate.
4. Line Items Table:
   - medicineName: Extract full product description with pack size (e.g. "MAXO COMBI(80)", "ENO SACHET(60)", "PUDIN HARA CAP(35)", "MANFORCE CONDOM(30)", "UNWANTED 72 TAB(76)", "S D ASHOKARIS 450ML", "MEGLOW ALOE GEL").
   - batchNumber: Batch or Lot number (e.g. "WA744", "B023F25", "A2026", "ENC26021", "A1920", "BB03125"). If blank/dash, generate a placeholder.
   - expiryDate: Normalize MM/YY or MM/YYYY (e.g. "11/29" -> "2029-11-30", "7/27" -> "2027-07-31", "1/28" -> "2028-01-31", "12/28" -> "2028-12-31").
   - quantity: Numeric quantity billed (e.g. 2, 5, 10, 50).
   - freeQuantity: Free or bonus quantity if any (e.g., +5, +1, +0.5).
   - purchasePrice: Rate per unit / Net Rate ("RATE" or "N.Rate" column, e.g. 59.32, 47.62, 23.69).
   - mrp: Maximum Retail Price column (e.g. 80.00, 60.00, 34.00, 315.00). If missing, calculate as 1.3 * purchasePrice.
   - gstRate: Total GST percentage. In Indian invoices, SGST % + CGST % = total GST % (e.g., SGST 2.5% + CGST 2.5% = 5; SGST 6% + CGST 6% = 12; SGST 9% + CGST 9% = 18; SGST 14% + CGST 14% = 28). If tax is 0 or exempt, use 0. Default to 12 if not specified.
5. Payment Method: Detect "Cash", "UPI", "Cheque", or "Bank Transfer" (often written in top/bottom stamp like "CASH", "PhonePe", "Union Bank").

Return ONLY a JSON object matching this schema:
{
  "vendorName": "Distributor Name",
  "billNumber": "Invoice Number",
  "invoiceDate": "YYYY-MM-DD",
  "dueDate": "YYYY-MM-DD",
  "discountAmount": 0,
  "paymentMethod": "Cash",
  "notes": "GST invoice verified",
  "items": [
    {
      "medicineName": "Product Name",
      "batchNumber": "Batch No",
      "expiryDate": "YYYY-MM-DD",
      "quantity": 10,
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
      temperature: 0.1
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
        // Continue loop to try next model
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

      parsed.items = parsed.items.map((item) => ({
        medicineName: item.medicineName || 'Medical Item',
        batchNumber: item.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: item.expiryDate || '2028-12-31',
        quantity: Number(item.quantity) || 1,
        freeQuantity: Number(item.freeQuantity) || 0,
        purchasePrice: Number(item.purchasePrice) || 50,
        mrp: Number(item.mrp) || Number(item.purchasePrice) * 1.3 || 70,
        gstRate: Number(item.gstRate) !== undefined ? Number(item.gstRate) : 12
      }));

      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} execution error:`, err);
    }
  }

  throw lastError || new Error('Failed to extract invoice data. Please verify your Gemini API key in Settings.');
}
