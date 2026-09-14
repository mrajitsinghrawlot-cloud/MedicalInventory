import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, PackagePlus, Sparkles, Check, Barcode } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Category, DosageForm, ScheduleType, Medicine } from '../../types/inventory';
import { BarcodeScannerModal } from './BarcodeScannerModal';
import confetti from 'canvas-confetti';

interface AddMedicineModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddMedicineModal: React.FC<AddMedicineModalProps> = ({ isOpen, onClose }) => {
  const { addMedicine } = useInventory();
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    genericName: '',
    category: 'Antibiotics' as Category,
    form: 'Tablet' as DosageForm,
    strength: '500mg',
    unitsPerPack: 10, // e.g. 10 tablets per strip
    packUnitLabel: '10 Tabs / Strip',
    manufacturer: '',
    batchNumber: '',
    barcode: '',
    expiryDate: '',
    purchasePrice: 0,
    mrp: 0,
    defaultSellingPrice: 0,
    stockQuantity: 50,
    minStockThreshold: 20,
    rackLocation: 'Rack A - Shelf 1',
    scheduleType: 'Schedule H' as ScheduleType,
    requiresPrescription: true,
    gstRate: 12,
    hsnCode: '30049099',
    notes: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

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

  const dosageForms: DosageForm[] = [
    'Tablet',
    'Capsule',
    'Syrup',
    'Injection',
    'Ointment',
    'Drops',
    'Inhaler',
    'Sachet'
  ];

