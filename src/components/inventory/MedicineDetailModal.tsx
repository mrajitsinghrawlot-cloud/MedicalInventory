import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Pill, 
  MapPin, 
  Barcode, 
  Clock, 
  SlidersHorizontal
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate, getExpiryStatusTag, getStockStatusTag } from '../../utils/formatters';

interface MedicineDetailModalProps {
  onClose: () => void;
  onOpenAdjustment: () => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  onClose,
  onOpenAdjustment
}) => {
  const { selectedMedicine, stockMovements } = useInventory();

  const expiry = selectedMedicine ? getExpiryStatusTag(selectedMedicine.expiryDate) : null;
  const stock = selectedMedicine ? getStockStatusTag(selectedMedicine.stockQuantity, selectedMedicine.minStockThreshold) : null;
  const profitMargin = selectedMedicine ? (((selectedMedicine.mrp - selectedMedicine.purchasePrice) / selectedMedicine.purchasePrice) * 100) : 0;
  const totalValuation = selectedMedicine ? (selectedMedicine.stockQuantity * selectedMedicine.purchasePrice) : 0;

  const medicineMovements = selectedMedicine ? stockMovements.filter(m => m.medicineId === selectedMedicine.id) : [];

  return (
    <AnimatePresence>
      {selectedMedicine && expiry && stock && (
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
            className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-start justify-between">
              <div className="flex items-start gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                  <Pill className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">{selectedMedicine.name}</h2>
                <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${expiry.color}`}>
                  {expiry.status}
                </span>
              </div>
              <p className="text-xs text-slate-500 font-medium mt-0.5">{selectedMedicine.genericName}</p>
              <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                <span>{selectedMedicine.category}</span>
                <span>•</span>
                <span>{selectedMedicine.form} ({selectedMedicine.strength})</span>
                <span>•</span>
                <span>Mfg: {selectedMedicine.manufacturer}</span>
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Key Metrics Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Current Stock</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className={`w-2.5 h-2.5 rounded-full ${stock.indicator}`} />
                <span className="text-xl font-extrabold text-slate-900">{selectedMedicine.stockQuantity}</span>
                <span className="text-xs text-slate-500">units</span>
              </div>
              <span className="text-[10px] text-slate-400">Min safe level: {selectedMedicine.minStockThreshold}</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Total Valuation</span>
              <div className="text-xl font-extrabold text-teal-800 mt-1">
                {formatCurrency(totalValuation)}
              </div>
              <span className="text-[10px] text-slate-400">Cost: {formatCurrency(selectedMedicine.purchasePrice)}/unit</span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Retail MRP</span>
              <div className="text-xl font-extrabold text-slate-900 mt-1">
                {formatCurrency(selectedMedicine.mrp)}
              </div>
              <span className="text-[10px] text-emerald-600 font-semibold">
                +{profitMargin.toFixed(1)}% Margin
              </span>
            </div>

            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[11px] text-slate-400 font-semibold block uppercase">Batch Expiry</span>
              <div className="text-sm font-bold text-slate-800 mt-1">
                {formatDate(selectedMedicine.expiryDate)}
              </div>
              <span className={`text-[10px] font-bold ${expiry.isExpired ? 'text-red-600' : 'text-slate-500'}`}>
                {expiry.label}
              </span>
            </div>
          </div>

          {/* Detailed Specs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2.5">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <Barcode className="w-4 h-4 text-teal-700" />
                Batch & Classification Details
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Batch Number</span>
                <span className="font-mono font-bold text-slate-800">{selectedMedicine.batchNumber}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Barcode / GTIN</span>
                <span className="font-mono font-semibold text-slate-800">{selectedMedicine.barcode}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Schedule Type</span>
                <span className="font-semibold text-rose-700">{selectedMedicine.scheduleType}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-slate-400">GST Rate / HSN</span>
                <span className="font-medium text-slate-800">{selectedMedicine.gstRate || 12}% • {selectedMedicine.hsnCode || '3004'}</span>
              </div>
            </div>

            <div className="p-4 bg-white rounded-2xl border border-slate-200/80 space-y-2.5">
              <h4 className="font-bold text-slate-800 border-b border-slate-100 pb-1.5 flex items-center gap-1.5">
                <MapPin className="w-4 h-4 text-teal-700" />
                Storage & Handling Instructions
              </h4>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Physical Location</span>
                <span className="font-mono font-semibold text-slate-800">{selectedMedicine.rackLocation}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-400">Prescription Required</span>
                <span className="font-semibold text-slate-800">{selectedMedicine.requiresPrescription ? 'Yes (Doctor Rx)' : 'No (OTC)'}</span>
              </div>
              <div className="py-1">
                <span className="text-slate-400 block mb-1">Storage Notes:</span>
                <p className="text-slate-700 bg-slate-50 p-2 rounded-lg font-normal">
                  {selectedMedicine.notes || 'Standard dry room temperature storage away from direct sunlight.'}
                </p>
              </div>
            </div>
          </div>

          {/* Barcode Mock Rendering */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-center flex flex-col items-center">
            <span className="text-[11px] text-slate-400 font-semibold mb-2 uppercase tracking-wider">Item Barcode (EAN-13)</span>
            <div className="bg-white p-3 rounded-xl border border-slate-200 inline-block shadow-2xs">
              <div className="flex gap-1 items-center h-12 px-4 justify-center">
                {selectedMedicine.barcode.split('').map((char, i) => (
                  <div
                    key={i}
                    className="bg-black"
                    style={{
                      width: `${(parseInt(char, 10) % 3) + 1.5}px`,
                      height: i % 4 === 0 ? '44px' : '36px'
                    }}
                  />
                ))}
              </div>
              <div className="text-xs font-mono tracking-widest text-slate-800 mt-1 font-bold">
                {selectedMedicine.barcode}
              </div>
            </div>
          </div>

          {/* Recent Stock Movement Audit History */}
          <div className="space-y-2">
            <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-teal-700" />
              Stock Movement History for this Drug
            </h4>
            <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
              {medicineMovements.length === 0 ? (
                <div className="p-4 text-center text-slate-400 text-xs">
                  No movement records found for this specific medicine.
                </div>
              ) : (
                medicineMovements.map(m => (
                  <div key={m.id} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors">
                    <div>
                      <div className="font-semibold text-slate-800">{m.reason}</div>
                      <div className="text-[11px] text-slate-400">
                        {new Date(m.date).toLocaleDateString()} • {m.performedBy}
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`font-bold ${m.quantity > 0 ? 'text-emerald-600' : 'text-slate-700'}`}>
                        {m.quantity > 0 ? `+${m.quantity}` : m.quantity} units
                      </span>
                      <div className="text-[10px] text-slate-400">
                        Balance: {m.newStock}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            Close Window
          </button>
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenAdjustment();
              }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Make Stock Adjustment</span>
            </button>
          </div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
