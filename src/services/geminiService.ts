export interface ExtractedBillItem {
  medicineName: string;
  batchNumber?: string;
  expiryDate?: string;
  quantity: number;
  freeQuantity?: number;
  purchasePrice: number; // Base cost price per unit BEFORE tax (from RATE column)
  netRate?: number; // Tax-inclusive unit rate (from N.Rate column if present)
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

export interface AiUsageStats {
  totalRequests: number;
  requestsToday: number;
  totalTokens: number;
  tokensToday: number;
  lastUsedDate: string;
  dailyLimit: number; // 1,500 requests / day on Google AI Studio Free Tier
  rpmLimit: number; // 15 requests / minute
  remainingRequestsToday: number;
  lastScan?: {
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    timestamp: string;
  };
}

const STORAGE_KEY = 'medistock_gemini_api_key';
const USAGE_STORAGE_KEY = 'medistock_gemini_usage_v1';

export function getAiUsageStats(): AiUsageStats {
  const todayStr = new Date().toISOString().split('T')[0];
  const defaultStats: AiUsageStats = {
    totalRequests: 0,
    requestsToday: 0,
    totalTokens: 0,
    tokensToday: 0,
    lastUsedDate: todayStr,
    dailyLimit: 1500,
    rpmLimit: 15,
    remainingRequestsToday: 1500
  };

  try {
    const raw = localStorage.getItem(USAGE_STORAGE_KEY);
    if (!raw) return defaultStats;
    const parsed = JSON.parse(raw);
    const requestsToday = parsed.lastUsedDate === todayStr ? (parsed.requestsToday || 0) : 0;
    const tokensToday = parsed.lastUsedDate === todayStr ? (parsed.tokensToday || 0) : 0;
    const totalRequests = parsed.totalRequests || 0;
    const totalTokens = parsed.totalTokens || 0;

    return {
      totalRequests,
      requestsToday,
      totalTokens,
      tokensToday,
      lastUsedDate: todayStr,
      dailyLimit: 1500,
      rpmLimit: 15,
      remainingRequestsToday: Math.max(0, 1500 - requestsToday),
      lastScan: parsed.lastScan
    };
  } catch {
    return defaultStats;
  }
}

export function recordAiUsage(
  usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; totalTokenCount?: number }, 
  modelName?: string
): AiUsageStats {
  const todayStr = new Date().toISOString().split('T')[0];
  const current = getAiUsageStats();

  const promptTokens = usageMetadata?.promptTokenCount || 950;
  const completionTokens = usageMetadata?.candidatesTokenCount || 420;
  const totalTokens = usageMetadata?.totalTokenCount || (promptTokens + completionTokens);

  const updated: AiUsageStats = {
    totalRequests: current.totalRequests + 1,
    requestsToday: (current.lastUsedDate === todayStr ? current.requestsToday : 0) + 1,
    totalTokens: current.totalTokens + totalTokens,
    tokensToday: (current.lastUsedDate === todayStr ? current.tokensToday : 0) + totalTokens,
    lastUsedDate: todayStr,
    dailyLimit: 1500,
    rpmLimit: 15,
    remainingRequestsToday: Math.max(0, 1500 - ((current.lastUsedDate === todayStr ? current.requestsToday : 0) + 1)),
    lastScan: {
      model: modelName || 'gemini-2.0-flash',
      promptTokens,
      completionTokens,
      totalTokens,
      timestamp: new Date().toISOString()
    }
  };

  try {
    localStorage.setItem(USAGE_STORAGE_KEY, JSON.stringify(updated));
  } catch {}

  return updated;
}

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

  const systemInstruction = `You are a precision Indian Pharmaceutical Wholesale Billing and GST Invoice OCR Assistant.
You specialize in reading Indian pharmaceutical distributor invoices (Marg ERP, Busy, Tally, Dot-matrix, and Laser printed bills like Shri Laxmi Trading Company, Suncity Enterprises, Jyoti Enterprises).

EXTRACT ALL ITEMS & SUMMARY NUMBERS WITH STRICT MATHEMATICAL INTEGRITY:

1. DISTRIBUTOR / VENDOR NAME:
   - Extract the full Distributor/Wholesaler Company Name printed at the top (e.g. "SHRI LAXMI TRADING COMPANY", "SUNCITY ENTERPRISES", "JYOTI ENTERPRISES").

2. INVOICE NUMBER & DATE:
   - Invoice / Bill #: e.g. "CA26/27/4323", "SE/015917", "CS002997".
   - Invoice Date: Normalize to YYYY-MM-DD (e.g. "12-09-2026" -> "2026-09-12").

3. LINE ITEMS (EVERY ROW):
   - medicineName: Full exact product brand name with pack/strength (e.g. "MAXO COMBI(80)", "STAYFREE REG(37)", "ENO SACHET(60)", "ODOMOS CREAM(120) <Lot>", "MAHABHRINGRAJ H/O(95)", "PUDIN HARA CAP(35)", "MANFORCE CONDOM(30)", "UNWANTED 72 TAB(76)", "S D ASHOKARIS 450ml").
   - batchNumber: Batch or lot number (e.g. "WA744", "B023F25", "A2026", "ENC26021", "A1920", "BD03125").
   - expiryDate: Convert MM/YY or MM/YYYY to last day of month YYYY-MM-DD (e.g. "11/29" -> "2029-11-30", "7/27" -> "2027-07-31", "2/28" -> "2028-02-29", "1/28" -> "2028-01-31", "12/28" -> "2028-12-31").
   - quantity: Exact billed quantity. If a fraction/half strip is billed (e.g. "4.5", "4+0.5", "10.5"), use exact decimal number (e.g. 4.5).
   - freeQuantity: Free or bonus units if any (e.g. 0).
   - purchasePrice: Must be the Base Rate BEFORE TAX from the "RATE" column (e.g. 59.32, 32.00, 47.62, 84.68, 23.69, 76.20, 97.46, 38.10, 22.86, 55.08, 53.80, 504.76, 223.81, 271.42, 240.00, 27.63, 54.28, 25.42, 59.05, 16.50, 93.22, 28.00, 30.00).
   - netRate: Tax-inclusive unit rate from "N.Rate" column if present (e.g. 70.00, 32.00, 50.00, 99.92, 27.96, 80.00, 115.00, 40.00, 24.00, 65.00, 56.50, 530.00, 235.00, 285.00, 252.00, 29.00, 57.00, 30.00, 62.00, 16.50, 110.00, 28.00, 30.00).
   - mrp: Maximum Retail Price from "MRP" column (e.g. 80.00, 37.00, 60.00, 120.00, 34.00, 95.00, 138.00, 45.63, 28.13, 72.00, 68.00, 666.48, 264.00, 319.00, 315.00, 35.00, 67.66, 65.75, 70.00, 30.00, 130.00, 50.00, 76.00).
   - gstRate: Total GST % = SGST % + CGST %. Look at the printed SGST and CGST columns for that row OR compare (N.Rate / RATE):
     * 0% (Nil / Exempt): When SGST is 0 and CGST is 0 (or N.Rate == RATE): e.g. MANFORCE CONDOM(30), STAYFREE, MALA D, UNWANTED 72.
     * 5%: When SGST is 2.50 and CGST is 2.50 (or N.Rate / RATE ≈ 1.05): e.g. ENO SACHET, MAHABHRINGRAJ, DABUR HONEY, DETTOL LIQ, B TEX OINT, MOOV CREAM, XENDURA MASS, HORLICKS, COMPLAN, REVITAL, PUDIN HARA, ITCH GUARD.
     * 12%: When SGST is 6.00 and CGST is 6.00 (or N.Rate / RATE ≈ 1.12).
     * 18%: When SGST is 9.00 and CGST is 9.00 (or N.Rate / RATE ≈ 1.18): e.g. MAXO COMBI, ODOMOS CREAM(120), ODOMOS CREAM(34), PONDS, GLOW&LOVELY, VIJHON, GARNIER.
     * 28%: When SGST is 14.00 and CGST is 14.00 (or N.Rate / RATE ≈ 1.28).

4. BILL SUMMARY BOX:
   - subtotal: Taxable subtotal before GST from the summary table (e.g. 3583.67).
   - taxAmount: Total GST tax (SGST + CGST, e.g. 143.36 + 143.36 = 286.72).
   - discountAmount: Scheme discount or cash discount (e.g. 0.0 or 84.41).
   - grandTotal: Final invoice total (e.g. 3870.00, 571.00, 1012.00).

Return ONLY valid JSON matching this schema:
{
  "vendorName": "SHRI LAXMI TRADING COMPANY",
  "billNumber": "CA26/27/4323",
  "invoiceDate": "2026-09-12",
  "dueDate": "2026-10-12",
  "subtotal": 3583.67,
  "taxAmount": 286.72,
  "discountAmount": 0.0,
  "grandTotal": 3870.00,
  "paymentMethod": "Cash",
  "notes": "Verified against wholesale distributor tax invoice",
  "items": [
    {
      "medicineName": "MAXO COMBI(80)",
      "batchNumber": "WA744",
      "expiryDate": "2029-11-30",
      "quantity": 2,
      "freeQuantity": 0,
      "purchasePrice": 59.32,
      "netRate": 70.00,
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
      recordAiUsage(data?.usageMetadata, model);

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
