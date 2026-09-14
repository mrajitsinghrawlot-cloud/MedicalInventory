import React, { useState } from 'react';
import { 
  History, 
  Download, 
  Search, 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCcw, 
  Trash2, 
  ShoppingBag,
  SlidersHorizontal
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { MovementType } from '../../types/inventory';
import { formatDateTime } from '../../utils/formatters';
import { exportMovementsToCSV } from '../../utils/exportUtils';

interface StockMovementsListProps {
  onOpenAdjustment: () => void;
}

export const StockMovementsList: React.FC<StockMovementsListProps> = ({ onOpenAdjustment }) => {
  const { stockMovements } = useInventory();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filtered = stockMovements.filter(m => {
    const matchesSearch = 
      m.medicineName.toLowerCase().includes(search.toLowerCase()) ||
      m.reason.toLowerCase().includes(search.toLowerCase()) ||
      m.performedBy.toLowerCase().includes(search.toLowerCase());

    const matchesType = typeFilter === 'ALL' || m.type === typeFilter;
    return matchesSearch && matchesType;
  });

  const getBadge = (type: MovementType) => {
    switch (type) {
      case 'PURCHASE':
        return { label: 'Inward Purchase', color: 'bg-teal-50 text-teal-700 border-teal-200' };
      case 'IN':
        return { label: 'Stock In', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' };
      case 'OUT':
        return { label: 'Dispense Out', color: 'bg-blue-50 text-blue-700 border-blue-200' };
      case 'ADJUSTMENT':
        return { label: 'Audit Adjust', color: 'bg-amber-50 text-amber-700 border-amber-200' };
      case 'RETURN':
        return { label: 'Vendor Return', color: 'bg-purple-50 text-purple-700 border-purple-200' };
      case 'DISPOSAL':
        return { label: 'Expired Disposal', color: 'bg-rose-50 text-rose-700 border-rose-200' };
      default:
        return { label: type, color: 'bg-slate-50 text-slate-700 border-slate-200' };
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Audit Trail & Stock Logs</h2>
          <p className="text-xs text-slate-500">Immutable ledger of pharmaceutical dispatches, receipts, and waste disposals</p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => exportMovementsToCSV(filtered)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export Audit CSV</span>
          </button>
          <button
            onClick={onOpenAdjustment}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>New Adjustment</span>
          </button>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by drug name, reason, or staff member..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>

        <select
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-none focus:border-teal-600 shrink-0 self-end sm:self-auto"
        >
          <option value="ALL">All Movement Types</option>
          <option value="PURCHASE">Purchase Inward</option>
          <option value="IN">Stock In</option>
          <option value="OUT">Dispense Out</option>
          <option value="ADJUSTMENT">Audit Adjustments</option>
          <option value="RETURN">Vendor Returns</option>
          <option value="DISPOSAL">Disposals</option>
        </select>
      </div>

      {/* Audit Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Date & Time</th>
                <th className="py-3.5 px-4">Medicine SKU</th>
                <th className="py-3.5 px-4">Type</th>
                <th className="py-3.5 px-4">Quantity Change</th>
                <th className="py-3.5 px-4">Stock (Before → After)</th>
                <th className="py-3.5 px-4">Reason / Reference</th>
                <th className="py-3.5 px-4">Logged By</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <History className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No stock movements found</p>
                  </td>
                </tr>
              ) : (
                filtered.map(mov => {
                  const badge = getBadge(mov.type);

                  return (
                    <tr key={mov.id} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">
                        {formatDateTime(mov.date)}
                      </td>

                      <td className="py-3 px-4 font-bold text-slate-900">
                        {mov.medicineName}
                      </td>

                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3 px-4 font-extrabold text-sm">
                        <span className={mov.quantity > 0 ? 'text-emerald-600' : 'text-slate-800'}>
                          {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} units
                        </span>
                      </td>

                      <td className="py-3 px-4 text-slate-700 font-mono">
                        {mov.previousStock} → <strong className="text-slate-900">{mov.newStock}</strong>
                      </td>

                      <td className="py-3 px-4 text-slate-700 max-w-xs truncate">
                        {mov.reason}
                      </td>

                      <td className="py-3 px-4 text-slate-500 font-medium">
                        {mov.performedBy}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
