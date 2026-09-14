import React, { useState } from 'react';
import { 
  AlertTriangle, 
  TrendingDown, 
  Trash2, 
  CornerUpLeft, 
  ShoppingBag, 
  CheckCircle2, 
  Calendar, 
  SlidersHorizontal,
  Pill
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Medicine } from '../../types/inventory';
import { formatCurrency, formatDate, getDaysUntilExpiry, getExpiryStatusTag } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface AlertsCenterProps {
  initialTab?: 'all' | 'expiry' | 'low-stock';
  onOpenAddBill: () => void;
  onOpenAdjustment: (med?: Medicine) => void;
}

export const AlertsCenter: React.FC<AlertsCenterProps> = ({
  initialTab = 'all',
  onOpenAddBill,
  onOpenAdjustment
}) => {
  const { 
    medicines, 
    vendors, 
    disposeExpiredItem, 
    returnToVendor, 
    navigate 
  } = useInventory();

  const [activeFilter, setActiveFilter] = useState<'all' | 'expired' | '30d' | '90d' | 'low-stock'>(
    initialTab === 'expiry' ? 'expired' : initialTab === 'low-stock' ? 'low-stock' : 'all'
  );

  const [returnModalMed, setReturnModalMed] = useState<Medicine | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string>(vendors[0]?.id || '');
  const [returnQty, setReturnQty] = useState<number>(1);
  const [returnReason, setReturnReason] = useState<string>('Near-expiry stock return for credit note');

  // Compute all alert categories
  const expiredItems = medicines.filter(m => getDaysUntilExpiry(m.expiryDate) < 0);
  const expiring30dItems = medicines.filter(m => {
    const d = getDaysUntilExpiry(m.expiryDate);
    return d >= 0 && d <= 30;
  });
  const expiring90dItems = medicines.filter(m => {
    const d = getDaysUntilExpiry(m.expiryDate);
    return d > 30 && d <= 90;
  });
  const lowStockItems = medicines.filter(m => m.stockQuantity <= m.minStockThreshold);

  const getFilteredItems = () => {
    switch (activeFilter) {
      case 'expired': return expiredItems;
      case '30d': return expiring30dItems;
      case '90d': return expiring90dItems;
      case 'low-stock': return lowStockItems;
      default:
        // All urgent alerts combined (deduplicated)
        const combined = new Map<string, Medicine>();
        [...expiredItems, ...expiring30dItems, ...lowStockItems, ...expiring90dItems].forEach(m => {
          combined.set(m.id, m);
        });
        return Array.from(combined.values());
    }
  };

  const displayedItems = getFilteredItems();

  const handleDispose = (med: Medicine) => {
    if (confirm(`Quarantine and dispose all ${med.stockQuantity} units of expired ${med.name}?`)) {
      disposeExpiredItem(med.id, med.stockQuantity, 'Expired batch isolated and safely incinerated');
      try {
        confetti({ particleCount: 30, spread: 50 });
      } catch {}
    }
  };

  const handleConfirmReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!returnModalMed) return;

    returnToVendor(returnModalMed.id, selectedVendorId, returnQty, returnReason);
    try {
      confetti({ particleCount: 40, spread: 60 });
    } catch {}
    setReturnModalMed(null);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Summary */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-slate-900">Alerts & Expiry Action Center</h2>
            <span className="px-2 py-0.5 bg-rose-100 text-rose-800 text-xs font-bold rounded-full">
              {expiredItems.length + expiring30dItems.length + lowStockItems.length} Urgent Actions
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Proactively manage expired stocks, quarantine batches, return to suppliers, and auto-reorder depleted medicines.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAddBill}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Generate Reorder Bill</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-100/80 rounded-2xl">
        <button
          onClick={() => setActiveFilter('all')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
            activeFilter === 'all' ? 'bg-white text-slate-900 shadow-2xs' : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          All Urgent Alerts ({expiredItems.length + expiring30dItems.length + lowStockItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('expired')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'expired' ? 'bg-red-600 text-white shadow-2xs' : 'text-red-700 hover:bg-red-50'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-red-300" />
          Expired Batches ({expiredItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('30d')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === '30d' ? 'bg-rose-600 text-white shadow-2xs' : 'text-rose-700 hover:bg-rose-50'
          }`}
        >
          Expiring in &lt;30 Days ({expiring30dItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('90d')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === '90d' ? 'bg-amber-600 text-white shadow-2xs' : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          Expiring in 31-90 Days ({expiring90dItems.length})
        </button>
        <button
          onClick={() => setActiveFilter('low-stock')}
          className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeFilter === 'low-stock' ? 'bg-amber-500 text-white shadow-2xs' : 'text-amber-700 hover:bg-amber-50'
          }`}
        >
          <TrendingDown className="w-3.5 h-3.5" />
          Low Stock Reorder ({lowStockItems.length})
        </button>
      </div>

      {/* Items List */}
      <div className="space-y-3">
        {displayedItems.length === 0 ? (
          <div className="bg-white p-12 rounded-3xl border border-slate-200 text-center">
            <CheckCircle2 className="w-12 h-12 text-emerald-500 mx-auto mb-3 opacity-80" />
            <h3 className="font-bold text-slate-800 text-base">No active alerts under this filter!</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              All batches are within valid shelf life and stock balances meet safety thresholds.
            </p>
          </div>
        ) : (
          displayedItems.map(med => {
            const expiry = getExpiryStatusTag(med.expiryDate);
            const days = getDaysUntilExpiry(med.expiryDate);
            const isExp = days < 0;
            const isLow = med.stockQuantity <= med.minStockThreshold;

            return (
              <div
                key={med.id}
                className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                {/* Left Info */}
                <div className="flex items-start gap-3.5 min-w-0">
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 border ${
                    isExp ? 'bg-red-50 text-red-600 border-red-200' : isLow ? 'bg-amber-50 text-amber-600 border-amber-200' : 'bg-rose-50 text-rose-600 border-rose-200'
                  }`}>
                    {isExp ? <AlertTriangle className="w-5 h-5" /> : isLow ? <TrendingDown className="w-5 h-5" /> : <Calendar className="w-5 h-5" />}
                  </div>

                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 text-sm">{med.name}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${expiry.color}`}>
                        {expiry.label}
                      </span>
                      {isLow && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                          Low Stock ({med.stockQuantity} / {med.minStockThreshold})
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-slate-500 mt-0.5 truncate">{med.genericName}</p>

                    <div className="flex flex-wrap items-center gap-3 mt-1 text-[11px] text-slate-400">
                      <span>Batch: <strong className="text-slate-700 font-mono">{med.batchNumber}</strong></span>
                      <span>•</span>
                      <span>Expiry: <strong className="text-slate-700">{formatDate(med.expiryDate)}</strong></span>
                      <span>•</span>
                      <span>Location: <strong className="text-slate-700 font-mono">{med.rackLocation}</strong></span>
                      <span>•</span>
                      <span>Valuation: <strong className="text-teal-800">{formatCurrency(med.stockQuantity * med.purchasePrice)}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Right Action Buttons */}
                <div className="flex flex-wrap items-center gap-2 self-end md:self-center shrink-0">
                  {isExp && med.stockQuantity > 0 && (
                    <>
                      <button
                        onClick={() => handleDispose(med)}
                        className="px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-700 border border-red-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Dispose ({med.stockQuantity})</span>
                      </button>

                      <button
                        onClick={() => {
                          setReturnModalMed(med);
                          setReturnQty(med.stockQuantity);
                        }}
                        className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                      >
                        <CornerUpLeft className="w-3.5 h-3.5" />
                        <span>Return to Vendor</span>
                      </button>
                    </>
                  )}

                  {!isExp && days <= 60 && med.stockQuantity > 0 && (
                    <button
                      onClick={() => {
                        setReturnModalMed(med);
                        setReturnQty(Math.min(med.stockQuantity, 10));
                      }}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <CornerUpLeft className="w-3.5 h-3.5" />
                      <span>Vendor Return</span>
                    </button>
                  )}

                  {isLow && (
                    <button
                      onClick={onOpenAddBill}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-xs font-bold transition-colors flex items-center gap-1"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Create Inward Bill</span>
                    </button>
                  )}

                  <button
                    onClick={() => onOpenAdjustment(med)}
                    className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                    title="Manual Stock Adjustment"
                  >
                    <SlidersHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Vendor Return Modal */}
      {returnModalMed && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={() => setReturnModalMed(null)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 z-10 space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CornerUpLeft className="w-5 h-5 text-teal-700" />
              Return Stock to Supplier
            </h3>
            <p className="text-xs text-slate-500">
              Returning <strong>{returnModalMed.name}</strong> (Batch: {returnModalMed.batchNumber})
            </p>

            <form onSubmit={handleConfirmReturn} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Select Supplier</label>
                <select
                  value={selectedVendorId}
                  onChange={e => setSelectedVendorId(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:border-teal-600"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.name} ({v.city})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Quantity to Return (Max: {returnModalMed.stockQuantity})
                </label>
                <input
                  type="number"
                  min="1"
                  max={returnModalMed.stockQuantity}
                  value={returnQty}
                  onChange={e => setReturnQty(Math.min(returnModalMed.stockQuantity, Math.max(1, parseInt(e.target.value, 10) || 1)))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Return Memo / Reason</label>
                <input
                  type="text"
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500">
                A debit credit note of <strong>{formatCurrency(returnQty * returnModalMed.purchasePrice)}</strong> will be credited to vendor balance.
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setReturnModalMed(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Confirm Return
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
