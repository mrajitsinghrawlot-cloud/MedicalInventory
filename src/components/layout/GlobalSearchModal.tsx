import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, Pill, FileSpreadsheet, Users2, Sparkles } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenAddMedicine: () => void;
  onOpenAddBill: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({
  isOpen,
  onClose,
  onOpenAddMedicine,
  onOpenAddBill
}) => {
  const { 
    medicines, 
    purchaseBills, 
    vendors, 
    setSelectedMedicine, 
    setSelectedBill, 
    setSelectedVendor, 
    navigate 
  } = useInventory();

  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
    }
  }, [isOpen]);

  const cleanQuery = query.toLowerCase().trim();

  // Match medicines by name, generic name, batch number, category, barcode
  const matchedMedicines = cleanQuery ? medicines.filter(m => 
    m.name.toLowerCase().includes(cleanQuery) ||
    m.genericName.toLowerCase().includes(cleanQuery) ||
    m.batchNumber.toLowerCase().includes(cleanQuery) ||
    m.barcode.includes(cleanQuery) ||
    m.category.toLowerCase().includes(cleanQuery)
  ).slice(0, 5) : [];

  // Match purchase bills by bill number or vendor name
  const matchedBills = cleanQuery ? purchaseBills.filter(b =>
    b.billNumber.toLowerCase().includes(cleanQuery) ||
    b.vendorName.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  // Match vendors by name or contact person
  const matchedVendors = cleanQuery ? vendors.filter(v =>
    v.name.toLowerCase().includes(cleanQuery) ||
    v.contactPerson.toLowerCase().includes(cleanQuery) ||
    v.city.toLowerCase().includes(cleanQuery)
  ).slice(0, 3) : [];

  const hasResults = matchedMedicines.length > 0 || matchedBills.length > 0 || matchedVendors.length > 0;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: -15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: -15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden z-10"
          >
            {/* Search Input Box */}
            <div className="flex items-center px-4 py-3.5 border-b border-slate-200 gap-3">
              <Search className="w-5 h-5 text-teal-600 shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
            placeholder="Type medicine name, salt, batch #, invoice, or vendor..."
            className="flex-1 text-slate-900 placeholder:text-slate-400 text-sm sm:text-base outline-none bg-transparent"
          />
          {query && (
            <button 
              onClick={() => setQuery('')}
              className="p-1 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex px-2 py-0.5 text-[10px] font-semibold text-slate-400 bg-slate-100 rounded">
            ESC
          </kbd>
        </div>

        {/* Results Area */}
        <div className="max-h-[60vh] overflow-y-auto p-3 space-y-4">
          {!query && (
            <div className="py-6 px-4 text-center">
              <Sparkles className="w-8 h-8 text-teal-500/50 mx-auto mb-2" />
              <div className="text-sm font-semibold text-slate-700">Quick Omnisearch</div>
              <div className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                Search through active stocks, batch numbers, invoices, suppliers, or launch quick actions.
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddMedicine();
                  }}
                  className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  + Add New Medicine
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onOpenAddBill();
                  }}
                  className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  + New Purchase Invoice
                </button>
                <button
                  onClick={() => {
                    onClose();
                    navigate('expiry');
                  }}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 text-xs font-semibold rounded-lg transition-colors"
                >
                  View Expiring Stock
                </button>
              </div>
            </div>
          )}

          {query && !hasResults && (
            <div className="py-12 text-center text-slate-400">
              <p className="text-sm font-medium text-slate-600">No results found for "{query}"</p>
              <p className="text-xs text-slate-400 mt-1">Try checking for typos or search by generic salt name</p>
            </div>
          )}

          {/* Medicines Group */}
          {matchedMedicines.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Medicines & Stock ({matchedMedicines.length})
              </div>
              <div className="space-y-1">
                {matchedMedicines.map(med => (
                  <div
                    key={med.id}
                    onClick={() => {
                      setSelectedMedicine(med);
                      navigate('inventory');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-teal-50/70 border border-transparent hover:border-teal-200 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                        <Pill className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-teal-900">
                          {med.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {med.genericName} • <span className="font-mono text-slate-400">Batch: {med.batchNumber}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {med.stockQuantity} units
                      </div>
                      <div className="text-[10px] text-slate-400">
                        MRP: {formatCurrency(med.mrp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bills Group */}
          {matchedBills.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Purchase Invoices ({matchedBills.length})
              </div>
              <div className="space-y-1">
                {matchedBills.map(bill => (
                  <div
                    key={bill.id}
                    onClick={() => {
                      setSelectedBill(bill);
                      navigate('purchase-bills');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-blue-50/70 border border-transparent hover:border-blue-200 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                        <FileSpreadsheet className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-blue-900">
                          {bill.billNumber}
                        </div>
                        <div className="text-xs text-slate-500">
                          {bill.vendorName} • {formatDate(bill.invoiceDate)}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold text-slate-900">
                        {formatCurrency(bill.grandTotal)}
                      </div>
                      <div className="text-[10px] font-semibold text-teal-700">
                        {bill.paymentStatus}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Vendors Group */}
          {matchedVendors.length > 0 && (
            <div>
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1.5">
                Suppliers / Vendors ({matchedVendors.length})
              </div>
              <div className="space-y-1">
                {matchedVendors.map(vendor => (
                  <div
                    key={vendor.id}
                    onClick={() => {
                      setSelectedVendor(vendor);
                      navigate('vendors');
                      onClose();
                    }}
                    className="flex items-center justify-between p-2.5 rounded-xl hover:bg-purple-50/70 border border-transparent hover:border-purple-200 cursor-pointer transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-purple-100 text-purple-700 flex items-center justify-center shrink-0">
                        <Users2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-slate-900 group-hover:text-purple-900">
                          {vendor.name}
                        </div>
                        <div className="text-xs text-slate-500">
                          {vendor.contactPerson} • {vendor.city}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-semibold text-slate-700">
                        {vendor.phone}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        Rating: ★ {vendor.rating}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer info */}
        <div className="p-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <div className="flex items-center gap-2">
            <span>Navigation:</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">↑</kbd>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">↓</kbd>
            <span className="ml-1">Select:</span>
            <kbd className="px-1.5 py-0.5 bg-white border border-slate-200 rounded text-slate-600 font-mono">↵</kbd>
          </div>
          <div>Press ESC to close</div>
        </div>
      </motion.div>
    </div>
      )}
    </AnimatePresence>
  );
};
