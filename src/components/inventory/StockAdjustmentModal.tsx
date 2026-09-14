import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, SlidersHorizontal, ArrowDownLeft, ArrowUpRight, Trash2, Check, AlertCircle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Medicine, MovementType } from '../../types/inventory';
import confetti from 'canvas-confetti';

interface StockAdjustmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  preselectedMedicine?: Medicine | null;
}

export const StockAdjustmentModal: React.FC<StockAdjustmentModalProps> = ({
  isOpen,
  onClose,
  preselectedMedicine
}) => {
  const { medicines, adjustStock } = useInventory();

  const [selectedMedId, setSelectedMedId] = useState<string>(preselectedMedicine?.id || (medicines[0]?.id || ''));
  const [adjustmentType, setAdjustmentType] = useState<MovementType>('OUT');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('Physical stock audit reconciliation');
  const [performedBy, setPerformedBy] = useState<string>('Dr. Arjun (Chief Pharmacist)');
  const [error, setError] = useState<string>('');

  const currentMed = medicines.find(m => m.id === selectedMedId);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!currentMed) {
      setError('Please select a valid medicine');
      return;
    }

    if (quantity <= 0) {
      setError('Quantity must be greater than 0');
      return;
    }

    if ((adjustmentType === 'OUT' || adjustmentType === 'DISPOSAL' || adjustmentType === 'RETURN') && quantity > currentMed.stockQuantity) {
      setError(`Cannot deduct ${quantity} units. Current available stock is only ${currentMed.stockQuantity} units.`);
      return;
    }

    const delta = (adjustmentType === 'IN' || adjustmentType === 'PURCHASE') ? quantity : -quantity;
    adjustStock(currentMed.id, delta, adjustmentType, reason, performedBy);

    try {
      confetti({ particleCount: 30, spread: 50, origin: { y: 0.7 } });
    } catch {}

    onClose();
  };

  const calculatedNewStock = currentMed ? (
    (adjustmentType === 'IN' || adjustmentType === 'PURCHASE')
      ? currentMed.stockQuantity + (quantity || 0)
      : currentMed.stockQuantity - (quantity || 0)
  ) : 0;

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
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-sm">
                  <SlidersHorizontal className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Stock Adjustment & Audit</h2>
                  <p className="text-xs text-slate-500">Record stock addition, write-off, or correction</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Select Medicine */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Select Medicine SKU</label>
            <select
              value={selectedMedId}
              onChange={e => setSelectedMedId(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
            >
              {medicines.map(m => (
                <option key={m.id} value={m.id}>
                  {m.name} (Current: {m.stockQuantity} units) — Batch: {m.batchNumber}
                </option>
              ))}
            </select>
          </div>

          {/* Current Stock Preview Card */}
          {currentMed && (
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Current Stock</span>
                <span className="text-base font-bold text-slate-900">{currentMed.stockQuantity} units</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-400 font-semibold block uppercase">Post-Adjustment Stock</span>
                <span className="text-base font-extrabold text-teal-700">{calculatedNewStock} units</span>
              </div>
            </div>
          )}

          {/* Adjustment Operation Type */}
          <div>
            <label className="block font-bold text-slate-700 mb-1.5">Adjustment Action Type</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setAdjustmentType('IN')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustmentType === 'IN' 
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 shadow-2xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowDownLeft className="w-3.5 h-3.5" />
                <span>Stock In (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('OUT')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustmentType === 'OUT' 
                    ? 'bg-blue-50 text-blue-700 border-blue-300 shadow-2xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ArrowUpRight className="w-3.5 h-3.5" />
                <span>Stock Out (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setAdjustmentType('DISPOSAL')}
                className={`py-2 px-3 rounded-xl font-bold flex items-center justify-center gap-1.5 border transition-all ${
                  adjustmentType === 'DISPOSAL' 
                    ? 'bg-rose-50 text-rose-700 border-rose-300 shadow-2xs' 
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Disposal (-)</span>
              </button>
            </div>
          </div>

          {/* Quantity Input */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">
              Quantity to Adjust (Units)
            </label>
            <input
              type="number"
              min="1"
              max={adjustmentType !== 'IN' ? currentMed?.stockQuantity : undefined}
              value={quantity}
              onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Reason / Reference */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Reason for Audit Log</label>
            <input
              type="text"
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="e.g. Broken vial during transit, Expired batch discard, Stock audit recount"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            />
          </div>

          {/* Performed by */}
          <div>
            <label className="block font-bold text-slate-700 mb-1">Logged By Staff Member</label>
            <input
              type="text"
              value={performedBy}
              onChange={e => setPerformedBy(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600"
            />
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Confirm & Update Balance</span>
          </button>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
