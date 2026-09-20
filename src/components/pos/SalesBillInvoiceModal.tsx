import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle2 } from 'lucide-react';
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

  return (
    <AnimatePresence>
      {bill && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
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
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none print:p-0"
          >
            {/* Top Header Controls (Hidden on Print) */}
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">Retail Cash Memo #{bill.billNumber}</span>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold flex items-center gap-1 ${
                  bill.paymentMethod === 'Credit'
                    ? 'bg-amber-100 text-amber-900'
                    : 'bg-emerald-100 text-emerald-800'
                }`}>
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Paid via {bill.paymentMethod}</span>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Cash Memo</span>
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 cursor-pointer transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Printable Cash Memo Body */}
            <div className="p-6 sm:p-8 overflow-y-auto space-y-5 text-xs text-slate-700 print:p-4 print:space-y-4">
              {/* Pharmacy Title & Masthead */}
              <div className="text-center pb-4 border-b-2 border-slate-900/10 space-y-1">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-teal-700 text-white font-black flex items-center justify-center text-base shadow-xs">
                    +
                  </div>
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {currentPharmacyName}
                  </h1>
                </div>
                <p className="text-slate-700 font-medium text-xs">
                  {currentAddress}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                  <span>Drug Lic: <strong className="text-slate-700 font-mono">{currentDlNumber}</strong></span>
                  <span>•</span>
                  <span>GSTIN: <strong className="text-slate-700 font-mono">{currentGstin}</strong></span>
                  <span>•</span>
                  <span>Ph: <strong className="text-slate-700">{currentPhone}</strong></span>
                </div>
                <div className="pt-2">
                  <span className="inline-block px-4 py-1 bg-slate-900 text-white font-extrabold text-[10px] tracking-widest rounded-full uppercase shadow-xs">
                    RETAIL CASH MEMO / DISPENSING INVOICE
                  </span>
                </div>
              </div>

              {/* Receipt Meta & Customer / Doctor Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200/80 text-xs">
                {/* Left Side: Invoice Details */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-24">Receipt No:</span>
                    <strong className="font-mono text-slate-900 font-bold">#{bill.billNumber}</strong>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-24">Date & Time:</span>
                    <strong className="text-slate-800 font-medium">{formatDateTime(bill.date)}</strong>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-24">Pharmacist:</span>
                    <strong className="text-slate-800 font-medium">{bill.pharmacistName || pharmacyProfile?.pharmacistName || 'Pharmacist In-Charge'}</strong>
                  </div>
                </div>

                {/* Right Side: Customer & Doctor Details */}
                <div className="space-y-1.5 border-t sm:border-t-0 sm:border-l border-slate-200 pt-2 sm:pt-0 sm:pl-4">
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-24">Patient Name:</span>
                    <strong className="text-slate-900 font-bold">{bill.customerName || 'Walk-in Customer'}</strong>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-24">Mobile Phone:</span>
                    <strong className="font-mono text-slate-800 font-medium">{bill.customerPhone || '—'}</strong>
                  </div>
                  <div className="flex items-center justify-between sm:justify-start gap-2">
                    <span className="text-[10px] uppercase font-bold text-slate-400 w-24">Doctor:</span>
                    <strong className="text-teal-900 font-bold">{bill.doctorName || defaultDoctor}</strong>
                  </div>
                </div>
              </div>

              {/* Itemized Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    <tr>
                      <th className="py-2.5 px-3 text-center w-8">#</th>
                      <th className="py-2.5 px-3">Medicine Description</th>
                      <th className="py-2.5 px-2 text-center w-20">Batch</th>
                      <th className="py-2.5 px-2 text-center w-20">Exp</th>
                      <th className="py-2.5 px-2 text-center w-20">Form</th>
                      <th className="py-2.5 px-2 text-center w-14">Qty</th>
                      <th className="py-2.5 px-3 text-right w-20">Rate</th>
                      <th className="py-2.5 px-3 text-right w-24">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-xs">
                    {bill.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/70">
                        <td className="py-2 px-3 text-center text-slate-400 text-[11px] font-mono">{idx + 1}</td>
                        <td className="py-2 px-3">
                          <div className="font-bold text-slate-900 text-xs">{item.medicineName}</div>
                          {item.genericName && item.genericName !== item.medicineName && (
                            <div className="text-[10px] text-slate-400 font-normal">{item.genericName}</div>
                          )}
                        </td>
                        <td className="py-2 px-2 text-center font-mono text-slate-600 text-[11px]">{item.batchNumber}</td>
                        <td className="py-2 px-2 text-center text-slate-600 text-[11px]">{formatDate(item.expiryDate)}</td>
                        <td className="py-2 px-2 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            item.sellMode === 'LOOSE' ? 'bg-amber-100 text-amber-900' : 'bg-teal-100 text-teal-800'
                          }`}>
                            {item.sellMode === 'LOOSE' ? 'Loose Tab' : 'Full Pack'}
                          </span>
                        </td>
                        <td className="py-2 px-2 text-center font-extrabold text-slate-900">{item.quantity}</td>
                        <td className="py-2 px-3 text-right font-medium text-slate-700">
                          {formatCurrency(item.sellMode === 'LOOSE' ? item.unitPrice : item.packPrice)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-slate-900">
                          {formatCurrency(item.totalAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Totals & Payment Summary Card */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pt-3 border-t border-slate-200">
                <div className="text-[11px] text-slate-500 space-y-1">
                  <div>Payment Status: <strong className={bill.paymentStatus === 'PAID' ? 'text-emerald-700' : 'text-amber-700'}>{bill.paymentStatus}</strong></div>
                  <div>Payment Method: <strong>{bill.paymentMethod}</strong></div>
                  {bill.notes && <div className="text-slate-400 italic">Note: {bill.notes}</div>}
                </div>

                <div className="w-full sm:w-64 bg-slate-50 p-3.5 rounded-2xl border border-slate-200/80 space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Subtotal:</span>
                    <span className="font-semibold text-slate-800">{formatCurrency(bill.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>GST (Included):</span>
                    <span className="font-semibold text-slate-700">{formatCurrency(bill.taxAmount)}</span>
                  </div>
                  {bill.discountAmount > 0 && (
                    <div className="flex justify-between text-emerald-600 font-semibold">
                      <span>Discount:</span>
                      <span>-{formatCurrency(bill.discountAmount)}</span>
                    </div>
                  )}
                  <div className="pt-2 border-t border-slate-200 flex justify-between items-center">
                    <span className="text-sm font-extrabold text-slate-900">Grand Total:</span>
                    <span className="text-lg font-black text-teal-800">{formatCurrency(bill.grandTotal)}</span>
                  </div>
                  {bill.paymentMethod === 'Credit' && (
                    <div className="pt-1 flex justify-between items-center text-xs font-bold text-rose-600 border-t border-dashed border-slate-200">
                      <span>Outstanding Udhaar:</span>
                      <span>{formatCurrency(bill.balanceDue !== undefined ? bill.balanceDue : bill.grandTotal)}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Note */}
              <div className="pt-4 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-0.5">
                <p className="font-medium text-slate-600">
                  Thank you for visiting {currentPharmacyName}. Take medicines only as prescribed by {defaultDoctor}.
                </p>
                <p>Keep out of reach of children. Store medicines in a cool, dry place.</p>
              </div>
            </div>

            {/* Modal Bottom Controls (Hidden on print) */}
            <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
              <span className="text-[11px] text-slate-400">
                Authorized computer generated tax dispensing memo
              </span>
              <button
                onClick={onClose}
                className="px-4 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
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

