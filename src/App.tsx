import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { AndroidNavDrawer } from './components/layout/AndroidNavDrawer';
import { QuickActionFab } from './components/layout/QuickActionFab';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Fast Lazy-loaded Views with Automatic Stale Chunk Auto-Recovery
function lazyWithRetry<T extends React.ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): React.LazyExoticComponent<T> {
  return lazy(() =>
    factory().catch((error) => {
      // Auto-reload on stale build chunk so user never gets MIME text/html errors
      const hasReloaded = window.sessionStorage.getItem('chunk_reload_attempt');
      if (!hasReloaded) {
        window.sessionStorage.setItem('chunk_reload_attempt', 'true');
        window.location.reload();
      }
      throw error;
    })
  );
}

const DashboardView = lazyWithRetry(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const PosCounterBilling = lazyWithRetry(() => import('./components/pos/PosCounterBilling').then(m => ({ default: m.PosCounterBilling })));
const SalesHistoryView = lazyWithRetry(() => import('./components/pos/SalesHistoryView').then(m => ({ default: m.SalesHistoryView })));
const MedicineList = lazyWithRetry(() => import('./components/inventory/MedicineList').then(m => ({ default: m.MedicineList })));
const AlertsCenter = lazyWithRetry(() => import('./components/alerts/AlertsCenter').then(m => ({ default: m.AlertsCenter })));
const PurchaseBillsList = lazyWithRetry(() => import('./components/bills/PurchaseBillsList').then(m => ({ default: m.PurchaseBillsList })));
const VendorsList = lazyWithRetry(() => import('./components/vendors/VendorsList').then(m => ({ default: m.VendorsList })));
const StockMovementsList = lazyWithRetry(() => import('./components/audit/StockMovementsList').then(m => ({ default: m.StockMovementsList })));
const ReportsView = lazyWithRetry(() => import('./components/reports/ReportsView').then(m => ({ default: m.ReportsView })));
const SupplierPriceComparisonView = lazyWithRetry(() => import('./components/procurement/SupplierPriceComparisonView').then(m => ({ default: m.SupplierPriceComparisonView })));
const SettingsView = lazyWithRetry(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));

// Fast Lazy-loaded Modals
const AddMedicineModal = lazyWithRetry(() => import('./components/inventory/AddMedicineModal').then(m => ({ default: m.AddMedicineModal })));
const MedicineDetailModal = lazyWithRetry(() => import('./components/inventory/MedicineDetailModal').then(m => ({ default: m.MedicineDetailModal })));
const StockAdjustmentModal = lazyWithRetry(() => import('./components/inventory/StockAdjustmentModal').then(m => ({ default: m.StockAdjustmentModal })));
const BarcodeScannerModal = lazyWithRetry(() => import('./components/inventory/BarcodeScannerModal').then(m => ({ default: m.BarcodeScannerModal })));
const AddPurchaseBillModal = lazyWithRetry(() => import('./components/bills/AddPurchaseBillModal').then(m => ({ default: m.AddPurchaseBillModal })));
const BillInvoiceModal = lazyWithRetry(() => import('./components/bills/BillInvoiceModal').then(m => ({ default: m.BillInvoiceModal })));
const SalesBillInvoiceModal = lazyWithRetry(() => import('./components/pos/SalesBillInvoiceModal').then(m => ({ default: m.SalesBillInvoiceModal })));
const AddVendorModal = lazyWithRetry(() => import('./components/vendors/AddVendorModal').then(m => ({ default: m.AddVendorModal })));

import { Medicine, PurchaseBill, SalesBill } from './types/inventory';

const PageLoader: React.FC = () => (
  <div className="flex items-center justify-center py-20">
    <div className="w-8 h-8 border-3 border-teal-600 border-t-transparent rounded-full animate-spin" />
  </div>
);

