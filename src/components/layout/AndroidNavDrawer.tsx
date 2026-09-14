import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  X,
  ShieldCheck,
  Database,
  ArrowRight,
  PackagePlus,
  FilePlus,
  Barcode,
  Download,
  Smartphone
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PageId } from '../../types/inventory';

interface AndroidNavDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMedicine: () => void;
  onOpenAddBill: () => void;
  onOpenScanner: () => void;
}

export const AndroidNavDrawer: React.FC<AndroidNavDrawerProps> = ({
  isOpen,
  onClose,
  onOpenAddMedicine,
  onOpenAddBill,
  onOpenScanner
}) => {
  const { 
    currentPage, 
    navigate, 
    expiredCount, 
    expiringSoonCount, 
    lowStockCount,
    resetToDemoData,
    syncStatus
  } = useInventory();

  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (installPrompt) {
      installPrompt.prompt();
      const choiceResult = await installPrompt.userChoice;
      if (choiceResult.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setInstallPrompt(null);
    } else {
      alert('To install MediStock on Android / iPhone:\n\n1. In Chrome / Safari, tap the menu (⋮ or Share icon ⎋)\n2. Tap "Add to Home Screen" or "Install App"\n3. MediStock will install with full offline & camera support!');
    }
  };

  if (!isOpen) return null;

  const totalAlerts = expiredCount + expiringSoonCount;

  const navSections: {
    title: string;
    items: {
      id: PageId;
      label: string;
      desc: string;
      icon: React.FC<{ className?: string }>;
      badge?: number | string;
      badgeColor?: string;
      highlight?: boolean;
    }[];
  }[] = [
    {
      title: 'Counter & Sales',
      items: [
        {
          id: 'pos',
          label: 'Counter Billing (POS)',
          desc: 'Sell loose tablets or full packs',
          icon: ShoppingCart,
          badge: 'SELL',
          badgeColor: 'bg-emerald-600 text-white font-extrabold',
          highlight: true
        },
        {
          id: 'sales-history',
          label: 'Sales Receipts & History',
          desc: 'Print past patient cash memos',
          icon: Receipt
        }
      ]
    },
    {
      title: 'Inventory & Operations',
      items: [
        {
          id: 'dashboard',
          label: 'Home Dashboard',
          desc: 'KPIs, valuation & live stream',
          icon: LayoutDashboard
        },
        {
          id: 'inventory',
          label: 'Medicines Inventory',
          desc: 'Drug catalogue, rack & batches',
          icon: Pill
        },
        {
          id: 'purchase-bills',
          label: 'Purchase Inward Bills',
          desc: 'Vendor invoices & inward stock',
          icon: FileSpreadsheet
        },
        {
          id: 'vendors',
          label: 'Vendors & Suppliers',
          desc: 'Drug license & payment terms',
          icon: Users2
        }
      ]
    },
    {
      title: 'Alerts & Audits',
      items: [
        {
          id: 'expiry',
          label: 'Expiry Tracking Center',
          desc: 'Quarantine & vendor returns',
          icon: AlertTriangle,
          badge: totalAlerts,
          badgeColor: expiredCount > 0 ? 'bg-rose-500 text-white' : 'bg-amber-500 text-white'
        },
        {
          id: 'low-stock',
          label: 'Low Stock Reorder',
          desc: 'Items below min threshold',
          icon: TrendingDown,
          badge: lowStockCount,
          badgeColor: 'bg-amber-500 text-white'
        },
        {
          id: 'stock-movements',
          label: 'Stock Audit Ledger',
          desc: 'Dispenses, additions & logs',
          icon: History
        }
      ]
    },
    {
      title: 'Analytics & Settings',
      items: [
        {
          id: 'reports',
          label: 'Financial & Stock Reports',
          desc: 'Valuation & monthly trends',
          icon: BarChart3
        },
        {
          id: 'settings',
          label: 'Store Settings & Backup',
          desc: 'Pharmacy profile & data tools',
          icon: Settings
        }
      ]
    }
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Slide-out Android Drawer */}
          <motion.div 
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col z-10"
          >
            {/* Drawer Header (Android App Style) */}
            <div className="bg-gradient-to-br from-teal-900 via-teal-800 to-emerald-800 text-white p-5 pt-8 shrink-0 relative">
              <button 
                onClick={onClose}
                className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
                title="Close menu"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-3 mb-3">
                <div className="w-12 h-12 rounded-2xl bg-white text-teal-800 flex items-center justify-center font-extrabold text-xl shadow-lg shadow-black/20">
                  <Pill className="w-6 h-6 text-teal-700" />
                </div>
                <div>
                  <h2 className="font-extrabold text-lg leading-tight flex items-center gap-1.5">
                    MediStock
                    <span className="text-[10px] uppercase font-black px-1.5 py-0.5 bg-emerald-400 text-emerald-950 rounded-md">
                      POS
                    </span>
                  </h2>
                  <p className="text-xs text-teal-200">Pharmacy Stock & Dispense OS</p>
                </div>
              </div>

              <div className="pt-2 border-t border-white/15 flex items-center justify-between text-xs text-teal-100">
                <div className="flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px]">DL-20B/21B-48190</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  <span className="text-[11px] capitalize">{syncStatus}</span>
                </div>
              </div>
            </div>

            {/* Quick Android Action Strip */}
            <div className="p-3 bg-slate-50 border-b border-slate-200 flex gap-2 overflow-x-auto shrink-0">
              <button
                onClick={() => {
                  onClose();
                  navigate('pos');
                }}
                className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs active:scale-95 transition-all"
              >
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Sell Now</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenAddMedicine();
                }}
                className="flex-1 min-w-[90px] flex items-center justify-center gap-1.5 py-2 px-2.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs active:scale-95 transition-all"
              >
                <PackagePlus className="w-3.5 h-3.5 text-teal-600" />
                <span>+ Med</span>
              </button>
              <button
                onClick={() => {
                  onClose();
                  onOpenScanner();
                }}
                className="w-9 h-9 flex items-center justify-center bg-white hover:bg-slate-100 border border-slate-200 text-purple-600 rounded-xl shrink-0 shadow-2xs active:scale-95 transition-all"
                title="Scan Barcode"
              >
                <Barcode className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable Navigation Sections */}
            <div className="flex-1 overflow-y-auto p-3 space-y-4">
              {navSections.map((sec, idx) => (
                <div key={idx} className="space-y-1">
                  <div className="px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    {sec.title}
                  </div>
                  {sec.items.map((item) => {
                    const isActive = currentPage === item.id || (item.id === 'inventory' && currentPage === 'medicine-details');
                    return (
                      <button
                        key={item.id}
                        onClick={() => {
                          navigate(item.id);
                          onClose();
                        }}
                        className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all active:scale-[0.98] ${
                          isActive
                            ? 'bg-teal-700 text-white font-bold shadow-sm'
                            : item.highlight
                            ? 'bg-emerald-50 text-emerald-950 font-bold border border-emerald-200/80 hover:bg-emerald-100/70'
                            : 'text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : item.highlight 
                              ? 'bg-emerald-600 text-white' 
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            <item.icon className="w-4 h-4" />
                          </div>
                          <div className="text-left">
                            <div className="text-xs font-semibold leading-tight">{item.label}</div>
                            <div className={`text-[10px] ${isActive ? 'text-teal-100' : 'text-slate-400'} font-normal`}>
                              {item.desc}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5">
                          {item.badge !== undefined && (
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${item.badgeColor || 'bg-slate-200 text-slate-700'}`}>
                              {item.badge}
                            </span>
                          )}
                          {!isActive && <ArrowRight className="w-3.5 h-3.5 text-slate-300" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* Drawer Footer */}
            <div className="p-3 bg-slate-50 border-t border-slate-200 shrink-0 space-y-2.5">
              {/* Install PWA Button */}
              <button
                onClick={handleInstallClick}
                className="w-full py-2.5 px-3 bg-gradient-to-r from-teal-700 to-emerald-700 hover:from-teal-800 hover:to-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-98 flex items-center justify-between"
              >
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-white/20 flex items-center justify-center">
                    <Smartphone className="w-3.5 h-3.5 text-white" />
                  </div>
                  <div className="text-left">
                    <div className="text-[11px] font-bold leading-tight">
                      {isInstalled ? 'MediStock App Active' : 'Install Android / PWA App'}
                    </div>
                    <div className="text-[9px] text-teal-100 font-normal">
                      {isInstalled ? 'Running in standalone mode' : 'Add to Home Screen & offline access'}
                    </div>
                  </div>
                </div>
                <Download className="w-4 h-4 text-white/90" />
              </button>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-slate-400" />
                  <span className="text-xs text-slate-600 font-medium">Demo Data</span>
                </div>
                <button
                  onClick={() => {
                    if (confirm('Reset demo medicine and billing data?')) {
                      resetToDemoData();
                      onClose();
                    }
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 shadow-2xs active:scale-95 transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
