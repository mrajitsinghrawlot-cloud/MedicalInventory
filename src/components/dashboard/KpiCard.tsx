import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: string;
    isPositive: boolean;
    text: string;
  };
  colorScheme?: 'teal' | 'rose' | 'amber' | 'blue' | 'purple';
  onClick?: () => void;
  badge?: string;
}

export const KpiCard: React.FC<KpiCardProps> = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  colorScheme = 'teal',
  onClick,
  badge
}) => {
  const schemes = {
    teal: {
      iconBg: 'bg-teal-50 text-teal-700 border-teal-100',
      accent: 'border-teal-500/30',
      hover: 'hover:border-teal-400 hover:shadow-teal-500/5'
    },
    rose: {
      iconBg: 'bg-rose-50 text-rose-700 border-rose-100',
      accent: 'border-rose-500/30',
      hover: 'hover:border-rose-400 hover:shadow-rose-500/5'
    },
    amber: {
      iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
      accent: 'border-amber-500/30',
      hover: 'hover:border-amber-400 hover:shadow-amber-500/5'
    },
    blue: {
      iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
      accent: 'border-blue-500/30',
      hover: 'hover:border-blue-400 hover:shadow-blue-500/5'
    },
    purple: {
      iconBg: 'bg-purple-50 text-purple-700 border-purple-100',
      accent: 'border-purple-500/30',
      hover: 'hover:border-purple-400 hover:shadow-purple-500/5'
    }
  };

  const scheme = schemes[colorScheme];

  return (
    <div
      onClick={onClick}
      className={`bg-white rounded-2xl p-5 border border-slate-200/90 shadow-2xs transition-all duration-200 relative overflow-hidden group interactive-card ${
        onClick ? 'cursor-pointer hover:shadow-lg ' + scheme.hover : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{title}</span>
            {badge && (
              <span className="px-1.5 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md">
                {badge}
              </span>
            )}
          </div>
          <div className="text-2xl font-extrabold text-slate-900 tracking-tight">
            {value}
          </div>
          {subtitle && (
            <div className="text-xs text-slate-400 font-medium">{subtitle}</div>
          )}
        </div>

        <div className={`w-11 h-11 rounded-2xl flex items-center justify-center border ${scheme.iconBg} transition-transform group-hover:scale-105 shrink-0`}>
          <Icon className="w-5 h-5 stroke-[2.2]" />
        </div>
      </div>

      {trend && (
        <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
          <span className={`font-semibold flex items-center gap-1 ${
            trend.isPositive ? 'text-emerald-600' : 'text-rose-600'
          }`}>
            {trend.value}
          </span>
          <span className="text-slate-400 text-[11px]">{trend.text}</span>
        </div>
      )}
    </div>
  );
};
