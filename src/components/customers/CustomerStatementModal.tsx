import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Printer, 
  Share2, 
  FileSpreadsheet, 
  ArrowDownLeft, 
  ArrowUpRight, 
  IndianRupee, 
  Calendar, 
  CheckCircle2, 
  AlertCircle,
  Phone
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { CustomerAccount } from '../../types/inventory';
import { formatCurrency, formatDate, formatDateTime } from '../../utils/formatters';

interface CustomerStatementModalProps {
  customer: CustomerAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onOpenRecordPayment: (customer: CustomerAccount) => void;
}

export const CustomerStatementModal: React.FC<CustomerStatementModalProps> = ({
  customer,
  isOpen,
  onClose,
  onOpenRecordPayment
}) => {
  const { salesBills, customerPayments } = useInventory();

  if (!isOpen || !customer) return null;

  const cleanPhone = customer.phone.replace(/\D/g, '').slice(-10);

  // Filter Sales Bills for this customer
  const customerSales = salesBills.filter(s => 
    s.customerId === customer.id || 
    (cleanPhone && (s.customerPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone) ||
    s.customerName.toLowerCase() === customer.name.toLowerCase()
  );

  // Filter Repayments for this customer
  const customerRepayments = customerPayments.filter(p =>
    p.customerId === customer.id ||
    (cleanPhone && (p.customerPhone || '').replace(/\D/g, '').slice(-10) === cleanPhone)
  );

  // Combine into a chronological ledger
  type LedgerEntry = {
    id: string;
    date: string;
    type: 'PURCHASE' | 'PAYMENT';
    refNumber: string;
    description: string;
    debitAmount: number; // Purchases / Dues
    creditAmount: number; // Payments
    status?: string;
  };

  const ledger: LedgerEntry[] = [
    ...customerSales.map(s => ({
      id: s.id,
      date: s.date,
      type: 'PURCHASE' as const,
      refNumber: s.billNumber,
      description: `Dispensed ${s.items.length} item${s.items.length !== 1 ? 's' : ''} (${s.items.map(i => i.medicineName).slice(0, 2).join(', ')}${s.items.length > 2 ? '...' : ''})`,
      debitAmount: s.grandTotal,
      creditAmount: s.paidAmount || (s.paymentStatus === 'PAID' ? s.grandTotal : 0),
      status: s.paymentStatus
    })),
    ...customerRepayments.map(p => ({
      id: p.id,
      date: p.date,
      type: 'PAYMENT' as const,
      refNumber: p.referenceNo || `CPAY-${p.id.slice(-6)}`,
      description: `Repayment via ${p.paymentMethod}${p.notes ? ` (${p.notes})` : ''}`,
      debitAmount: 0,
      creditAmount: p.amount,
      status: 'SETTLED'
    }))
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const handleWhatsAppShare = () => {
    const message = `Hello ${customer.name}, greeting from MediStock Pharmacy. Your outstanding balance is ${formatCurrency(customer.balanceDue)}. Total purchases: ${formatCurrency(customer.totalPurchases)}. Kindly settle at your convenience. Thank you!`;
    const cleanP = customer.phone.replace(/\D/g, '').slice(-10);
    window.open(`https://wa.me/91${cleanP}?text=${encodeURIComponent(message)}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs print:hidden"
          onClick={onClose}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col print:max-h-none print:shadow-none print:border-none print:rounded-none"
        >
          {/* Header */}
          <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between print:hidden">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-teal-500/20 text-teal-300 border border-teal-500/30 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Customer Statement & Khata Passbook</h3>
                <p className="text-[11px] text-slate-300">Transaction History & Debt Ledger</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleWhatsAppShare}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-2xs"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp Statement</span>
              </button>
              <button
                onClick={handlePrint}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-semibold"
              >
                <Printer className="w-3.5 h-3.5" />
                <span>Print</span>
              </button>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Body */}
          <div className="p-6 overflow-y-auto space-y-5 text-xs text-slate-700">
            {/* Pharmacy & Customer Banner */}
            <div className="flex justify-between items-start pb-4 border-b border-slate-200">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-6 h-6 rounded-lg bg-teal-700 text-white font-bold text-xs flex items-center justify-center">
                    +
                  </div>
                  <span className="text-lg font-bold text-slate-900">MediStock Hospital Pharmacy</span>
                </div>
                <p className="text-slate-500 text-[11px]">42 Medical Center Boulevard, Healthcare District</p>
                <p className="text-slate-500 text-[11px]">GSTIN: 27AAAAA0000A1Z5 • Phone: +91 022 2891-9000</p>
              </div>

              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider block">KHATA PASSBOOK</span>
                <h4 className="text-base font-extrabold text-slate-900 mt-0.5">{customer.name}</h4>
                <div className="text-[11px] text-slate-500 font-mono">Mobile: {customer.phone}</div>
                {customer.address && <div className="text-[10px] text-slate-400">{customer.address}</div>}
              </div>
            </div>

            {/* Account Summary Mini-Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Purchases</span>
                <div className="text-base font-extrabold text-slate-900 mt-0.5">
                  {formatCurrency(customer.totalPurchases)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Total Repayments</span>
                <div className="text-base font-extrabold text-emerald-600 mt-0.5">
                  {formatCurrency(customer.totalPaid)}
                </div>
              </div>

              <div className="p-3 bg-rose-50/60 rounded-2xl border border-rose-200">
                <span className="text-[10px] text-rose-600 font-bold uppercase">Outstanding Due</span>
                <div className="text-base font-extrabold text-rose-600 mt-0.5">
                  {formatCurrency(customer.balanceDue)}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                <span className="text-[10px] text-slate-400 font-bold uppercase">Credit Limit</span>
                <div className="text-base font-extrabold text-teal-800 mt-0.5">
                  {formatCurrency(customer.creditLimit)}
                </div>
              </div>
            </div>

            {/* Ledger Table */}
            <div>
              <h5 className="font-bold text-slate-800 text-xs mb-2">Chronological Statement of Transactions</h5>
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-100 text-slate-600 font-semibold border-b border-slate-200 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3">Type & Ref #</th>
                      <th className="py-2.5 px-3">Description</th>
                      <th className="py-2.5 px-3 text-right">Debit / Due (₹)</th>
                      <th className="py-2.5 px-3 text-right">Credit / Paid (₹)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {ledger.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-8 text-center text-slate-400">
                          No transactions recorded yet for this customer.
                        </td>
                      </tr>
                    ) : (
                      ledger.map((entry, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-3 font-medium text-slate-600">
                            {formatDateTime(entry.date)}
                          </td>
                          <td className="py-2.5 px-3">
                            <span className={`inline-flex items-center gap-1 font-bold font-mono text-[11px] ${
                              entry.type === 'PURCHASE' ? 'text-slate-900' : 'text-emerald-700'
                            }`}>
                              {entry.type === 'PURCHASE' ? (
                                <ArrowDownLeft className="w-3 h-3 text-rose-500" />
                              ) : (
                                <ArrowUpRight className="w-3 h-3 text-emerald-500" />
                              )}
                              {entry.refNumber}
                            </span>
                          </td>
                          <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                            {entry.description}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-slate-900">
                            {entry.debitAmount > 0 ? formatCurrency(entry.debitAmount) : '-'}
                          </td>
                          <td className="py-2.5 px-3 text-right font-bold text-emerald-600">
                            {entry.creditAmount > 0 ? formatCurrency(entry.creditAmount) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between print:hidden">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold"
            >
              Close
            </button>

            {customer.balanceDue > 0 && (
              <button
                onClick={() => {
                  onClose();
                  onOpenRecordPayment(customer);
                }}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
              >
                <IndianRupee className="w-4 h-4" />
                <span>Record Repayment ({formatCurrency(customer.balanceDue)})</span>
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default CustomerStatementModal;
