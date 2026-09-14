export type Category = 
  | 'Antibiotics'
  | 'Analgesics & Pain'
  | 'Cardiovascular'
  | 'Antidiabetics'
  | 'Gastrointestinal'
  | 'Respiratory'
  | 'Dermatological'
  | 'Vitamins & Supplements'
  | 'Emergency & ICU'
  | 'Medical Supplies';

export type DosageForm = 
  | 'Tablet'
  | 'Capsule'
  | 'Syrup'
  | 'Injection'
  | 'Ointment'
  | 'Drops'
  | 'Inhaler'
  | 'Sachet';

export type ScheduleType = 'OTC' | 'Schedule H' | 'Schedule H1' | 'Schedule X' | 'Narcotic';

export interface Medicine {
  id: string;
  name: string;
  genericName: string;
  category: Category;
  form: DosageForm;
  strength: string; // e.g., "500mg", "10ml"
  manufacturer: string;
  batchNumber: string;
  barcode: string;
  expiryDate: string; // YYYY-MM-DD
  purchasePrice: number; // Cost price per pack/strip
  mrp: number; // Maximum Retail Price per pack/strip
  defaultSellingPrice?: number; // Custom selling price per pack (defaults to MRP)
  unitsPerPack: number; // e.g. 10 tablets in a strip, 15 capsules in a strip, 1 for bottle
  packUnitLabel?: string; // 'Tablets / Strip', 'Capsules / Strip', 'Bottle', etc.
  stockQuantity: number; // Stored in total packs / fractional packs or total packs
  minStockThreshold: number;
  rackLocation: string; // e.g. "Rack A - Shelf 2"
  scheduleType: ScheduleType;
  requiresPrescription: boolean;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock' | 'Expiring Soon' | 'Expired';
  hsnCode?: string;
  gstRate?: number; // 5%, 12%, 18%
  notes?: string;
  lastUpdated?: string;
}

export type MovementType = 'IN' | 'OUT' | 'ADJUSTMENT' | 'RETURN' | 'DISPOSAL' | 'PURCHASE' | 'SALE';

export interface StockMovement {
  id: string;
  medicineId: string;
  medicineName: string;
  type: MovementType;
  quantity: number; // positive for IN/PURCHASE, negative or absolute for OUT/DISPOSAL/SALE
  date: string; // ISO string
  reason: string;
  referenceId?: string; // Bill ID, Invoice ID or Adjustment ID
  performedBy: string;
  previousStock: number;
  newStock: number;
}

export interface PurchaseBillItem {
  medicineId: string;
  medicineName: string;
  batchNumber: string;
  expiryDate: string;
  quantity: number;
  freeQuantity?: number;
  purchasePrice: number;
  mrp: number;
  gstRate: number; // percentage e.g. 12
  taxAmount: number;
  totalAmount: number;
}

export interface PurchaseBill {
  id: string;
  billNumber: string;
  invoiceDate: string;
  dueDate: string;
  vendorId: string;
  vendorName: string;
  items: PurchaseBillItem[];
  subtotal: number;
  taxAmount: number;
  discountAmount: number;
  roundOff?: number;
  grandTotal: number;
  paidAmount: number;
  paymentStatus: 'PAID' | 'PARTIAL' | 'UNPAID';
  paymentMethod: 'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'Credit Note';
  notes?: string;
  receivedDate: string;
}

export interface SalesBillItem {
  medicineId: string;
  medicineName: string;
  genericName?: string;
  batchNumber: string;
  expiryDate: string;
  packSize: number; // e.g. 10 tabs per strip
  sellMode: 'PACK' | 'LOOSE'; // 'PACK' = whole strip/bottle, 'LOOSE' = individual tablets/units
  quantity: number; // count of packs OR count of loose tablets
  packPrice: number; // Selling price for 1 full pack/strip (e.g. ₹50)
  unitPrice: number; // Calculated price per loose tablet (e.g. ₹50 / 10 = ₹5.00)
  gstRate: number;
  taxAmount: number;
  discountPercent?: number;
  totalAmount: number;
  deductedPacks: number; // e.g. 3 tabs of 10-tab strip = 0.3 packs deducted
}

export interface SalesBill {
  id: string;
  billNumber: string; // e.g. REC-2026-0042
  date: string; // ISO date
  customerName: string;
  customerPhone?: string;
  doctorName?: string;
  doctorRegNo?: string;
  items: SalesBillItem[];
  subtotal: number;
  discountAmount: number;
  taxAmount: number;
  roundOff: number;
  grandTotal: number;
  paymentMethod: 'Cash' | 'UPI' | 'Card' | 'Credit';
  paymentStatus: 'PAID' | 'UNPAID';
  notes?: string;
  pharmacistName: string;
}

export interface Vendor {
  id: string;
  name: string;
  contactPerson: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  gstin: string;
  dlNumber: string; // Drug License
  paymentTermsDays: number;
  rating: number; // 1-5
  balanceDue: number;
  totalPurchases: number;
  status: 'Active' | 'Inactive';
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'EXPIRY_ALERT' | 'LOW_STOCK' | 'BILL_DUE' | 'SYSTEM';
  severity: 'HIGH' | 'MEDIUM' | 'LOW';
  timestamp: string;
  read: boolean;
  targetPage?: PageId;
  metadata?: {
    medicineId?: string;
    billId?: string;
    vendorId?: string;
  };
}

export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'sync-failed';

export type PageId = 
  | 'dashboard'
  | 'pos'
  | 'sales-history'
  | 'inventory'
  | 'medicine-details'
  | 'purchase-bills'
  | 'add-purchase-bill'
  | 'vendors'
  | 'expiry'
  | 'low-stock'
  | 'stock-movements'
  | 'reports'
  | 'settings';
