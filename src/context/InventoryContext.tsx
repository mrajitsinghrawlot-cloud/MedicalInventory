import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  Medicine, 
  Vendor, 
  PurchaseBill, 
  StockMovement, 
  AppNotification, 
  SyncStatus, 
  PageId, 
  MovementType,
  SalesBill 
} from '../types/inventory';
import { 
  initialMedicines, 
  initialVendors, 
  initialPurchaseBills, 
  initialStockMovements, 
  initialNotifications,
  initialSalesBills 
} from '../data/initialData';
import { getDaysUntilExpiry } from '../utils/formatters';

interface InventoryContextType {
  // State
  medicines: Medicine[];
  vendors: Vendor[];
  purchaseBills: PurchaseBill[];
  salesBills: SalesBill[];
  stockMovements: StockMovement[];
  notifications: AppNotification[];
  syncStatus: SyncStatus;
  lastSynced: Date;
  currentPage: PageId;
  previousPages: PageId[];
  selectedMedicine: Medicine | null;
  selectedBill: PurchaseBill | null;
  selectedSalesBill: SalesBill | null;
  selectedVendor: Vendor | null;
  globalSearchOpen: boolean;
  
  // Navigation & UI controls
  navigate: (page: PageId) => void;
  goBack: () => void;
  setSelectedMedicine: (med: Medicine | null) => void;
  setSelectedBill: (bill: PurchaseBill | null) => void;
  setSelectedSalesBill: (bill: SalesBill | null) => void;
  setSelectedVendor: (vendor: Vendor | null) => void;
  setGlobalSearchOpen: (open: boolean) => void;
  setSyncStatus: (status: SyncStatus) => void;
  triggerSync: () => Promise<void>;
  
  // Business logic mutations
  addMedicine: (medicine: Omit<Medicine, 'id' | 'status'>) => void;
  updateMedicine: (id: string, updates: Partial<Medicine>) => void;
  deleteMedicine: (id: string) => void;
  adjustStock: (medicineId: string, quantityChange: number, type: MovementType, reason: string, performedBy?: string) => void;
  addPurchaseBill: (bill: Omit<PurchaseBill, 'id'> | (Omit<PurchaseBill, 'id' | 'grandTotal' | 'subtotal' | 'taxAmount'> & { roundOff?: number; grandTotal?: number; subtotal?: number; taxAmount?: number })) => void;
  deletePurchaseBill: (billId: string, reason?: string, performedBy?: string) => void;
  restorePurchaseBill: (billId: string, performedBy?: string) => void;
  permanentlyDeletePurchaseBill: (billId: string) => void;
  deletedPurchaseBills: PurchaseBill[];
  superAdminPin: string;
  setSuperAdminPin: (pin: string) => void;
  createSalesBill: (bill: Omit<SalesBill, 'id'>) => SalesBill;
  updateBillPayment: (billId: string, paidAmount: number, status: 'PAID' | 'PARTIAL' | 'UNPAID') => void;
  addVendor: (vendor: Omit<Vendor, 'id' | 'balanceDue' | 'totalPurchases'>) => void;
  updateVendor: (id: string, updates: Partial<Vendor>) => void;
  disposeExpiredItem: (medicineId: string, quantity: number, reason: string) => void;
  returnToVendor: (medicineId: string, vendorId: string, quantity: number, reason: string) => void;
  
  // Notifications & Data Reset
  markNotificationRead: (id: string) => void;
  clearAllNotifications: () => void;
  resetToDemoData: () => void;
  clearAllData: () => void;

  // Computed summary counts
  expiredCount: number;
  expiringSoonCount: number;
  lowStockCount: number;
  outOfStockCount: number;
  totalStockValue: number;
  totalSalesToday: number;
  totalSalesCount: number;
}

const InventoryContext = createContext<InventoryContextType | undefined>(undefined);

const STORAGE_KEYS = {
  MEDICINES: 'medistock_medicines_v2',
  VENDORS: 'medistock_vendors_v2',
  BILLS: 'medistock_bills_v2',
  DELETED_BILLS: 'medistock_deleted_bills_v2',
  SUPER_ADMIN_PIN: 'medistock_super_admin_pin_v2',
  SALES: 'medistock_sales_v2',
  MOVEMENTS: 'medistock_movements_v2',
  NOTIFICATIONS: 'medistock_notifications_v2'
};

