import React from 'react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip 
} from 'recharts';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency } from '../../utils/formatters';

const COLORS = [
  '#0f766e', // teal-700
  '#0284c7', // sky-600
  '#8b5cf6', // violet-500
  '#f59e0b', // amber-500
  '#ec4899', // pink-500
  '#10b981', // emerald-500
  '#6366f1', // indigo-500
  '#f97316', // orange-500
  '#14b8a6', // teal-500
  '#64748b'  // slate-500
];

export const CategoryBreakdownChart: React.FC = () => {
  const { medicines, navigate } = useInventory();

  // Aggregate valuation by category
  const categoryMap: Record<string, { value: number; count: number }> = {};

  medicines.forEach(m => {
    const valuation = m.stockQuantity * m.purchasePrice;
    if (!categoryMap[m.category]) {
      categoryMap[m.category] = { value: 0, count: 0 };
    }
    categoryMap[m.category].value += valuation;
    categoryMap[m.category].count += m.stockQuantity;
  });

  const data = Object.entries(categoryMap)
    .map(([name, stat]) => ({
      name,
      value: Math.round(stat.value),
      units: stat.count
    }))
    .filter(d => d.value > 0)
    .sort((a, b) => b.value - a.value);

  const topCategories = data.slice(0, 4);

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-2">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Stock Valuation by Category</h3>
          <p className="text-xs text-slate-400">Capital invested in therapeutic classes</p>
        </div>
        <button
          onClick={() => navigate('inventory')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
        >
          View Inventory →
        </button>
      </div>

      <div className="flex flex-col sm:flex-row items-center gap-4">
        {/* Donut Chart */}
        <div className="h-48 w-48 shrink-0 relative">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={75}
                paddingAngle={3}
                dataKey="value"
              >
                {data.map((_, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: any) => [formatCurrency(Number(value || 0)), 'Valuation']}
                contentStyle={{
                  backgroundColor: '#ffffff',
                  borderColor: '#e2e8f0',
                  borderRadius: '0.75rem',
                  fontSize: '12px',
                  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
            <span className="text-[10px] text-slate-400 font-medium">Categories</span>
            <span className="text-sm font-extrabold text-slate-800">{data.length}</span>
          </div>
        </div>

        {/* Legend List */}
        <div className="flex-1 w-full space-y-2">
          {topCategories.map((cat, idx) => (
            <div key={cat.name} className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 truncate pr-2">
                <span 
                  className="w-2.5 h-2.5 rounded-full shrink-0" 
                  style={{ backgroundColor: COLORS[idx % COLORS.length] }} 
                />
                <span className="text-slate-700 truncate font-medium">{cat.name}</span>
              </div>
              <span className="font-bold text-slate-900 shrink-0">
                {formatCurrency(cat.value)}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
        <span>Active Categories Tracked:</span>
        <span className="font-bold text-slate-800">{data.length}</span>
      </div>
    </div>
  );
};
