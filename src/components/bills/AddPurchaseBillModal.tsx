import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Trash2, 
  FilePlus, 
  Sparkles, 
  Check, 
  AlertCircle, 
  Barcode, 
  Camera, 
  Upload, 
  Loader2, 
  Key, 
  ExternalLink,
  HelpCircle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseBillItem, Medicine } from '../../types/inventory';
import { formatCurrency } from '../../utils/formatters';
import { BarcodeScannerModal } from '../inventory/BarcodeScannerModal';
import { 
  getStoredApiKey, 
  setStoredApiKey, 
  extractPurchaseBillFromImage, 
  ExtractedPurchaseBill 
} from '../../services/geminiService';
import confetti from 'canvas-confetti';

interface AddPurchaseBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPurchaseBillModal: React.FC<AddPurchaseBillModalProps> = ({
  isOpen,
  onClose
}) => {
  const { medicines, addMedicine, vendors, addVendor, addPurchaseBill } = useInventory();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [billNumber, setBillNumber] = useState(`PB-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [vendorName, setVendorName] = useState(vendors[0]?.name || 'SHRI LAXMI TRADING COMPANY');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'Credit Note'>('Cash');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [roundOff, setRoundOff] = useState<number>(0);
  const [notes, setNotes] = useState('Stock verified & batch cold-chain inspected upon receipt');

  const [items, setItems] = useState<PurchaseBillItem[]>([
    {
      medicineId: medicines[0]?.id || 'new-med-1',
      medicineName: medicines[0]?.name || 'MAXO COMBI(80)',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '2028-12-31',
      quantity: 10,
      freeQuantity: 0,
      purchasePrice: 50,
      mrp: 75,
      gstRate: 12,
      taxAmount: 60,
      totalAmount: 560
    }
  ]);

  const [error, setError] = useState('');
  
  // AI Bill Scanner State
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAiExtracting, setIsAiExtracting] = useState(false);
  const [aiSuccessMessage, setAiSuccessMessage] = useState<string | null>(null);
  const [isApiKeyPromptOpen, setIsApiKeyPromptOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => getStoredApiKey());
  const [aiError, setAiError] = useState<string | null>(null);

  const handleAiScanButtonClick = () => {
    const key = getStoredApiKey();
    if (!key) {
      setIsApiKeyPromptOpen(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleSaveKeyAndContinue = (e: React.FormEvent) => {
    e.preventDefault();
    if (apiKeyInput.trim()) {
      setStoredApiKey(apiKeyInput.trim());
      setIsApiKeyPromptOpen(false);
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 200);
    }
  };

  const handleFileSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    e.target.value = '';
    setIsAiExtracting(true);
    setAiError(null);
    setAiSuccessMessage(null);

    try {
      const extracted: ExtractedPurchaseBill = await extractPurchaseBillFromImage(file);

      // Auto-populate distributor/vendor name
      if (extracted.vendorName) {
        setVendorName(extracted.vendorName);
        const lowerVendor = extracted.vendorName.toLowerCase();
        const matchedVendor = vendors.find(v => 
          lowerVendor.includes(v.name.toLowerCase()) || 
          v.name.toLowerCase().includes(lowerVendor)
        );
        if (matchedVendor) {
          setVendorId(matchedVendor.id);
        }
      }

      if (extracted.billNumber) setBillNumber(extracted.billNumber);
      if (extracted.invoiceDate) setInvoiceDate(extracted.invoiceDate);
      if (extracted.dueDate) setDueDate(extracted.dueDate);
      if (extracted.discountAmount !== undefined) setDiscountAmount(extracted.discountAmount);
      if (extracted.paymentMethod) setPaymentMethod(extracted.paymentMethod);
      if (extracted.notes) setNotes(extracted.notes);

      // Map extracted line items
      if (extracted.items && extracted.items.length > 0) {
        const mappedItems: PurchaseBillItem[] = extracted.items.map((extItem) => {
          const lowerName = extItem.medicineName.toLowerCase();
          const matchedMed = medicines.find(m => 
            m.name.toLowerCase() === lowerName ||
            m.name.toLowerCase().includes(lowerName) || 
            lowerName.includes(m.name.toLowerCase())
          );

          const qty = Number(extItem.quantity) || 1;
          const price = Number(extItem.purchasePrice) || matchedMed?.purchasePrice || 50;
          const gst = Number(extItem.gstRate) !== undefined ? Number(extItem.gstRate) : (matchedMed?.gstRate || 0);
          const baseTotal = qty * price;
          const taxAmt = Math.round(((baseTotal * gst) / 100) * 100) / 100;
          const lineTotal = Math.round((baseTotal + taxAmt) * 100) / 100;

          return {
            medicineId: matchedMed?.id || `new-med-${Math.random().toString(36).slice(2, 7)}`,
            medicineName: extItem.medicineName,
            batchNumber: extItem.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
            expiryDate: extItem.expiryDate || '2028-12-31',
            quantity: qty,
            freeQuantity: Number(extItem.freeQuantity) || 0,
            purchasePrice: Math.round(price * 100) / 100,
            mrp: Number(extItem.mrp) || matchedMed?.mrp || Math.round(price * 1.35 * 100) / 100,
            gstRate: gst,
            taxAmount: taxAmt,
            totalAmount: lineTotal
          };
        });

        setItems(mappedItems);

        // Auto-calculate roundOff if grandTotal is present
        if (extracted.grandTotal) {
          const rawSubtotal = mappedItems.reduce((acc, i) => acc + (i.quantity * i.purchasePrice), 0);
          const rawTax = mappedItems.reduce((acc, i) => acc + i.taxAmount, 0);
          const computedTotal = rawSubtotal + rawTax - (extracted.discountAmount || 0);
          const diff = Math.round((extracted.grandTotal - computedTotal) * 100) / 100;
          if (Math.abs(diff) <= 2) {
            setRoundOff(diff);
          }
        }

        setAiSuccessMessage(`Successfully extracted ${mappedItems.length} items from ${extracted.vendorName || 'Invoice'}!`);
        try {
          confetti({ particleCount: 50, spread: 65 });
        } catch {}
      } else {
        setAiSuccessMessage('Invoice metadata extracted. Please check line items.');
      }
    } catch (err: any) {
      console.error('AI Extraction failed:', err);
      setAiError(err?.message || 'Failed to analyze bill image. Please check API key or image clarity.');
    } finally {
      setIsAiExtracting(false);
    }
  };

  const handleItemChange = (index: number, field: keyof PurchaseBillItem, val: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      // If medicine name changed, check for existing SKU match
      if (field === 'medicineName') {
        const med = medicines.find(m => m.name.toLowerCase() === String(val).toLowerCase());
        if (med) {
          item.medicineId = med.id;
          item.purchasePrice = med.purchasePrice;
          item.mrp = med.mrp;
          item.batchNumber = med.batchNumber || item.batchNumber;
          item.expiryDate = med.expiryDate || item.expiryDate;
          item.gstRate = med.gstRate ?? item.gstRate;
        }
      }

      // Recompute tax and total
      const baseTotal = (Number(item.quantity) || 0) * (Number(item.purchasePrice) || 0);
      const taxRate = Number(item.gstRate) || 0;
      item.taxAmount = Math.round(((baseTotal * taxRate) / 100) * 100) / 100;
      item.totalAmount = Math.round((baseTotal + item.taxAmount) * 100) / 100;

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    const newItem: PurchaseBillItem = {
      medicineId: `new-med-${Date.now()}`,
      medicineName: '',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '2028-12-31',
      quantity: 10,
      freeQuantity: 0,
      purchasePrice: 50,
      mrp: 80,
      gstRate: 12,
      taxAmount: 60,
      totalAmount: 560
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleScannedInwardItem = (scannedMed: Medicine) => {
    const effectiveGstRate = scannedMed.gstRate ?? 12;
    const baseTotal = 20 * scannedMed.purchasePrice;
    const taxAmt = Math.round(((baseTotal * effectiveGstRate) / 100) * 100) / 100;
    const newItem: PurchaseBillItem = {
      medicineId: scannedMed.id,
      medicineName: scannedMed.name,
      batchNumber: scannedMed.batchNumber || `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: scannedMed.expiryDate,
      quantity: 20,
      freeQuantity: 0,
      purchasePrice: scannedMed.purchasePrice,
      mrp: scannedMed.mrp,
      gstRate: effectiveGstRate,
      taxAmount: taxAmt,
      totalAmount: Math.round((baseTotal + taxAmt) * 100) / 100
    };
    setItems(prev => [...prev, newItem]);
    setIsScannerOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculatedSubtotal = Math.round(items.reduce((acc, i) => acc + (i.quantity * i.purchasePrice), 0) * 100) / 100;
  const calculatedTax = Math.round(items.reduce((acc, i) => acc + i.taxAmount, 0) * 100) / 100;
  const calculatedGrandTotal = Math.max(0, Math.round((calculatedSubtotal + calculatedTax - (discountAmount || 0) + (roundOff || 0)) * 100) / 100);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!billNumber.trim()) {
      setError('Bill number is required');
      return;
    }

    if (items.length === 0) {
      setError('Please add at least 1 medicine item');
      return;
    }

    // Auto-resolve or register vendor
    let targetVendorId = vendorId;
    const matchedVendor = vendors.find(v => 
      v.id === vendorId || 
      v.name.toLowerCase() === vendorName.trim().toLowerCase()
    );

    if (matchedVendor) {
      targetVendorId = matchedVendor.id;
    } else if (vendorName.trim()) {
      const newVenId = `ven-${Date.now()}`;
      addVendor({
        name: vendorName.trim(),
        contactPerson: 'Distributor Representative',
        phone: '+91 94144 78218',
        email: 'billing@distributor.com',
        address: 'Medical Market, MGH Road',
        city: 'Jodhpur',
        gstin: '08AABPI5309K1ZR',
        dlNumber: 'DL-20B/21B-48190',
        paymentTermsDays: 30,
        rating: 5.0,
        status: 'Active'
      });
      targetVendorId = newVenId;
    }

    // Auto-register new medicines into store inventory if they don't exist yet
    const finalizedItems: PurchaseBillItem[] = items.map(item => {
      const trimmedName = item.medicineName.trim() || 'Medical Product';
      const matchedMed = medicines.find(m => m.name.toLowerCase() === trimmedName.toLowerCase());
      let medId = matchedMed?.id || item.medicineId;

      if (!matchedMed) {
        medId = `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
        addMedicine({
          name: trimmedName,
          genericName: trimmedName,
          category: 'Medical Supplies',
          form: 'Tablet',
          strength: 'Standard',
          manufacturer: vendorName.trim() || 'Pharmaceutical Distributor',
          batchNumber: item.batchNumber,
          barcode: String(Math.floor(100000000000 + Math.random() * 900000000000)),
          expiryDate: item.expiryDate,
          purchasePrice: item.purchasePrice,
          mrp: item.mrp || item.purchasePrice * 1.35,
          unitsPerPack: 10,
          stockQuantity: 0,
          minStockThreshold: 10,
          rackLocation: 'Inward Shelf',
          scheduleType: 'OTC',
          requiresPrescription: false,
          gstRate: item.gstRate
        });
      }

      return {
        ...item,
        medicineId: medId,
        medicineName: trimmedName
      };
    });

    addPurchaseBill({
      billNumber,
      invoiceDate,
      dueDate,
      vendorId: targetVendorId,
      vendorName: vendorName.trim() || 'Authorized Supplier',
      items: finalizedItems,
      discountAmount,
      paidAmount: paymentStatus === 'PAID' ? calculatedGrandTotal : 0,
      paymentStatus,
      paymentMethod,
      receivedDate: new Date().toISOString().split('T')[0],
      notes
    });

    try {
      confetti({ particleCount: 50, spread: 70 });
    } catch {}

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
                  <FilePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Record Inward Purchase Bill</h2>
                  <p className="text-xs text-slate-500">Auto-updates drug stock inventory upon submission</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleAiScanButtonClick}
                  className="px-3.5 py-1.5 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-xs transition-all active:scale-95"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>AI Scan Bill / Upload</span>
                </button>

                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Hidden AI File Input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,application/pdf"
              capture="environment"
              onChange={handleFileSelected}
              className="hidden"
            />

            {/* AI Extraction Loading Overlay */}
            {isAiExtracting && (
              <div className="absolute inset-0 z-40 bg-white/90 backdrop-blur-xs flex flex-col items-center justify-center p-6 text-center space-y-4">
                <div className="relative">
                  <div className="w-16 h-16 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-center text-teal-700 shadow-lg">
                    <Sparkles className="w-8 h-8 animate-pulse" />
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-600 text-white flex items-center justify-center shadow-xs">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
                <div className="space-y-1 max-w-sm">
                  <h3 className="font-bold text-slate-900 text-sm">Google AI Extracting Purchase Bill...</h3>
                  <p className="text-xs text-slate-500">
                    Analyzing supplier name, invoice #, line items, batches, expiries, quantities, and GST rates.
                  </p>
                </div>
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-teal-50 border border-teal-200 text-teal-800 rounded-full text-[10px] font-bold">
                  <span>Powered by Gemini 2.5 Flash Free Tier</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* AI Success Banner */}
              {aiSuccessMessage && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{aiSuccessMessage}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAiSuccessMessage(null)}
                    className="text-emerald-700 hover:text-emerald-900 font-bold text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* AI Error Banner */}
              {aiError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold">{aiError}</span>
                  </div>
                  <button 
                    type="button" 
                    onClick={() => setAiError(null)}
                    className="text-rose-700 hover:text-rose-900 font-bold text-xs"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Quick AI Tip Callout */}
              <div className="p-3 bg-gradient-to-r from-teal-50/70 to-emerald-50/70 border border-teal-200/60 rounded-xl flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-teal-900">
                  <Sparkles className="w-4 h-4 text-teal-700 shrink-0" />
                  <span className="font-medium">
                    Tip: Snap a photo of physical wholesale bills or upload PDF invoices to autofill the entire form in seconds!
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleAiScanButtonClick}
                  className="px-2.5 py-1 bg-white border border-teal-300 hover:bg-teal-50 text-teal-800 rounded-lg font-bold text-[11px] shrink-0 shadow-2xs"
                >
                  Scan Photo
                </button>
              </div>

          {/* Supplier and Bill Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier / Vendor</label>
              <input
                type="text"
                list="vendor-datalist-options"
                value={vendorName}
                onChange={e => {
                  const val = e.target.value;
                  setVendorName(val);
                  const matched = vendors.find(v => v.name.toLowerCase() === val.toLowerCase());
                  if (matched) setVendorId(matched.id);
                }}
                placeholder="Supplier name"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium text-slate-800 focus:outline-none focus:border-teal-600"
              />
              <datalist id="vendor-datalist-options">
                {vendors.map(v => (
                  <option key={v.id} value={v.name} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice / Bill #</label>
              <input
                type="text"
                value={billNumber}
                onChange={e => setBillNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Invoice Date</label>
              <input
                type="date"
                value={invoiceDate}
                onChange={e => setInvoiceDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Due Date</label>
              <input
                type="date"
                value={dueDate}
                onChange={e => setDueDate(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>
          </div>

          {/* Line Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                Inward Items & Quantities ({items.length})
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="px-2.5 py-1 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg font-bold flex items-center gap-1 transition-colors"
                  title="Scan package barcode to auto-insert item row"
                >
                  <Barcode className="w-3.5 h-3.5" />
                  <span>Scan Barcode Line</span>
                </button>
                <button
                  type="button"
                  onClick={handleAddItem}
                  className="px-2.5 py-1 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-lg font-bold flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item Line</span>
                </button>
              </div>
            </div>

            <datalist id="medicine-datalist-options">
              {medicines.map(m => (
                <option key={m.id} value={m.name} />
              ))}
            </datalist>

            <div className="border border-slate-200 rounded-2xl overflow-x-auto shadow-2xs">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[170px]">Medicine / Item Name</th>
                    <th className="py-2.5 px-2">Batch #</th>
                    <th className="py-2.5 px-2">Expiry</th>
                    <th className="py-2.5 px-2 text-center">Qty</th>
                    <th className="py-2.5 px-2 text-center">Free</th>
                    <th className="py-2.5 px-2 text-right">Cost (₹)</th>
                    <th className="py-2.5 px-2 text-right">MRP (₹)</th>
                    <th className="py-2.5 px-2 text-center">GST%</th>
                    <th className="py-2.5 px-3 text-right">Total (₹)</th>
                    <th className="py-2.5 px-2 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <input
                          type="text"
                          list="medicine-datalist-options"
                          value={item.medicineName}
                          onChange={e => handleItemChange(idx, 'medicineName', e.target.value)}
                          placeholder="Medicine name"
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 text-xs focus:outline-none focus:border-teal-600"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                          className="w-20 px-1.5 py-1 bg-white border border-slate-200 rounded-lg font-mono text-slate-800 text-xs"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-28 px-1 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="any"
                          min="0.1"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="any"
                          min="0"
                          value={item.freeQuantity || 0}
                          onChange={e => handleItemChange(idx, 'freeQuantity', parseFloat(e.target.value) || 0)}
                          className="w-12 px-1 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.purchasePrice}
                          onChange={e => handleItemChange(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-right"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.01"
                          value={item.mrp || ''}
                          onChange={e => handleItemChange(idx, 'mrp', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-slate-700 text-right"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <select
                          value={item.gstRate}
                          onChange={e => handleItemChange(idx, 'gstRate', parseFloat(e.target.value) || 0)}
                          className="w-16 px-1 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-center text-xs"
                        >
                          <option value="0">0% (Nil)</option>
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                          <option value="28">28%</option>
                        </select>
                      </td>

                      <td className="py-2 px-3 font-bold text-slate-900 text-right whitespace-nowrap">
                        {formatCurrency(item.totalAmount)}
                      </td>

                      <td className="py-2 px-2 text-center">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition-colors"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Totals & Payment Config */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Status</label>
                  <select
                    value={paymentStatus}
                    onChange={e => setPaymentStatus(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="PAID">Paid in Full</option>
                    <option value="PARTIAL">Partially Paid</option>
                    <option value="UNPAID">Unpaid / On Credit</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Payment Method</label>
                  <select
                    value={paymentMethod}
                    onChange={e => setPaymentMethod(e.target.value as any)}
                    className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg font-medium"
                  >
                    <option value="Bank Transfer">Bank Transfer (NEFT/RTGS)</option>
                    <option value="Cheque">Cheque</option>
                    <option value="UPI">UPI Payment</option>
                    <option value="Cash">Cash</option>
                    <option value="Credit Note">Credit Note</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Bill Notes</label>
                <input
                  type="text"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Financial Summary calculation */}
            <div className="p-3 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal (Excl. Tax):</span>
                <span className="font-semibold text-slate-800">{formatCurrency(calculatedSubtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Total GST Tax:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(calculatedTax)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Special Discount (₹):</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 border border-slate-200 rounded text-right font-semibold"
                />
              </div>
              <div className="flex justify-between items-center text-slate-600">
                <span>Round Off (₹):</span>
                <input
                  type="number"
                  step="0.01"
                  value={roundOff || ''}
                  onChange={e => setRoundOff(parseFloat(e.target.value) || 0)}
                  placeholder="0.00"
                  className="w-24 px-2 py-0.5 border border-slate-200 rounded text-right font-semibold text-slate-700"
                />
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                <span className="font-bold text-slate-900 text-sm">Grand Invoiced Total:</span>
                <span className="font-extrabold text-teal-800 text-base">{formatCurrency(calculatedGrandTotal)}</span>
              </div>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save Invoice & Update Stock</span>
          </button>
        </div>
      </motion.div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicine={(med) => handleScannedInwardItem(med)}
        title="Scan Inward Package Barcode"
        subtitle="Point camera at arriving stock box to auto-insert a purchase invoice line"
        actionButtonLabel="Insert Inward Line"
      />

      {/* AI Studio API Key Prompt Modal */}
      <AnimatePresence>
        {isApiKeyPromptOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
              onClick={() => setIsApiKeyPromptOpen(false)}
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 p-6 z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-xl shadow-xs">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm">Setup Free AI Bill Scanner</h3>
                    <p className="text-[11px] text-slate-500">Google AI Studio Gemini API</p>
                  </div>
                </div>
                <button
                  onClick={() => setIsApiKeyPromptOpen(false)}
                  className="w-7 h-7 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="space-y-3 text-xs text-slate-600">
                <p className="leading-relaxed">
                  To automatically read invoices from photos, MediStock connects directly to your free Google AI Studio key.
                </p>

                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900 text-[11px]">
                  <div className="font-bold flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>100% Free Tier Limits:</span>
                  </div>
                  <p>• 1,500 bill scans / day (50–100x what any pharmacy needs)</p>
                  <p>• 15 scans / minute • 1,000,000 tokens/min • ₹0.00 cost</p>
                  <p>• Key remains private in your local browser only</p>
                </div>

                <form onSubmit={handleSaveKeyAndContinue} className="space-y-3 pt-1">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="font-bold text-slate-800">Paste Gemini API Key:</label>
                      <a
                        href="https://aistudio.google.com/app/apikey"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-700 hover:text-teal-800 font-bold inline-flex items-center gap-1 text-[11px] hover:underline"
                      >
                        <span>Get Free Key</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <input
                      type="password"
                      value={apiKeyInput}
                      onChange={e => setApiKeyInput(e.target.value)}
                      placeholder="AIzaSy..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                      autoFocus
                    />
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setIsApiKeyPromptOpen(false)}
                      className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold text-xs"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!apiKeyInput.trim()}
                      className="px-4 py-2 bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm flex items-center gap-1.5"
                    >
                      <span>Save & Choose Bill Photo</span>
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
      )}
    </AnimatePresence>
  );
};

export default AddPurchaseBillModal;
