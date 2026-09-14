import React from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart,
  Pill, 
  FileSpreadsheet, 
  Menu
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PageId } from '../../types/inventory';

interface MobileNavProps {
  onOpenMenu: () => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ onOpenMenu }) => {
  const { 
    currentPage, 
    navigate, 
    expiredCount, 
    expiringSoonCount, 
    lowStockCount
  } = useInventory();

  const totalAlerts = expiredCount + expiringSoonCount + lowStockCount;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-slate-200/90 z-40 pb-safe shadow-[0_-4px_20px_rgba(0,0,0,0.06)]">
      <div className="flex items-center justify-between px-2 py-1.5 max-w-md mx-auto">
        {/* 1. Home / Dashboard */}
        <button
          onClick={() => navigate('dashboard')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all relative ${
            currentPage === 'dashboard' ? 'text-teal-900 font-extrabold' : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`px-3.5 py-1 rounded-full transition-all ${
            currentPage === 'dashboard' ? 'bg-teal-100 text-teal-800' : ''
          }`}>
            <LayoutDashboard className={`w-5 h-5 ${currentPage === 'dashboard' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[11px] leading-tight">Home</span>
        </button>

        {/* 2. Stock / Medicines */}
        <button
          onClick={() => navigate('inventory')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all relative ${
            currentPage === 'inventory' || currentPage === 'medicine-details' 
              ? 'text-teal-900 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`px-3.5 py-1 rounded-full transition-all relative ${
            currentPage === 'inventory' || currentPage === 'medicine-details' 
              ? 'bg-teal-100 text-teal-800' 
              : ''
          }`}>
            <Pill className={`w-5 h-5 ${currentPage === 'inventory' ? 'stroke-[2.5]' : 'stroke-2'}`} />
            {totalAlerts > 0 && (
              <span className="absolute top-0 right-1 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-white" />
            )}
          </div>
          <span className="text-[11px] leading-tight">Stock</span>
        </button>

        {/* 3. Sell (POS) - Elevated Center Action Button */}
        <button
          onClick={() => navigate('pos')}
          className="flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all group"
        >
          <div className={`px-4 py-1.5 rounded-full flex items-center justify-center transition-all shadow-sm ${
            currentPage === 'pos' 
              ? 'bg-emerald-600 text-white shadow-emerald-600/30 scale-105' 
              : 'bg-emerald-50 text-emerald-800 border border-emerald-300'
          }`}>
            <ShoppingCart className="w-5 h-5 stroke-[2.5]" />
          </div>
          <span className={`text-[11px] font-extrabold leading-tight ${
            currentPage === 'pos' ? 'text-emerald-800' : 'text-emerald-700'
          }`}>
            Sell POS
          </span>
        </button>

        {/* 4. Bills */}
        <button
          onClick={() => navigate('purchase-bills')}
          className={`flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all relative ${
            currentPage === 'purchase-bills' || currentPage === 'add-purchase-bill' 
              ? 'text-teal-900 font-extrabold' 
              : 'text-slate-500 hover:text-slate-800'
          }`}
        >
          <div className={`px-3.5 py-1 rounded-full transition-all ${
            currentPage === 'purchase-bills' || currentPage === 'add-purchase-bill' 
              ? 'bg-teal-100 text-teal-800' 
              : ''
          }`}>
            <FileSpreadsheet className={`w-5 h-5 ${currentPage === 'purchase-bills' ? 'stroke-[2.5]' : 'stroke-2'}`} />
          </div>
          <span className="text-[11px] leading-tight">Bills</span>
        </button>

        {/* 5. Menu Button (Opens Android Nav Drawer) */}
        <button
          onClick={onOpenMenu}
          className="flex-1 flex flex-col items-center gap-1 py-1 px-1 rounded-2xl transition-all text-slate-600 hover:text-teal-800"
          title="Open Full Menu"
        >
          <div className="px-3.5 py-1 rounded-full hover:bg-slate-100 transition-all">
            <Menu className="w-5 h-5 stroke-[2.3]" />
          </div>
          <span className="text-[11px] font-semibold leading-tight">Menu</span>
        </button>
      </div>
    </nav>
  );
};
