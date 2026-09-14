import React, { useState, Suspense, lazy } from 'react';
import { motion } from 'framer-motion';
import { InventoryProvider, useInventory } from './context/InventoryContext';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { MobileNav } from './components/layout/MobileNav';
import { AndroidNavDrawer } from './components/layout/AndroidNavDrawer';
import { QuickActionFab } from './components/layout/QuickActionFab';
import { GlobalSearchModal } from './components/layout/GlobalSearchModal';

// Fast Lazy-loaded Views (Code Splitting)
const DashboardView = lazy(() => import('./components/dashboard/DashboardView').then(m => ({ default: m.DashboardView })));
const PosCounterBilling = lazy(() => import('./components/pos/PosCounterBilling').then(m => ({ default: m.PosCounterBilling })));
const SalesHistoryView = lazy(() => import('./components/pos/SalesHistoryView').then(m => ({ default: m.SalesHistoryView })));
const MedicineList = lazy(() => import('./components/inventory/MedicineList').then(m => ({ default: m.MedicineList })));
const AlertsCenter = lazy(() => import('./components/alerts/AlertsCenter').then(m => ({ default: m.AlertsCenter })));
const PurchaseBillsList = lazy(() => import('./components/bills/PurchaseBillsList').then(m => ({ default: m.PurchaseBillsList })));
const VendorsList = lazy(() => import('./components/vendors/VendorsList').then(m => ({ default: m.VendorsList })));
const StockMovementsList = lazy(() => import('./components/audit/StockMovementsList').then(m => ({ default: m.StockMovementsList })));
const ReportsView = lazy(() => import('./components/reports/ReportsView').then(m => ({ default: m.ReportsView })));
const SettingsView = lazy(() => import('./components/settings/SettingsView').then(m => ({ default: m.SettingsView })));

// Fast Lazy-loaded Modals
const AddMedicineModal = lazy(() => import('./components/inventory/AddMedicineModal').then(m => ({ default: m.AddMedicineModal })));
const MedicineDetailModal = lazy(() => import('./components/inventory/MedicineDetailModal').then(m => ({ default: m.MedicineDetailModal })));
const StockAdjustmentModal = lazy(() => import('./components/inventory/StockAdjustmentModal').then(m => ({ default: m.StockAdjustmentModal })));
const BarcodeScannerModal = lazy(() => import('./components/inventory/BarcodeScannerModal').then(m => ({ default: m.BarcodeScannerModal })));
const AddPurchaseBillModal = lazy(() => import('./components/bills/AddPurchaseBillModal').then(m => ({ default: m.AddPurchaseBillModal })));
const BillInvoiceModal = lazy(() => import('./components/bills/BillInvoiceModal').then(m => ({ default: m.BillInvoiceModal })));
const SalesBillInvoiceModal = lazy(() => import('./components/pos/SalesBillInvoiceModal').then(m => ({ default: m.SalesBillInvoiceModal })));
const AddVendorModal = lazy(() => import('./components/vendors/AddVendorModal').then(m => ({ default: m.AddVendorModal })));

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