const MainLayout: React.FC = () => {
  const { 
    currentPage, 
    selectedMedicine, 
    setSelectedMedicine,
    selectedBill, 
    setSelectedBill,
    selectedSalesBill,
    setSelectedSalesBill,
    globalSearchOpen,
    setGlobalSearchOpen,
    navigate
  } = useInventory();

  // Modals & Drawer state
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddMedicineOpen, setIsAddMedicineOpen] = useState(false);
  const [isAddBillOpen, setIsAddBillOpen] = useState(false);
  const [isAdjustmentOpen, setIsAdjustmentOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isAddVendorOpen, setIsAddVendorOpen] = useState(false);
  const [adjustmentTargetMed, setAdjustmentTargetMed] = useState<Medicine | null>(null);

  const handleOpenAdjustment = (med?: Medicine) => {
    setAdjustmentTargetMed(med || selectedMedicine || null);
    setIsAdjustmentOpen(true);
  };

  const renderActivePage = () => {
    switch (currentPage) {
      case 'pos':
        return (
          <PosCounterBilling
            onOpenSalesReceipt={(bill) => setSelectedSalesBill(bill)}
          />
        );

      case 'sales-history':
        return (
          <SalesHistoryView
            onOpenNewSale={() => navigate('pos')}
            onOpenReceipt={(bill) => setSelectedSalesBill(bill)}
          />
        );

      case 'dashboard':
        return (
          <DashboardView
            onOpenAddMedicine={() => setIsAddMedicineOpen(true)}
            onOpenAddBill={() => setIsAddBillOpen(true)}
            onOpenAdjustment={() => handleOpenAdjustment()}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );

      case 'inventory':
      case 'medicine-details':
        return (
          <MedicineList
            onOpenAdd={() => setIsAddMedicineOpen(true)}
            onOpenAdjustment={(med) => handleOpenAdjustment(med)}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );

      case 'expiry':
        return (
          <AlertsCenter
            initialTab="expiry"
            onOpenAddBill={() => setIsAddBillOpen(true)}
            onOpenAdjustment={(med) => handleOpenAdjustment(med)}
          />
        );

      case 'low-stock':
        return (
          <AlertsCenter
            initialTab="low-stock"
            onOpenAddBill={() => setIsAddBillOpen(true)}
            onOpenAdjustment={(med) => handleOpenAdjustment(med)}
          />
        );

      case 'purchase-bills':
      case 'add-purchase-bill':
        return (
          <PurchaseBillsList
            onOpenAddBill={() => setIsAddBillOpen(true)}
            onOpenInvoice={(bill) => setSelectedBill(bill)}
          />
        );

      case 'vendors':
        return (
          <VendorsList
            onOpenAddVendor={() => setIsAddVendorOpen(true)}
          />
        );

      case 'stock-movements':
        return (
          <StockMovementsList
            onOpenAdjustment={() => handleOpenAdjustment()}
          />
        );

      case 'reports':
        return <ReportsView />;

      case 'price-comparison':
        return (
          <SupplierPriceComparisonView
            onOpenAddBill={() => setIsAddBillOpen(true)}
            onOpenMedicineDetail={(med) => setSelectedMedicine(med)}
          />
        );

      case 'settings':
        return <SettingsView />;

      default:
        return (
          <DashboardView
            onOpenAddMedicine={() => setIsAddMedicineOpen(true)}
            onOpenAddBill={() => setIsAddBillOpen(true)}
            onOpenAdjustment={() => handleOpenAdjustment()}
            onOpenScanner={() => setIsScannerOpen(true)}
          />
        );
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-50 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header */}
        <Header
          onOpenMenu={() => setIsDrawerOpen(true)}
          onOpenAddMedicine={() => setIsAddMedicineOpen(true)}
          onOpenAddBill={() => setIsAddBillOpen(true)}
          onOpenAdjustment={() => handleOpenAdjustment()}
          onOpenScanner={() => setIsScannerOpen(true)}
        />

        {/* Scrollable Page Canvas with Fast Instant Transitions */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 pb-28 md:pb-8">
          <Suspense fallback={<PageLoader />}>
            <motion.div
              key={currentPage}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.12 }}
              className="w-full"
            >
              {renderActivePage()}
            </motion.div>
          </Suspense>
        </main>
      </div>

      {/* Android Style Slide-out Navigation Drawer */}
      <AndroidNavDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenAddMedicine={() => setIsAddMedicineOpen(true)}
        onOpenAddBill={() => setIsAddBillOpen(true)}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Mobile Bottom Navigation (Android Material 3) */}
      <MobileNav onOpenMenu={() => setIsDrawerOpen(true)} />

      {/* Mobile Floating Action Button */}
      <QuickActionFab
        onOpenAddMedicine={() => setIsAddMedicineOpen(true)}
        onOpenAddBill={() => setIsAddBillOpen(true)}
        onOpenAdjustment={() => handleOpenAdjustment()}
        onOpenScanner={() => setIsScannerOpen(true)}
      />

      {/* Global Search Omnibar */}
      <GlobalSearchModal
        isOpen={globalSearchOpen}
        onClose={() => setGlobalSearchOpen(false)}
        onOpenAddMedicine={() => setIsAddMedicineOpen(true)}
        onOpenAddBill={() => setIsAddBillOpen(true)}
      />

      {/* Lazy-Loaded Modals */}
      <Suspense fallback={null}>
        {isAddMedicineOpen && (
          <AddMedicineModal
            isOpen={isAddMedicineOpen}
            onClose={() => setIsAddMedicineOpen(false)}
          />
        )}

        {selectedMedicine && (
          <MedicineDetailModal
            onClose={() => setSelectedMedicine(null)}
            onOpenAdjustment={() => handleOpenAdjustment(selectedMedicine)}
            onOpenAddBill={() => setIsAddBillOpen(true)}
          />
        )}

        {isAdjustmentOpen && (
          <StockAdjustmentModal
            isOpen={isAdjustmentOpen}
            onClose={() => {
              setIsAdjustmentOpen(false);
              setAdjustmentTargetMed(null);
            }}
            preselectedMedicine={adjustmentTargetMed}
          />
        )}

        {isScannerOpen && (
          <BarcodeScannerModal
            isOpen={isScannerOpen}
            onClose={() => setIsScannerOpen(false)}
          />
        )}

        {isAddBillOpen && (
          <AddPurchaseBillModal
            isOpen={isAddBillOpen}
            onClose={() => setIsAddBillOpen(false)}
          />
        )}

        {selectedBill && (
          <BillInvoiceModal
            bill={selectedBill}
            onClose={() => setSelectedBill(null)}
          />
        )}

        {selectedSalesBill && (
          <SalesBillInvoiceModal
            bill={selectedSalesBill}
            onClose={() => setSelectedSalesBill(null)}
          />
        )}

        {isAddVendorOpen && (
          <AddVendorModal
            isOpen={isAddVendorOpen}
            onClose={() => setIsAddVendorOpen(false)}
          />
        )}
      </Suspense>
    </div>
  );
};

export function App() {
  return (
    <InventoryProvider>
      <MainLayout />
    </InventoryProvider>
  );
}

export default App;
