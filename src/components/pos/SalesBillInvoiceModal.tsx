import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, CheckCircle2 } from 'lucide-react';
import { SalesBill } from '../../types/inventory';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface SalesBillInvoiceModalProps {
  bill: SalesBill | null;
  onClose: () => void;
}

export const SalesBillInvoiceModal: React.FC<SalesBillInvoiceModalProps> = ({ bill, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

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
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs print:hidden"
            onClick={onClose}
          />

          {/* Modal Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none"
          >
            {/* Top Header Controls (Hidden on Print) */}
            <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-sm">Retail Cash Memo #{bill.billNumber}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  <span>Paid via {bill.paymentMethod}</span>
                </span>
              </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="flex items-center gap-1 px-3 py-1.5 bg-teal-700 hover:bg-teal-800 text-white rounded-lg text-xs font-bold shadow-2xs transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Cash Memo</span>
            </button>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Printable Cash Memo Body */}
        <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700">
          {/* Pharmacy Title */}
          <div className="text-center pb-4 border-b border-slate-200 space-y-1">
            <div className="flex items-center justify-center gap-1.5">
              <div className="w-6 h-6 rounded-md bg-teal-700 text-white font-bold flex items-center justify-center text-xs">
                +
              </div>
              <h1 className="text-lg font-extrabold text-slate-900 tracking-tight">MediStock Hospital & Retail Pharmacy</h1>
            </div>
            <p className="text-slate-500 text-[11px]">42 Medical Center Boulevard, Healthcare District</p>
            <p className="text-slate-500 text-[10px]">
              Drug Lic: DL-20B/21B-48190 • GSTIN: 27AAAAA0000A1Z5 • Ph: +91 (022) 2891-9000
            </p>
            <div className="inline-block mt-1 px-3 py-0.5 bg-slate-100 rounded-full font-bold text-[10px] uppercase text-slate-700 tracking-wider">
              RETAIL DISPENSING CASH MEMO
            </div>
          </div>

          {/* Receipt Meta & Customer / Doctor */}
          <div className="grid grid-cols-2 gap-3 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-[11px]">
            <div>
              <div>Receipt No: <strong className="font-mono text-slate-900">{bill.billNumber}</strong></div>
              <div>Date & Time: <strong>{formatDateTime(bill.date)}</strong></div>
              <div>Pharmacist: <strong>{bill.pharmacistName}</strong></div>
            </div>
            <div className="text-right">
              <div>Patient: <strong className="text-slate-900">{bill.customerName}</strong></div>
              {bill.customerPhone && <div>Phone: <strong className="font-mono">{bill.customerPhone}</strong></div>}
              {bill.doctorName && <div>Prescribed By: <strong>{bill.doctorName}</strong></div>}
            </div>
          </div>

          {/* Itemized Table */}
          <table className="w-full text-left">
            <thead className="bg-slate-100 border-b border-slate-200 text-[10px] font-bold text-slate-600 uppercase">
              <tr>
                <th className="py-2 px-2">#</th>
                <th className="py-2 px-2">Medicine / Item</th>
                <th className="py-2 px-2">Batch</th>
                <th className="py-2 px-2">Exp</th>
                <th className="py-2 px-2 text-center">Unit Type</th>
                <th className="py-2 px-2 text-center">Qty</th>
                <th className="py-2 px-2 text-right">Rate (₹)</th>
                <th className="py-2 px-2 text-right">Amount (₹)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {bill.items.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-2.5 px-2 text-slate-400">{idx + 1}</td>
                  <td className="py-2.5 px-2">
                    <div className="font-bold text-slate-900">{item.medicineName}</div>
                    <div className="text-[10px] text-slate-400">{item.genericName}</div>
                  </td>
                  <td className="py-2.5 px-2 font-mono text-slate-600 text-[11px]">{item.batchNumber}</td>
                  <td className="py-2.5 px-2 text-slate-600">{formatDate(item.expiryDate)}</td>
                  <td className="py-2.5 px-2 text-center">
                    <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                      item.sellMode === 'LOOSE' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                    }`}>
                      {item.sellMode === 'LOOSE' ? 'Loose Tablet' : 'Full Strip'}
                    </span>
                  </td>
                  <td className="py-2.5 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                  <td className="py-2.5 px-2 text-right font-medium text-slate-700">
                    {formatCurrency(item.sellMode === 'LOOSE' ? item.unitPrice : item.packPrice)}
                  </td>
                  <td className="py-2.5 px-2 text-right font-extrabold text-slate-900">
                    {formatCurrency(item.totalAmount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Summary */}
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <div className="w-64 space-y-1 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal:</span>
                <span className="font-semibold text-slate-800">{formatCurrency(bill.subtotal)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (Included):</span>
                <span className="font-semibold text-slate-700">{formatCurrency(bill.taxAmount)}</span>
              </div>
              {bill.discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-semibold">
                  <span>Discount:</span>
                  <span>-{formatCurrency(bill.discountAmount)}</span>
                </div>
              )}
              <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                <span>Net Paid ({bill.paymentMethod}):</span>
                <span className="text-teal-800 text-base">{formatCurrency(bill.grandTotal)}</span>
              </div>
            </div>
          </div>

          {/* Footer Note */}
          <div className="pt-6 border-t border-slate-100 text-center text-[10px] text-slate-400 space-y-1">
            <p>Thank you for choosing MediStock Pharmacy. Take medicines only as prescribed by your doctor.</p>
            <p>Keep out of reach of children. Store in a cool, dry place.</p>
          </div>
        </div>

        {/* Modal Bottom (Hidden on print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end gap-2 print:hidden">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
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
