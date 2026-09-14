import React from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell 
} from 'recharts';
import { useInventory } from '../../context/InventoryContext';
import { getDaysUntilExpiry } from '../../utils/formatters';

export const ExpiryTimelineChart: React.FC = () => {
  const { medicines, navigate } = useInventory();

  let expiredCount = 0;
  let within30 = 0;
  let within60 = 0;
  let within90 = 0;
  let healthy = 0;

  medicines.forEach(m => {
    const days = getDaysUntilExpiry(m.expiryDate);
    if (days < 0) expiredCount += m.stockQuantity;
    else if (days <= 30) within30 += m.stockQuantity;
    else if (days <= 60) within60 += m.stockQuantity;
    else if (days <= 90) within90 += m.stockQuantity;
    else healthy += m.stockQuantity;
  });

  const data = [
    { name: 'Expired', units: expiredCount, fill: '#ef4444' },
    { name: '< 30 Days', units: within30, fill: '#f43f5e' },
    { name: '31-60 Days', units: within60, fill: '#f59e0b' },
    { name: '61-90 Days', units: within90, fill: '#3b82f6' },
    { name: '> 90 Days', units: healthy, fill: '#10b981' }
  ];

  return (
    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-bold text-slate-900 text-sm">Batch Expiry Horizon</h3>
          <p className="text-xs text-slate-400">Total units distribution by expiry window</p>
        </div>
        <button
          onClick={() => navigate('expiry')}
          className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline"
        >
          View All Alerts →
        </button>
      </div>

      <div className="h-56 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
            <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#64748b' }} axisLine={false} tickLine={false} />
            <Tooltip
              formatter={(value: any) => [`${value ?? 0} units`, 'Stock']}
              contentStyle={{
                backgroundColor: '#ffffff',
                borderColor: '#e2e8f0',
                borderRadius: '0.75rem',
                fontSize: '12px',
                boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
              }}
            />
            <Bar dataKey="units" radius={[6, 6, 0, 0]}>
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-2 pt-3 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
        <div className="p-2 bg-red-50/70 rounded-xl">
          <div className="font-extrabold text-red-700">{expiredCount}</div>
          <div className="text-[10px] text-red-600">Expired Units</div>
        </div>
        <div className="p-2 bg-rose-50/70 rounded-xl">
          <div className="font-extrabold text-rose-700">{within30 + within60}</div>
          <div className="text-[10px] text-rose-600">&lt;60d Critical</div>
        </div>
        <div className="p-2 bg-emerald-50/70 rounded-xl">
          <div className="font-extrabold text-emerald-700">{healthy}</div>
          <div className="text-[10px] text-emerald-600">Safe Shelf Life</div>
        </div>
      </div>
    </div>
  );
};
