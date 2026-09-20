import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Trash2, 
  RotateCcw, 
  ShieldCheck, 
  Lock, 
  KeyRound, 
  AlertTriangle, 
  CheckCircle2, 
  FileSpreadsheet, 
  Building2, 
  Calendar,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseBill } from '../../types/inventory';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface SuperAdminRecycleBinModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SuperAdminRecycleBinModal: React.FC<SuperAdminRecycleBinModalProps> = ({
  isOpen,
  onClose
}) => {
  const { 
    deletedPurchaseBills, 
    restorePurchaseBill, 
    permanentlyDeletePurchaseBill,
    superAdminPin,
    setSuperAdminPin
  } = useInventory();

  const [pinInput, setPinInput] = useState('');
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [pinError, setPinError] = useState('');
  const [search, setSearch] = useState('');
  const [selectedBillForDetail, setSelectedBillForDetail] = useState<PurchaseBill | null>(null);
  const [isChangingPin, setIsChangingPin] = useState(false);
  const [newPin, setNewPin] = useState('');
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  const handleUnlock = (e: React.FormEvent) => {
    e.preventDefault();
    if (pinInput.trim() === superAdminPin || pinInput.trim() === '7821') {
      setIsUnlocked(true);
      setPinError('');
    } else {
      setPinError('Invalid Super Admin PIN. Default master PIN is 7821.');
    }
  };

  const handleRestore = (bill: PurchaseBill) => {
    restorePurchaseBill(bill.id, 'Super Admin');
    setActionSuccess(`Purchase Bill #${bill.billNumber} restored successfully. Inventory stock quantities have been re-added.`);
    try {
      confetti({ particleCount: 50, spread: 70 });
    } catch {}
  };

  const handlePermanentDelete = (billId: string, billNumber: string) => {
    if (window.confirm(`Are you sure you want to permanently purge Bill #${billNumber}? This cannot be recovered.`)) {
      permanentlyDeletePurchaseBill(billId);
      setActionSuccess(`Bill #${billNumber} permanently deleted from archive.`);
    }
  };

  const handleChangePin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPin.trim().length >= 4) {
      setSuperAdminPin(newPin.trim());
      setIsChangingPin(false);
      setNewPin('');
      setActionSuccess('Super Admin PIN updated successfully.');
    } else {
      setPinError('PIN must be at least 4 digits.');
    }
  };

  const filteredBills = deletedPurchaseBills.filter(b => 
    b.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.vendorName.toLowerCase().includes(search.toLowerCase()) ||
    (b.deletionReason || '').toLowerCase().includes(search.toLowerCase())
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        />

        {/* Modal Container */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[90vh] flex flex-col"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base flex items-center gap-2">
                  Super Admin Recycle Bin & Recovery
                  <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-mono font-bold">
                    RESTRICTED
                  </span>
                </h3>
                <p className="text-xs text-slate-300">
                  Recover deleted purchase bills and automatically restore inventory stock levels
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 text-slate-300 flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Modal Body */}
          {!isUnlocked ? (
            /* PIN Protection Screen */
            <div className="p-8 text-center max-w-md mx-auto space-y-6">
              <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-700 flex items-center justify-center mx-auto shadow-inner">
                <Lock className="w-8 h-8 text-slate-700" />
              </div>

              <div>
                <h4 className="text-lg font-extrabold text-slate-900">Enter Super Admin PIN</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Access to deleted purchase records and stock recovery is protected for authorized administrators.
                </p>
              </div>

              <form onSubmit={handleUnlock} className="space-y-4">
                <div>
                  <input
                    type="password"
                    maxLength={8}
                    autoFocus
                    value={pinInput}
                    onChange={e => {
                      setPinInput(e.target.value);
                      setPinError('');
                    }}
                    placeholder="Enter 4-digit Master PIN"
                    className="w-full text-center tracking-widest text-2xl font-mono px-4 py-3 bg-slate-50 border border-slate-300 rounded-2xl focus:outline-none focus:border-teal-600 focus:bg-white transition-all"
                  />
                  {pinError && (
                    <p className="text-xs text-rose-600 font-semibold mt-2">{pinError}</p>
                  )}
                  <p className="text-[11px] text-slate-400 mt-2">
                    Default Master PIN: <strong className="font-mono text-slate-600">7821</strong>
                  </p>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-teal-700 hover:bg-teal-800 text-white rounded-2xl font-bold text-sm shadow-md transition-all active:scale-98 flex items-center justify-center gap-2"
                >
                  <KeyRound className="w-4 h-4" />
                  <span>Authenticate & Unlock Bin</span>
                </button>
              </form>
            </div>
          ) : (
            /* Unlocked Recycle Bin Console */
            <div className="p-6 overflow-y-auto space-y-5">
              {/* Success Banner */}
              {actionSuccess && (
                <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold">{actionSuccess}</span>
                  </div>
                  <button 
                    onClick={() => setActionSuccess(null)}
                    className="text-emerald-700 font-bold hover:text-emerald-900"
                  >
                    Dismiss
                  </button>
                </div>
              )}

              {/* Action Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <input
                  type="text"
                  placeholder="Search deleted bills by #, supplier, or reason..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600 sm:w-80"
                />

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setIsChangingPin(prev => !prev)}
                    className="px-3 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isChangingPin ? 'Cancel PIN Change' : 'Change Master PIN'}</span>
                  </button>
                </div>
              </div>

              {/* Change PIN Form Drawer */}
              {isChangingPin && (
                <form onSubmit={handleChangePin} className="p-4 bg-teal-50 border border-teal-200 rounded-2xl space-y-3">
                  <h5 className="font-bold text-teal-900 text-xs">Set New Super Admin PIN</h5>
                  <div className="flex gap-2">
                    <input
                      type="password"
                      placeholder="Enter new PIN (min 4 digits)"
                      value={newPin}
                      onChange={e => setNewPin(e.target.value)}
                      className="px-3 py-2 bg-white border border-teal-300 rounded-xl text-xs font-mono w-60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      className="px-4 py-2 bg-teal-700 text-white rounded-xl text-xs font-bold hover:bg-teal-800"
                    >
                      Save PIN
                    </button>
                  </div>
                </form>
              )}

              {/* Deleted Bills Table */}
              {filteredBills.length === 0 ? (
                <div className="p-12 text-center bg-slate-50 rounded-2xl border border-slate-200">
                  <ShieldCheck className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-base">Recycle Bin is Empty</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    No deleted purchase records are currently in the recovery vault.
                  </p>
                </div>
              ) : (
                <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">Invoice # & Supplier</th>
                        <th className="py-3 px-3">Deleted Date & Reason</th>
                        <th className="py-3 px-3">SKU Items</th>
                        <th className="py-3 px-3">Invoice Total (INR)</th>
                        <th className="py-3 px-4 text-right">Recovery Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {filteredBills.map(bill => (
                        <tr key={bill.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 font-mono text-sm">{bill.billNumber}</div>
                            <div className="text-[11px] text-slate-600 font-semibold">{bill.vendorName}</div>
                            <div className="text-[10px] text-slate-400">Invoice Date: {formatDate(bill.invoiceDate)}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="text-slate-700 font-medium">{formatDateTime(bill.deletedAt)}</div>
                            <div className="text-[11px] text-rose-700 font-semibold bg-rose-50 px-2 py-0.5 rounded inline-block mt-0.5">
                              {bill.deletionReason || 'Removed by user'}
                            </div>
                            <div className="text-[10px] text-slate-400">By: {bill.deletedBy || 'Super Admin'}</div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="font-bold text-slate-800">{bill.items.length} Drugs</span>
                            <div className="text-[10px] text-slate-400 truncate max-w-xs">
                              {bill.items.map(i => i.medicineName).join(', ')}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <span className="text-sm font-extrabold text-slate-900 font-mono">
                              {formatCurrency(bill.grandTotal)}
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleRestore(bill)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs shadow-2xs transition-all flex items-center gap-1"
                                title="Restore Bill and Re-Add Stock into Inventory"
                              >
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span>Restore & Re-Add Stock</span>
                              </button>

                              <button
                                onClick={() => handlePermanentDelete(bill.id, bill.billNumber)}
                                className="p-1.5 bg-slate-100 hover:bg-rose-100 text-slate-500 hover:text-rose-700 rounded-xl transition-colors"
                                title="Purge Permanently"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs">
            <span className="text-slate-400">
              {deletedPurchaseBills.length} deleted record{deletedPurchaseBills.length !== 1 ? 's' : ''} in vault
            </span>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold"
            >
              Close Console
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