export const InventoryProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Load initial or stored data
  const [medicines, setMedicines] = useState<Medicine[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MEDICINES);
    return saved ? JSON.parse(saved) : initialMedicines;
  });

  const [vendors, setVendors] = useState<Vendor[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VENDORS);
    return saved ? JSON.parse(saved) : initialVendors;
  });

  const [purchaseBills, setPurchaseBills] = useState<PurchaseBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BILLS);
    return saved ? JSON.parse(saved) : initialPurchaseBills;
  });

  const [deletedPurchaseBills, setDeletedPurchaseBills] = useState<PurchaseBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.DELETED_BILLS);
    return saved ? JSON.parse(saved) : [];
  });

  const [superAdminPin, setSuperAdminPin] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SUPER_ADMIN_PIN);
    return saved || '7821';
  });

  const [salesBills, setSalesBills] = useState<SalesBill[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : initialSalesBills;
  });

  const [stockMovements, setStockMovements] = useState<StockMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : initialStockMovements;
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
    return saved ? JSON.parse(saved) : initialNotifications;
  });

  const [syncStatus, setSyncStatus] = useState<SyncStatus>('synced');
  const [lastSynced, setLastSynced] = useState<Date>(new Date());
  const [currentPage, setCurrentPage] = useState<PageId>('dashboard');
  const [previousPages, setPreviousPages] = useState<PageId[]>([]);
  const [selectedMedicine, setSelectedMedicine] = useState<Medicine | null>(null);
  const [selectedBill, setSelectedBill] = useState<PurchaseBill | null>(null);
  const [selectedSalesBill, setSelectedSalesBill] = useState<SalesBill | null>(null);
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);

  // Sync to local storage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MEDICINES, JSON.stringify(medicines));
  }, [medicines]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VENDORS, JSON.stringify(vendors));
  }, [vendors]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BILLS, JSON.stringify(purchaseBills));
  }, [purchaseBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.DELETED_BILLS, JSON.stringify(deletedPurchaseBills));
  }, [deletedPurchaseBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SUPER_ADMIN_PIN, superAdminPin);
  }, [superAdminPin]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(salesBills));
  }, [salesBills]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(stockMovements));
  }, [stockMovements]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifications));
  }, [notifications]);

  const computeMedicineStatus = (stockQty: number, minThreshold: number, expiryDateStr: string): Medicine['status'] => {
    const days = getDaysUntilExpiry(expiryDateStr);
    if (days < 0) return 'Expired';
    if (stockQty <= 0) return 'Out of Stock';
    if (days <= 60) return 'Expiring Soon';
    if (stockQty <= minThreshold) return 'Low Stock';
    return 'In Stock';
  };

  const navigate = (page: PageId) => {
    setPreviousPages(prev => [...prev, currentPage]);
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const goBack = () => {
    if (previousPages.length > 0) {
      const prev = previousPages[previousPages.length - 1];
      setPreviousPages(p => p.slice(0, -1));
      setCurrentPage(prev);
    } else {
      setCurrentPage('dashboard');
    }
  };

  const triggerSync = async () => {
    setSyncStatus('syncing');
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setSyncStatus('synced');
      setLastSynced(new Date());
    } catch {
      setSyncStatus('sync-failed');
    }
  };

  const addMedicine = (data: Omit<Medicine, 'id' | 'status'>) => {
    const id = `med-${Date.now()}`;
    const status = computeMedicineStatus(data.stockQuantity, data.minStockThreshold, data.expiryDate);
    const newMedicine: Medicine = {
      ...data,
      id,
      status,
      unitsPerPack: data.unitsPerPack || 10,
      defaultSellingPrice: data.defaultSellingPrice || data.mrp,
      lastUpdated: new Date().toISOString().split('T')[0]
    };

    setMedicines(prev => [newMedicine, ...prev]);

    if (data.stockQuantity > 0) {
      const movement: StockMovement = {
        id: `mov-${Date.now()}`,
        medicineId: id,
        medicineName: data.name,
        type: 'IN',
        quantity: data.stockQuantity,
        date: new Date().toISOString(),
        reason: 'Initial opening stock registration',
        performedBy: 'System Pharmacist',
        previousStock: 0,
        newStock: data.stockQuantity
      };
      setStockMovements(prev => [movement, ...prev]);
    }
  };

  const updateMedicine = (id: string, updates: Partial<Medicine>) => {
    setMedicines(prev => prev.map(item => {
      if (item.id === id) {
        const updated = { ...item, ...updates, lastUpdated: new Date().toISOString().split('T')[0] };
        updated.status = computeMedicineStatus(
          updated.stockQuantity,
          updated.minStockThreshold,
          updated.expiryDate
        );
        return updated;
      }
      return item;
    }));

    if (selectedMedicine?.id === id) {
      setSelectedMedicine(prev => prev ? { ...prev, ...updates } : null);
    }
  };

  const deleteMedicine = (id: string) => {
    setMedicines(prev => prev.filter(item => item.id !== id));
    if (selectedMedicine?.id === id) {
      setSelectedMedicine(null);
    }
  };

  const adjustStock = (
    medicineId: string, 
    quantityChange: number, 
    type: MovementType, 
    reason: string, 
    performedBy = 'Chief Pharmacist'
  ) => {
    const target = medicines.find(m => m.id === medicineId);
    if (!target) return;

    const previousStock = target.stockQuantity;
    const newStock = Math.max(0, previousStock + quantityChange);

    updateMedicine(medicineId, { stockQuantity: newStock });

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      medicineId,
      medicineName: target.name,
      type,
      quantity: quantityChange,
      date: new Date().toISOString(),
      reason,
      performedBy,
      previousStock,
      newStock
    };

    setStockMovements(prev => [movement, ...prev]);

    if (newStock <= target.minStockThreshold && previousStock > target.minStockThreshold) {
      const notif: AppNotification = {
        id: `notif-${Date.now()}`,
        title: 'Low Stock Alert',
        message: `${target.name} stock decreased to ${newStock} units (Threshold: ${target.minStockThreshold}).`,
        type: 'LOW_STOCK',
        severity: 'HIGH',
        timestamp: new Date().toISOString(),
        read: false,
        targetPage: 'low-stock',
        metadata: { medicineId }
      };
      setNotifications(prev => [notif, ...prev]);
    }
  };

  // Dispense / Sell Medicine to Patient (POS)
  const createSalesBill = (billData: Omit<SalesBill, 'id'>): SalesBill => {
    const billId = `sale-${Date.now()}`;
    const newSale: SalesBill = {
      ...billData,
      id: billId
    };

    setSalesBills(prev => [newSale, ...prev]);

    // Deduct stock for each dispensed item
    billData.items.forEach(item => {
      const target = medicines.find(m => m.id === item.medicineId);
      if (target) {
        const prevStock = target.stockQuantity;
        // If selling loose tablets: quantity / packSize
        // If selling full packs: quantity
        const packsToDeduct = item.sellMode === 'LOOSE' 
          ? Number((item.quantity / (item.packSize || 10)).toFixed(2))
          : item.quantity;

        const newStock = Math.max(0, Number((prevStock - packsToDeduct).toFixed(2)));

        updateMedicine(target.id, { stockQuantity: newStock });

        // Record SALE movement
        const movement: StockMovement = {
          id: `mov-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          medicineId: target.id,
          medicineName: target.name,
          type: 'SALE',
          quantity: -packsToDeduct,
          date: new Date().toISOString(),
          reason: `Dispensed to ${billData.customerName || 'Walk-in Patient'} (Receipt #${billData.billNumber}): ${item.quantity} ${item.sellMode === 'LOOSE' ? 'loose tabs' : 'packs'}`,
          referenceId: billId,
          performedBy: billData.pharmacistName || 'Dr. Arjun (Pharmacist)',
          previousStock: prevStock,
          newStock
        };

        setStockMovements(prev => [movement, ...prev]);
      }
    });

    return newSale;
  };

  const addPurchaseBill = (billData: Omit<PurchaseBill, 'id'> | (Omit<PurchaseBill, 'id' | 'grandTotal' | 'subtotal' | 'taxAmount'> & { roundOff?: number; grandTotal?: number; subtotal?: number; taxAmount?: number })) => {
    const subtotal = 'subtotal' in billData && typeof billData.subtotal === 'number'
      ? billData.subtotal
      : Math.round(billData.items.reduce((acc, item) => acc + (item.quantity * item.purchasePrice), 0) * 100) / 100;
    const taxAmount = 'taxAmount' in billData && typeof billData.taxAmount === 'number'
      ? billData.taxAmount
      : Math.round(billData.items.reduce((acc, item) => acc + item.taxAmount, 0) * 100) / 100;
    const roundOff = ('roundOff' in billData && typeof billData.roundOff === 'number') ? billData.roundOff : 0;
    const grandTotal = 'grandTotal' in billData && typeof billData.grandTotal === 'number'
      ? billData.grandTotal
      : Math.max(0, Math.round((subtotal + taxAmount - (billData.discountAmount || 0) + roundOff) * 100) / 100);

    const billId = `bill-${Date.now()}`;
    const newBill: PurchaseBill = {
      ...billData,
      id: billId,
      subtotal,
      taxAmount,
      roundOff,
      grandTotal,
      paidAmount: billData.paymentStatus === 'PAID' ? grandTotal : (billData.paidAmount || 0)
    };

    setPurchaseBills(prev => [newBill, ...prev]);

    // Update or Auto-register Vendor
    setVendors(prev => {
      const targetName = (billData.vendorName || '').trim();
      const existingVendor = prev.find(v => 
        (billData.vendorId && v.id === billData.vendorId) || 
        (targetName && v.name.toLowerCase() === targetName.toLowerCase())
      );
      const remainingUnpaid = grandTotal - (newBill.paidAmount || 0);

      if (existingVendor) {
        return prev.map(v => {
          if (v.id === existingVendor.id) {
            return {
              ...v,
              balanceDue: v.balanceDue + remainingUnpaid,
              totalPurchases: v.totalPurchases + grandTotal
            };
          }
          return v;
        });
      } else if (targetName) {
        const newVendor: Vendor = {
          id: billData.vendorId || `ven-${Date.now()}`,
          name: targetName,
          contactPerson: 'Distributor Representative',
          phone: '+91 94144 78218',
          email: 'billing@distributor.com',
          address: 'Medical Market, MGH Road',
          city: 'Jodhpur',
          gstin: '08AABPI5309K1ZR',
          dlNumber: 'DL-20B/21B-48190',
          paymentTermsDays: 30,
          rating: 5.0,
          balanceDue: remainingUnpaid,
          totalPurchases: grandTotal,
          status: 'Active'
        };
        return [newVendor, ...prev];
      }
      return prev;
    });

    // Atomically Update Medicine Stock Quantities & Record Audit Movement Logs
    const newMovements: StockMovement[] = [];

    setMedicines(prevMedicines => {
      const updatedMedicines = [...prevMedicines];

      billData.items.forEach((item, idx) => {
        const addedQty = Number(item.quantity || 0) + Number(item.freeQuantity || 0);
        if (addedQty <= 0) return;

        const trimmedName = (item.medicineName || '').trim();
        const existingIndex = updatedMedicines.findIndex(m => 
          (item.medicineId && m.id === item.medicineId) || 
          (trimmedName && m.name.toLowerCase() === trimmedName.toLowerCase())
        );

        if (existingIndex !== -1) {
          // Existing medicine: Increase stockQuantity
          const existing = updatedMedicines[existingIndex];
          const prevStock = Number(existing.stockQuantity) || 0;
          const newStock = prevStock + addedQty;
          const status = computeMedicineStatus(newStock, existing.minStockThreshold || 10, item.expiryDate || existing.expiryDate);

          updatedMedicines[existingIndex] = {
            ...existing,
            stockQuantity: newStock,
            status,
            batchNumber: item.batchNumber || existing.batchNumber,
            expiryDate: item.expiryDate || existing.expiryDate,
            purchasePrice: item.purchasePrice || existing.purchasePrice,
            mrp: item.mrp || existing.mrp,
            gstRate: item.gstRate ?? existing.gstRate
          };

          newMovements.push({
            id: `mov-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            medicineId: existing.id,
            medicineName: existing.name,
            type: 'PURCHASE',
            quantity: addedQty,
            date: new Date().toISOString(),
            reason: `Purchase Bill #${billData.billNumber} (${billData.vendorName || 'Supplier'})`,
            referenceId: billId,
            performedBy: 'Receiving Pharmacist',
            previousStock: prevStock,
            newStock
          });
        } else {
          // New medicine: Create new catalog item with stockQuantity = addedQty
          const medId = item.medicineId || `med-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`;
          const status = computeMedicineStatus(addedQty, 10, item.expiryDate || '2028-12-31');

          const newMed: Medicine = {
            id: medId,
            name: trimmedName || 'Medical Product',
            genericName: trimmedName || 'Medical Product',
            category: 'Medical Supplies',
            form: 'Tablet',
            strength: 'Standard',
            manufacturer: billData.vendorName || 'Pharmaceutical Distributor',
            batchNumber: item.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
            barcode: String(Math.floor(100000000000 + Math.random() * 900000000000)),
            expiryDate: item.expiryDate || '2028-12-31',
            purchasePrice: item.purchasePrice || 50,
            mrp: item.mrp || Math.round((item.purchasePrice || 50) * 1.35 * 100) / 100,
            unitsPerPack: 10,
            stockQuantity: addedQty,
            minStockThreshold: 10,
            rackLocation: 'Inward Shelf',
            scheduleType: 'OTC',
            requiresPrescription: false,
            status,
            gstRate: item.gstRate ?? 12
          };

          updatedMedicines.unshift(newMed);

          newMovements.push({
            id: `mov-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            medicineId: medId,
            medicineName: newMed.name,
            type: 'PURCHASE',
            quantity: addedQty,
            date: new Date().toISOString(),
            reason: `Purchase Bill #${billData.billNumber} (New SKU registered)`,
            referenceId: billId,
            performedBy: 'Receiving Pharmacist',
            previousStock: 0,
            newStock: addedQty
          });
        }
      });

      return updatedMedicines;
    });

    if (newMovements.length > 0) {
      setStockMovements(prev => [...newMovements, ...prev]);
    }
  };

  const deletePurchaseBill = (billId: string, reason?: string, performedBy?: string) => {
    const targetBill = purchaseBills.find(b => b.id === billId);
    if (!targetBill) return;

    const deletionAuditMovements: StockMovement[] = [];
    const unpaidAmount = targetBill.grandTotal - (targetBill.paidAmount || 0);

    // 1. Atomically deduct stock quantities from inventory
    setMedicines(prevMedicines => {
      const updatedMedicines = [...prevMedicines];

      targetBill.items.forEach((item, idx) => {
        const deductedQty = Number(item.quantity || 0) + Number(item.freeQuantity || 0);
        if (deductedQty <= 0) return;

        const trimmedName = (item.medicineName || '').trim().toLowerCase();
        const existingIndex = updatedMedicines.findIndex(m => 
          (item.medicineId && m.id === item.medicineId) || 
          (trimmedName && m.name.toLowerCase() === trimmedName)
        );

        if (existingIndex !== -1) {
          const existing = updatedMedicines[existingIndex];
          const prevStock = Number(existing.stockQuantity) || 0;
          const newStock = Math.max(0, prevStock - deductedQty);
          const status = computeMedicineStatus(newStock, existing.minStockThreshold || 10, existing.expiryDate);

          updatedMedicines[existingIndex] = {
            ...existing,
            stockQuantity: newStock,
            status
          };

          deletionAuditMovements.push({
            id: `mov-del-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            medicineId: existing.id,
            medicineName: existing.name,
            type: 'RETURN',
            quantity: -deductedQty,
            date: new Date().toISOString(),
            reason: `Purchase Bill #${targetBill.billNumber} Deleted / Stock Reversal (${targetBill.vendorName}) - ${reason || 'Inward Cancelled'}`,
            referenceId: targetBill.id,
            performedBy: performedBy || 'Super Admin',
            previousStock: prevStock,
            newStock
          });
        }
      });

      return updatedMedicines;
    });

    if (deletionAuditMovements.length > 0) {
      setStockMovements(prev => [...deletionAuditMovements, ...prev]);
    }

    // 2. Adjust vendor balance due and total purchases
    setVendors(prevVendors => prevVendors.map(v => {
      const isTargetVendor = (targetBill.vendorId && v.id === targetBill.vendorId) ||
        (targetBill.vendorName && v.name.toLowerCase() === targetBill.vendorName.trim().toLowerCase());
      if (isTargetVendor) {
        return {
          ...v,
          balanceDue: Math.max(0, (v.balanceDue || 0) - unpaidAmount),
          totalPurchases: Math.max(0, (v.totalPurchases || 0) - targetBill.grandTotal)
        };
      }
      return v;
    }));

    // 3. Move to deletedPurchaseBills (soft delete for Super Admin recovery)
    const softDeletedBill: PurchaseBill = {
      ...targetBill,
      isDeleted: true,
      deletedAt: new Date().toISOString(),
      deletedBy: performedBy || 'Super Admin',
      deletionReason: reason || 'Inward Bill Deleted / Stock Reverted'
    };

    setDeletedPurchaseBills(prev => [softDeletedBill, ...prev.filter(b => b.id !== billId)]);
    setPurchaseBills(prev => prev.filter(b => b.id !== billId));
  };

  const restorePurchaseBill = (billId: string, performedBy?: string) => {
    const targetBill = deletedPurchaseBills.find(b => b.id === billId);
    if (!targetBill) return;

    const restoreAuditMovements: StockMovement[] = [];
    const unpaidAmount = targetBill.grandTotal - (targetBill.paidAmount || 0);

    // 1. Atomically restore medicine stock quantities
    setMedicines(prevMedicines => {
      const updatedMedicines = [...prevMedicines];

      targetBill.items.forEach((item, idx) => {
        const addedQty = Number(item.quantity || 0) + Number(item.freeQuantity || 0);
        if (addedQty <= 0) return;

        const trimmedName = (item.medicineName || '').trim().toLowerCase();
        const existingIndex = updatedMedicines.findIndex(m => 
          (item.medicineId && m.id === item.medicineId) || 
          (trimmedName && m.name.toLowerCase() === trimmedName)
        );

        if (existingIndex !== -1) {
          const existing = updatedMedicines[existingIndex];
          const prevStock = Number(existing.stockQuantity) || 0;
          const newStock = prevStock + addedQty;
          const status = computeMedicineStatus(newStock, existing.minStockThreshold || 10, existing.expiryDate);

          updatedMedicines[existingIndex] = {
            ...existing,
            stockQuantity: newStock,
            status
          };

          restoreAuditMovements.push({
            id: `mov-res-${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 6)}`,
            medicineId: existing.id,
            medicineName: existing.name,
            type: 'PURCHASE',
            quantity: addedQty,
            date: new Date().toISOString(),
            reason: `Purchase Bill #${targetBill.billNumber} Restored by Super Admin (${targetBill.vendorName})`,
            referenceId: targetBill.id,
            performedBy: performedBy || 'Super Admin',
            previousStock: prevStock,
            newStock
          });
        } else {
          // Re-create medicine if missing
          const medId = item.medicineId || `med-${Date.now()}-${idx}`;
          const status = computeMedicineStatus(addedQty, 10, item.expiryDate || '2028-12-31');
          updatedMedicines.unshift({
            id: medId,
            name: item.medicineName,
            genericName: item.medicineName,
            category: 'Medical Supplies',
            form: 'Tablet',
            strength: 'Standard',
            manufacturer: targetBill.vendorName,
            batchNumber: item.batchNumber || 'BAT-RESTORE',
            barcode: String(Math.floor(100000000000 + Math.random() * 900000000000)),
            expiryDate: item.expiryDate || '2028-12-31',
            purchasePrice: item.purchasePrice || 50,
            mrp: item.mrp || Math.round((item.purchasePrice || 50) * 1.35 * 100) / 100,
            unitsPerPack: 10,
            stockQuantity: addedQty,
            minStockThreshold: 10,
            rackLocation: 'Inward Shelf',
            scheduleType: 'OTC',
            requiresPrescription: false,
            status,
            gstRate: item.gstRate ?? 12
          });
        }
      });

      return updatedMedicines;
    });

    if (restoreAuditMovements.length > 0) {
      setStockMovements(prev => [...restoreAuditMovements, ...prev]);
    }

    // 2. Restore vendor ledger
    setVendors(prevVendors => prevVendors.map(v => {
      const isTargetVendor = (targetBill.vendorId && v.id === targetBill.vendorId) ||
        (targetBill.vendorName && v.name.toLowerCase() === targetBill.vendorName.trim().toLowerCase());
      if (isTargetVendor) {
        return {
          ...v,
          balanceDue: (v.balanceDue || 0) + unpaidAmount,
          totalPurchases: (v.totalPurchases || 0) + targetBill.grandTotal
        };
      }
      return v;
    }));

    // 3. Move back to active purchaseBills
    const restoredBill: PurchaseBill = {
      ...targetBill,
      isDeleted: false
    };

    setPurchaseBills(prev => [restoredBill, ...prev]);
    setDeletedPurchaseBills(prev => prev.filter(b => b.id !== billId));
  };

  const permanentlyDeletePurchaseBill = (billId: string) => {
    setDeletedPurchaseBills(prev => prev.filter(b => b.id !== billId));
  };

  const updateBillPayment = (billId: string, paidAmount: number, status: 'PAID' | 'PARTIAL' | 'UNPAID') => {
    setPurchaseBills(prev => prev.map(b => {
      if (b.id === billId) {
        return {
          ...b,
          paidAmount,
          paymentStatus: status
        };
      }
      return b;
    }));
  };

  const addVendor = (data: Omit<Vendor, 'id' | 'balanceDue' | 'totalPurchases'>) => {
    const newVendor: Vendor = {
      ...data,
      id: `ven-${Date.now()}`,
      balanceDue: 0,
      totalPurchases: 0
    };
    setVendors(prev => [newVendor, ...prev]);
  };

  const updateVendor = (id: string, updates: Partial<Vendor>) => {
    setVendors(prev => prev.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const disposeExpiredItem = (medicineId: string, quantity: number, reason: string) => {
    adjustStock(medicineId, -quantity, 'DISPOSAL', `Expired Stock Disposal: ${reason}`);
  };

  const returnToVendor = (medicineId: string, vendorId: string, quantity: number, reason: string) => {
    const vendor = vendors.find(v => v.id === vendorId);
    adjustStock(medicineId, -quantity, 'RETURN', `Vendor Return (${vendor?.name || 'Supplier'}): ${reason}`);
  };

  const markNotificationRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const clearAllNotifications = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const resetToDemoData = () => {
    setMedicines(initialMedicines);
    setVendors(initialVendors);
    setPurchaseBills(initialPurchaseBills);
    setSalesBills(initialSalesBills);
    setStockMovements(initialStockMovements);
    setNotifications(initialNotifications);
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  };

  const clearAllData = () => {
    setMedicines([]);
    setVendors([]);
    setPurchaseBills([]);
    setSalesBills([]);
    setStockMovements([]);
    setNotifications([]);
    setSelectedMedicine(null);
    setSelectedBill(null);
    setSelectedSalesBill(null);
    setSelectedVendor(null);
    Object.values(STORAGE_KEYS).forEach(k => localStorage.removeItem(k));
  };

  // Computed summary metrics
  const expiredCount = medicines.filter(m => getDaysUntilExpiry(m.expiryDate) < 0).length;
  const expiringSoonCount = medicines.filter(m => {
    const days = getDaysUntilExpiry(m.expiryDate);
    return days >= 0 && days <= 60;
  }).length;
  const lowStockCount = medicines.filter(m => m.stockQuantity > 0 && m.stockQuantity <= m.minStockThreshold).length;
  const outOfStockCount = medicines.filter(m => m.stockQuantity <= 0).length;
  const totalStockValue = medicines.reduce((sum, m) => sum + (m.stockQuantity * m.purchasePrice), 0);
  
  const totalSalesToday = salesBills.reduce((sum, s) => sum + s.grandTotal, 0);
  const totalSalesCount = salesBills.length;

  return (
    <InventoryContext.Provider
      value={{
        medicines,
        vendors,
        purchaseBills,
        deletedPurchaseBills,
        superAdminPin,
        setSuperAdminPin,
        salesBills,
        stockMovements,
        notifications,
        syncStatus,
        lastSynced,
        currentPage,
        previousPages,
        selectedMedicine,
        selectedBill,
        selectedSalesBill,
        selectedVendor,
        globalSearchOpen,
        navigate,
        goBack,
        setSelectedMedicine,
        setSelectedBill,
        setSelectedSalesBill,
        setSelectedVendor,
        setGlobalSearchOpen,
        setSyncStatus,
        triggerSync,
        addMedicine,
        updateMedicine,
        deleteMedicine,
        adjustStock,
        addPurchaseBill,
        deletePurchaseBill,
        restorePurchaseBill,
        permanentlyDeletePurchaseBill,
        createSalesBill,
        updateBillPayment,
        addVendor,
        updateVendor,
        disposeExpiredItem,
        returnToVendor,
        markNotificationRead,
        clearAllNotifications,
        resetToDemoData,
        clearAllData,
        expiredCount,
        expiringSoonCount,
        lowStockCount,
        outOfStockCount,
        totalStockValue,
        totalSalesToday,
        totalSalesCount
      }}
    >
      {children}
    </InventoryContext.Provider>
  );
};

export const useInventory = () => {
  const context = useContext(InventoryContext);
  if (!context) {
    throw new Error('useInventory must be used within an InventoryProvider');
  }
  return context;
};
