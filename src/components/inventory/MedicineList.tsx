import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  SlidersHorizontal, 
  Pill, 
  Eye, 
  Trash2,
  ArrowUpDown,
  Barcode,
  LayoutGrid,
  List
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Medicine, Category } from '../../types/inventory';
import { formatCurrency, formatDate, getExpiryStatusTag, getStockStatusTag } from '../../utils/formatters';
import { exportMedicinesToCSV } from '../../utils/exportUtils';

interface MedicineListProps {
  onOpenAdd: () => void;
  onOpenAdjustment: (med?: Medicine) => void;
  onOpenScanner: () => void;
}

export const MedicineList: React.FC<MedicineListProps> = ({
  onOpenAdd,
  onOpenAdjustment,
  onOpenScanner
}) => {
  const { 
    medicines, 
    deleteMedicine, 
    setSelectedMedicine 
  } = useInventory();

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [selectedSchedule, setSelectedSchedule] = useState<string>('ALL');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'expiry' | 'mrp'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  const categories: Category[] = [
    'Antibiotics',
    'Analgesics & Pain',
    'Cardiovascular',
    'Antidiabetics',
    'Gastrointestinal',
    'Respiratory',
    'Dermatological',
    'Vitamins & Supplements',
    'Emergency & ICU',
    'Medical Supplies'
  ];

  const filteredMedicines = useMemo(() => {
    return medicines
      .filter(m => {
        const matchesSearch = 
          m.name.toLowerCase().includes(search.toLowerCase()) ||
          m.genericName.toLowerCase().includes(search.toLowerCase()) ||
          m.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
          m.barcode.includes(search) ||
          m.manufacturer.toLowerCase().includes(search.toLowerCase());

        const matchesCategory = selectedCategory === 'ALL' || m.category === selectedCategory;
        const matchesSchedule = selectedSchedule === 'ALL' || m.scheduleType === selectedSchedule;
        
        const expiryTag = getExpiryStatusTag(m.expiryDate);
        let matchesStatus = true;
        if (selectedStatus === 'EXPIRED') matchesStatus = expiryTag.isExpired;
        else if (selectedStatus === 'EXPIRING_SOON') matchesStatus = expiryTag.isNear;
        else if (selectedStatus === 'LOW_STOCK') matchesStatus = m.stockQuantity > 0 && m.stockQuantity <= m.minStockThreshold;
        else if (selectedStatus === 'OUT_OF_STOCK') matchesStatus = m.stockQuantity <= 0;
        else if (selectedStatus === 'OPTIMAL') matchesStatus = m.stockQuantity > m.minStockThreshold && !expiryTag.isExpired && !expiryTag.isNear;

        return matchesSearch && matchesCategory && matchesSchedule && matchesStatus;
      })
      .sort((a, b) => {
        let comp = 0;
        if (sortBy === 'name') comp = a.name.localeCompare(b.name);
        else if (sortBy === 'stock') comp = a.stockQuantity - b.stockQuantity;
        else if (sortBy === 'mrp') comp = a.mrp - b.mrp;
        else if (sortBy === 'expiry') comp = new Date(a.expiryDate).getTime() - new Date(b.expiryDate).getTime();

        return sortOrder === 'asc' ? comp : -comp;
      });
  }, [medicines, search, selectedCategory, selectedStatus, selectedSchedule, sortBy, sortOrder]);

  const toggleSort = (field: 'name' | 'stock' | 'expiry' | 'mrp') => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Header Bar & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-lg font-bold text-slate-900">Medicine & Stock Directory</h2>
          <p className="text-xs text-slate-500">
            Showing {filteredMedicines.length} of {medicines.length} total pharmaceuticals
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => exportMedicinesToCSV(filteredMedicines)}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            title="Download CSV report"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-xl text-xs font-semibold transition-colors"
          >
            <Barcode className="w-4 h-4" />
            <span>Scan Barcode</span>
          </button>

          <button
            onClick={onOpenAdd}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-semibold shadow-sm transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine</span>
          </button>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by brand name, generic salt, batch #, barcode..."
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 transition-all"
            />
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 self-end md:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'table' ? 'bg-white text-teal-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Table View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg transition-colors ${
                viewMode === 'grid' ? 'bg-white text-teal-700 shadow-2xs font-bold' : 'text-slate-500 hover:text-slate-800'
              }`}
              title="Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dropdown Filters Row */}
        <div className="flex flex-wrap items-center gap-2 pt-1 border-t border-slate-100 text-xs">
          <div className="flex items-center gap-1 text-slate-400 font-medium">
            <Filter className="w-3.5 h-3.5" />
            <span>Filters:</span>
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Categories</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Stock Statuses</option>
            <option value="OPTIMAL">Optimal In-Stock</option>
            <option value="LOW_STOCK">Low Stock (&le; min)</option>
            <option value="OUT_OF_STOCK">Out of Stock (0)</option>
            <option value="EXPIRING_SOON">Expiring &lt;60 Days</option>
            <option value="EXPIRED">Expired Batches</option>
          </select>

          {/* Schedule Type Filter */}
          <select
            value={selectedSchedule}
            onChange={(e) => setSelectedSchedule(e.target.value)}
            className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-700 text-xs font-medium focus:outline-none focus:border-teal-600"
          >
            <option value="ALL">All Schedules (Rx & OTC)</option>
            <option value="OTC">OTC (Over the Counter)</option>
            <option value="Schedule H">Schedule H (Rx)</option>
            <option value="Schedule H1">Schedule H1 (Controlled)</option>
            <option value="Schedule X">Schedule X</option>
          </select>

          {(selectedCategory !== 'ALL' || selectedStatus !== 'ALL' || selectedSchedule !== 'ALL' || search) && (
            <button
              onClick={() => {
                setSelectedCategory('ALL');
                setSelectedStatus('ALL');
                setSelectedSchedule('ALL');
                setSearch('');
              }}
              className="px-2.5 py-1.5 text-teal-700 hover:text-teal-800 text-xs font-semibold hover:underline"
            >
              Reset Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Content: Table or Grid */}
      <AnimatePresence mode="wait">
        {viewMode === 'table' ? (
          <motion.div
            key="table-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
          >
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider select-none">
                  <tr>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort('name')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Medicine & Salt</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Category & Form</th>
                    <th className="py-3 px-4">Batch #</th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort('expiry')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Expiry Date</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort('stock')}
                    >
                      <div className="flex items-center gap-1">
                        <span>Stock Qty</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th 
                      className="py-3 px-4 cursor-pointer hover:text-slate-800"
                      onClick={() => toggleSort('mrp')}
                    >
                      <div className="flex items-center gap-1">
                        <span>MRP / Cost</span>
                        <ArrowUpDown className="w-3 h-3" />
                      </div>
                    </th>
                    <th className="py-3 px-4">Location</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredMedicines.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-12 text-center text-slate-400">
                        <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                        <p className="font-semibold text-slate-600">No medicines found</p>
                        <p className="text-xs text-slate-400">Try adjusting your filters or search keywords</p>
                      </td>
                    </tr>
                  ) : (
                    filteredMedicines.map((med) => {
                      const expiry = getExpiryStatusTag(med.expiryDate);
                      const stock = getStockStatusTag(med.stockQuantity, med.minStockThreshold);

                      return (
                        <tr 
                          key={med.id} 
                          className="hover:bg-teal-50/40 transition-colors group cursor-pointer"
                          onClick={() => setSelectedMedicine(med)}
                        >
                          {/* Name & Generic */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900 group-hover:text-teal-900 flex items-center gap-1.5">
                              {med.name}
                              {med.scheduleType !== 'OTC' && (
                                <span className="text-[9px] font-extrabold px-1 py-0.2 bg-rose-50 text-rose-700 border border-rose-200 rounded">
                                  Rx
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-slate-500 font-normal line-clamp-1">
                              {med.genericName}
                            </div>
                            <div className="text-[10px] text-slate-400">{med.manufacturer}</div>
                          </td>

                          {/* Category */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                              {med.category}
                            </span>
                            <div className="text-[10px] text-slate-400 mt-1">{med.form} • {med.strength}</div>
                          </td>

                          {/* Batch */}
                          <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                            {med.batchNumber}
                          </td>

                          {/* Expiry */}
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-800">{formatDate(med.expiryDate)}</div>
                            <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold border ${expiry.color}`}>
                              {expiry.label}
                            </span>
                          </td>

                          {/* Stock */}
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${stock.indicator}`} />
                              <span className="font-extrabold text-slate-900 text-sm">
                                {med.stockQuantity}
                              </span>
                              <span className="text-slate-400 text-[10px]">units</span>
                            </div>
                            <div className="text-[10px] text-slate-400">Min: {med.minStockThreshold}</div>
                          </td>

                          {/* MRP / Cost */}
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{formatCurrency(med.mrp)}</div>
                            <div className="text-[10px] text-slate-400">Cost: {formatCurrency(med.purchasePrice)}</div>
                          </td>

                          {/* Location */}
                          <td className="py-3.5 px-4">
                            <span className="px-2 py-0.5 bg-slate-50 border border-slate-200 text-slate-600 rounded text-[11px] font-mono">
                              {med.rackLocation}
                            </span>
                          </td>

                          {/* Actions */}
                          <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => onOpenAdjustment(med)}
                                title="Adjust Stock Balance"
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-amber-600 transition-colors"
                              >
                                <SlidersHorizontal className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setSelectedMedicine(med)}
                                title="View Medicine Details"
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-teal-700 transition-colors"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove ${med.name}?`)) {
                                    deleteMedicine(med.id);
                                  }
                                }}
                                title="Delete Medicine"
                                className="p-1.5 hover:bg-red-50 rounded-lg text-slate-400 hover:text-red-600 transition-colors"
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
          </motion.div>
        ) : (
          /* Grid Card View */
          <motion.div
            key="grid-view"
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.16 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {filteredMedicines.map(med => {
              const expiry = getExpiryStatusTag(med.expiryDate);
              const stock = getStockStatusTag(med.stockQuantity, med.minStockThreshold);

              return (
                <div
                  key={med.id}
                  onClick={() => setSelectedMedicine(med)}
                  className="interactive-card bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs hover:shadow-md hover:border-teal-300 transition-all cursor-pointer flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md">
                          {med.category}
                        </span>
                        <h3 className="font-bold text-slate-900 text-sm mt-1.5 leading-snug">
                          {med.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-1">{med.genericName}</p>
                      </div>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${expiry.color}`}>
                        {expiry.status}
                      </span>
                    </div>

                    <div className="my-3 py-2.5 px-3 bg-slate-50 rounded-xl grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">Stock Balance</span>
                        <div className="flex items-center gap-1 font-extrabold text-slate-900 text-sm">
                          <span className={`w-2 h-2 rounded-full ${stock.indicator}`} />
                          {med.stockQuantity} units
                        </div>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">MRP / Cost</span>
                        <div className="font-bold text-slate-900">
                          {formatCurrency(med.mrp)}
                        </div>
                      </div>
                    </div>

                    <div className="text-[11px] text-slate-500 space-y-1">
                      <div className="flex justify-between">
                        <span className="text-slate-400">Batch Number:</span>
                        <span className="font-mono font-medium">{med.batchNumber}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Expiry Date:</span>
                        <span className="font-medium">{formatDate(med.expiryDate)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-400">Location:</span>
                        <span className="font-mono text-slate-700">{med.rackLocation}</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <button
                      onClick={() => onOpenAdjustment(med)}
                      className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition-colors"
                    >
                      Adjust Stock
                    </button>
                    <button
                      onClick={() => setSelectedMedicine(med)}
                      className="text-xs font-bold text-teal-700 hover:text-teal-800"
                    >
                      Full Details →
                    </button>
                  </div>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
