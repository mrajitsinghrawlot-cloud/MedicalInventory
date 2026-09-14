import React, { useState } from 'react';
import { 
  FileText, 
  Search, 
  Download, 
  Eye, 
  Plus, 
  Calendar, 
  User, 
  CreditCard,
  CheckCircle2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { SalesBill } from '../../types/inventory';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

interface SalesHistoryViewProps {
  onOpenNewSale: () => void;
  onOpenReceipt: (bill: SalesBill) => void;
}

export const SalesHistoryView: React.FC<SalesHistoryViewProps> = ({ onOpenNewSale, onOpenReceipt }) => {
  const { salesBills } = useInventory();
  const [search, setSearch] = useState('');

  const filteredSales = salesBills.filter(bill =>
    bill.billNumber.toLowerCase().includes(search.toLowerCase()) ||
    bill.customerName.toLowerCase().includes(search.toLowerCase()) ||
    (bill.customerPhone && bill.customerPhone.includes(search)) ||
    (bill.doctorName && bill.doctorName.toLowerCase().includes(search.toLowerCase()))
  );

  const totalSalesRevenue = salesBills.reduce((sum, s) => sum + s.grandTotal, 0);

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Retail Sales Receipts & Patient Dispensing Log</h2>
          <p className="text-xs text-slate-500">Record of all counter sales, loose tablet dispensations, and cash memos</p>
        </div>

        <button
          onClick={onOpenNewSale}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>New Counter Sale (POS)</span>
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Total Retail Sales</span>
          <div className="text-xl font-extrabold text-teal-800 mt-0.5">
            {formatCurrency(totalSalesRevenue)}
          </div>
          <span className="text-[11px] text-slate-500">{salesBills.length} completed receipts</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Average Ticket Size</span>
          <div className="text-xl font-extrabold text-slate-900 mt-0.5">
            {formatCurrency(salesBills.length > 0 ? totalSalesRevenue / salesBills.length : 0)}
          </div>
          <span className="text-[11px] text-slate-400">Per patient bill</span>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
          <span className="text-[11px] text-slate-400 font-bold uppercase">Payment Settlement</span>
          <div className="text-xl font-extrabold text-emerald-600 mt-0.5">
            100% Cleared
          </div>
          <span className="text-[11px] text-emerald-600 font-medium">Cash / UPI / Card</span>
        </div>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by receipt #, patient name, phone, or prescribing doctor..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Receipts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Receipt # & Date</th>
                <th className="py-3.5 px-4">Patient / Customer</th>
                <th className="py-3.5 px-4">Prescribing Doctor</th>
                <th className="py-3.5 px-4">Items Dispensed</th>
                <th className="py-3.5 px-4">Payment Method</th>
                <th className="py-3.5 px-4">Total Amount</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-10 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">No retail sales found</p>
                  </td>
                </tr>
              ) : (
                filteredSales.map(bill => (
                  <tr
                    key={bill.id}
                    className="hover:bg-teal-50/40 transition-colors cursor-pointer group"
                    onClick={() => onOpenReceipt(bill)}
                  >
                    <td className="py-3.5 px-4 font-medium text-slate-900">
                      <div className="font-bold text-slate-900 group-hover:text-teal-900 font-mono">
                        {bill.billNumber}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {formatDateTime(bill.date)}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      <div>{bill.customerName}</div>
                      {bill.customerPhone && (
                        <div className="text-[10px] text-slate-400 font-mono">{bill.customerPhone}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-slate-700">
                      {bill.doctorName || <span className="text-slate-400 italic">Over the Counter (OTC)</span>}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="flex flex-wrap gap-1">
                        {bill.items.map((item, i) => (
                          <span key={i} className="px-2 py-0.5 bg-slate-100 rounded text-[10px] text-slate-700 font-medium">
                            {item.medicineName.split(' ')[0]} ({item.quantity} {item.sellMode === 'LOOSE' ? 'tabs' : 'strips'})
                          </span>
                        ))}
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full font-bold text-[10px] inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>{bill.paymentMethod}</span>
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-extrabold text-slate-900 text-sm">
                      {formatCurrency(bill.grandTotal)}
                    </td>

                    <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onOpenReceipt(bill)}
                        className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-teal-50 hover:text-teal-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Print Memo</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
