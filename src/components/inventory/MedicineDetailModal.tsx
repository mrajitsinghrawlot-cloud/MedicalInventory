import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Pill, 
  MapPin, 
  Barcode, 
  Clock, 
  SlidersHorizontal,
  Scale,
  Building2,
  Check,
  AlertCircle,
  Sparkles,
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate, getExpiryStatusTag, getStockStatusTag } from '../../utils/formatters';

interface MedicineDetailModalProps {
  onClose: () => void;
  onOpenAdjustment: () => void;
  onOpenAddBill?: (vendorId?: string, medicineName?: string) => void;
}

export const MedicineDetailModal: React.FC<MedicineDetailModalProps> = ({
  onClose,
  onOpenAdjustment,
  onOpenAddBill
}) => {
  const { selectedMedicine, stockMovements, purchaseBills, vendors } = useInventory();
  const [activeTab, setActiveTab] = useState<'overview' | 'suppliers' | 'history'>('overview');

  const expiry = selectedMedicine ? getExpiryStatusTag(selectedMedicine.expiryDate) : null;
  const stock = selectedMedicine ? getStockStatusTag(selectedMedicine.stockQuantity, selectedMedicine.minStockThreshold) : null;
  const profitMargin = selectedMedicine ? (((selectedMedicine.mrp - selectedMedicine.purchasePrice) / selectedMedicine.purchasePrice) * 100) : 0;
  const totalValuation = selectedMedicine ? (selectedMedicine.stockQuantity * selectedMedicine.purchasePrice) : 0;

  const medicineMovements = selectedMedicine ? stockMovements.filter(m => m.medicineId === selectedMedicine.id) : [];

  // Cross-Vendor Quotes for this specific medicine
  const medicineQuotes = React.useMemo(() => {
    if (!selectedMedicine) return [];
    const quotesMap = new Map<string, {
      vendorName: string;
      vendorId: string;
      purchasePrice: number;
      mrp: number;
      lastDate: string;
      billNumber: string;
      batchNumber: string;
      expiryDate: string;
      quantity: number;
    }>();

    purchaseBills.forEach(b => {
      b.items.forEach(item => {
        const isMatch = item.medicineId === selectedMedicine.id || 
          (item.medicineName && item.medicineName.trim().toLowerCase() === selectedMedicine.name.trim().toLowerCase());
        if (isMatch) {
          const vKey = (b.vendorName || 'Supplier').trim().toLowerCase();
          const existing = quotesMap.get(vKey);
          if (!existing || new Date(b.invoiceDate) >= new Date(existing.lastDate)) {
            quotesMap.set(vKey, {
              vendorName: b.vendorName || 'Supplier',
              vendorId: b.vendorId || '',
              purchasePrice: item.purchasePrice || selectedMedicine.purchasePrice,
              mrp: item.mrp || selectedMedicine.mrp,
              lastDate: b.invoiceDate || '2026-09-01',
              billNumber: b.billNumber,
              batchNumber: item.batchNumber || selectedMedicine.batchNumber,
              expiryDate: item.expiryDate || selectedMedicine.expiryDate,
              quantity: (existing?.quantity || 0) + (item.quantity || 0)
            });
          }
        }
      });
    });

    if (quotesMap.size === 0) {
      quotesMap.set(selectedMedicine.manufacturer.toLowerCase(), {
        vendorName: selectedMedicine.manufacturer || 'Primary Distributor',
        vendorId: '',
        purchasePrice: selectedMedicine.purchasePrice,
        mrp: selectedMedicine.mrp,
        lastDate: selectedMedicine.lastUpdated || '2026-09-01',
        billNumber: 'Catalog',
        batchNumber: selectedMedicine.batchNumber,
        expiryDate: selectedMedicine.expiryDate,
        quantity: selectedMedicine.stockQuantity
      });
    }

    const list = Array.from(quotesMap.values()).sort((a, b) => a.purchasePrice - b.purchasePrice);
    const minPrice = list[0].purchasePrice;

    return list.map(q => ({
      ...q,
      isLowest: q.purchasePrice === minPrice,
      margin: Math.round(((q.mrp - q.purchasePrice) / q.mrp) * 1000) / 10,
      diffFromLowest: Math.round((q.purchasePrice - minPrice) * 100) / 100
    }));
  }, [selectedMedicine, purchaseBills]);

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

        {/* Tab Navigation */}
        <div className="px-6 pt-3 bg-slate-50 border-b border-slate-200 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'overview'
                ? 'border-teal-700 text-teal-800 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Overview & Specifications
          </button>
          <button
            onClick={() => setActiveTab('suppliers')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 flex items-center gap-1.5 ${
              activeTab === 'suppliers'
                ? 'border-teal-700 text-teal-800 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Supplier Price Compare ({medicineQuotes.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition-all border-b-2 ${
              activeTab === 'history'
                ? 'border-teal-700 text-teal-800 bg-white shadow-xs'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Stock Audit Log ({medicineMovements.length})
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6">
          {activeTab === 'overview' && (
            <>
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
            </>
          )}

          {/* TAB 2: Cross-Vendor Price Comparison */}
          {activeTab === 'suppliers' && (
            <div className="space-y-4">
              {/* Best Buy Recommendation Banner */}
              {medicineQuotes.length > 1 && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div className="flex items-start gap-2.5">
                    <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-emerald-900 text-sm">Best Buy Recommendation</h4>
                      <p className="text-emerald-800 mt-0.5">
                        Purchase from <strong>{medicineQuotes[0].vendorName}</strong> at <strong>{formatCurrency(medicineQuotes[0].purchasePrice)}</strong> per pack for maximum gross profit margin of <strong>{medicineQuotes[0].margin}%</strong>.
                      </p>
                    </div>
                  </div>

                  {onOpenAddBill && (
                    <button
                      onClick={() => {
                        onClose();
                        onOpenAddBill(medicineQuotes[0].vendorId, selectedMedicine.name);
                      }}
                      className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold text-xs shrink-0 shadow-2xs transition-all"
                    >
                      Order at {formatCurrency(medicineQuotes[0].purchasePrice)}
                    </button>
                  )}
                </div>
              )}

              {/* Vendor Quotes Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Supplier Name</th>
                      <th className="py-3 px-3">Purchase Rate</th>
                      <th className="py-3 px-3">Gross Margin</th>
                      <th className="py-3 px-3">Rate Difference</th>
                      <th className="py-3 px-3">Last Inward Date</th>
                      <th className="py-3 px-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {medicineQuotes.map((q, idx) => (
                      <tr 
                        key={`${q.vendorName}-${idx}`}
                        className={`hover:bg-slate-50/80 transition-colors ${
                          q.isLowest ? 'bg-emerald-50/40' : ''
                        }`}
                      >
                        <td className="py-3.5 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                              {q.vendorName.charAt(0)}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{q.vendorName}</span>
                                {q.isLowest && (
                                  <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-extrabold">
                                    🏆 Lowest Rate
                                  </span>
                                )}
                              </div>
                              <span className="text-[10px] text-slate-400">
                                Batch: {q.batchNumber} • Inward Qty: {q.quantity}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3 font-mono">
                          <span className={`text-sm font-extrabold ${
                            q.isLowest ? 'text-emerald-700' : 'text-slate-800'
                          }`}>
                            {formatCurrency(q.purchasePrice)}
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-bold text-slate-800">{q.margin}%</span>
                          <span className="text-[10px] text-slate-400 block">
                            +{formatCurrency(q.mrp - q.purchasePrice)}/pack
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          {q.isLowest ? (
                            <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              <Check className="w-3 h-3" />
                              Cheapest
                            </span>
                          ) : (
                            <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                              +{formatCurrency(q.diffFromLowest)} higher
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          <span className="font-medium">{formatDate(q.lastDate)}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">
                            {q.billNumber}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          {onOpenAddBill && (
                            <button
                              onClick={() => {
                                onClose();
                                onOpenAddBill(q.vendorId, selectedMedicine.name);
                              }}
                              className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition-all"
                            >
                              Add Bill
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: Recent Stock Movement Audit History */}
          {activeTab === 'history' && (
            <div className="space-y-2">
              <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-teal-700" />
                Stock Movement History for this Drug
              </h4>
              <div className="border border-slate-200 rounded-2xl overflow-hidden divide-y divide-slate-100 text-xs">
                {medicineMovements.length === 0 ? (
                  <div className="p-6 text-center text-slate-400 text-xs">
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
          )}
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
