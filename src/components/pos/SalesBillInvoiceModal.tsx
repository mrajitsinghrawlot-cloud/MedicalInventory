import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle2, AlertCircle } from 'lucide-react';
import { SalesBill } from '../../types/inventory';
import { useInventory } from '../../context/InventoryContext';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface SalesBillInvoiceModalProps {
  bill: SalesBill | null;
  onClose: () => void;
}

export const SalesBillInvoiceModal: React.FC<SalesBillInvoiceModalProps> = ({ bill, onClose }) => {
  const { pharmacyProfile } = useInventory();

  const handlePrint = () => {
    window.print();
  };

  const currentPharmacyName = pharmacyProfile?.pharmacyName || 'Santoshi Maa Medical';
  const currentAddress = pharmacyProfile?.address || 'Basni 2nd Phase Near Dr. Adarsh School';
  const currentPhone = pharmacyProfile?.phone || '+91 98290 12345';
  const currentDlNumber = pharmacyProfile?.dlNumber || 'DL-20B/21B-48190';
  const currentGstin = pharmacyProfile?.gstin || '08AAAAA0000A1Z5';
  const defaultDoctor = pharmacyProfile?.defaultDoctorName || 'Dr. Jai';

  const isCreditSale = bill?.paymentMethod === 'Credit';
  const isUnpaid = isCreditSale && (bill?.paymentStatus === 'UNPAID' || (bill?.balanceDue && bill.balanceDue > 0));

  return (
    <AnimatePresence>
      {bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs print:hidden"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[94vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none print:p-0"
          >
            {/* Top Header Controls (Hidden on Print) */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs sm:text-sm">Memo #{bill.billNumber}</span>
                {isUnpaid ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                    <span>Udhaar (Credit)</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] sm:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600 shrink-0" />
                    <span>Paid via {bill.paymentMethod}</span>
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Print Cash Memo</span>
                  <span className="sm:hidden">Print</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Cash Memo Body */}
            <div className="p-4 sm:p-7 overflow-y-auto space-y-4 text-xs text-slate-700 print:p-4 print:space-y-3">
              {/* Pharmacy Title & Masthead */}
              <div className="text-center pb-3 border-b border-slate-200 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 sm:w-7 sm:h-7 rounded-lg bg-teal-700 text-white font-black flex items-center justify-center text-sm shadow-xs shrink-0">
                    +
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentPharmacyName}
                  </h1>
                </div>
                <p className="text-slate-700 font-medium text-[11px] sm:text-xs">
                  {currentAddress}
                </p>
                <div className="text-[10px] sm:text-[11px] text-slate-500 font-mono flex flex-wrap items-center justify-center gap-x-2 gap-y-0.5">
                  <span>DL: <strong className="text-slate-700">{currentDlNumber}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span>GSTIN: <strong className="text-slate-700">{currentGstin}</strong></span>
                  <span className="text-slate-300">|</span>
                  <span className="font-sans">Ph: <strong className="text-slate-700">{currentPhone}</strong></span>
                </div>
                <div className="pt-1">
                  <span className="inline-block px-3 py-0.5 bg-slate-900 text-white font-extrabold text-[9px] sm:text-[10px] tracking-widest rounded-full uppercase">
                    RETAIL CASH MEMO / DISPENSING INVOICE
                  </span>
                </div>
              </div>

              {/* Receipt Meta & Customer / Doctor Compact Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs">
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Receipt No</span>
                  <strong className="font-mono text-slate-900 font-bold text-xs">#{bill.billNumber}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Date & Time</span>
                  <strong className="text-slate-800 font-medium text-[11px] block">{formatDateTime(bill.date)}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Prescribed By</span>
                  <strong className="text-teal-900 font-bold text-[11px] block">{bill.doctorName || defaultDoctor}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Patient Name</span>
                  <strong className="text-slate-900 font-bold text-[11px] block">{bill.customerName || 'Walk-in Customer'}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Mobile Phone</span>
                  <strong className="font-mono text-slate-800 font-medium text-[11px] block">{bill.customerPhone || '—'}</strong>
                </div>
                <div>
                  <span className="text-[9px] uppercase font-bold text-slate-400 block">Pharmacist</span>
                  <strong className="text-slate-800 font-medium text-[11px] block">{bill.pharmacistName || pharmacyProfile?.pharmacistName || 'Pharmacist In-Charge'}</strong>
                </div>
              </div>

              {/* Itemized Table (Horizontally scrollable on small mobile, never clipped) */}
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse min-w-[500px]">
                    <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                      <tr>
                        <th className="py-2 px-2.5 text-center w-8">#</th>
                        <th className="py-2 px-2.5">Medicine Description</th>
                        <th className="py-2 px-2 text-center w-20">Batch</th>
                        <th className="py-2 px-2 text-center w-20">Exp</th>
                        <th className="py-2 px-2 text-center w-16">Unit</th>
                        <th className="py-2 px-2 text-center w-12">Qty</th>
                        <th className="py-2 px-2.5 text-right w-20">Rate (₹)</th>
                        <th className="py-2 px-2.5 text-right w-20">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-[11px]">
                      {bill.items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/70">
                          <td className="py-2 px-2.5 text-center text-slate-400 font-mono">{idx + 1}</td>
                          <td className="py-2 px-2.5">
                            <div className="font-bold text-slate-900 text-xs">{item.medicineName}</div>
                            {item.genericName && item.genericName !== item.medicineName && (
                              <div className="text-[10px] text-slate-400 font-normal">{item.genericName}</div>
                            )}
                          </td>
                          <td className="py-2 px-2 text-center font-mono text-slate-600 text-[11px] whitespace-nowrap">{item.batchNumber}</td>
                          <td className="py-2 px-2 text-center text-slate-600 text-[11px] whitespace-nowrap">{formatDate(item.expiryDate)}</td>
                          <td className="py-2 px-2 text-center whitespace-nowrap">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              item.sellMode === 'LOOSE' ? 'bg-amber-100 text-amber-900' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {item.sellMode === 'LOOSE' ? 'Loose' : 'Pack'}
                            </span>
                          </td>
                          <td className="py-2 px-2 text-center font-extrabold text-slate-900">{item.quantity}</td>
                          <td className="py-2 px-2.5 text-right font-medium text-slate-700">
                            {formatCurrency(item.sellMode === 'LOOSE' ? item.unitPrice : item.packPrice)}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-slate-900">
                            {formatCurrency(item.totalAmount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Totals & Payment Breakdown */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-3 pt-2 border-t border-slate-200">
                <div className="text-[11px] text-slate-600 space-y-1">
                  <div className="flex items-center gap-1.5">
                    <span>Payment Mode:</span>
                    <strong className={isCreditSale ? 'text-amber-800' : 'text-slate-900'}>
                      {bill.paymentMethod} {isCreditSale && '(Udhaar)'}
                    </strong>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span>Status:</span>
                    <span className={`font-bold px-1.5 py-0.2 rounded text-[10px] ${
                      bill.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                    }`}>
                      {bill.paymentStatus}
                    </span>
                  </div>
                  {bill.notes && <div className="text-slate-400 italic text-[10px]">Note: {bill.notes}</div>}
                </div>

                <div className="w-full sm:w-60 bg-slate-50 p-3 rounded-xl border border-slate-200/80 space-y-1 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 text-[11px]">
                    <span>GST (Included in MRP):</span>
                    <span className="font-medium text-slate-600">{formatCurrency(bill.taxAmount)}</span>
                  </div>
                  {bill.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>-{formatCurrency(bill.discountAmount)}</span>
                    </div>
                  )}
                  <div className="pt-1.5 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-900">Grand Total:</span>
                    <span className="text-base font-black text-teal-800">{formatCurrency(bill.grandTotal)}</span>
                  </div>
                  {isCreditSale && (
                    <div className="pt-1 flex justify-between items-center text-xs font-bold text-rose-600 border-t border-dashed border-slate-200">
                      <span>Outstanding Udhaar:</span>
                      <span>{formatCurrency(bill.balanceDue !== undefined ? bill.balanceDue : bill.grandTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-0.5">
                <p className="font-medium text-slate-600">
                  Thank you for visiting {currentPharmacyName}. Take medicines only as prescribed by {defaultDoctor}.
                </p>
                <p>Keep out of reach of children. Store medicines in a cool, dry place.</p>
              </div>
            </div>

            {/* Modal Bottom Controls (Hidden on print) */}
            <div className="px-4 sm:px-6 py-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-[10px] sm:text-[11px] text-slate-400 truncate mr-2">
                Computer generated dispensing cash memo
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer shrink-0"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

