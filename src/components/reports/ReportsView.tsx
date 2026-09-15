import React from 'react';
import { 
  Download, 
  Printer,
  Scale
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, getDaysUntilExpiry } from '../../utils/formatters';
import { exportMedicinesToCSV } from '../../utils/exportUtils';

export const ReportsView: React.FC = () => {
  const { medicines, navigate } = useInventory();

  // 1. Total inventory cost valuation vs MRP valuation
  const totalCostValuation = medicines.reduce((sum, m) => sum + (m.stockQuantity * m.purchasePrice), 0);
  const totalMrpValuation = medicines.reduce((sum, m) => sum + (m.stockQuantity * m.mrp), 0);
  const potentialGrossMargin = totalMrpValuation - totalCostValuation;

  // 2. Expired loss value
  const expiredLossValue = medicines
    .filter(m => getDaysUntilExpiry(m.expiryDate) < 0)
    .reduce((sum, m) => sum + (m.stockQuantity * m.purchasePrice), 0);

  // 3. Category valuation data
  const categoryData: { name: string; cost: number; mrp: number }[] = [];
  const map: Record<string, { cost: number; mrp: number }> = {};
  medicines.forEach(m => {
    if (!map[m.category]) map[m.category] = { cost: 0, mrp: 0 };
    map[m.category].cost += m.stockQuantity * m.purchasePrice;
    map[m.category].mrp += m.stockQuantity * m.mrp;
  });
  Object.entries(map).forEach(([name, vals]) => {
    categoryData.push({
      name: name.split(' ')[0], // short name for chart
      cost: Math.round(vals.cost),
      mrp: Math.round(vals.mrp)
    });
  });

  // 4. Monthly Purchases Trend
  const monthlyPurchasesData = [
    { month: 'Apr', amount: 32000 },
    { month: 'May', amount: 48500 },
    { month: 'Jun', amount: 41200 },
    { month: 'Jul', amount: 56000 },
    { month: 'Aug', amount: 62400 },
    { month: 'Sep (Current)', amount: 50972 }
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Financial & Stock Analytics</h2>
          <p className="text-xs text-slate-500">Inventory valuation audits, margin projections, and waste loss reports</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => navigate('price-comparison')}
            className="flex items-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold transition-colors"
          >
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>Supplier Price Compare</span>
          </button>
          <button
            onClick={() => exportMedicinesToCSV(medicines)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Valuation CSV</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Total Stock Valuation (Cost)</span>
          <div className="text-2xl font-extrabold text-teal-800 mt-1">
            {formatCurrency(totalCostValuation)}
          </div>
          <span className="text-[11px] text-slate-400">Capital tied in active inventory</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Retail Value (MRP)</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">
            {formatCurrency(totalMrpValuation)}
          </div>
          <span className="text-[11px] text-emerald-600 font-semibold">
            +{((potentialGrossMargin / totalCostValuation) * 100).toFixed(1)}% Markup
          </span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Potential Profit Margin</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">
            {formatCurrency(potentialGrossMargin)}
          </div>
          <span className="text-[11px] text-slate-400">Gross realization upon 100% dispense</span>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Expired Stock Loss Value</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">
            {formatCurrency(expiredLossValue)}
          </div>
          <span className="text-[11px] text-rose-500 font-medium">Eligible for supplier credit note</span>
        </div>
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Category Cost vs MRP Bar Chart */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Category Valuation: Cost vs MRP</h3>
            <p className="text-xs text-slate-400">Comparison of purchase capital invested vs retail return</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), '']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="cost" fill="#0f766e" name="Cost Price" radius={[4, 4, 0, 0]} />
                <Bar dataKey="mrp" fill="#14b8a6" name="Retail MRP" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-center gap-6 text-xs text-slate-600 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-800" />
              <span>Purchase Cost (Capital)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded bg-teal-400" />
              <span>Retail MRP Potential</span>
            </div>
          </div>
        </div>

        {/* Monthly Purchases Inward Trend */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <div>
            <h3 className="font-bold text-slate-900 text-sm">Monthly Purchase Inward Volume</h3>
            <p className="text-xs text-slate-400">Total inward invoices billed across preceding 6 months</p>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyPurchasesData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
                <Tooltip
                  formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Purchases']}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#e2e8f0',
                    borderRadius: '0.75rem',
                    fontSize: '12px'
                  }}
                />
                <Bar dataKey="amount" fill="#3b82f6" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <span>Average Monthly Procurement:</span>
            <strong className="text-slate-800 font-bold">₹48,512 / mo</strong>
          </div>
        </div>
      </div>
    </div>
  );
};