  const handleGenerateBatch = () => {
    const prefix = formData.name ? formData.name.slice(0, 3).toUpperCase() : 'MED';
    const rand = Math.floor(1000 + Math.random() * 9000);
    const code = `${prefix}-${rand}`;
    setFormData(prev => ({
      ...prev,
      batchNumber: code,
      barcode: prev.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`
    }));
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!formData.name.trim()) errs.name = 'Brand medicine name is required';
    if (!formData.genericName.trim()) errs.genericName = 'Generic composition is required';
    if (!formData.batchNumber.trim()) errs.batchNumber = 'Batch number is required';
    if (!formData.expiryDate) errs.expiryDate = 'Expiry date is required';
    if (formData.mrp <= 0) errs.mrp = 'MRP must be greater than 0';
    if (formData.purchasePrice <= 0) errs.purchasePrice = 'Purchase price must be greater than 0';
    if (formData.unitsPerPack <= 0) errs.unitsPerPack = 'Units per pack must be at least 1';
    return errs;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    addMedicine({
      ...formData,
      defaultSellingPrice: formData.defaultSellingPrice || formData.mrp,
      barcode: formData.barcode || `890${Math.floor(100000000 + Math.random() * 900000000)}`,
      manufacturer: formData.manufacturer || 'Standard Pharma Labs'
    });

    try {
      confetti({ particleCount: 40, spread: 60, origin: { y: 0.7 } });
    } catch {}

    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 15 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 max-h-[92vh] flex flex-col"
          >
            {/* Header */}
            <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-700 text-white flex items-center justify-center shadow-sm">
                  <PackagePlus className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">Add New Medicine / Strip Pack</h2>
                  <p className="text-xs text-slate-500">Configure pack size and loose tablet selling prices</p>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500 transition-colors"
              >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 text-xs">
          {/* Row 1: Brand Name & Generic Name */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Brand / Trade Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Paracetamol 650mg / Dolo"
                value={formData.name}
                onChange={e => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600"
              />
              {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Generic Salt Composition <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Paracetamol / Acetaminophen (650mg)"
                value={formData.genericName}
                onChange={e => setFormData({ ...formData, genericName: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-teal-600"
              />
              {errors.genericName && <p className="text-[11px] text-rose-600 mt-1">{errors.genericName}</p>}
            </div>
          </div>

          {/* Row 2: Category, Form, Strength & Pack Size */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Therapeutic Category</label>
              <select
                value={formData.category}
                onChange={e => setFormData({ ...formData, category: e.target.value as Category })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              >
                {categories.map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Dosage Form</label>
              <select
                value={formData.form}
                onChange={e => setFormData({ ...formData, form: e.target.value as DosageForm })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-teal-600"
              >
                {dosageForms.map(f => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Strength</label>
              <input
                type="text"
                placeholder="e.g. 650mg"
                value={formData.strength}
                onChange={e => setFormData({ ...formData, strength: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Tabs per Strip / Pack <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="1"
                placeholder="e.g. 10 or 15"
                value={formData.unitsPerPack}
                onChange={e => setFormData({ 
                  ...formData, 
                  unitsPerPack: parseInt(e.target.value, 10) || 1,
                  packUnitLabel: `${e.target.value || 1} Tabs / Strip`
                })}
                className="w-full px-3 py-2 bg-amber-50/70 border border-amber-300 rounded-xl text-xs font-bold text-slate-900 text-center"
              />
            </div>
          </div>

          {/* Row 3: Batch Number, Barcode, Expiry Date & Manufacturer */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">
                  Batch Number <span className="text-rose-500">*</span>
                </label>
                <button
                  type="button"
                  onClick={handleGenerateBatch}
                  className="text-[10px] text-teal-700 hover:underline flex items-center gap-0.5 font-bold"
                >
                  <Sparkles className="w-2.5 h-2.5" />
                  Auto
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. DL-8821"
                value={formData.batchNumber}
                onChange={e => setFormData({ ...formData, batchNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800"
              />
              {errors.batchNumber && <p className="text-[11px] text-rose-600 mt-1">{errors.batchNumber}</p>}
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Barcode / EAN-13</label>
                <button
                  type="button"
                  onClick={() => setIsScannerOpen(true)}
                  className="text-[10px] text-purple-700 hover:underline flex items-center gap-0.5 font-bold"
                  title="Scan physical box barcode with camera"
                >
                  <Barcode className="w-3 h-3" />
                  <span>Scan</span>
                </button>
              </div>
              <input
                type="text"
                placeholder="e.g. 8901234567890"
                value={formData.barcode}
                onChange={e => setFormData({ ...formData, barcode: e.target.value })}
                className="w-full px-3 py-2 bg-purple-50/50 border border-purple-200 rounded-xl text-xs font-mono font-bold text-purple-950"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Expiry Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.expiryDate}
                onChange={e => setFormData({ ...formData, expiryDate: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
              {errors.expiryDate && <p className="text-[11px] text-rose-600 mt-1">{errors.expiryDate}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Manufacturer</label>
              <input
                type="text"
                placeholder="e.g. Micro Labs Ltd"
                value={formData.manufacturer}
                onChange={e => setFormData({ ...formData, manufacturer: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>
          </div>

          {/* Row 4: Pricing & Quantities */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3.5 rounded-2xl border border-slate-100">
            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Purchase Cost / Strip (₹) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.purchasePrice || ''}
                onChange={e => setFormData({ ...formData, purchasePrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
              {errors.purchasePrice && <p className="text-[10px] text-rose-600 mt-1">{errors.purchasePrice}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Strip MRP (₹) *
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                value={formData.mrp || ''}
                onChange={e => {
                  const val = parseFloat(e.target.value) || 0;
                  setFormData({ ...formData, mrp: val, defaultSellingPrice: formData.defaultSellingPrice || val });
                }}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
              {errors.mrp && <p className="text-[10px] text-rose-600 mt-1">{errors.mrp}</p>}
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Default Sell Price / Strip (₹)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                placeholder="e.g. 50"
                value={formData.defaultSellingPrice || ''}
                onChange={e => setFormData({ ...formData, defaultSellingPrice: parseFloat(e.target.value) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-teal-300 rounded-lg text-xs font-bold text-teal-900"
              />
              <span className="text-[10px] text-teal-700 font-semibold block mt-0.5">
                = {((formData.defaultSellingPrice || formData.mrp || 0) / (formData.unitsPerPack || 10)).toFixed(2)}/tab
              </span>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Opening Stock (Strips)</label>
              <input
                type="number"
                min="0"
                value={formData.stockQuantity}
                onChange={e => setFormData({ ...formData, stockQuantity: parseInt(e.target.value, 10) || 0 })}
                className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-bold text-slate-800"
              />
            </div>
          </div>

          {/* Row 5: Rack Location, Schedule */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Storage Rack / Shelf</label>
              <input
                type="text"
                placeholder="e.g. Rack A - Shelf 3"
                value={formData.rackLocation}
                onChange={e => setFormData({ ...formData, rackLocation: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Regulatory Schedule</label>
              <select
                value={formData.scheduleType}
                onChange={e => setFormData({ 
                  ...formData, 
                  scheduleType: e.target.value as ScheduleType,
                  requiresPrescription: e.target.value !== 'OTC'
                })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
              >
                <option value="OTC">OTC (Non-prescription)</option>
                <option value="Schedule H">Schedule H (Doctor Rx)</option>
                <option value="Schedule H1">Schedule H1 (Controlled)</option>
                <option value="Schedule X">Schedule X</option>
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Min Safe Level (Strips)</label>
              <input
                type="number"
                min="1"
                value={formData.minStockThreshold}
                onChange={e => setFormData({ ...formData, minStockThreshold: parseInt(e.target.value, 10) || 10 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold"
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Save & Register Medicine</span>
          </button>
        </div>
      </motion.div>

      {/* Barcode Scanner Modal */}
      <BarcodeScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onSelectMedicine={(med) => {
          setFormData(prev => ({
            ...prev,
            barcode: med.barcode,
            name: prev.name || med.name,
            genericName: prev.genericName || med.genericName,
            manufacturer: prev.manufacturer || med.manufacturer
          }));
          setIsScannerOpen(false);
        }}
        title="Scan Packaging Barcode"
        subtitle="Point camera at physical medicine box or strip to auto-fill barcode digits"
        actionButtonLabel="Use Barcode Digits"
      />
    </div>
      )}
    </AnimatePresence>
  );
};
