import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  CheckCircle2, 
  IndianRupee, 
  CreditCard, 
  Banknote, 
  QrCode, 
  FileText, 
  User, 
  Phone,
  Sparkles
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { CustomerAccount } from '../../types/inventory';
import { formatCurrency } from '../../utils/formatters';
import confetti from 'canvas-confetti';

interface RecordCustomerPaymentModalProps {
  customer: CustomerAccount | null;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess?: () => void;
}

export const RecordCustomerPaymentModal: React.FC<RecordCustomerPaymentModalProps> = ({
  customer,
  isOpen,
  onClose,
  onPaymentSuccess
}) => {
  const { recordCustomerPayment } = useInventory();

  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Bank Transfer'>('UPI');
  const [referenceNo, setReferenceNo] = useState('');
  const [notes, setNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  React.useEffect(() => {
    if (customer) {
      setAmount(customer.balanceDue > 0 ? customer.balanceDue.toString() : '');
      setReferenceNo('');
      setNotes('');
      setErrorMsg('');
    }
  }, [customer, isOpen]);

  if (!isOpen || !customer) return null;

  const numAmount = parseFloat(amount) || 0;
  const remainingAfterPayment = Math.max(0, Number(((customer.balanceDue || 0) - numAmount).toFixed(2)));

  const handleQuickAmount = (val: number) => {
    setAmount(val.toString());
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (numAmount <= 0) {
      setErrorMsg('Please enter a valid repayment amount greater than 0.');
      return;
    }

    if (numAmount > customer.balanceDue) {
      if (!window.confirm(`The entered amount (₹${numAmount}) is greater than the outstanding balance (₹${customer.balanceDue}). Do you want to proceed with full settlement?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    recordCustomerPayment(
      customer.id,
      Math.min(numAmount, customer.balanceDue || numAmount),
      paymentMethod,
      notes.trim() || undefined,
      referenceNo.trim() || undefined,
      'Pharmacist Admin'
    );

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    setIsSubmitting(false);
    onPaymentSuccess?.();
    onClose();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs"
          onClick={onClose}
        />

        <motion.div 
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col"
        >
          <div className="px-6 py-4 bg-gradient-to-r from-emerald-800 to-teal-800 text-white flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-white">
                <IndianRupee className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm">Collect Debt Repayment</h3>
                <p className="text-[11px] text-emerald-200">Customer Khata Settlement & Receipt</p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4 text-xs">
            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold">
                {errorMsg}
              </div>
            )}

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
              <div>
                <div className="font-bold text-slate-900 text-sm">{customer.name}</div>
                <div className="text-[11px] text-slate-500 font-mono mt-0.5">{customer.phone}</div>
                {customer.address && (
                  <div className="text-[10px] text-slate-400 mt-0.5">{customer.address}</div>
                )}
              </div>

              <div className="text-right">
                <div className="text-[10px] text-slate-400 font-bold uppercase">Total Due</div>
                <div className="text-lg font-extrabold text-rose-600 font-mono">
                  {formatCurrency(customer.balanceDue)}
                </div>
              </div>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5 flex justify-between">
                <span>Received Repayment Amount (₹)</span>
                {customer.balanceDue > 0 && (
                  <span className="text-teal-700 font-semibold">
                    New Balance: {formatCurrency(remainingAfterPayment)}
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">₹</span>
                <input
                  type="number"
                  step="0.01"
                  min="1"
                  autoFocus
                  required
                  placeholder="0.00"
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    setErrorMsg('');
                  }}
                  className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-300 rounded-2xl text-base font-extrabold text-slate-900 focus:outline-none focus:border-teal-600 focus:bg-white transition-all font-mono"
                />
              </div>

              {customer.balanceDue > 0 && (
                <div className="flex gap-1.5 mt-2">
                  <button
                    type="button"
                    onClick={() => handleQuickAmount(customer.balanceDue)}
                    className="flex-1 py-1 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-emerald-800 rounded-lg text-[11px] font-bold transition-colors"
                  >
                    Full ({formatCurrency(customer.balanceDue)})
                  </button>
                  {customer.balanceDue > 100 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(Math.round(customer.balanceDue / 2))}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      50% ({formatCurrency(Math.round(customer.balanceDue / 2))})
                    </button>
                  )}
                  {customer.balanceDue > 500 && (
                    <button
                      type="button"
                      onClick={() => handleQuickAmount(500)}
                      className="flex-1 py-1 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                    >
                      ₹500
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Payment Collection Mode
              </label>
              <div className="grid grid-cols-4 gap-2">
                {(['UPI', 'Cash', 'Card', 'Bank Transfer'] as const).map(mode => (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setPaymentMethod(mode)}
                    className={`py-2 px-2 rounded-xl text-xs font-bold border transition-all flex flex-col items-center gap-1 ${
                      paymentMethod === mode
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <span>{mode}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Transaction Reference / UPI UTR / Receipt # (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. UPI/2026/9104882"
                value={referenceNo}
                onChange={e => setReferenceNo(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 font-mono focus:outline-none focus:border-teal-600"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-600 mb-1">
                Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Cleared pending bill from last month"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              />
            </div>

            <div className="pt-2 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl font-semibold transition-colors flex-1"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isSubmitting || numAmount <= 0}
                className="px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 disabled:opacity-50 text-white rounded-2xl font-bold shadow-md shadow-emerald-700/20 transition-all active:scale-98 flex items-center justify-center gap-1.5 flex-1"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Settlement</span>
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default RecordCustomerPaymentModal;
