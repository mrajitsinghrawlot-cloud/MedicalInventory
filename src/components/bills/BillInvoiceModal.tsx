import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Printer, Download, CheckCircle2, Building2, Calendar, CreditCard, ShieldCheck, Trash2 } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseBill } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { DeletePurchaseBillModal } from './DeletePurchaseBillModal';

interface BillInvoiceModalProps {
  bill: PurchaseBill | null;
  onClose: () => void;
}

export const BillInvoiceModal: React.FC<BillInvoiceModalProps> = ({ bill, onClose }) => {
  const { updateBillPayment } = useInventory();
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  const balance = bill ? bill.grandTotal - (bill.paidAmount || 0) : 0;

  const handleMarkPaid = () => {
    if (bill) {
      updateBillPayment(bill.id, bill.grandTotal, 'PAID');
    }
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <>
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

            {/* Printable Invoice Card */}
            <motion.div 
              initial={{ opacity: 0, scale: 0.94, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 15 }}
              transition={{ type: "spring", damping: 25, stiffness: 350 }}
              className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col print:shadow-none print:border-none print:max-h-none print:rounded-none"
            >
              {/* Modal Top Bar (Hidden on print) */}
              <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-800 text-sm">Invoice #{bill.billNumber}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    bill.paymentStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                  }`}>
                    {bill.paymentStatus}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handlePrint}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold shadow-2xs"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Print / PDF</span>
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Invoice Printable Body */}
              <div className="p-8 overflow-y-auto space-y-6 text-xs text-slate-700">
                {/* Header & Logo */}
                <div className="flex justify-between items-start pb-6 border-b border-slate-200">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-7 h-7 rounded-lg bg-teal-700 flex items-center justify-center text-white font-bold text-sm">
                        +
                      </div>
                      <span className="text-xl font-extrabold text-slate-900 tracking-tight">MediStock Hospital Pharmacy</span>
                    </div>
                    <p className="text-slate-500">42 Medical Center Boulevard, Healthcare District</p>
                    <p className="text-slate-500">GSTIN: 27AAAAA0000A1Z5 • Drug Lic: DL-20B/21B-48190</p>
                    <p className="text-slate-500">Contact: +91 (022) 2891-9000 | support@medistock.health</p>
                  </div>

                  <div className="text-right">
                    <span className="text-xs uppercase font-extrabold text-slate-400 block tracking-wider">TAX INVOICE</span>
                    <div className="text-lg font-bold font-mono text-slate-900 mt-1">{bill.billNumber}</div>
                    <div className="text-slate-500 mt-1">Invoice Date: <strong>{formatDate(bill.invoiceDate)}</strong></div>
                    <div className="text-slate-500">Due Date: <strong>{formatDate(bill.dueDate)}</strong></div>
                  </div>
                </div>

                {/* Supplier Info */}
                <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Billed From (Vendor):</span>
                    <h3 className="font-bold text-slate-900 text-sm mt-0.5">{bill.vendorName}</h3>
                    <p className="text-slate-500 text-[11px] mt-0.5">Payment Terms: 30 Days Net</p>
                    <p className="text-slate-500 text-[11px]">Payment Mode: {bill.paymentMethod}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Payment Status:</span>
                    <div className="text-base font-extrabold text-slate-900 mt-0.5">{bill.paymentStatus}</div>
                    <div className="text-[11px] text-slate-500">Paid: {formatCurrency(bill.paidAmount || 0)}</div>
                    {balance > 0 && (
                      <div className="text-[11px] font-bold text-rose-600">Balance Due: {formatCurrency(balance)}</div>
                    )}
                  </div>
                </div>

                {/* Items Table */}
                <table className="w-full text-left">
                  <thead className="bg-slate-100 border-b border-slate-200 text-[11px] font-bold text-slate-600 uppercase">
                    <tr>
                      <th className="py-2.5 px-3">#</th>
                      <th className="py-2.5 px-3">Medicine Description</th>
                      <th className="py-2.5 px-3">Batch</th>
                      <th className="py-2.5 px-3">Expiry</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Rate (₹)</th>
                      <th className="py-2.5 px-2 text-center">GST</th>
                      <th className="py-2.5 px-3 text-right">Amount (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(bill.items || []).map((item, idx) => (
                      <tr key={idx}>
                        <td className="py-3 px-3 text-slate-400">{idx + 1}</td>
                        <td className="py-3 px-3 font-semibold text-slate-900">
                          {item.medicineName}
                          {item.freeQuantity ? (
                            <span className="ml-1 text-[10px] text-emerald-600 font-bold">(+{item.freeQuantity} Free)</span>
                          ) : null}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">{item.batchNumber}</td>
                        <td className="py-3 px-3 text-slate-600">{formatDate(item.expiryDate)}</td>
                        <td className="py-3 px-2 text-center font-bold text-slate-900">{item.quantity}</td>
                        <td className="py-3 px-3 text-right text-slate-700">{formatCurrency(item.purchasePrice || 0)}</td>
                        <td className="py-3 px-2 text-center text-slate-500">{item.gstRate ?? 12}%</td>
                        <td className="py-3 px-3 text-right font-bold text-slate-900">{formatCurrency(item.totalAmount || 0)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Summary Box */}
                <div className="flex justify-end pt-4 border-t border-slate-200">
                  <div className="w-72 space-y-1.5 text-xs">
                    <div className="flex justify-between text-slate-500">
                      <span>Subtotal:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(bill.subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>GST Tax Total:</span>
                      <span className="font-semibold text-slate-800">{formatCurrency(bill.taxAmount)}</span>
                    </div>
                    {bill.discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-medium">
                        <span>Special Discount:</span>
                        <span>-{formatCurrency(bill.discountAmount)}</span>
                      </div>
                    )}
                    {bill.roundOff !== undefined && bill.roundOff !== 0 && (
                      <div className="flex justify-between text-slate-500 font-medium">
                        <span>Round Off:</span>
                        <span>{bill.roundOff > 0 ? `+${formatCurrency(bill.roundOff)}` : formatCurrency(bill.roundOff)}</span>
                      </div>
                    )}
                    <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                      <span>Grand Total:</span>
                      <span className="text-teal-800">{formatCurrency(bill.grandTotal)}</span>
                    </div>
                  </div>
                </div>

                {/* Verification stamp & signature */}
                <div className="pt-8 grid grid-cols-2 gap-8 border-t border-slate-100 text-[11px] text-slate-400">
                  <div>
                    <p className="font-semibold text-slate-700">Notes / Instructions:</p>
                    <p className="mt-1">{bill.notes || 'Goods received in good condition. All batches temperature verified.'}</p>
                  </div>
                  <div className="text-right space-y-8">
                    <p className="font-semibold text-slate-700">Authorized Signatory</p>
                    <div className="border-b border-slate-300 w-40 ml-auto" />
                    <p className="text-[10px]">Chief Pharmacist & Quality In-charge</p>
                  </div>
                </div>
              </div>

              {/* Footer Actions (Hidden on print) */}
              <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
                <div className="flex items-center gap-2">
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => setIsDeleteOpen(true)}
                    className="px-3 py-2 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Delete Bill & Reverse Stock</span>
                  </button>
                </div>

                {balance > 0 && (
                  <button
                    onClick={handleMarkPaid}
                    className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Mark as Fully Paid</span>
                  </button>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <DeletePurchaseBillModal
        bill={bill}
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onDeleted={() => {
          setIsDeleteOpen(false);
          onClose();
        }}
      />
    </>
  );
};

export default BillInvoiceModal;

