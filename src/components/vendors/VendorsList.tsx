import React, { useState } from 'react';
import { Users2, Plus, Phone, Mail, MapPin, Star, ShieldCheck, FileSpreadsheet, Search } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Vendor } from '../../types/inventory';
import { formatCurrency } from '../../utils/formatters';

interface VendorsListProps {
  onOpenAddVendor: () => void;
  onOpenAddBillForVendor?: (vendorId: string) => void;
}

export const VendorsList: React.FC<VendorsListProps> = ({ onOpenAddVendor, onOpenAddBillForVendor }) => {
  const { vendors, purchaseBills, navigate } = useInventory();
  const [search, setSearch] = useState('');

  const filteredVendors = vendors.filter(v => 
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    v.contactPerson.toLowerCase().includes(search.toLowerCase()) ||
    v.city.toLowerCase().includes(search.toLowerCase()) ||
    v.gstin.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Pharma Vendors & Distributors</h2>
          <p className="text-xs text-slate-500">Manage drug suppliers, license numbers, ratings, and credit terms</p>
        </div>

        <button
          onClick={onOpenAddVendor}
          className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Vendor</span>
        </button>
      </div>

      {/* Search Toolbar */}
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="relative w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search suppliers by name, contact, city, GSTIN..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600"
          />
        </div>
      </div>

      {/* Grid of Vendor Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-4">
        {filteredVendors.map(vendor => {
          const vendorBills = purchaseBills.filter(b => b.vendorId === vendor.id);

          return (
            <div
              key={vendor.id}
              className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-700 border border-purple-100 flex items-center justify-center font-bold text-base shrink-0">
                      {vendor.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-base leading-snug">{vendor.name}</h3>
                      <p className="text-xs text-slate-500 font-medium">{vendor.contactPerson} • {vendor.city}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full text-xs font-bold shrink-0">
                    <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                    <span>{vendor.rating}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 bg-slate-50 p-3 rounded-xl text-xs mb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Credit Period</span>
                    <span className="font-bold text-slate-800">{vendor.paymentTermsDays} Days Net</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold uppercase block">Total Invoiced</span>
                    <span className="font-bold text-slate-800">{formatCurrency(vendor.totalPurchases)}</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-medium text-slate-700">{vendor.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="text-slate-600 truncate">{vendor.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-mono text-slate-500 text-[11px]">DL: {vendor.dlNumber} • GST: {vendor.gstin}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <div>
                  {vendor.balanceDue > 0 ? (
                    <span className="text-xs font-bold text-rose-600">
                      Due: {formatCurrency(vendor.balanceDue)}
                    </span>
                  ) : (
                    <span className="text-xs font-bold text-emerald-600">
                      ✓ No dues pending
                    </span>
                  )}
                </div>

                <button
                  onClick={() => navigate('purchase-bills')}
                  className="text-xs font-bold text-teal-700 hover:text-teal-800 flex items-center gap-1"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>{vendorBills.length} Invoices →</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
