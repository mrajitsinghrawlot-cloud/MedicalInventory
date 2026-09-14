import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShoppingCart, 
  Search, 
  Plus, 
  Trash2, 
  CreditCard, 
  Banknote, 
  QrCode, 
  Printer, 
  Pill, 
  Package, 
  Calculator, 
  Check, 
  User, 
  Stethoscope, 
  Phone, 
  Sparkles,
  AlertCircle,
  FileText,
  Barcode,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Medicine, SalesBillItem, SalesBill } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';
import { BarcodeScannerModal } from '../inventory/BarcodeScannerModal';
import confetti from 'canvas-confetti';

interface PosCounterBillingProps {
  onOpenSalesReceipt: (bill: SalesBill) => void;
}

export const PosCounterBilling: React.FC<PosCounterBillingProps> = ({ onOpenSalesReceipt }) => {
  const { medicines, createSalesBill, navigate } = useInventory();

  // Search & Selected Drug state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMed, setSelectedMed] = useState<Medicine | null>(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [fastAutoAdd, setFastAutoAdd] = useState(true);
  const [scanToast, setScanToast] = useState<string | null>(null);

  // Item builder inputs (for the currently selected medicine)
  const [sellMode, setSellMode] = useState<'PACK' | 'LOOSE'>('LOOSE');
  const [quantity, setQuantity] = useState<number>(3); // e.g. 3 tabs
  const [packPrice, setPackPrice] = useState<number>(50); // e.g. ₹50 / strip
  const [unitPrice, setUnitPrice] = useState<number>(5); // e.g. ₹5 / tab
  const [itemDiscount, setItemDiscount] = useState<number>(0); // %

  // Cart / Bill State
  const [cart, setCart] = useState<SalesBillItem[]>([]);
  const [customerName, setCustomerName] = useState('Walk-in Customer');
  const [customerPhone, setCustomerPhone] = useState('');
  const [doctorName, setDoctorName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'Cash' | 'UPI' | 'Card' | 'Credit'>('Cash');
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  const [billNotes, setBillNotes] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // Search suggestions
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return medicines.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.genericName.toLowerCase().includes(q) ||
      m.batchNumber.toLowerCase().includes(q) ||
      m.barcode.includes(q)
    ).slice(0, 6);
  }, [medicines, searchQuery]);

  // When a barcode is scanned via camera or USB scanner gun
  const handleScannedMedicine = (med: Medicine) => {
    setErrorMsg('');
    if (fastAutoAdd) {
      const pSize = med.unitsPerPack || 10;
      const defaultPPrice = med.defaultSellingPrice || med.mrp;
      const uPrice = Number((defaultPPrice / pSize).toFixed(2));
      const sellQty = 1; // 1 full pack by default
      const baseAmount = defaultPPrice * sellQty;
      const taxAmt = Number(((baseAmount * (med.gstRate || 12)) / 100).toFixed(2));

      const newItem: SalesBillItem = {
        medicineId: med.id,
        medicineName: med.name,
        genericName: med.genericName,
        batchNumber: med.batchNumber,
        expiryDate: med.expiryDate,
        packSize: pSize,
        sellMode: 'PACK',
        quantity: sellQty,
        packPrice: defaultPPrice,
        unitPrice: uPrice,
        gstRate: med.gstRate || 12,
        taxAmount: taxAmt,
        discountPercent: 0,
        totalAmount: baseAmount,
        deductedPacks: 1
      };

      setCart(prev => [newItem, ...prev]);
      setScanToast(`✓ Scanned & Added: ${med.name} (₹${defaultPPrice})`);
      setTimeout(() => setScanToast(null), 3000);
    } else {
      handleSelectMedicine(med);
      setScanToast(`✓ Barcode Found: ${med.name}`);
      setTimeout(() => setScanToast(null), 3000);
    }
  };

  // Hardware USB Scanner Gun Enter Key handler
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const q = searchQuery.trim().toLowerCase();
      if (!q) return;

      const match = medicines.find(
        m => m.barcode.toLowerCase() === q ||
             m.batchNumber.toLowerCase() === q ||
             m.name.toLowerCase() === q
      );

      if (match) {
        setSearchQuery('');
        handleScannedMedicine(match);
      } else if (searchResults.length > 0) {
        setSearchQuery('');
        handleScannedMedicine(searchResults[0]);
      } else {
        setErrorMsg(`No medicine matching barcode or name "${searchQuery}"`);
      }
    }
  };

  // When medicine is picked manually, configure pricing and unit defaults
  const handleSelectMedicine = (med: Medicine) => {
    setSelectedMed(med);
    setSearchQuery('');
    const defaultPPrice = med.defaultSellingPrice || med.mrp;
    const pSize = med.unitsPerPack || 10;
    const uPrice = Number((defaultPPrice / pSize).toFixed(2));

    setPackPrice(defaultPPrice);
    setUnitPrice(uPrice);
    setSellMode(pSize > 1 ? 'LOOSE' : 'PACK');
    setQuantity(pSize > 1 ? 3 : 1);
    setItemDiscount(0);
  };

  // Synchronize Pack Price vs Unit Price changes
  const handlePackPriceChange = (newPackPrice: number) => {
    setPackPrice(newPackPrice);
    const pSize = selectedMed?.unitsPerPack || 10;
    setUnitPrice(Number((newPackPrice / pSize).toFixed(2)));
  };

  const handleUnitPriceChange = (newUnitPrice: number) => {
    setUnitPrice(newUnitPrice);
    const pSize = selectedMed?.unitsPerPack || 10;
    setPackPrice(Number((newUnitPrice * pSize).toFixed(2)));
  };

  // Add configured item to cart
  const handleAddToCart = () => {
    if (!selectedMed) return;
    setErrorMsg('');

    if (quantity <= 0) {
      setErrorMsg('Please enter a quantity greater than 0');
      return;
    }

    const pSize = selectedMed.unitsPerPack || 10;
    const deductedPacks = sellMode === 'LOOSE' 
      ? Number((quantity / pSize).toFixed(2)) 
      : quantity;

    if (deductedPacks > selectedMed.stockQuantity) {
      setErrorMsg(`Insufficient stock! Available: ${selectedMed.stockQuantity} strips (${selectedMed.stockQuantity * pSize} tablets).`);
      return;
    }

    const baseAmount = sellMode === 'LOOSE' ? quantity * unitPrice : quantity * packPrice;
    const discAmount = (baseAmount * itemDiscount) / 100;
    const finalAmount = Number((baseAmount - discAmount).toFixed(2));
    const taxAmt = Number(((finalAmount * (selectedMed.gstRate || 12)) / 100).toFixed(2));

    const newItem: SalesBillItem = {
      medicineId: selectedMed.id,
      medicineName: selectedMed.name,
      genericName: selectedMed.genericName,
      batchNumber: selectedMed.batchNumber,
      expiryDate: selectedMed.expiryDate,
      packSize: pSize,
      sellMode,
      quantity,
      packPrice,
      unitPrice,
      gstRate: selectedMed.gstRate || 12,
      taxAmount: taxAmt,
      discountPercent: itemDiscount,
      totalAmount: finalAmount,
      deductedPacks
    };

    setCart(prev => [newItem, ...prev]);
    setSelectedMed(null);
  };

  const handleRemoveItem = (index: number) => {
    setCart(prev => prev.filter((_, i) => i !== index));
  };

  // Totals calculations
  const subtotal = cart.reduce((acc, item) => acc + item.totalAmount, 0);
  const totalTax = cart.reduce((acc, item) => acc + item.taxAmount, 0);
  const rawTotal = subtotal + totalTax - overallDiscount;
  const grandTotal = Math.max(0, Math.round(rawTotal));
  const roundOff = Number((grandTotal - rawTotal).toFixed(2));

  // Handle Checkout / Print
  const handleCompleteSale = () => {
    if (cart.length === 0) {
      setErrorMsg('Please add at least 1 medicine to the billing cart');
      return;
    }

    const billNumber = `REC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newSale = createSalesBill({
      billNumber,
      date: new Date().toISOString(),
      customerName: customerName.trim() || 'Walk-in Customer',
      customerPhone: customerPhone.trim() || undefined,
      doctorName: doctorName.trim() || undefined,
      items: cart,
      subtotal,
      discountAmount: overallDiscount,
      taxAmount: totalTax,
      roundOff,
      grandTotal,
      paymentMethod,
      paymentStatus: 'PAID',
      notes: billNotes,
      pharmacistName: 'Dr. Arjun (Registered Pharmacist)'
    });

    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.6 } });
    } catch {}

    // Reset Form
    setCart([]);
    setCustomerName('Walk-in Customer');
    setCustomerPhone('');
    setDoctorName('');
    setOverallDiscount(0);

    // Open receipt modal
    onOpenSalesReceipt(newSale);
  };

  return (
    <div className="space-y-5 max-w-7xl mx-auto">
      {/* Top Header */}
      <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-700 text-white flex items-center justify-center font-bold text-sm shadow-sm">
              <ShoppingCart className="w-4 h-4" />
            </div>
            <h2 className="text-lg font-bold text-slate-900">Counter Sale & Patient Billing (POS)</h2>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Dispense full strips or individual loose tablets with real-time unit price calculation & instant stock deduction.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('sales-history')}
            className="flex items-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
          >
            <FileText className="w-4 h-4" />
            <span>Past Sales Receipts</span>
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="p-3.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Scan Toast Success Banner */}
      {scanToast && (
        <div className="p-3 bg-emerald-600 text-white rounded-2xl flex items-center justify-between text-xs font-bold shadow-lg shadow-emerald-700/20 animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-200" />
            <span>{scanToast}</span>
          </div>
          <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full">Cart Updated</span>
        </div>
      )}

      {/* Main 2-Column POS Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left Column (7 cols): Medicine Selector & Item Builder */}
        <div className="lg:col-span-7 space-y-4">
          {/* 1. Medicine Search & Barcode Scanner Bar */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-slate-800 uppercase tracking-wider">
                1. Search or Scan Barcode
              </label>
              
              {/* Fast Auto-Add Toggle */}
              <label className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-semibold text-slate-600">
                <input
                  type="checkbox"
                  checked={fastAutoAdd}
                  onChange={e => setFastAutoAdd(e.target.checked)}
                  className="rounded text-teal-700 focus:ring-teal-600 w-3.5 h-3.5"
                />
                <span className="flex items-center gap-1">
                  <Zap className="w-3 h-3 text-amber-500 fill-amber-500" />
                  <span>Auto-add 1 pack on scan</span>
                </span>
              </label>
            </div>

            {/* Search Input + Barcode Scanner Trigger Button */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Type drug name / scan barcode / press Enter..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  onKeyDown={handleSearchKeyDown}
                  className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-600/20 focus:border-teal-600 font-medium"
                />
              </div>

              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="px-3.5 py-2.5 bg-gradient-to-r from-purple-700 to-indigo-700 hover:from-purple-800 hover:to-indigo-800 text-white rounded-xl text-xs font-bold shadow-md shadow-purple-900/20 transition-all active:scale-95 flex items-center gap-1.5 shrink-0"
                title="Open Camera / USB Barcode Scanner"
              >
                <Barcode className="w-4 h-4" />
                <span className="hidden sm:inline">Scan Barcode</span>
              </button>
            </div>

            {/* Live Search Suggestions Dropdown */}
            {searchResults.length > 0 && (
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white shadow-lg animate-in fade-in">
                {searchResults.map(med => (
                  <div
                    key={med.id}
                    onClick={() => handleSelectMedicine(med)}
                    className="p-3 hover:bg-teal-50/70 cursor-pointer transition-colors flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-teal-100 text-teal-700 flex items-center justify-center font-bold shrink-0">
                        <Pill className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <div className="font-bold text-slate-900">{med.name}</div>
                        <div className="text-[11px] text-slate-500">
                          {med.genericName} • <span className="font-mono text-slate-400">Barcode: {med.barcode}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-slate-900">{formatCurrency(med.defaultSellingPrice || med.mrp)} / strip</div>
                      <div className="text-[10px] text-emerald-600 font-semibold">{med.stockQuantity} strips in stock</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Quick 1-Tap Barcode Simulation Chips */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] text-slate-500 font-bold flex items-center gap-1">
                  <Barcode className="w-3 h-3 text-purple-600" />
                  <span>1-Tap Barcode Scan (Simulate Camera / USB Gun):</span>
                </span>
                <span className="text-[10px] text-slate-400">Fast scan into bill</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {medicines.slice(0, 5).map(m => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => handleScannedMedicine(m)}
                    className="px-2.5 py-1 bg-purple-50/60 hover:bg-purple-100/80 text-purple-900 hover:border-purple-300 border border-purple-200/80 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 active:scale-95 shadow-2xs"
                  >
                    <Barcode className="w-3 h-3 text-purple-500" />
                    <span>{m.name.split(' ')[0]}</span>
                    <span className="font-mono text-[9px] text-purple-600/80">({m.barcode.slice(-4)})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 2. Selling Mode, Loose Units, & Dynamic Price Calculator Box */}
          <AnimatePresence>
            {selectedMed && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.98 }}
                transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="bg-gradient-to-br from-white to-teal-50/40 p-5 rounded-2xl border-2 border-teal-500/40 shadow-sm space-y-4"
              >
              <div className="flex items-start justify-between border-b border-teal-100 pb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 bg-teal-700 text-white rounded-md text-[10px] font-extrabold uppercase">
                      Selected Item
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base">{selectedMed.name}</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">{selectedMed.genericName}</p>
                  <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-500 font-medium">
                    <span>Batch: <strong className="font-mono text-slate-800">{selectedMed.batchNumber}</strong></span>
                    <span>•</span>
                    <span>Available: <strong className="text-emerald-700">{selectedMed.stockQuantity} Strips</strong> ({selectedMed.stockQuantity * selectedMed.unitsPerPack} Tablets)</span>
                  </div>
                </div>

                <button
                  onClick={() => setSelectedMed(null)}
                  className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
                >
                  Change Drug
                </button>
              </div>

              {/* Selling Mode Selection Tabs */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  How are you dispensing this medicine?
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setSellMode('LOOSE');
                      setQuantity(3);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      sellMode === 'LOOSE'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Pill className="w-4 h-4" />
                    <span>Loose Tablets / Single Units</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setSellMode('PACK');
                      setQuantity(1);
                    }}
                    className={`py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 border transition-all ${
                      sellMode === 'PACK'
                        ? 'bg-teal-700 text-white border-teal-700 shadow-sm'
                        : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <Package className="w-4 h-4" />
                    <span>Full Strip / Pack</span>
                  </button>
                </div>
              </div>

              {/* Real-time Calculation & Price Editor Matrix */}
              <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between text-xs border-b border-slate-100 pb-2">
                  <div className="flex items-center gap-1.5 font-bold text-slate-700">
                    <Calculator className="w-4 h-4 text-teal-700" />
                    <span>Unit Pricing & Calculation</span>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Pack Size: <strong>{selectedMed.unitsPerPack} Tablets per Strip</strong>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  {/* Pack Price Input */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Full Strip Price (₹)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      value={packPrice}
                      onChange={e => handlePackPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-900 focus:outline-none focus:border-teal-600"
                    />
                    <span className="text-[10px] text-slate-400">MRP: {formatCurrency(selectedMed.mrp)}</span>
                  </div>

                  {/* Calculated Loose Tablet Unit Price */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      Rate per Tablet (₹)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={unitPrice}
                      onChange={e => handleUnitPriceChange(parseFloat(e.target.value) || 0)}
                      className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl font-bold text-teal-800 focus:outline-none focus:border-teal-600"
                    />
                    <span className="text-[10px] text-slate-400">₹{packPrice} ÷ {selectedMed.unitsPerPack} tabs</span>
                  </div>

                  {/* Quantity to sell */}
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">
                      {sellMode === 'LOOSE' ? 'Quantity (Tablets)' : 'Quantity (Strips)'}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, parseInt(e.target.value, 10) || 1))}
                      className="w-full px-3 py-1.5 bg-teal-50/60 border border-teal-300 rounded-xl font-extrabold text-teal-900 text-sm focus:outline-none focus:border-teal-600 text-center"
                    />
                    {sellMode === 'LOOSE' && (
                      <span className="text-[10px] text-slate-400">
                        = {(quantity / selectedMed.unitsPerPack).toFixed(2)} strips deducted
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Formula Preview */}
                <div className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-slate-600 font-medium">Calculated Charge: </span>
                    <strong className="text-slate-900">
                      {sellMode === 'LOOSE' 
                        ? `${quantity} tabs × ${formatCurrency(unitPrice)}/tab` 
                        : `${quantity} strips × ${formatCurrency(packPrice)}/strip`}
                    </strong>
                  </div>
                  <div className="text-base font-extrabold text-teal-900">
                    {formatCurrency(sellMode === 'LOOSE' ? quantity * unitPrice : quantity * packPrice)}
                  </div>
                </div>
              </div>

              {/* Add to Cart Button */}
              <button
                type="button"
                onClick={handleAddToCart}
                className="w-full py-2.5 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-md shadow-teal-700/20 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add this Item to Bill</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>

          {/* 3. Patient & Doctor Details */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs space-y-3">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider block">
              3. Patient & Doctor Information (Optional)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <label className="block text-slate-500 mb-1 font-medium flex items-center gap-1">
                  <User className="w-3 h-3 text-slate-400" />
                  <span>Patient / Customer Name</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={customerName}
                  onChange={e => setCustomerName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium flex items-center gap-1">
                  <Phone className="w-3 h-3 text-slate-400" />
                  <span>Mobile Phone</span>
                </label>
                <input
                  type="text"
                  placeholder="+91 98200 00000"
                  value={customerPhone}
                  onChange={e => setCustomerPhone(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-mono"
                />
              </div>

              <div>
                <label className="block text-slate-500 mb-1 font-medium flex items-center gap-1">
                  <Stethoscope className="w-3 h-3 text-slate-400" />
                  <span>Prescribing Doctor</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dr. Kulkarni (MD)"
                  value={doctorName}
                  onChange={e => setDoctorName(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column (5 cols): Live Billing Cart & Checkout Receipt */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-5 space-y-4 flex flex-col justify-between h-full min-h-[500px]">
            <div>
              {/* Cart Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 text-teal-700" />
                  <h3 className="font-bold text-slate-900 text-sm">Dispensing Cart</h3>
                  <span className="px-2 py-0.2 bg-teal-100 text-teal-800 text-xs font-bold rounded-full">
                    {cart.length} item{cart.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {cart.length > 0 && (
                  <button
                    onClick={() => setCart([])}
                    className="text-[11px] text-rose-600 hover:underline font-semibold"
                  >
                    Clear Cart
                  </button>
                )}
              </div>

              {/* Cart Items List */}
              <div className="my-3 space-y-2 max-h-72 overflow-y-auto divide-y divide-slate-100 pr-1">
                {cart.length === 0 ? (
                  <div className="py-12 text-center text-slate-400 text-xs animate-in fade-in">
                    <Pill className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                    <p className="font-semibold text-slate-600">Cart is empty</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">Search and add tablets or strips to begin billing</p>
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {cart.map((item, idx) => (
                      <motion.div
                        key={`${item.medicineId}-${item.batchNumber}-${idx}`}
                        initial={{ opacity: 0, height: 0, y: -8 }}
                        animate={{ opacity: 1, height: 'auto', y: 0 }}
                        exit={{ opacity: 0, height: 0, x: 20 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="pt-2.5 pb-2 flex items-start justify-between gap-2 text-xs overflow-hidden"
                      >
                        <div className="min-w-0">
                          <div className="font-bold text-slate-900 flex items-center gap-1.5">
                            <span>{item.medicineName}</span>
                            <span className={`text-[9px] font-extrabold px-1.5 py-0.2 rounded ${
                              item.sellMode === 'LOOSE' ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                            }`}>
                              {item.sellMode === 'LOOSE' ? `${item.quantity} Tabs Loose` : `${item.quantity} Strip`}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            Batch: {item.batchNumber} • Rate: {item.sellMode === 'LOOSE' ? `${formatCurrency(item.unitPrice)}/tab` : `${formatCurrency(item.packPrice)}/strip`}
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span className="font-extrabold text-slate-900">
                            {formatCurrency(item.totalAmount)}
                          </span>
                          <button
                            onClick={() => handleRemoveItem(idx)}
                            className="p-1 text-slate-300 hover:text-rose-600 active:scale-90 transition-all"
                            title="Remove item"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

            {/* Bottom Checkout Controls */}
            <div className="border-t border-slate-200 pt-3 space-y-3 text-xs">
              {/* Payment Method Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-600 mb-1">
                  Payment Mode
                </label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(['Cash', 'UPI', 'Card', 'Credit'] as const).map(mode => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setPaymentMethod(mode)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold border transition-all ${
                        paymentMethod === mode
                          ? 'bg-slate-900 text-white border-slate-900 shadow-2xs'
                          : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price Calculation Summary */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200/80 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>GST Taxes included:</span>
                  <span className="font-semibold text-slate-700">{formatCurrency(totalTax)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span>Counter Discount (₹):</span>
                  <input
                    type="number"
                    min="0"
                    value={overallDiscount || ''}
                    onChange={e => setOverallDiscount(parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-20 px-2 py-0.5 bg-white border border-slate-200 rounded-md text-right font-bold text-rose-600"
                  />
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-sm font-extrabold">
                  <span className="text-slate-900">Total Payable:</span>
                  <span className="text-xl text-teal-800">{formatCurrency(grandTotal)}</span>
                </div>
              </div>

              {/* Complete & Print Button */}
              <button
                type="button"
                onClick={handleCompleteSale}
                disabled={cart.length === 0}
                className="w-full py-3 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-bold text-sm shadow-lg shadow-teal-700/25 transition-all active:scale-98 flex items-center justify-center gap-2"
              >
                <Printer className="w-4 h-4" />
                <span>Complete Sale & Print Cash Memo ({formatCurrency(grandTotal)})</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Embedded Barcode Scanner Camera & Input Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicine={(med) => handleScannedMedicine(med)}
        title="POS Counter Barcode Scanner"
        subtitle="Point camera at medicine barcode or click test item to add to bill"
        actionButtonLabel="Add to Billing Cart"
      />
    </div>
  );
};
