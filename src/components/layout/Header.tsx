import React, { useState, useRef, useEffect } from 'react';
import { 
  Menu,
  Search, 
  Bell, 
  Plus, 
  RefreshCw, 
  WifiOff, 
  AlertCircle, 
  CheckCircle2, 
  ChevronDown,
  FilePlus,
  PackagePlus,
  SlidersHorizontal,
  Barcode,
  ShoppingCart
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatDateTime } from '../../utils/formatters';

interface HeaderProps {
  onOpenMenu: () => void;
  onOpenAddMedicine: () => void;
  onOpenAddBill: () => void;
  onOpenAdjustment: () => void;
  onOpenScanner: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onOpenAddMedicine,
  onOpenAddBill,
  onOpenAdjustment,
  onOpenScanner
}) => {
  const { 
    currentPage, 
    syncStatus, 
    lastSynced, 
    triggerSync, 
    setSyncStatus, 
    notifications, 
    markNotificationRead,
    clearAllNotifications,
    navigate,
    setGlobalSearchOpen
  } = useInventory();

  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickAdd, setShowQuickAdd] = useState(false);
  const [showSyncMenu, setShowSyncMenu] = useState(false);

  const notifRef = useRef<HTMLDivElement>(null);
  const quickAddRef = useRef<HTMLDivElement>(null);
  const syncRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter(n => !n.read).length;

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
      }
      if (quickAddRef.current && !quickAddRef.current.contains(e.target as Node)) {
        setShowQuickAdd(false);
      }
      if (syncRef.current && !syncRef.current.contains(e.target as Node)) {
        setShowSyncMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setGlobalSearchOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setGlobalSearchOpen]);

  const getPageTitle = () => {
    switch (currentPage) {
      case 'dashboard': return 'Dashboard Overview';
      case 'pos': return 'Counter Billing & Patient Dispensing (POS)';
      case 'sales-history': return 'Sales Receipts & Patient Invoices';
      case 'inventory': return 'Inventory & Medicines';
      case 'purchase-bills': return 'Purchase Invoices & Bills';
      case 'add-purchase-bill': return 'New Purchase Bill';
      case 'vendors': return 'Supplier & Vendor Directory';
      case 'expiry': return 'Expiry Tracking Center';
      case 'low-stock': return 'Low Stock & Reorder Levels';
      case 'stock-movements': return 'Audit Trail & Stock Logs';
      case 'reports': return 'Financial & Stock Reports';
      case 'settings': return 'System Settings & Preferences';
      case 'medicine-details': return 'Medicine Details';
      default: return 'MediStock Hub';
    }
  };

  return (
    <header className="h-16 bg-white border-b border-slate-200 px-3 md:px-6 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Hamburger Menu Trigger & Page Title */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {/* Android / Mobile Drawer Hamburger Button */}
        <button
          onClick={onOpenMenu}
          className="p-2 -ml-1 text-slate-700 hover:text-teal-800 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-1.5 shrink-0 focus:outline-hidden"
          title="Open Navigation Menu"
          aria-label="Open Navigation Menu"
        >
          <Menu className="w-6 h-6 stroke-[2.2]" />
          <span className="hidden lg:inline-block text-xs font-bold text-slate-700">Menu</span>
        </button>

        <div className="min-w-0">
          <div className="hidden md:flex items-center gap-1.5 text-[11px] text-slate-500 font-medium">
            <span>MediStock</span>
            <span>/</span>
            <span className="text-teal-700 capitalize">{currentPage.replace('-', ' ')}</span>
          </div>
          <h1 className="text-sm sm:text-base md:text-lg font-extrabold text-slate-900 leading-tight truncate">
            {getPageTitle()}
          </h1>
        </div>
      </div>

      {/* Middle: Prominent Search Bar (Desktop & Tablet) */}
      <div className="hidden sm:flex flex-1 max-w-md mx-3">
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="w-full flex items-center justify-between px-3.5 py-2 bg-slate-50 hover:bg-slate-100/80 border border-slate-200 hover:border-teal-400 rounded-xl text-slate-400 text-sm transition-all group shadow-sm"
          title="Press Ctrl+K or Cmd+K to search"
        >
          <div className="flex items-center gap-2.5 truncate">
            <Search className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors shrink-0" />
            <span className="text-slate-500 text-xs sm:text-sm font-normal truncate">
              Search medicines, batches, bills, vendors...
            </span>
          </div>
          <kbd className="hidden md:inline-flex items-center gap-0.5 px-2 py-0.5 text-[10px] font-semibold text-slate-500 bg-white border border-slate-200 rounded-md shadow-2xs shrink-0">
            <span className="text-xs">⌘</span>K
          </kbd>
        </button>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        {/* Mobile Search Icon Button (Visible only on small screens) */}
        <button
          onClick={() => setGlobalSearchOpen(true)}
          className="sm:hidden p-2 text-slate-600 hover:text-teal-800 hover:bg-slate-100 rounded-xl transition-all"
          title="Search medicines"
          aria-label="Search medicines"
        >
          <Search className="w-5 h-5" />
        </button>

        {/* Quick Dispense / POS Button */}
        <button
          onClick={() => navigate('pos')}
          className="hidden md:flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          title="Open Counter Billing / Dispense Tablets"
        >
          <ShoppingCart className="w-4 h-4" />
          <span>Sell Medicine (POS)</span>
        </button>

        {/* Sync Status Badge */}
        <div className="relative" ref={syncRef}>
          <button
            onClick={() => setShowSyncMenu(!showSyncMenu)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-all ${
              syncStatus === 'synced'
                ? 'bg-emerald-50/80 text-emerald-700 border-emerald-200 hover:bg-emerald-100/60'
                : syncStatus === 'syncing'
                ? 'bg-blue-50 text-blue-700 border-blue-200 animate-pulse'
                : syncStatus === 'offline'
                ? 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/60'
                : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100/60'
            }`}
            title="Sync status & controls"
          >
            {syncStatus === 'synced' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
            {syncStatus === 'syncing' && <RefreshCw className="w-3.5 h-3.5 text-blue-600 animate-spin" />}
            {syncStatus === 'offline' && <WifiOff className="w-3.5 h-3.5 text-amber-600" />}
            {syncStatus === 'sync-failed' && <AlertCircle className="w-3.5 h-3.5 text-red-600" />}
            <span className="hidden lg:inline capitalize">
              {syncStatus === 'synced' ? 'Online' : syncStatus}
            </span>
          </button>

          {showSyncMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-xl shadow-xl p-3 z-50 animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
                <span className="text-xs font-semibold text-slate-700">Sync Controls</span>
                <span className="text-[10px] text-slate-400">
                  Last: {formatDateTime(lastSynced.toISOString())}
                </span>
              </div>
              <p className="text-xs text-slate-600 mb-3 leading-relaxed">
                Local changes are automatically cached in Indexed Storage and synced.
              </p>
              <div className="space-y-1.5">
                <button
                  onClick={() => {
                    triggerSync();
                    setShowSyncMenu(false);
                  }}
                  disabled={syncStatus === 'syncing'}
                  className="w-full flex items-center justify-center gap-2 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-medium transition-colors"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                  Sync Now
                </button>
                <div className="flex gap-1.5 pt-1">
                  <button
                    onClick={() => {
                      setSyncStatus(syncStatus === 'offline' ? 'synced' : 'offline');
                      setShowSyncMenu(false);
                    }}
                    className="flex-1 px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-[11px] font-medium"
                  >
                    {syncStatus === 'offline' ? 'Go Online' : 'Simulate Offline'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Notifications Bell */}
        <div className="relative" ref={notifRef}>
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition-colors relative"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center ring-2 ring-white">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white border border-slate-200 rounded-2xl shadow-2xl p-0 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2">
              <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-100">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900">Notifications</span>
                  {unreadCount > 0 && (
                    <span className="px-2 py-0.5 bg-teal-100 text-teal-800 text-xs font-semibold rounded-full">
                      {unreadCount} new
                    </span>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={clearAllNotifications}
                    className="text-xs text-teal-700 hover:text-teal-800 font-medium hover:underline"
                  >
                    Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="py-8 text-center text-slate-400 text-xs">
                    No new notifications
                  </div>
                ) : (
                  notifications.map(notif => (
                    <div
                      key={notif.id}
                      onClick={() => {
                        markNotificationRead(notif.id);
                        if (notif.targetPage) {
                          navigate(notif.targetPage);
                          setShowNotifications(false);
                        }
                      }}
                      className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 items-start ${
                        !notif.read ? 'bg-teal-50/40' : ''
                      }`}
                    >
                      <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${
                        notif.severity === 'HIGH' ? 'bg-red-500' : notif.severity === 'MEDIUM' ? 'bg-amber-500' : 'bg-blue-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-xs font-semibold text-slate-900">{notif.title}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">{notif.message}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Add Dropdown (Desktop) */}
        <div className="relative hidden sm:block" ref={quickAddRef}>
          <button
            onClick={() => setShowQuickAdd(!showQuickAdd)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Actions</span>
            <ChevronDown className="w-3.5 h-3.5 opacity-80" />
          </button>

          {showQuickAdd && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-xl py-1.5 z-50 animate-in fade-in slide-in-from-top-2">
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  navigate('pos');
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-emerald-800 bg-emerald-50/50 hover:bg-emerald-100 transition-colors text-left font-bold"
              >
                <ShoppingCart className="w-4 h-4 text-emerald-700" />
                <div>
                  <div>Sell / Dispense (POS)</div>
                  <div className="text-[10px] text-emerald-600 font-normal">Loose tabs or full strips</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  onOpenAddMedicine();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left"
              >
                <PackagePlus className="w-4 h-4 text-teal-600" />
                <div>
                  <div className="font-semibold">Add Medicine / Stock</div>
                  <div className="text-[10px] text-slate-400">Register new batch or drug</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  onOpenAddBill();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left"
              >
                <FilePlus className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="font-semibold">Purchase Inward Bill</div>
                  <div className="text-[10px] text-slate-400">Record supplier invoice</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  onOpenAdjustment();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left"
              >
                <SlidersHorizontal className="w-4 h-4 text-amber-600" />
                <div>
                  <div className="font-semibold">Stock Adjustment</div>
                  <div className="text-[10px] text-slate-400">Damage, return or audit fix</div>
                </div>
              </button>
              <button
                onClick={() => {
                  setShowQuickAdd(false);
                  onOpenScanner();
                }}
                className="w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-slate-700 hover:bg-teal-50 hover:text-teal-900 transition-colors text-left"
              >
                <Barcode className="w-4 h-4 text-purple-600" />
                <div>
                  <div className="font-semibold">Barcode / QR Lookup</div>
                  <div className="text-[10px] text-slate-400">Quick scan medicine</div>
                </div>
              </button>
            </div>
          )}
        </div>

        {/* User Profile */}
        <div className="flex items-center pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-teal-700 to-teal-500 text-white font-bold text-xs flex items-center justify-center shadow-xs cursor-pointer" title="Pharmacist In-Charge: Dr. Arjun">
            DA
          </div>
        </div>
      </div>
    </header>
  );
};
