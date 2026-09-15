import React, { useState, useMemo } from 'react';
import { 
  Scale, 
  Search, 
  TrendingUp, 
  Sparkles, 
  Building2, 
  Pill, 
  ArrowRight, 
  Download, 
  Printer, 
  Plus, 
  Coins, 
  Check
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Medicine } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

export interface SupplierQuote {
  vendorId: string;
  vendorName: string;
  purchasePrice: number;
  mrp: number;
  grossMarginPercent: number;
  lastPurchaseDate: string;
  billId: string;
  billNumber: string;
  batchNumber: string;
  expiryDate: string;
  totalQuantityPurchased: number;
  freeQuantityPurchased: number;
  isLowestPrice: boolean;
  priceDiffFromLowest: number;
  priceDiffPercent: number;
}

export interface MedicineComparisonGroup {
  medicineId: string;
  medicineName: string;
  genericName: string;
  category: string;
  currentStock: number;
  currentPurchasePrice: number;
  mrp: number;
  quotes: SupplierQuote[];
  cheapestQuote: SupplierQuote;
  costliestQuote: SupplierQuote;
  hasMultipleSuppliers: boolean;
  maxPriceSpread: number;
  maxPriceSpreadPercent: number;
  potentialSavingsPerPack: number;
}

interface SupplierPriceComparisonViewProps {
  onOpenAddBill?: (vendorId?: string, medicineName?: string) => void;
  onOpenMedicineDetail?: (medicine: Medicine) => void;
}

