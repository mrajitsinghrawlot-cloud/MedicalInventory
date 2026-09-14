import React from 'react';
import { 
  Pill, 
  TrendingDown, 
  AlertTriangle, 
  DollarSign, 
  FilePlus, 
  FileSpreadsheet,
  PackagePlus, 
  SlidersHorizontal, 
  Barcode, 
  ArrowRight,
  ShieldAlert,
  Sparkles,
  ShoppingCart,
  Receipt
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { KpiCard } from './KpiCard';
import { ExpiryTimelineChart } from './ExpiryTimelineChart';
import { CategoryBreakdownChart } from './CategoryBreakdownChart';
import { RecentActivityList } from './RecentActivityList';
import { formatCurrency, getDaysUntilExpiry } from '../../utils/formatters';

interface DashboardViewProps {
  onOpenAddMedicine: () => void;
  onOpenAddBill: () => void;
  onOpenAdjustment: () => void;
  onOpenScanner: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddMedicine,
  onOpenAddBill,
  onOpenAdjustment,
  onOpenScanner
}) => {
  const { 
    medicines, 
    totalStockValue, 
    expiredCount, 
    expiringSoonCount, 
    lowStockCount, 
    totalSalesToday,
    totalSalesCount,
    clearAllData,
    resetToDemoData,
    navigate,
    setSelectedMedicine
  } = useInventory();

  const totalMedicines = medicines.length;
  const criticalItemsCount = expiredCount + lowStockCount;

  const urgentMedicines = medicines
    .filter(m => getDaysUntilExpiry(m.expiryDate) < 0 || m.stockQuantity <= m.minStockThreshold)
    .slice(0, 3);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Empty Database Fresh Production Mode Banner */}
      {medicines.length === 0 && (
        <div className="p-6 bg-gradient-to-r from-teal-50 via-emerald-50 to-cyan-50 border border-teal-200 rounded-3xl text-teal-950 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 bg-emerald-600 text-white text-[11px] font-bold rounded-full">
                Clean Database
              </span>
              <span className="text-xs font-semibold text-teal-800">Production Mode Active</span>
            </div>
            <h3 className="font-extrabold text-base text-slate-900">
              Your Pharmacy Database is Clean & Ready
            </h3>
            <p className="text-xs text-slate-600 max-w-xl">
              All demo items have been wiped. You can now scan real physical wholesaler invoices with AI or add your own inventory stock.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={onOpenAddBill}
              className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all flex items-center gap-1.5 active:scale-95"
            >
              <FilePlus className="w-4 h-4" />
              <span>Scan / Add Purchase Bill</span>
            </button>
            <button
              onClick={onOpenAddMedicine}
              className="px-3.5 py-2.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-bold shadow-2xs active:scale-95 flex items-center gap-1.5"
            >
              <PackagePlus className="w-4 h-4" />
              <span>Add Medicine</span>
            </button>
            <button
              onClick={() => {
                if (window.confirm('Reload sample demo medicines and invoices?')) resetToDemoData();
              }}
              className="px-3 py-2.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl text-xs font-semibold"
            >
              Reload Demo
            </button>
          </div>
        </div>
      )}
      {/* Primary POS Action Hero Card */}
      <div className="bg-gradient-to-r from-teal-800 via-teal-700 to-emerald-700 text-white rounded-3xl p-5 sm:p-6 shadow-xl shadow-teal-900/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 bg-emerald-400 text-emerald-950 text-xs font-extrabold rounded-full uppercase tracking-wider">
              Quick Counter POS
            </span>
            <span className="text-white/80 text-xs">Loose Tablets & Full Strips</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight">
            Dispense & Sell Medicine to Patient
          </h2>
          <p className="text-xs sm:text-sm text-teal-100 max-w-xl">
            Choose full strips or single loose tablets with live unit rate calculation (e.g. ₹50 for 10 tabs = ₹5/tab). Instant inventory deduction.
          </p>
        </div>

        <div className="flex items-center gap-2.5 w-full md:w-auto">
          <button
            onClick={() => navigate('pos')}
            className="flex-1 md:flex-initial px-6 py-3 bg-white text-teal-800 hover:bg-teal-50 rounded-2xl font-extrabold text-sm shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="w-4 h-4 text-teal-700" />
            <span>Open Counter Billing</span>
          </button>
          <button
            onClick={() => navigate('sales-history')}
            className="px-4 py-3 bg-teal-900/60 hover:bg-teal-900/80 text-white border border-white/20 rounded-2xl font-bold text-xs transition-all flex items-center gap-1.5"
          >
            <Receipt className="w-4 h-4" />
            <span>Sales ({totalSalesCount})</span>
          </button>
        </div>
      </div>

      {/* Urgent Alerts Banner */}
      {criticalItemsCount > 0 && (
        <div className="p-4 sm:p-5 bg-gradient-to-r from-rose-500 via-rose-600 to-amber-600 text-white rounded-3xl shadow-lg shadow-rose-500/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
              <ShieldAlert className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-lg">Attention Required</span>
                <span className="px-2 py-0.5 bg-white text-rose-700 text-xs font-bold rounded-full">
                  {criticalItemsCount} Critical Action{criticalItemsCount > 1 ? 's' : ''}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-white/90 mt-0.5">
                {expiredCount > 0 && `${expiredCount} expired medicine batch(es) quarantine required. `}
                {lowStockCount > 0 && `${lowStockCount} items have fallen below safe reorder levels.`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto">
            {expiredCount > 0 && (
              <button
                onClick={() => navigate('expiry')}
                className="flex-1 md:flex-initial px-4 py-2 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
              >
                Resolve Expiries ({expiredCount})
              </button>
            )}
            {lowStockCount > 0 && (
              <button
                onClick={() => navigate('low-stock')}
                className="flex-1 md:flex-initial px-4 py-2 bg-rose-900/40 hover:bg-rose-900/60 text-white rounded-xl text-xs font-bold transition-all border border-white/20"
              >
                Order Low Stock ({lowStockCount})
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top 4 KPI Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          title="Today's Retail Sales"
          value={formatCurrency(totalSalesToday)}
          subtitle={`${totalSalesCount} patient sales completed`}
          icon={ShoppingCart}
          colorScheme="teal"
          trend={{ value: '100% Cash/UPI', isPositive: true, text: 'instant cleared' }}
          onClick={() => navigate('sales-history')}
        />
        <KpiCard
          title="Total Stock Valuation"
          value={formatCurrency(totalStockValue)}
          subtitle="At purchase cost price"
          icon={DollarSign}
          colorScheme="blue"
          trend={{ value: '+8.4%', isPositive: true, text: 'vs last month' }}
          onClick={() => navigate('reports')}
        />
        <KpiCard
          title="Expired & Near Expiry"
          value={expiredCount + expiringSoonCount}
          subtitle={`${expiredCount} Expired • ${expiringSoonCount} Expiring <60d`}
          icon={AlertTriangle}
          colorScheme={expiredCount > 0 ? 'rose' : 'amber'}
          badge={expiredCount > 0 ? `${expiredCount} Expired` : undefined}
          onClick={() => navigate('expiry')}
        />
        <KpiCard
          title="Low Stock SKUs"
          value={lowStockCount}
          subtitle="Items below min threshold"
          icon={TrendingDown}
          colorScheme="amber"
          badge={lowStockCount > 0 ? 'Action Needed' : undefined}
          onClick={() => navigate('low-stock')}
        />
      </div>

      {/* Quick Action Shortcuts Panel */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-2xs">
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-teal-700" />
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Quick Actions</h3>
          </div>
          <span className="text-[11px] text-slate-400">Common pharmacy workflows</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <button
            onClick={() => navigate('pos')}
            className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/70 hover:border-emerald-300 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-emerald-950">Counter Billing</div>
              <div className="text-[10px] text-emerald-700">Sell loose / strips</div>
            </div>
          </button>

          <button
            onClick={onOpenAddMedicine}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-teal-50 border border-slate-200/70 hover:border-teal-300 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <PackagePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-teal-900">Add Medicine</div>
              <div className="text-[10px] text-slate-400">New batch or SKU</div>
            </div>
          </button>

          <button
            onClick={onOpenAddBill}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-blue-50 border border-slate-200/70 hover:border-blue-300 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <FilePlus className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-blue-900">Purchase Inward</div>
              <div className="text-[10px] text-slate-400">Record supplier bill</div>
            </div>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 hover:bg-purple-50 border border-slate-200/70 hover:border-purple-300 transition-all text-left group"
          >
            <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
              <Barcode className="w-4 h-4" />
            </div>
            <div>
              <div className="text-xs font-bold text-slate-900 group-hover:text-purple-900">Barcode Lookup</div>
              <div className="text-[10px] text-slate-400">Quick camera scan</div>
            </div>
          </button>
        </div>
      </div>

      {/* Visual Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ExpiryTimelineChart />
        <CategoryBreakdownChart />
      </div>

      {/* Bottom Android App Launcher: All Modules & Actions */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100 text-teal-800 flex items-center justify-center font-bold">
              <Pill className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base">Quick App Launcher & Modules</h3>
              <p className="text-xs text-slate-400">Tap any button to jump directly to that screen</p>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full">
            10 Modules
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {/* 1. Counter POS */}
          <button
            onClick={() => navigate('pos')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-emerald-50 hover:bg-emerald-100/80 border border-emerald-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <ShoppingCart className="w-5 h-5" />
            </div>
            <div className="font-extrabold text-emerald-950 text-xs sm:text-sm leading-tight">Counter POS</div>
            <div className="text-[11px] text-emerald-700 mt-0.5">Sell loose tabs & packs</div>
          </button>

          {/* 2. Stock Inventory */}
          <button
            onClick={() => navigate('inventory')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-teal-50/70 hover:bg-teal-100/70 border border-teal-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-teal-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <Pill className="w-5 h-5" />
            </div>
            <div className="font-bold text-teal-950 text-xs sm:text-sm leading-tight">Medicines Stock</div>
            <div className="text-[11px] text-teal-700 mt-0.5">{totalMedicines} total SKUs</div>
          </button>

          {/* 3. Sales History */}
          <button
            onClick={() => navigate('sales-history')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-indigo-50/70 hover:bg-indigo-100/70 border border-indigo-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-indigo-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <Receipt className="w-5 h-5" />
            </div>
            <div className="font-bold text-indigo-950 text-xs sm:text-sm leading-tight">Sales Receipts</div>
            <div className="text-[11px] text-indigo-700 mt-0.5">{totalSalesCount} patient bills</div>
          </button>

          {/* 4. Purchase Bills */}
          <button
            onClick={() => navigate('purchase-bills')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div className="font-bold text-blue-950 text-xs sm:text-sm leading-tight">Purchase Bills</div>
            <div className="text-[11px] text-blue-700 mt-0.5">Supplier inward invoices</div>
          </button>

          {/* 5. Expiry Center */}
          <button
            onClick={() => navigate('expiry')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-100/70 border border-rose-200/80 transition-all text-left group active:scale-98 shadow-xs relative"
          >
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <AlertTriangle className="w-5 h-5" />
            </div>
            {expiredCount > 0 && (
              <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-rose-600 text-white text-[9px] font-bold rounded-full">
                {expiredCount} Exp
              </span>
            )}
            <div className="font-bold text-rose-950 text-xs sm:text-sm leading-tight">Expiry Center</div>
            <div className="text-[11px] text-rose-700 mt-0.5">Quarantine & returns</div>
          </button>

          {/* 6. Low Stock */}
          <button
            onClick={() => navigate('low-stock')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-100/70 border border-amber-200/80 transition-all text-left group active:scale-98 shadow-xs relative"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <TrendingDown className="w-5 h-5" />
            </div>
            {lowStockCount > 0 && (
              <span className="absolute top-3 right-3 px-1.5 py-0.5 bg-amber-600 text-white text-[9px] font-bold rounded-full">
                {lowStockCount} Low
              </span>
            )}
            <div className="font-bold text-amber-950 text-xs sm:text-sm leading-tight">Low Stock Alerts</div>
            <div className="text-[11px] text-amber-700 mt-0.5">Reorder thresholds</div>
          </button>

          {/* 7. Vendors */}
          <button
            onClick={() => navigate('vendors')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <PackagePlus className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">Suppliers / Vendors</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Drug licenses & dues</div>
          </button>

          {/* 8. Audit Trail */}
          <button
            onClick={() => navigate('stock-movements')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-slate-700 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <SlidersHorizontal className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">Audit Movements</div>
            <div className="text-[11px] text-slate-500 mt-0.5">In/Out stock ledger</div>
          </button>

          {/* 9. Barcode Scan */}
          <button
            onClick={onOpenScanner}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-100/70 border border-purple-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <Barcode className="w-5 h-5" />
            </div>
            <div className="font-bold text-purple-950 text-xs sm:text-sm leading-tight">Barcode Scanner</div>
            <div className="text-[11px] text-purple-700 mt-0.5">Camera batch lookup</div>
          </button>

          {/* 10. Financial Reports */}
          <button
            onClick={() => navigate('reports')}
            className="flex flex-col items-start p-3.5 rounded-2xl bg-slate-50 hover:bg-slate-100/80 border border-slate-200/80 transition-all text-left group active:scale-98 shadow-xs"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center mb-2 shadow-xs group-hover:scale-105 transition-transform">
              <DollarSign className="w-5 h-5" />
            </div>
            <div className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">Financial Reports</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Valuation & profits</div>
          </button>
        </div>
      </div>
    </div>
  );
};
