import React, { useState } from 'react';
import { 
  LayoutDashboard, 
  ShoppingCart,
  Receipt,
  Pill, 
  FileSpreadsheet, 
  Users2, 
  AlertTriangle, 
  TrendingDown, 
  BarChart3, 
  Settings, 
  History, 
  ChevronLeft, 
  ChevronRight,
  ShieldCheck,
  Sparkles,
  Scale
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PageId } from '../../types/inventory';

export const Sidebar: React.FC = () => {
  const { 
    currentPage, 
    navigate, 
    expiredCount, 
    expiringSoonCount, 
    lowStockCount 
  } = useInventory();

  const [collapsed, setCollapsed] = useState(false);

  const navItems: { 
    id: PageId; 
    label: string; 
    icon: React.FC<{ className?: string }>; 
    badge?: number | string; 
    badgeColor?: string;
    isPrimaryAction?: boolean;
  }[] = [
    { 
      id: 'pos', 
      label: 'Counter Billing (POS)', 
      icon: ShoppingCart,
      badge: 'SELL',
      badgeColor: 'bg-emerald-600 text-white font-extrabold',
      isPrimaryAction: true
    },
    { 
      id: 'dashboard', 
      label: 'Dashboard', 
      icon: LayoutDashboard 
    },
    { 
      id: 'sales-history', 
      label: 'Sales Receipts', 
      icon: Receipt 
    },
    { 
      id: 'inventory', 
      label: 'Inventory', 
      icon: Pill 
    },
    { 
      id: 'purchase-bills', 
      label: 'Purchase Bills', 
      icon: FileSpreadsheet 
    },
    { 
      id: 'price-comparison', 
      label: 'Price Compare', 
      icon: Scale,
      badge: 'PRO',
      badgeColor: 'bg-emerald-100 text-emerald-800 font-bold'
    },
    { 
      id: 'vendors', 
      label: 'Vendors', 
      icon: Users2 
    },
    { 
      id: 'expiry', 
      label: 'Expiry Center', 
      icon: AlertTriangle,
      badge: expiredCount + expiringSoonCount,
      badgeColor: expiredCount > 0 ? 'bg-red-500 text-white' : 'bg-amber-500 text-white'
    },
    { 
      id: 'low-stock', 
      label: 'Low Stock', 
      icon: TrendingDown,
      badge: lowStockCount,
      badgeColor: 'bg-amber-500 text-white'
    },
    { 
      id: 'stock-movements', 
      label: 'Audit Trail', 
      icon: History 
    },
    { 
      id: 'reports', 
      label: 'Reports', 
      icon: BarChart3 
    },
    { 
      id: 'settings', 
      label: 'Settings', 
      icon: Settings 
    }
  ];

  return (
    <aside 
      className={`hidden md:flex flex-col bg-white border-r border-slate-200 shrink-0 transition-all duration-300 relative select-none ${
        collapsed ? 'w-20' : 'w-60'
      }`}
    >
      {/* Brand Header */}
      <div className="h-16 px-4 flex items-center justify-between border-b border-slate-100">
        <div className="flex items-center gap-3 overflow-hidden cursor-pointer" onClick={() => navigate('dashboard')}>
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-800 to-teal-600 flex items-center justify-center text-white shadow-md shadow-teal-700/20 shrink-0">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 4v16m8-8H4" />
              <rect x="2" y="2" width="20" height="20" rx="5" strokeWidth="2" />
            </svg>
          </div>
          {!collapsed && (
            <div className="animate-in fade-in duration-200">
              <div className="font-extrabold text-slate-900 text-base tracking-tight leading-none flex items-center gap-1.5">
                MediStock
                <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 bg-teal-50 text-teal-700 rounded-md border border-teal-200/50">Pro</span>
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-1">Pharmacy POS & Stock OS</div>
            </div>
          )}
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-6 h-6 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = 
            currentPage === item.id ||
            (item.id === 'inventory' && currentPage === 'medicine-details') ||
            (item.id === 'purchase-bills' && currentPage === 'add-purchase-bill');

          return (
            <button
              key={item.id}
              onClick={() => navigate(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all group relative ${
                isActive 
                  ? 'bg-teal-700 text-white shadow-sm shadow-teal-700/20 font-bold' 
                  : item.isPrimaryAction
                  ? 'bg-emerald-50/80 text-emerald-800 hover:bg-emerald-100/70 border border-emerald-200/70'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <item.icon className={`w-5 h-5 shrink-0 transition-transform group-hover:scale-105 ${
                isActive ? 'text-white' : item.isPrimaryAction ? 'text-emerald-700' : 'text-slate-400 group-hover:text-teal-600'
              }`} />

              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}

              {/* Badge Counter */}
              {item.badge !== undefined && (
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${item.badgeColor} ${
                  collapsed ? 'absolute -top-1 -right-1 ring-2 ring-white scale-75' : ''
                }`}>
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Pharmacy Status Card at Bottom */}
      {!collapsed && (
        <div className="p-3 m-3 bg-gradient-to-br from-slate-50 to-teal-50/50 border border-slate-200/80 rounded-2xl">
          <div className="flex items-center gap-2 mb-1.5">
            <ShieldCheck className="w-4 h-4 text-teal-700" />
            <span className="text-xs font-bold text-slate-800">Pharmacy License</span>
          </div>
          <div className="text-[11px] text-slate-500 font-mono">DL-20B/21B-48190</div>
          <div className="mt-2 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[10px] text-slate-400 font-medium">
            <span>v2.4.0 (POS Active)</span>
            <span className="text-emerald-600 font-semibold">● Ready</span>
          </div>
        </div>
      )}
    </aside>
  );
};