export const SupplierPriceComparisonView: React.FC<SupplierPriceComparisonViewProps> = ({
  onOpenAddBill,
  onOpenMedicineDetail
}) => {
  const { medicines, purchaseBills, vendors, setSelectedMedicine } = useInventory();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedVendorFilter, setSelectedVendorFilter] = useState('ALL');
  const [filterMultiVendorOnly, setFilterMultiVendorOnly] = useState(false);
  const [filterHighVarianceOnly, setFilterHighVarianceOnly] = useState(false);
  const [sortBy, setSortBy] = useState<'variance_desc' | 'savings_desc' | 'name_asc' | 'price_asc' | 'recent'>('variance_desc');
  const [activeTab, setActiveTab] = useState<'medicines' | 'vendors' | 'insights'>('medicines');

  // Extract all categories
  const categories = useMemo(() => {
    const cats = new Set<string>();
    medicines.forEach(m => {
      if (m.category) cats.add(m.category);
    });
    return Array.from(cats);
  }, [medicines]);

  // Aggregate Cross-Vendor Quotes per Medicine
  const comparisonGroups = useMemo<MedicineComparisonGroup[]>(() => {
    const groupMap = new Map<string, {
      medicine: Medicine | null;
      fallbackName: string;
      quotesMap: Map<string, {
        vendorId: string;
        vendorName: string;
        purchasePrice: number;
        mrp: number;
        lastPurchaseDate: string;
        billId: string;
        billNumber: string;
        batchNumber: string;
        expiryDate: string;
        totalQuantityPurchased: number;
        freeQuantityPurchased: number;
      }>;
    }>();

    // 1. Seed with catalog medicines
    medicines.forEach(med => {
      const key = med.name.trim().toLowerCase();
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          medicine: med,
          fallbackName: med.name,
          quotesMap: new Map()
        });
      }
    });

    // 2. Aggregate from purchase bills
    purchaseBills.forEach(bill => {
      bill.items.forEach(item => {
        const rawName = (item.medicineName || '').trim();
        if (!rawName) return;
        const key = rawName.toLowerCase();

        if (!groupMap.has(key)) {
          const matchedMed = medicines.find(m => m.name.toLowerCase() === key || m.id === item.medicineId) || null;
          groupMap.set(key, {
            medicine: matchedMed,
            fallbackName: rawName,
            quotesMap: new Map()
          });
        }

        const group = groupMap.get(key)!;
        const vendorKey = (bill.vendorName || 'Authorized Distributor').trim().toLowerCase();
        const existingQuote = group.quotesMap.get(vendorKey);

        const itemPrice = Number(item.purchasePrice) || 0;
        const itemMrp = Number(item.mrp) || (group.medicine?.mrp || itemPrice * 1.35);
        const itemQty = Number(item.quantity) || 0;
        const itemFree = Number(item.freeQuantity) || 0;

        if (!existingQuote) {
          group.quotesMap.set(vendorKey, {
            vendorId: bill.vendorId || '',
            vendorName: bill.vendorName || 'Authorized Distributor',
            purchasePrice: itemPrice,
            mrp: itemMrp,
            lastPurchaseDate: bill.invoiceDate || '2026-09-01',
            billId: bill.id,
            billNumber: bill.billNumber,
            batchNumber: item.batchNumber || '',
            expiryDate: item.expiryDate || '',
            totalQuantityPurchased: itemQty,
            freeQuantityPurchased: itemFree
          });
        } else {
          const isMoreRecent = new Date(bill.invoiceDate) >= new Date(existingQuote.lastPurchaseDate);
          if (isMoreRecent && itemPrice > 0) {
            existingQuote.purchasePrice = itemPrice;
            existingQuote.mrp = itemMrp || existingQuote.mrp;
            existingQuote.lastPurchaseDate = bill.invoiceDate;
            existingQuote.billId = bill.id;
            existingQuote.billNumber = bill.billNumber;
            existingQuote.batchNumber = item.batchNumber || existingQuote.batchNumber;
            existingQuote.expiryDate = item.expiryDate || existingQuote.expiryDate;
          }
          existingQuote.totalQuantityPurchased += itemQty;
          existingQuote.freeQuantityPurchased += itemFree;
        }
      });
    });

    // 3. Transform to list of MedicineComparisonGroup
    const result: MedicineComparisonGroup[] = [];

    groupMap.forEach((entry, key) => {
      const quotesRaw = Array.from(entry.quotesMap.values());
      const med = entry.medicine;

      if (quotesRaw.length === 0 && med) {
        quotesRaw.push({
          vendorId: '',
          vendorName: med.manufacturer || 'Primary Supplier',
          purchasePrice: med.purchasePrice,
          mrp: med.mrp,
          lastPurchaseDate: med.lastUpdated || '2026-09-01',
          billId: '',
          billNumber: 'Catalog',
          batchNumber: med.batchNumber,
          expiryDate: med.expiryDate,
          totalQuantityPurchased: med.stockQuantity,
          freeQuantityPurchased: 0
        });
      }

      if (quotesRaw.length === 0) return;

      const sortedQuotesRaw = [...quotesRaw].sort((a, b) => a.purchasePrice - b.purchasePrice);
      const lowestPrice = sortedQuotesRaw[0].purchasePrice;
      const highestPrice = sortedQuotesRaw[sortedQuotesRaw.length - 1].purchasePrice;

      const finalQuotes: SupplierQuote[] = sortedQuotesRaw.map(q => {
        const mrpVal = q.mrp > 0 ? q.mrp : (med?.mrp || q.purchasePrice * 1.35);
        const grossMargin = mrpVal > 0 ? Math.max(0, Math.round(((mrpVal - q.purchasePrice) / mrpVal) * 1000) / 10) : 0;
        const diffFromLowest = Math.round((q.purchasePrice - lowestPrice) * 100) / 100;
        const diffPercent = lowestPrice > 0 ? Math.round(((q.purchasePrice - lowestPrice) / lowestPrice) * 1000) / 10 : 0;

        return {
          ...q,
          mrp: mrpVal,
          grossMarginPercent: grossMargin,
          isLowestPrice: q.purchasePrice === lowestPrice,
          priceDiffFromLowest: diffFromLowest,
          priceDiffPercent: diffPercent
        };
      });

      const cheapestQuote = finalQuotes[0];
      const costliestQuote = finalQuotes[finalQuotes.length - 1];
      const maxPriceSpread = Math.round((highestPrice - lowestPrice) * 100) / 100;
      const maxPriceSpreadPercent = lowestPrice > 0 ? Math.round(((highestPrice - lowestPrice) / lowestPrice) * 1000) / 10 : 0;
      const potentialSavingsPerPack = maxPriceSpread;

      result.push({
        medicineId: med?.id || `med-${key}`,
        medicineName: med?.name || entry.fallbackName,
        genericName: med?.genericName || entry.fallbackName,
        category: med?.category || 'Medical Supplies',
        currentStock: med?.stockQuantity ?? 0,
        currentPurchasePrice: med?.purchasePrice ?? cheapestQuote.purchasePrice,
        mrp: med?.mrp ?? cheapestQuote.mrp,
        quotes: finalQuotes,
        cheapestQuote,
        costliestQuote,
        hasMultipleSuppliers: finalQuotes.length > 1,
        maxPriceSpread,
        maxPriceSpreadPercent,
        potentialSavingsPerPack
      });
    });

    return result;
  }, [medicines, purchaseBills]);

  // Filter and sort comparison groups
  const filteredGroups = useMemo(() => {
    return comparisonGroups
      .filter(g => {
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase().trim();
          const matchName = g.medicineName.toLowerCase().includes(query);
          const matchGeneric = g.genericName.toLowerCase().includes(query);
          const matchCategory = g.category.toLowerCase().includes(query);
          const matchVendor = g.quotes.some(q => q.vendorName.toLowerCase().includes(query));
          if (!matchName && !matchGeneric && !matchCategory && !matchVendor) return false;
        }

        if (selectedCategory !== 'ALL' && g.category !== selectedCategory) {
          return false;
        }

        if (selectedVendorFilter !== 'ALL') {
          const hasVendor = g.quotes.some(q => q.vendorName.toLowerCase() === selectedVendorFilter.toLowerCase());
          if (!hasVendor) return false;
        }

        if (filterMultiVendorOnly && !g.hasMultipleSuppliers) {
          return false;
        }

        if (filterHighVarianceOnly && g.maxPriceSpreadPercent < 5) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'variance_desc') {
          return b.maxPriceSpreadPercent - a.maxPriceSpreadPercent;
        }
        if (sortBy === 'savings_desc') {
          return b.maxPriceSpread - a.maxPriceSpread;
        }
        if (sortBy === 'name_asc') {
          return a.medicineName.localeCompare(b.medicineName);
        }
        if (sortBy === 'price_asc') {
          return a.cheapestQuote.purchasePrice - b.cheapestQuote.purchasePrice;
        }
        if (sortBy === 'recent') {
          const dateA = new Date(a.cheapestQuote.lastPurchaseDate).getTime();
          const dateB = new Date(b.cheapestQuote.lastPurchaseDate).getTime();
          return dateB - dateA;
        }
        return 0;
      });
  }, [comparisonGroups, searchQuery, selectedCategory, selectedVendorFilter, filterMultiVendorOnly, filterHighVarianceOnly, sortBy]);

  // Overall KPIs
  const kpiStats = useMemo(() => {
    const totalMedicines = comparisonGroups.length;
    const multiVendorMedicines = comparisonGroups.filter(g => g.hasMultipleSuppliers);
    const multiVendorCount = multiVendorMedicines.length;
    const highVarianceItems = comparisonGroups.filter(g => g.maxPriceSpreadPercent >= 5);

    let maxVariancePercent = 0;
    let maxVarianceItemName = '';
    let totalEstimatedSavings = 0;

    comparisonGroups.forEach(g => {
      if (g.maxPriceSpreadPercent > maxVariancePercent) {
        maxVariancePercent = g.maxPriceSpreadPercent;
        maxVarianceItemName = g.medicineName;
      }
      if (g.hasMultipleSuppliers) {
        totalEstimatedSavings += g.maxPriceSpread * Math.max(20, g.currentStock || 20);
      }
    });

    return {
      totalMedicines,
      multiVendorCount,
      highVarianceCount: highVarianceItems.length,
      maxVariancePercent,
      maxVarianceItemName,
      totalEstimatedSavings: Math.round(totalEstimatedSavings)
    };
  }, [comparisonGroups]);

  // Vendor Scorecard Data
  const vendorScorecard = useMemo(() => {
    const scoreMap = new Map<string, {
      vendorName: string;
      vendorId: string;
      totalQuotes: number;
      lowestPriceCount: number;
      totalPurchasedQty: number;
      avgMarginPercent: number;
      totalMarginSum: number;
    }>();

    comparisonGroups.forEach(g => {
      g.quotes.forEach(q => {
        const vKey = q.vendorName.trim().toLowerCase();
        if (!scoreMap.has(vKey)) {
          scoreMap.set(vKey, {
            vendorName: q.vendorName,
            vendorId: q.vendorId,
            totalQuotes: 0,
            lowestPriceCount: 0,
            totalPurchasedQty: 0,
            avgMarginPercent: 0,
            totalMarginSum: 0
          });
        }
        const entry = scoreMap.get(vKey)!;
        entry.totalQuotes += 1;
        if (q.isLowestPrice) entry.lowestPriceCount += 1;
        entry.totalPurchasedQty += q.totalQuantityPurchased;
        entry.totalMarginSum += q.grossMarginPercent;
      });
    });

    return Array.from(scoreMap.values()).map(entry => ({
      ...entry,
      winRate: entry.totalQuotes > 0 ? Math.round((entry.lowestPriceCount / entry.totalQuotes) * 100) : 0,
      avgMargin: entry.totalQuotes > 0 ? Math.round((entry.totalMarginSum / entry.totalQuotes) * 10) / 10 : 0
    })).sort((a, b) => b.winRate - a.winRate || b.lowestPriceCount - a.lowestPriceCount);
  }, [comparisonGroups]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['Medicine Name', 'Generic Name', 'Category', 'MRP (INR)', 'Lowest Price (INR)', 'Cheapest Vendor', 'Highest Price (INR)', 'Costliest Vendor', 'Price Spread (INR)', 'Variance (%)', 'All Suppliers'];
    
    const rows = comparisonGroups.map(g => [
      `"${g.medicineName.replace(/"/g, '""')}"`,
      `"${g.genericName.replace(/"/g, '""')}"`,
      `"${g.category}"`,
      g.mrp.toFixed(2),
      g.cheapestQuote.purchasePrice.toFixed(2),
      `"${g.cheapestQuote.vendorName.replace(/"/g, '""')}"`,
      g.costliestQuote.purchasePrice.toFixed(2),
      `"${g.costliestQuote.vendorName.replace(/"/g, '""')}"`,
      g.maxPriceSpread.toFixed(2),
      `${g.maxPriceSpreadPercent}%`,
      `"${g.quotes.map(q => `${q.vendorName}: ₹${q.purchasePrice}`).join(' | ')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Supplier_Price_Comparison_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-teal-700 to-emerald-600 flex items-center justify-center text-white shadow-md shadow-teal-700/20">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                Supplier Price Comparison & Procurement Intelligence
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-extrabold">
                  Smart Buy
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                Compare purchase rates across distributors, discover lowest prices, and maximize profit margins.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Export Matrix</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
          {onOpenAddBill && (
            <button
              onClick={() => onOpenAddBill()}
              className="flex items-center gap-1.5 px-4 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Record Purchase Bill</span>
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Analyzed Products</span>
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-teal-700 flex items-center justify-center">
              <Pill className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 mt-2">
            {kpiStats.totalMedicines}
          </div>
          <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-teal-700">{kpiStats.multiVendorCount} multi-vendor</span> tracked SKUs
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Multi-Supplier Products</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-indigo-900 mt-2">
            {kpiStats.multiVendorCount}
          </div>
          <div className="text-[11px] text-indigo-600 mt-1 flex items-center gap-1">
            <span>2+ distributor quotes available</span>
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Max Price Variance</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-amber-900 mt-2">
            +{kpiStats.maxVariancePercent}%
          </div>
          <div className="text-[11px] text-amber-700 mt-1 truncate">
            {kpiStats.maxVarianceItemName ? `${kpiStats.maxVarianceItemName.slice(0, 22)}...` : 'Across distributors'}
          </div>
        </div>

        <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-2xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Identified Savings</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <Coins className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl font-extrabold text-emerald-700 mt-2">
            {formatCurrency(kpiStats.totalEstimatedSavings)}
          </div>
          <div className="text-[11px] text-emerald-600 mt-1 font-semibold flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Potential monthly procurement gain</span>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-1">
        <button
          onClick={() => setActiveTab('medicines')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'medicines'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Drug-wise Price Matrix ({filteredGroups.length})
        </button>
        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${
            activeTab === 'vendors'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          Distributor Scorecard & Win Rates ({vendorScorecard.length})
        </button>
        <button
          onClick={() => setActiveTab('insights')}
          className={`px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center gap-1.5 ${
            activeTab === 'insights'
              ? 'bg-teal-700 text-white shadow-sm'
              : 'bg-white text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-500" />
          <span>Procurement Savings Opportunities</span>
        </button>
      </div>

      {/* TAB 1: Drug-wise Price Matrix */}
      {activeTab === 'medicines' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-12 gap-3">
              {/* Search */}
              <div className="sm:col-span-5 relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by drug name, generic composition, or supplier..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                />
              </div>

              {/* Category Filter */}
              <div className="sm:col-span-3">
                <select
                  value={selectedCategory}
                  onChange={e => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  <option value="ALL">All Categories</option>
                  {categories.map(c => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </select>
              </div>

              {/* Vendor Filter */}
              <div className="sm:col-span-2">
                <select
                  value={selectedVendorFilter}
                  onChange={e => setSelectedVendorFilter(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  <option value="ALL">All Suppliers</option>
                  {vendors.map(v => (
                    <option key={v.id} value={v.name}>{v.name}</option>
                  ))}
                </select>
              </div>

              {/* Sort By */}
              <div className="sm:col-span-2">
                <select
                  value={sortBy}
                  onChange={e => setSortBy(e.target.value as any)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-none focus:border-teal-600"
                >
                  <option value="variance_desc">Highest Variance %</option>
                  <option value="savings_desc">Highest Savings (₹)</option>
                  <option value="price_asc">Lowest Purchase Price</option>
                  <option value="name_asc">Drug Name A-Z</option>
                  <option value="recent">Recently Purchased</option>
                </select>
              </div>
            </div>

            {/* Quick Toggle Badges */}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 flex-wrap">
              <span className="text-[11px] font-bold text-slate-400">Quick Filters:</span>
              <button
                onClick={() => setFilterMultiVendorOnly(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filterMultiVendorOnly
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Multi-Supplier Only ({comparisonGroups.filter(g => g.hasMultipleSuppliers).length})</span>
              </button>

              <button
                onClick={() => setFilterHighVarianceOnly(prev => !prev)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                  filterHighVarianceOnly
                    ? 'bg-amber-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Price Spread &gt; 5% ({comparisonGroups.filter(g => g.maxPriceSpreadPercent >= 5).length})</span>
              </button>

              {(searchQuery || selectedCategory !== 'ALL' || selectedVendorFilter !== 'ALL' || filterMultiVendorOnly || filterHighVarianceOnly) && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ALL');
                    setSelectedVendorFilter('ALL');
                    setFilterMultiVendorOnly(false);
                    setFilterHighVarianceOnly(false);
                  }}
                  className="text-xs text-rose-600 hover:text-rose-800 font-bold ml-auto"
                >
                  Reset Filters
                </button>
              )}
            </div>
          </div>

          {/* Comparison Cards List */}
          {filteredGroups.length === 0 ? (
            <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
              <Scale className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-800">No matching medicine comparisons found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                Try clearing your search terms or filter selections to view all recorded supplier rates.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredGroups.map(group => {
                const matchedMed = medicines.find(m => m.id === group.medicineId || m.name.toLowerCase() === group.medicineName.toLowerCase());

                return (
                  <div
                    key={group.medicineId}
                    className="bg-white rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all overflow-hidden"
                  >
                    {/* Item Header */}
                    <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-50 via-white to-slate-50/50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0 mt-0.5">
                          <Pill className="w-5 h-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 
                              onClick={() => {
                                if (matchedMed) {
                                  setSelectedMedicine(matchedMed);
                                  onOpenMedicineDetail?.(matchedMed);
                                }
                              }}
                              className="font-bold text-slate-900 text-base hover:text-teal-700 cursor-pointer"
                            >
                              {group.medicineName}
                            </h3>
                            <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                              {group.category}
                            </span>
                            {group.hasMultipleSuppliers ? (
                              <span className="px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center gap-1">
                                <Building2 className="w-3 h-3" />
                                {group.quotes.length} Suppliers Compared
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[11px] font-medium">
                                1 Supplier Recorded
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 font-medium mt-0.5">
                            {group.genericName}
                          </p>
                        </div>
                      </div>

                      {/* Summary Metrics on the Right */}
                      <div className="flex items-center gap-4 self-start md:self-auto">
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Retail MRP</span>
                          <span className="text-sm font-bold text-slate-800">{formatCurrency(group.mrp)}</span>
                        </div>
                        <div className="h-7 w-px bg-slate-200" />
                        <div className="text-right">
                          <span className="text-[10px] uppercase font-bold text-slate-400 block">Best Rate</span>
                          <span className="text-sm font-extrabold text-emerald-700">
                            {formatCurrency(group.cheapestQuote.purchasePrice)}
                          </span>
                        </div>
                        {group.hasMultipleSuppliers && group.maxPriceSpread > 0 && (
                          <>
                            <div className="h-7 w-px bg-slate-200" />
                            <div className="text-right">
                              <span className="text-[10px] uppercase font-bold text-amber-600 block">Variance</span>
                              <span className="text-sm font-extrabold text-amber-600">
                                +{group.maxPriceSpreadPercent}%
                              </span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Best Buy Recommendation Banner (if multiple suppliers) */}
                    {group.hasMultipleSuppliers && group.maxPriceSpread > 0 && (
                      <div className="px-4 py-2.5 bg-emerald-50/80 border-b border-emerald-100 flex items-center justify-between gap-3 text-xs">
                        <div className="flex items-center gap-2 text-emerald-900 font-medium">
                          <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span>
                            <strong>Procurement Advice:</strong> Buy from <strong className="text-emerald-800 font-bold">{group.cheapestQuote.vendorName}</strong> at {formatCurrency(group.cheapestQuote.purchasePrice)} to save <strong className="text-emerald-700">{formatCurrency(group.maxPriceSpread)} / pack ({group.maxPriceSpreadPercent}%)</strong> over {group.costliestQuote.vendorName}.
                          </span>
                        </div>
                        {onOpenAddBill && (
                          <button
                            onClick={() => onOpenAddBill(group.cheapestQuote.vendorId, group.medicineName)}
                            className="px-3 py-1 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg font-bold text-[11px] shrink-0 transition-all shadow-2xs"
                          >
                            Order from {group.cheapestQuote.vendorName.split(' ')[0]}
                          </button>
                        )}
                      </div>
                    )}

                    {/* Supplier Rates Matrix Table */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                          <tr>
                            <th className="py-2.5 px-4">Distributor / Supplier</th>
                            <th className="py-2.5 px-3">Purchase Rate</th>
                            <th className="py-2.5 px-3">Price Comparison</th>
                            <th className="py-2.5 px-3">Gross Margin</th>
                            <th className="py-2.5 px-3">Latest Batch & Expiry</th>
                            <th className="py-2.5 px-3">Last Billed</th>
                            <th className="py-2.5 px-4 text-right">Action</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {group.quotes.map((quote, idx) => (
                            <tr
                              key={`${quote.vendorName}-${idx}`}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                quote.isLowestPrice ? 'bg-emerald-50/30 font-medium' : ''
                              }`}
                            >
                              <td className="py-3 px-4">
                                <div className="flex items-center gap-2">
                                  <div className="w-7 h-7 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs shrink-0">
                                    {quote.vendorName.charAt(0)}
                                  </div>
                                  <div>
                                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                      <span>{quote.vendorName}</span>
                                      {quote.isLowestPrice && (
                                        <span className="px-1.5 py-0.2 bg-emerald-100 text-emerald-800 rounded text-[10px] font-extrabold flex items-center gap-0.5">
                                          <Check className="w-3 h-3" />
                                          Cheapest
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-slate-400">
                                      Total volume supplied: {quote.totalQuantityPurchased} units {quote.freeQuantityPurchased > 0 && `(+${quote.freeQuantityPurchased} Free)`}
                                    </span>
                                  </div>
                                </div>
                              </td>

                              <td className="py-3 px-3 font-mono">
                                <span className={`text-sm font-extrabold ${
                                  quote.isLowestPrice ? 'text-emerald-700' : 'text-slate-800'
                                }`}>
                                  {formatCurrency(quote.purchasePrice)}
                                </span>
                                <span className="text-[10px] text-slate-400 block font-sans">per pack</span>
                              </td>

                              <td className="py-3 px-3">
                                {quote.isLowestPrice ? (
                                  <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                    <Check className="w-3 h-3" />
                                    Lowest Baseline
                                  </span>
                                ) : (
                                  <div>
                                    <span className="text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                      +{formatCurrency(quote.priceDiffFromLowest)} (+{quote.priceDiffPercent}%)
                                    </span>
                                    <span className="text-[10px] text-slate-400 block mt-0.5">more expensive</span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-3">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-extrabold text-slate-900">{quote.grossMarginPercent}%</span>
                                </div>
                                <span className="text-[10px] text-slate-400">
                                  Profit: {formatCurrency(quote.mrp - quote.purchasePrice)}
                                </span>
                              </td>

                              <td className="py-3 px-3 text-slate-600">
                                <span className="font-mono font-medium block">{quote.batchNumber || '—'}</span>
                                <span className="text-[10px] text-slate-400">{quote.expiryDate ? `Exp: ${quote.expiryDate}` : '—'}</span>
                              </td>

                              <td className="py-3 px-3 text-slate-600">
                                <span className="font-medium block">{formatDate(quote.lastPurchaseDate)}</span>
                                <span className="text-[10px] text-slate-400 font-mono">Bill #{quote.billNumber}</span>
                              </td>

                              <td className="py-3 px-4 text-right">
                                {onOpenAddBill && (
                                  <button
                                    onClick={() => onOpenAddBill(quote.vendorId, group.medicineName)}
                                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-teal-700 hover:text-white text-slate-700 rounded-lg text-[11px] font-bold transition-all"
                                  >
                                    Create Bill
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Vendor Scorecard & Win Rates */}
      {activeTab === 'vendors' && (
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
            <h3 className="font-bold text-slate-900 text-sm mb-1">Supplier Competitiveness Scorecard</h3>
            <p className="text-xs text-slate-500 mb-4">
              Evaluates which distributors provide the most competitive pricing, largest margins, and best catalog coverage.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendorScorecard.map((score) => {
                const matchedVendor = vendors.find(v => v.name.toLowerCase() === score.vendorName.toLowerCase() || v.id === score.vendorId);

                return (
                  <div
                    key={score.vendorName}
                    className="p-4 bg-slate-50/70 border border-slate-200 rounded-2xl hover:bg-white hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-extrabold text-sm shrink-0">
                            {score.vendorName.charAt(0)}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900 text-sm leading-tight">{score.vendorName}</h4>
                            <span className="text-[11px] text-slate-500">
                              {matchedVendor?.city || 'Pharmaceutical Wholesale'}
                            </span>
                          </div>
                        </div>

                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-extrabold ${
                          score.winRate >= 50
                            ? 'bg-emerald-100 text-emerald-800'
                            : score.winRate > 0
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}>
                          {score.winRate}% Best Price
                        </span>
                      </div>

                      <div className="space-y-1.5 mb-4">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-slate-500">Lowest Rate Frequency</span>
                          <span className="font-bold text-slate-800">{score.lowestPriceCount} of {score.totalQuotes} SKUs</span>
                        </div>
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className={`h-full rounded-full ${
                              score.winRate >= 50 ? 'bg-emerald-600' : 'bg-amber-500'
                            }`}
                            style={{ width: `${score.winRate}%` }}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs mb-3">
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Avg Gross Margin</span>
                          <span className="font-extrabold text-slate-800 text-sm">{score.avgMargin}%</span>
                        </div>
                        <div className="p-2.5 bg-white rounded-xl border border-slate-100">
                          <span className="text-[10px] text-slate-400 font-bold block uppercase">Total Inward Qty</span>
                          <span className="font-extrabold text-slate-800 text-sm">{score.totalPurchasedQty} units</span>
                        </div>
                      </div>
                    </div>

                    {onOpenAddBill && (
                      <button
                        onClick={() => onOpenAddBill(score.vendorId)}
                        className="w-full py-2 bg-white hover:bg-teal-700 hover:text-white border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all shadow-2xs"
                      >
                        Create Purchase Bill with {score.vendorName.split(' ')[0]}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Procurement Savings Opportunities */}
      {activeTab === 'insights' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-900 to-teal-800 text-white p-6 rounded-2xl shadow-md">
            <div className="flex items-center gap-2 text-emerald-300 text-xs font-extrabold uppercase tracking-wider mb-2">
              <Sparkles className="w-4 h-4" />
              <span>AI & Mathematical Procurement Opportunities</span>
            </div>
            <h2 className="text-xl font-extrabold mb-1">Direct Profit Boost by Switching Suppliers</h2>
            <p className="text-xs text-emerald-100 max-w-2xl leading-relaxed">
              Based on historical invoice data, your pharmacy could save up to <strong className="text-white font-bold">{formatCurrency(kpiStats.totalEstimatedSavings)}</strong> on next batch restocks by consolidating purchases with the lowest-priced distributors identified below.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {comparisonGroups
              .filter(g => g.hasMultipleSuppliers && g.maxPriceSpread > 0)
              .sort((a, b) => b.maxPriceSpreadPercent - a.maxPriceSpreadPercent)
              .map(group => (
                <div
                  key={group.medicineId}
                  className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-bold text-slate-900 text-base">{group.medicineName}</h4>
                        <p className="text-xs text-slate-500">{group.genericName}</p>
                      </div>
                      <span className="px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full text-xs font-extrabold shrink-0">
                        +{group.maxPriceSpreadPercent}% Variance
                      </span>
                    </div>

                    <div className="my-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          Cheapest: <strong>{group.cheapestQuote.vendorName}</strong>
                        </span>
                        <span className="font-extrabold text-emerald-700 font-mono">
                          {formatCurrency(group.cheapestQuote.purchasePrice)}
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-slate-500 flex items-center gap-1.5">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Costliest: <strong>{group.costliestQuote.vendorName}</strong>
                        </span>
                        <span className="font-bold text-rose-700 font-mono">
                          {formatCurrency(group.costliestQuote.purchasePrice)}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-slate-200 flex items-center justify-between font-bold text-emerald-800">
                        <span>Savings per 50-pack restock:</span>
                        <span className="font-extrabold text-sm">
                          {formatCurrency(group.maxPriceSpread * 50)}
                        </span>
                      </div>
                    </div>
                  </div>

                  {onOpenAddBill && (
                    <button
                      onClick={() => onOpenAddBill(group.cheapestQuote.vendorId, group.medicineName)}
                      className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-1.5"
                    >
                      <span>Reorder from {group.cheapestQuote.vendorName}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  );
};
