import React from 'react';
import { 
  ArrowDownLeft, 
  ArrowUpRight, 
  RefreshCcw, 
  Trash2, 
  ShoppingBag,
  Clock
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatDateTime } from '../../utils/formatters';

export const RecentActivityList: React.FC = () => {
  const { stockMovements, navigate } = useInventory();

  const recent = stockMovements.slice(0, 5);

  const getMovementIcon = (type: string) => {
    switch (type) {
      case 'PURCHASE':
        return <ShoppingBag className="w-3.5 h-3.5 text-teal-700" />;
      case 'IN':
        return <ArrowDownLeft className="w-3.5 h-3.5 text-emerald-700" />;
      case 'OUT':
        return <ArrowUpRight className="w-3.5 h-3.5 text-blue-700" />;
      case 'ADJUSTMENT':
        return <RefreshCcw className="w-3.5 h-3.5 text-amber-700" />;
      case 'DISPOSAL':
      case 'RETURN':
        return <Trash2 className="w-3.5 h-3.5 text-rose-700" />;
      default:
        return <Clock className="w-3.5 h-3.5 text-slate-500" />;
    }
  };

  const getMovementBg = (type: string) => {
    switch (type) {
      case 'PURCHASE':
      case 'IN':
        return 'bg-emerald-50 border-emerald-200';
      case 'OUT':
        return 'bg-blue-50 border-blue-200';
      case 'ADJUSTMENT':
        return 'bg-amber-50 border-amber-200';
      case 'DISPOSAL':
      case 'RETURN':
        return 'bg-rose-50 border-rose-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Recent Stock Movements</h3>
          <p className="text-xs text-slate-400">Live audit log of dispenses, returns & inward shipments</p>
        </div>
        <button
          onClick={() => navigate('stock-movements')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
        >
          View Full Audit Log →
        </button>
      </div>

      <div className="divide-y divide-slate-100">
        {recent.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            No stock movements recorded yet.
          </div>
        ) : (
          recent.map(mov => (
            <div key={mov.id} className="py-3 flex items-center justify-between first:pt-0 last:pb-0 gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center border shrink-0 ${getMovementBg(mov.type)}`}>
                  {getMovementIcon(mov.type)}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {mov.medicineName}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {mov.reason} • <span className="text-slate-400">{mov.performedBy}</span>
                  </div>
                </div>
              </div>

              <div className="text-right shrink-0">
                <div className={`text-xs font-extrabold ${
                  mov.quantity > 0 ? 'text-emerald-600' : 'text-slate-700'
                }`}>
                  {mov.quantity > 0 ? `+${mov.quantity}` : mov.quantity} units
                </div>
                <div className="text-[10px] text-slate-400">
                  {formatDateTime(mov.date)}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
