import React, { useState, useMemo } from 'react';
import { 
  Users2, 
  Search, 
  Plus, 
  Download, 
  Printer, 
  IndianRupee, 
  Phone, 
  Share2, 
  FileText, 
  AlertTriangle, 
  CheckCircle2, 
  TrendingUp, 
  UserCheck, 
  ShieldAlert,
  ArrowUpRight,
  Sparkles,
  SlidersHorizontal,
  Edit2,
  X
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { CustomerAccount } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { RecordCustomerPaymentModal } from './RecordCustomerPaymentModal';
import { CustomerStatementModal } from './CustomerStatementModal';

export const CustomerKhataView: React.FC = () => {
  const { 
    customers = [], 
    customerPayments = [], 
    totalCustomerDues, 
    activeBorrowersCount,
    createOrUpdateCustomer,
    updateCustomerCreditLimit,
    navigate
  } = useInventory();

  const [search, setSearch] = useState('');
  const [filterTab, setFilterTab] = useState<'ALL' | 'DUES_ONLY' | 'CLEARED' | 'HIGH_DUES'>('ALL');
  
  // Modals state
  const [payingCustomer, setPayingCustomer] = useState<CustomerAccount | null>(null);
  const [statementCustomer, setStatementCustomer] = useState<CustomerAccount | null>(null);
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [editingLimitCustomer, setEditingLimitCustomer] = useState<CustomerAccount | null>(null);
  const [newCreditLimitInput, setNewCreditLimitInput] = useState<string>('');

  // New Customer Form State
  const [newCustName, setNewCustName] = useState('');
  const [newCustPhone, setNewCustPhone] = useState('');
  const [newCustAddress, setNewCustAddress] = useState('');
  const [newCustLimit, setNewCustLimit] = useState('5000');
  const [newCustNotes, setNewCustNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Filtered customer list
  const filteredCustomers = useMemo(() => {
    return customers.filter(c => {
      const q = search.toLowerCase().trim();
      const matchSearch = 
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        (c.address || '').toLowerCase().includes(q);

      if (!matchSearch) return false;

      if (filterTab === 'DUES_ONLY') return c.balanceDue > 0;
      if (filterTab === 'CLEARED') return c.balanceDue === 0;
      if (filterTab === 'HIGH_DUES') return c.balanceDue >= 1000;

      return true;
    }).sort((a, b) => b.balanceDue - a.balanceDue);
  }, [customers, search, filterTab]);

  // Overall metrics
  const totalCollections = customerPayments.reduce((acc, p) => acc + (p.amount || 0), 0);
  const overLimitCount = customers.filter(c => c.balanceDue > c.creditLimit).length;

  const handleOpenWhatsApp = (c: CustomerAccount) => {
    const cleanPhone = c.phone.replace(/\D/g, '').slice(-10);
    const msg = `Namaste ${c.name} ji, this is a reminder from MediStock Pharmacy. Your current pending medicine bill balance is ${formatCurrency(c.balanceDue)}. Please settle via UPI at your convenience. Thank you!`;
    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(msg)}`, '_blank');
  };

  const handleCreateNewCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    const cleanN = newCustName.trim();
    const cleanP = newCustPhone.replace(/\D/g, '').slice(-10);

    if (!cleanN || cleanN.length < 3) {
      setFormError('Customer Full Name is required (minimum 3 characters).');
      return;
    }

    if (!cleanP || cleanP.length !== 10) {
      setFormError('Valid 10-digit mobile phone number is required.');
      return;
    }

    // Check duplicate phone
    const exists = customers.find(c => c.phone.replace(/\D/g, '').slice(-10) === cleanP);
    if (exists) {
      setFormError(`A customer account with phone ${cleanP} already exists (${exists.name}).`);
      return;
    }

    createOrUpdateCustomer({
      name: cleanN,
      phone: cleanP,
      address: newCustAddress.trim() || undefined,
      creditLimit: parseFloat(newCustLimit) || 5000,
      totalPurchases: 0,
      totalCredit: 0,
      totalPaid: 0,
      balanceDue: 0,
      lastPurchaseDate: new Date().toISOString().split('T')[0],
      notes: newCustNotes.trim() || undefined,
      status: 'Active'
    });

    setIsAddCustomerOpen(false);
    setNewCustName('');
    setNewCustPhone('');
    setNewCustAddress('');
    setNewCustLimit('5000');
    setNewCustNotes('');
  };

  const handleSaveCreditLimit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingLimitCustomer) {
      const num = parseFloat(newCreditLimitInput) || 5000;
      updateCustomerCreditLimit(editingLimitCustomer.id, num);
      setEditingLimitCustomer(null);
    }
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Customer Name', 'Mobile Phone', 'Address', 'Credit Limit (INR)', 'Total Purchases (INR)', 'Total Credit (INR)', 'Total Paid (INR)', 'Balance Due (INR)', 'Status'];
    const rows = filteredCustomers.map(c => [
      `"${c.name.replace(/"/g, '""')}"`,
      `"${c.phone}"`,
      `"${(c.address || '').replace(/"/g, '""')}"`,
      c.creditLimit,
      c.totalPurchases,
      c.totalCredit,
      c.totalPaid,
      c.balanceDue,
      c.status
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Customer_Khata_Udhaar_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-rose-600/20">
              <IndianRupee className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                Customer Khata & Borrower Ledger (Udhaar)
                <span className="px-2 py-0.2 bg-rose-100 text-rose-800 rounded-full text-[10px] font-mono font-bold">
                  LEDGER
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Track credit sales, record partial/full cash & UPI repayments, and send 1-click WhatsApp payment reminders.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddCustomerOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Customer Account</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Outstanding Dues */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">Total Outstanding Udhaar</span>
            <div className="text-2xl font-extrabold text-rose-600 font-mono mt-1">
              {formatCurrency(totalCustomerDues)}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">
            Across <strong className="text-slate-800">{activeBorrowersCount} active borrower{activeBorrowersCount !== 1 ? 's' : ''}</strong>
          </span>
        </div>

        {/* Total Collections Received */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Repayments Collected</span>
            <div className="text-2xl font-extrabold text-emerald-600 font-mono mt-1">
              {formatCurrency(totalCollections)}
            </div>
          </div>
          <span className="text-[11px] text-emerald-700 font-medium mt-2">
            {customerPayments.length} recorded settlements
          </span>
        </div>

        {/* Total Registered Accounts */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Registered Khata Accounts</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">
              {customers.length}
            </div>
          </div>
          <span className="text-[11px] text-teal-700 font-semibold mt-2">
            {customers.filter(c => c.balanceDue === 0).length} cleared / 0 due
          </span>
        </div>

        {/* Credit Safeguard / Over Limit */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs flex flex-col justify-between">
          <div>
            <span className="text-[11px] font-bold text-amber-600 uppercase tracking-wider block">Over-Limit Alerts</span>
            <div className="text-2xl font-extrabold text-amber-600 mt-1">
              {overLimitCount}
            </div>
          </div>
          <span className="text-[11px] text-slate-500 mt-2">
            {overLimitCount > 0 ? 'Exceeding approved credit limit' : 'All accounts within safe limit'}
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search borrower by name, 10-digit mobile, or address..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600 font-medium"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 self-start sm:self-auto overflow-x-auto max-w-full pb-1 sm:pb-0 text-xs font-semibold">
          <button
            onClick={() => setFilterTab('ALL')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'ALL'
                ? 'bg-slate-900 text-white shadow-2xs'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Accounts ({customers.length})
          </button>
          <button
            onClick={() => setFilterTab('DUES_ONLY')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'DUES_ONLY'
                ? 'bg-rose-600 text-white shadow-2xs'
                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
            }`}
          >
            Pending Dues ({activeBorrowersCount})
          </button>
          <button
            onClick={() => setFilterTab('HIGH_DUES')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'HIGH_DUES'
                ? 'bg-amber-600 text-white shadow-2xs'
                : 'bg-amber-50 text-amber-700 hover:bg-amber-100'
            }`}
          >
            High Debt (&gt;₹1k)
          </button>
          <button
            onClick={() => setFilterTab('CLEARED')}
            className={`px-3 py-1.5 rounded-xl transition-all whitespace-nowrap ${
              filterTab === 'CLEARED'
                ? 'bg-emerald-600 text-white shadow-2xs'
                : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
            }`}
          >
            Cleared (0 Due)
          </button>
        </div>
      </div>

      {/* Customer Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Borrower / Customer</th>
                <th className="py-3.5 px-3">Contact & Address</th>
                <th className="py-3.5 px-3">Credit Limit Usage</th>
                <th className="py-3.5 px-3">Lifetime Purchases</th>
                <th className="py-3.5 px-3">Total Repaid</th>
                <th className="py-3.5 px-4">Current Due (₹)</th>
                <th className="py-3.5 px-4 text-right">Ledger Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <Users2 className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-700">No customer khata accounts found</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Add a new customer account or perform a credit sale in POS.</p>
                  </td>
                </tr>
              ) : (
                filteredCustomers.map(c => {
                  const limitUsagePercent = Math.min(100, Math.round((c.balanceDue / (c.creditLimit || 5000)) * 100));
                  const isOverLimit = c.balanceDue > c.creditLimit;

                  return (
                    <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                      {/* Name */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 ${
                            c.balanceDue > 0 ? 'bg-rose-100 text-rose-700' : 'bg-emerald-100 text-emerald-700'
                          }`}>
                            {c.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 text-sm">{c.name}</div>
                            <div className="text-[10px] text-slate-400">
                              Last active: {formatDate(c.lastPurchaseDate)}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Phone & Address */}
                      <td className="py-3.5 px-3">
                        <div className="font-mono font-semibold text-slate-800 flex items-center gap-1">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{c.phone}</span>
                        </div>
                        <div className="text-[10px] text-slate-400 truncate max-w-xs mt-0.5">
                          {c.address || 'Local Customer'}
                        </div>
                      </td>

                      {/* Credit Limit Usage */}
                      <td className="py-3.5 px-3 min-w-[140px]">
                        <div className="flex items-center justify-between text-[10px] font-semibold mb-1">
                          <span className={isOverLimit ? 'text-rose-600 font-bold' : 'text-slate-500'}>
                            {limitUsagePercent}% used
                          </span>
                          <span className="text-slate-400 font-mono">
                            Limit: {formatCurrency(c.creditLimit)}
                          </span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              isOverLimit ? 'bg-rose-600' : limitUsagePercent > 75 ? 'bg-amber-500' : 'bg-teal-600'
                            }`}
                            style={{ width: `${limitUsagePercent}%` }}
                          />
                        </div>
                      </td>

                      {/* Lifetime Purchases */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-slate-800 font-mono">
                          {formatCurrency(c.totalPurchases)}
                        </span>
                      </td>

                      {/* Total Paid */}
                      <td className="py-3.5 px-3">
                        <span className="font-bold text-emerald-600 font-mono">
                          {formatCurrency(c.totalPaid)}
                        </span>
                      </td>

                      {/* Balance Due */}
                      <td className="py-3.5 px-4">
                        <div className={`font-mono font-extrabold text-sm ${
                          c.balanceDue > 0 ? 'text-rose-600' : 'text-emerald-700'
                        }`}>
                          {formatCurrency(c.balanceDue)}
                        </div>
                        {c.balanceDue > 0 && (
                          <span className="inline-block px-1.5 py-0.2 bg-rose-50 text-rose-700 rounded text-[9px] font-bold mt-0.5">
                            Pending Udhaar
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Record Repayment */}
                          {c.balanceDue > 0 && (
                            <button
                              onClick={() => setPayingCustomer(c)}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-all shadow-2xs flex items-center gap-1"
                              title="Collect Cash / UPI Repayment"
                            >
                              <IndianRupee className="w-3.5 h-3.5" />
                              <span>Settle</span>
                            </button>
                          )}

                          {/* WhatsApp Reminder */}
                          {c.balanceDue > 0 && (
                            <button
                              onClick={() => handleOpenWhatsApp(c)}
                              className="p-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-lg transition-colors"
                              title="Send WhatsApp Payment Reminder"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {/* View Statement Passbook */}
                          <button
                            onClick={() => setStatementCustomer(c)}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors"
                            title="View Full Statement & Passbook"
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </button>

                          {/* Edit Limit */}
                          <button
                            onClick={() => {
                              setEditingLimitCustomer(c);
                              setNewCreditLimitInput(c.creditLimit.toString());
                            }}
                            className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-500 rounded-lg transition-colors"
                            title="Adjust Credit Limit"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5" />
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
      <RecordCustomerPaymentModal
        customer={payingCustomer}
        isOpen={Boolean(payingCustomer)}
        onClose={() => setPayingCustomer(null)}
      />

      <CustomerStatementModal
        customer={statementCustomer}
        isOpen={Boolean(statementCustomer)}
        onClose={() => setStatementCustomer(null)}
        onOpenRecordPayment={cust => setPayingCustomer(cust)}
      />

      {/* Add New Customer Modal */}
      {isAddCustomerOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setIsAddCustomerOpen(false)} />
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="px-6 py-4 bg-teal-800 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Register New Customer Khata</h3>
              <button onClick={() => setIsAddCustomerOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateNewCustomer} className="p-6 space-y-3.5 text-xs">
              {formError && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl font-semibold">
                  {formError}
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Customer Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Sharma"
                  value={newCustName}
                  onChange={e => setNewCustName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Mobile Phone Number (10 Digits) *</label>
                <input
                  type="tel"
                  maxLength={10}
                  required
                  placeholder="98200 00000"
                  value={newCustPhone}
                  onChange={e => setNewCustPhone(e.target.value.replace(/\D/g, ''))}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Address / Area</label>
                <input
                  type="text"
                  placeholder="e.g. Shop 4, Market Road"
                  value={newCustAddress}
                  onChange={e => setNewCustAddress(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Approved Credit Limit (₹)</label>
                <input
                  type="number"
                  min="500"
                  step="500"
                  value={newCustLimit}
                  onChange={e => setNewCustLimit(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-600 mb-1">Notes / Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Regular monthly customer"
                  value={newCustNotes}
                  onChange={e => setNewCustNotes(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddCustomerOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl font-semibold flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex-1"
                >
                  Create Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Adjust Credit Limit Modal */}
      {editingLimitCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setEditingLimitCustomer(null)} />
          <div className="relative w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <h3 className="font-bold text-sm">Adjust Credit Limit</h3>
              <button onClick={() => setEditingLimitCustomer(null)} className="text-white/80 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCreditLimit} className="p-6 space-y-4 text-xs">
              <div>
                <div className="font-bold text-slate-900">{editingLimitCustomer.name}</div>
                <div className="text-[11px] text-slate-500 font-mono">Phone: {editingLimitCustomer.phone}</div>
                <div className="text-[11px] text-rose-600 font-semibold mt-1">
                  Current Due: {formatCurrency(editingLimitCustomer.balanceDue)}
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">New Credit Limit (₹)</label>
                <input
                  type="number"
                  min="0"
                  step="500"
                  required
                  value={newCreditLimitInput}
                  onChange={e => setNewCreditLimitInput(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-xl font-mono text-base font-extrabold text-slate-900 focus:outline-none focus:border-teal-600"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditingLimitCustomer(null)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl font-semibold flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold flex-1"
                >
                  Save Limit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerKhataView;
