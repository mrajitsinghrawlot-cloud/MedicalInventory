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

export async function testApiKey(apiKey: string): Promise<{ success: boolean; message: string; model?: string }> {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API key is empty.' };
  }

  const modelsToTry = ['gemini-2.5-flash', 'gemini-1.5-flash'];

  for (const model of modelsToTry) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey.trim())}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [
              {
                parts: [{ text: 'Respond with "OK" if this connection is working.' }]
              }
            ]
          })
        }
      );

      if (response.ok) {
        return { success: true, message: `Connected successfully to Google AI Studio (${model})!`, model };
      }

      const errorData = await response.json().catch(() => ({}));
      if (response.status === 400 || response.status === 403) {
        return { 
          success: false, 
          message: errorData?.error?.message || `Authentication failed (${response.status}). Please verify your API key.` 
        };
      }
    } catch (err: any) {
      // Try next model
    }
  }

  return { success: false, message: 'Could not connect to Gemini API. Please check your internet connection and API key.' };
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

  const systemInstruction = `You are a medical pharmacy billing and invoice extraction assistant.
Analyze the provided medical wholesale/distributor purchase invoice or bill image/PDF and extract all structured data with high precision.

Return ONLY a valid JSON object strictly matching this schema:
{
  "vendorName": "Distributor/Supplier Name",
  "billNumber": "Invoice/Bill Number or PB-XXXX",
  "invoiceDate": "YYYY-MM-DD (format normalized to YYYY-MM-DD, e.g. 2026-03-15)",
  "dueDate": "YYYY-MM-DD (or calculated 30 days after invoiceDate if missing)",
  "discountAmount": 0,
  "paymentMethod": "Bank Transfer",
  "notes": "Any invoice notes or remarks",
  "items": [
    {
      "medicineName": "Full Medicine Brand Name & Strength (e.g. Augmentin 625 Duo)",
      "batchNumber": "Batch or Lot number",
      "expiryDate": "YYYY-MM-DD (e.g. 2027-11-30. If MM/YY is given like 11/27, use last day of month 2027-11-30)",
      "quantity": 10,
      "freeQuantity": 0,
      "purchasePrice": 120.50,
      "mrp": 160.00,
      "gstRate": 12
    }
  ]
}

Extraction rules:
- Extract all line items of medicines/drugs listed in the invoice table.
- Numbers must be numeric without currency symbols (₹, $, commas).
- If MRP is missing, estimate as 1.25x purchasePrice.
- If purchasePrice is missing, calculate from line item rate.
- If GST is not specified, default to 12.
- Dates must be in YYYY-MM-DD format.
- Output pure JSON only.`;

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

  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  let lastError: Error | null = null;

  for (const model of models) {
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }
      );

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson?.error?.message || `Gemini API returned status ${response.status}`);
      }

      const data = await response.json();
      const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

      if (!rawText) {
        throw new Error('No content returned from AI model.');
      }

      // Clean raw text if wrapped in markdown code blocks
      const cleanJson = rawText
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/```$/g, '')
        .trim();

      const parsed: ExtractedPurchaseBill = JSON.parse(cleanJson);

      // Validate & clean items
      if (!Array.isArray(parsed.items)) {
        parsed.items = [];
      }

      parsed.items = parsed.items.map((item) => ({
        medicineName: item.medicineName || 'Unknown Medicine',
        batchNumber: item.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
        expiryDate: item.expiryDate || '2027-12-31',
        quantity: Number(item.quantity) || 1,
        freeQuantity: Number(item.freeQuantity) || 0,
        purchasePrice: Number(item.purchasePrice) || 50,
        mrp: Number(item.mrp) || Number(item.purchasePrice) * 1.3 || 70,
        gstRate: Number(item.gstRate) || 12
      }));

      return parsed;
    } catch (err: any) {
      lastError = err;
      console.warn(`Model ${model} failed:`, err);
    }
  }

  throw lastError || new Error('Failed to extract bill information from image.');
}
