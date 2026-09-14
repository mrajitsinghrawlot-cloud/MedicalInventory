import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Plus, Trash2, FilePlus, Sparkles, Check, AlertCircle, Barcode } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseBillItem, Medicine } from '../../types/inventory';
import { formatCurrency } from '../../utils/formatters';
import { BarcodeScannerModal } from '../inventory/BarcodeScannerModal';
import confetti from 'canvas-confetti';

interface AddPurchaseBillModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddPurchaseBillModal: React.FC<AddPurchaseBillModalProps> = ({
  isOpen,
  onClose
}) => {
  const { medicines, vendors, addPurchaseBill } = useInventory();

  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [billNumber, setBillNumber] = useState(`PB-2026-${Math.floor(100 + Math.random() * 900)}`);
  const [invoiceDate, setInvoiceDate] = useState(new Date().toISOString().split('T')[0]);
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().split('T')[0];
  });
  const [vendorId, setVendorId] = useState(vendors[0]?.id || '');
  const [paymentStatus, setPaymentStatus] = useState<'PAID' | 'PARTIAL' | 'UNPAID'>('PAID');
  const [paymentMethod, setPaymentMethod] = useState<'Bank Transfer' | 'Cheque' | 'Cash' | 'UPI' | 'Credit Note'>('Bank Transfer');
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [notes, setNotes] = useState('Stock verified & batch cold-chain inspected upon receipt');

  const [items, setItems] = useState<PurchaseBillItem[]>([
    {
      medicineId: medicines[0]?.id || '',
      medicineName: medicines[0]?.name || '',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '2027-12-31',
      quantity: 50,
      freeQuantity: 0,
      purchasePrice: medicines[0]?.purchasePrice || 100,
      mrp: medicines[0]?.mrp || 150,
      gstRate: 12,
      taxAmount: 600,
      totalAmount: 5600
    }
  ]);

  const [error, setError] = useState('');

  const handleItemChange = (index: number, field: keyof PurchaseBillItem, val: any) => {
    setItems(prev => {
      const updated = [...prev];
      const item = { ...updated[index], [field]: val };

      // If medicine changed, auto-fill base price and name
      if (field === 'medicineId') {
        const med = medicines.find(m => m.id === val);
        if (med) {
          item.medicineName = med.name;
          item.purchasePrice = med.purchasePrice;
          item.mrp = med.mrp;
          item.batchNumber = med.batchNumber;
          item.expiryDate = med.expiryDate;
          item.gstRate = med.gstRate ?? 12;
        }
      }

      // Recompute tax and total
      const baseTotal = (item.quantity || 0) * (item.purchasePrice || 0);
      const taxRate = item.gstRate || 0;
      item.taxAmount = (baseTotal * taxRate) / 100;
      item.totalAmount = baseTotal + item.taxAmount;

      updated[index] = item;
      return updated;
    });
  };

  const handleAddItem = () => {
    const firstMed = medicines[0];
    const newItem: PurchaseBillItem = {
      medicineId: firstMed?.id || '',
      medicineName: firstMed?.name || 'Selected Medicine',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      expiryDate: '2027-12-31',
      quantity: 10,
      freeQuantity: 0,
      purchasePrice: firstMed?.purchasePrice || 50,
      mrp: firstMed?.mrp || 80,
      gstRate: 12,
      taxAmount: 60,
      totalAmount: 560
    };
    setItems(prev => [...prev, newItem]);
  };

  const handleScannedInwardItem = (scannedMed: Medicine) => {
    const effectiveGstRate = scannedMed.gstRate ?? 12;
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
      taxAmount: (20 * scannedMed.purchasePrice * effectiveGstRate) / 100,
      totalAmount: (20 * scannedMed.purchasePrice) * (1 + effectiveGstRate / 100)
    };
    setItems(prev => [...prev, newItem]);
    setIsScannerOpen(false);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(prev => prev.filter((_, i) => i !== index));
    }
  };

  const calculatedSubtotal = items.reduce((acc, i) => acc + (i.quantity * i.purchasePrice), 0);
  const calculatedTax = items.reduce((acc, i) => acc + i.taxAmount, 0);
  const calculatedGrandTotal = Math.max(0, calculatedSubtotal + calculatedTax - discountAmount);

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

    const vendor = vendors.find(v => v.id === vendorId);

    addPurchaseBill({
      billNumber,
      invoiceDate,
      dueDate,
      vendorId,
      vendorName: vendor?.name || 'Authorized Supplier',
      items,
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

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-5 text-xs">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

          {/* Supplier and Bill Meta */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier / Vendor</label>
              <select
                value={vendorId}
                onChange={e => setVendorId(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-600"
              >
                {vendors.map(v => (
                  <option key={v.id} value={v.id}>{v.name}</option>
                ))}
              </select>
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

            <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                  <tr>
                    <th className="py-2.5 px-3">Medicine SKU</th>
                    <th className="py-2.5 px-3">Batch #</th>
                    <th className="py-2.5 px-3">Expiry</th>
                    <th className="py-2.5 px-2">Qty</th>
                    <th className="py-2.5 px-2">Free</th>
                    <th className="py-2.5 px-2">Cost (₹)</th>
                    <th className="py-2.5 px-2">GST%</th>
                    <th className="py-2.5 px-3">Total (₹)</th>
                    <th className="py-2.5 px-2 text-right"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="py-2 px-3">
                        <select
                          value={item.medicineId}
                          onChange={e => handleItemChange(idx, 'medicineId', e.target.value)}
                          className="w-full px-2 py-1 bg-white border border-slate-200 rounded-lg font-medium text-slate-800 max-w-[180px]"
                        >
                          {medicines.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                          ))}
                        </select>
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="text"
                          value={item.batchNumber}
                          onChange={e => handleItemChange(idx, 'batchNumber', e.target.value)}
                          className="w-24 px-2 py-1 bg-white border border-slate-200 rounded-lg font-mono text-slate-800"
                        />
                      </td>

                      <td className="py-2 px-3">
                        <input
                          type="date"
                          value={item.expiryDate}
                          onChange={e => handleItemChange(idx, 'expiryDate', e.target.value)}
                          className="w-28 px-1.5 py-1 bg-white border border-slate-200 rounded-lg text-[11px] text-slate-800"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="1"
                          value={item.quantity}
                          onChange={e => handleItemChange(idx, 'quantity', parseInt(e.target.value, 10) || 1)}
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg font-bold text-slate-800 text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          min="0"
                          value={item.freeQuantity || 0}
                          onChange={e => handleItemChange(idx, 'freeQuantity', parseInt(e.target.value, 10) || 0)}
                          className="w-12 px-1 py-1 bg-white border border-slate-200 rounded-lg text-slate-600 text-center"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <input
                          type="number"
                          step="0.1"
                          value={item.purchasePrice}
                          onChange={e => handleItemChange(idx, 'purchasePrice', parseFloat(e.target.value) || 0)}
                          className="w-16 px-2 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-right"
                        />
                      </td>

                      <td className="py-2 px-2">
                        <select
                          value={item.gstRate}
                          onChange={e => handleItemChange(idx, 'gstRate', parseInt(e.target.value, 10) || 12)}
                          className="w-14 px-1 py-1 bg-white border border-slate-200 rounded-lg text-slate-800 text-center"
                        >
                          <option value="5">5%</option>
                          <option value="12">12%</option>
                          <option value="18">18%</option>
                        </select>
                      </td>

                      <td className="py-2 px-3 font-bold text-slate-900">
                        {formatCurrency(item.totalAmount)}
                      </td>

                      <td className="py-2 px-2 text-right">
                        {items.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-400 hover:text-rose-600"
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
                  value={discountAmount || ''}
                  onChange={e => setDiscountAmount(parseFloat(e.target.value) || 0)}
                  className="w-24 px-2 py-0.5 border border-slate-200 rounded text-right font-semibold"
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
    </div>
      )}
    </AnimatePresence>
  );
};
