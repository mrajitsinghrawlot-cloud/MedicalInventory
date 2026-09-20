import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  AlertTriangle, 
  ArrowDown, 
  ShieldAlert, 
  Check, 
  FileSpreadsheet,
  Building2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseBill } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface DeletePurchaseBillModalProps {
  bill: PurchaseBill | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
}

export const DeletePurchaseBillModal: React.FC<DeletePurchaseBillModalProps> = ({
  bill,
  isOpen,
  onClose,
  onDeleted
}) => {
  const { deletePurchaseBill, medicines } = useInventory();
  const [reason, setReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen || !bill) return null;

  const handleDelete = () => {
    setIsSubmitting(true);
    deletePurchaseBill(bill.id, reason.trim() || 'User requested bill deletion', 'Pharmacist Admin');
    setIsSubmitting(false);
    onDeleted?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-rose-50 border-b border-rose-100 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0">
                <Trash2 className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Delete Purchase Bill & Reverse Stock</h3>
                <p className="text-[11px] text-rose-700 font-medium">Automatic Stock Adjustment & Safe Archive</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white border border-slate-200 hover:bg-slate-100 text-slate-500 flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Body */}
          <div className="p-6 space-y-4 text-xs">
            {/* Warning Banner */}
            <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">What happens when you delete this bill?</p>
                <ul className="list-disc list-inside space-y-0.5 text-amber-800 text-[11px]">
                  <li><strong>Inventory Stock will automatically be deducted backwards</strong> for all medicines in this bill.</li>
                  <li>Supplier balance due & purchases will automatically be adjusted.</li>
                  <li>The invoice is safely moved to the <strong>Super Admin Recycle Bin</strong> (can be recovered anytime).</li>
                </ul>
              </div>
            </div>

            {/* Bill Summary */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Invoice #{bill.billNumber}</span>
                <span className="font-mono text-teal-800">{formatCurrency(bill.grandTotal)}</span>
              </div>
              <div className="flex justify-between text-slate-500 text-[11px]">
                <span>Supplier: {bill.vendorName}</span>
                <span>Date: {formatDate(bill.invoiceDate)}</span>
              </div>
            </div>

            {/* Affected Medicine Quantities */}
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Stock Deductions to be Applied ({bill.items.length} Medicines):
              </label>
              <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                {bill.items.map((item, idx) => {
                  const qty = (item.quantity || 0) + (item.freeQuantity || 0);
                  const med = medicines.find(m => m.id === item.medicineId || m.name.toLowerCase() === item.medicineName.toLowerCase());
                  const currentStock = med?.stockQuantity ?? 0;
                  const newStock = Math.max(0, currentStock - qty);

                  return (
                    <div key={idx} className="p-2.5 flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-slate-800">{item.medicineName}</div>
                        <div className="text-[10px] text-slate-400">Current Stock: {currentStock} units</div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded text-[11px]">
                          -{qty} units
                        </span>
                        <div className="text-[10px] text-slate-500 mt-0.5">New: {newStock} units</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Reason Input */}
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Reason for Deletion (Optional):
              </label>
              <input
                type="text"
                value={reason}
                onChange={e => setReason(e.target.value)}
                placeholder="e.g. Duplicate entry, Supplier cancelled shipment"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-rose-500"
              />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
            >
              Cancel
            </button>

            <button
              onClick={handleDelete}
              disabled={isSubmitting}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition-all active:scale-95 flex items-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Confirm Delete & Deduct Stock</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
