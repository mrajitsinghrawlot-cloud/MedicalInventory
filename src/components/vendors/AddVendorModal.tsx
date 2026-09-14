import React, { useState } from 'react';
import { X, Users2, Check, AlertCircle } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import confetti from 'canvas-confetti';

interface AddVendorModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddVendorModal: React.FC<AddVendorModalProps> = ({ isOpen, onClose }) => {
  const { addVendor } = useInventory();

  const [formData, setFormData] = useState({
    name: '',
    contactPerson: '',
    phone: '',
    email: '',
    address: '',
    city: 'Mumbai',
    gstin: '',
    dlNumber: '',
    paymentTermsDays: 30,
    rating: 4.8,
    status: 'Active' as const
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setErrors({ name: 'Vendor / Agency name is required' });
      return;
    }
    if (!formData.phone.trim()) {
      setErrors({ phone: 'Contact phone number is required' });
      return;
    }

    addVendor({
      ...formData,
      gstin: formData.gstin || '27AABCV9999P1Z1',
      dlNumber: formData.dlNumber || 'MH-WZ-20B-998822'
    });

    try {
      confetti({ particleCount: 30, spread: 50 });
    } catch {}

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 animate-in fade-in zoom-in-95">
        <div className="px-6 py-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-700 text-white flex items-center justify-center shadow-sm">
              <Users2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">Add New Pharma Supplier</h2>
              <p className="text-xs text-slate-500">Register distributor & drug license details</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white border border-slate-200 hover:bg-slate-100 flex items-center justify-center text-slate-500">
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Company / Distributor Name *</label>
            <input
              type="text"
              placeholder="e.g. Abbott Healthcare Logistics"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:outline-none focus:border-purple-600"
            />
            {errors.name && <p className="text-[11px] text-rose-600 mt-1">{errors.name}</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Contact Person</label>
              <input
                type="text"
                placeholder="e.g. Ramesh Patel"
                value={formData.contactPerson}
                onChange={e => setFormData({ ...formData, contactPerson: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Phone Number *</label>
              <input
                type="text"
                placeholder="+91 98200 11223"
                value={formData.phone}
                onChange={e => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
              {errors.phone && <p className="text-[11px] text-rose-600 mt-1">{errors.phone}</p>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                placeholder="orders@supplier.com"
                value={formData.email}
                onChange={e => setFormData({ ...formData, email: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">City / Region</label>
              <input
                type="text"
                value={formData.city}
                onChange={e => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN Number</label>
              <input
                type="text"
                placeholder="27AABCM1234F1Z8"
                value={formData.gstin}
                onChange={e => setFormData({ ...formData, gstin: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Drug License #</label>
              <input
                type="text"
                placeholder="MH-WZ-20B-184920"
                value={formData.dlNumber}
                onChange={e => setFormData({ ...formData, dlNumber: e.target.value })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Payment Credit Term (Days)</label>
              <input
                type="number"
                min="0"
                value={formData.paymentTermsDays}
                onChange={e => setFormData({ ...formData, paymentTermsDays: parseInt(e.target.value, 10) || 30 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1">Supplier Rating (1-5)</label>
              <input
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={formData.rating}
                onChange={e => setFormData({ ...formData, rating: parseFloat(e.target.value) || 5 })}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Warehouse Address</label>
            <input
              type="text"
              placeholder="Plot 42, Logistics Park, Phase 1"
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl"
            />
          </div>
        </form>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
          <button type="button" onClick={onClose} className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold">
            Cancel
          </button>
          <button type="button" onClick={handleSubmit} className="px-5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl font-bold shadow-sm flex items-center gap-1.5">
            <Check className="w-4 h-4" />
            <span>Save Supplier</span>
          </button>
        </div>
      </div>
    </div>
  );
};
