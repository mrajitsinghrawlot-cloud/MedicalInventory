import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Plus, 
  Download, 
  Search, 
  Eye, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  Building2,
  Calendar,
  CreditCard,
  Trash2,
  Lock,
  RotateCcw
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { PurchaseBill } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { exportBillsToCSV } from '../../utils/exportUtils';
import { DeletePurchaseBillModal } from './DeletePurchaseBillModal';
import { SuperAdminRecycleBinModal } from './SuperAdminRecycleBinModal';

interface PurchaseBillsListProps {
  onOpenAddBill: () => void;
  onOpenInvoice: (bill: PurchaseBill) => void;
}

export const PurchaseBillsList: React.FC<PurchaseBillsListProps> = ({
  onOpenAddBill,
  onOpenInvoice
}) => {
  const { purchaseBills = [], deletedPurchaseBills = [] } = useInventory();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [billToDelete, setBillToDelete] = useState<PurchaseBill | null>(null);
  const [isRecycleBinOpen, setIsRecycleBinOpen] = useState(false);

  const safeBills = Array.isArray(purchaseBills) ? purchaseBills : [];

  const filteredBills = safeBills.filter(bill => {
    if (!bill) return false;
    const billNum = bill.billNumber || '';
    const venName = bill.vendorName || '';
    const matchesSearch = 
      billNum.toLowerCase().includes(search.toLowerCase()) ||
      venName.toLowerCase().includes(search.toLowerCase());

    const matchesStatus = statusFilter === 'ALL' || bill.paymentStatus === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const totalSpent = safeBills.reduce((acc, b) => acc + (b?.grandTotal || 0), 0);
  const totalDue = safeBills.reduce((acc, b) => acc + ((b?.grandTotal || 0) - (b?.paidAmount || 0)), 0);

  const getStatusBadge = (status?: PurchaseBill['paymentStatus']) => {
    switch (status) {
      case 'PAID':
        return {
          label: 'Paid in Full',
          color: 'bg-emerald-50 text-emerald-700 border-emerald-200',
          icon: CheckCircle2
        };
      case 'PARTIAL':
        return {
          label: 'Partially Paid',
          color: 'bg-amber-50 text-amber-700 border-amber-200',
          icon: Clock
        };
      case 'UNPAID':
      default:
        return {
          label: 'Payment Pending',
          color: 'bg-rose-50 text-rose-700 border-rose-200',
          icon: AlertCircle
        };
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Purchase Bills & Invoices</h2>
          <p className="text-xs text-slate-500">Track inward pharma stock shipments, GST taxes, and vendor dues</p>
        </div>

        <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
          <button
            onClick={() => setIsRecycleBinOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-slate-200"
            title="Super Admin Recovery Vault"
          >
            <Trash2 className="w-3.5 h-3.5 text-slate-500" />
            <span>Recycle Bin</span>
            {deletedPurchaseBills.length > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 bg-rose-600 text-white rounded-full text-[10px] font-bold">
                {deletedPurchaseBills.length}
              </span>
            )}
          </button>

          <button
            onClick={() => exportBillsToCSV(filteredBills)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenAddBill}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Create Purchase Bill</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Mini-Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Total Invoiced Amount</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
            {formatCurrency(totalSpent)}
          </div>
          <span className="text-[11px] text-slate-500">{purchaseBills.length} recorded bills</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Total Balance Due</span>
          <div className="text-xl font-extrabold text-rose-600 mt-0.5">
            {formatCurrency(totalDue)}
          </div>
          <span className="text-[11px] text-rose-500 font-medium">To be settled with suppliers</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Settled Payments</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
            {formatCurrency(totalSpent - totalDue)}
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Cleared invoices</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Bill # or Supplier name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>

        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-xs">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PAID">Paid</option>
            <option value="PARTIAL">Partially Paid</option>
            <option value="UNPAID">Unpaid / Due</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Bill # & Date</th>
                <th className="py-3.5 px-4">Supplier / Vendor</th>
                <th className="py-3.5 px-4">Items</th>
                <th className="py-3.5 px-4">Tax (GST)</th>
                <th className="py-3.5 px-4">Grand Total</th>
                <th className="py-3.5 px-4">Payment Status</th>
                <th className="py-3.5 px-4">Due Date</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredBills.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-slate-400">
                    <FileSpreadsheet className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No purchase bills found</p>
                  </td>
                </tr>
              ) : (
                filteredBills.map(bill => {
                  const badge = getStatusBadge(bill.paymentStatus);
                  const Icon = badge.icon;
                  const balance = bill.grandTotal - (bill.paidAmount || 0);

                  return (
                    <tr
                      key={bill.id}
                      className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                      onClick={() => onOpenInvoice(bill)}
                    >
                      <td className="py-3.5 px-4 font-medium text-slate-900">
                        <div className="font-bold text-slate-900 group-hover:text-teal-900">
                          {bill.billNumber}
                        </div>
                        <div className="text-[11px] text-slate-400">
                          Inv: {formatDate(bill.invoiceDate)}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-800">
                        <div className="font-semibold">{bill.vendorName}</div>
                        <div className="text-[10px] text-slate-400">Mode: {bill.paymentMethod}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                          {Array.isArray(bill.items) ? bill.items.length : 0} Drug SKU{(Array.isArray(bill.items) ? bill.items.length : 0) !== 1 ? 's' : ''}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 font-medium text-slate-600">
                        {formatCurrency(bill.taxAmount || 0)}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-extrabold text-slate-900 text-sm">
                          {formatCurrency(bill.grandTotal || 0)}
                        </div>
                        {balance > 0 && (
                          <div className="text-[10px] text-rose-600 font-semibold">
                            Due: {formatCurrency(balance)}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.color}`}>
                          <Icon className="w-3.5 h-3.5" />
                          {badge.label}
                        </span>
                      </td>

                      <td className="py-3.5 px-4 text-slate-600">
                        {formatDate(bill.dueDate)}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenInvoice(bill)}
                            className="px-2.5 py-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-700 hover:border-teal-200 rounded-lg text-xs font-semibold transition-colors inline-flex items-center gap-1 shadow-2xs"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => setBillToDelete(bill)}
                            className="p-1.5 bg-white border border-slate-200 hover:bg-rose-50 hover:text-rose-700 hover:border-rose-200 rounded-lg text-slate-400 hover:text-rose-600 transition-colors shadow-2xs"
                            title="Delete Bill & Reverse Stock"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <DeletePurchaseBillModal
        bill={billToDelete}
        isOpen={Boolean(billToDelete)}
        onClose={() => setBillToDelete(null)}
      />

      <SuperAdminRecycleBinModal
        isOpen={isRecycleBinOpen}
        onClose={() => setIsRecycleBinOpen(false)}
      />
    </div>
  );
};

export default PurchaseBillsList;

