import React, { useState } from 'react';
import { Plus, ShoppingCart, PackagePlus, FilePlus, SlidersHorizontal, Barcode } from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';

interface QuickActionFabProps {
  onOpenAddMedicine: () => void;
  onOpenAddBill: () => void;
  onOpenAdjustment: () => void;
  onOpenScanner: () => void;
}

export const QuickActionFab: React.FC<QuickActionFabProps> = ({
  onOpenAddMedicine,
  onOpenAddBill,
  onOpenAdjustment,
  onOpenScanner
}) => {
  const { navigate } = useInventory();
  const [isOpen, setIsOpen] = useState(false);

  const actions = [
    {
      label: 'Sell / POS',
      icon: ShoppingCart,
      color: 'bg-emerald-600 text-white hover:bg-emerald-700 font-bold',
      action: () => navigate('pos')
    },
    {
      label: 'Add Medicine',
      icon: PackagePlus,
      color: 'bg-teal-600 text-white hover:bg-teal-700',
      action: onOpenAddMedicine
    },
    {
      label: 'Purchase Bill',
      icon: FilePlus,
      color: 'bg-blue-600 text-white hover:bg-blue-700',
      action: onOpenAddBill
    },
    {
      label: 'Stock Adjust',
      icon: SlidersHorizontal,
      color: 'bg-amber-600 text-white hover:bg-amber-700',
      action: onOpenAdjustment
    },
    {
      label: 'Barcode Scan',
      icon: Barcode,
      color: 'bg-purple-600 text-white hover:bg-purple-700',
      action: onOpenScanner
    }
  ];

  return (
    <div className="md:hidden">
      {/* Backdrop overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 animate-in fade-in duration-200"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* FAB and Action options */}
      <div className="fixed bottom-20 right-4 z-50 flex flex-col items-end gap-3">
        {isOpen && (
          <div className="flex flex-col gap-2.5 items-end mb-1 animate-in slide-in-from-bottom-4 fade-in duration-200">
            {actions.map((act, index) => (
              <button
                key={index}
                onClick={() => {
                  setIsOpen(false);
                  act.action();
                }}
                className="flex items-center gap-2.5 px-3.5 py-2 bg-white text-slate-800 text-xs font-semibold rounded-full shadow-lg border border-slate-200 active:scale-95 transition-all group"
              >
                <span>{act.label}</span>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center ${act.color} shadow-xs`}>
                  <act.icon className="w-4 h-4" />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Main Trigger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          aria-label={isOpen ? 'Close actions menu' : 'Open quick actions menu'}
          className={`w-13 h-13 rounded-full text-white shadow-xl flex items-center justify-center transition-all duration-300 active:scale-95 ${
            isOpen ? 'bg-slate-800 rotate-45 scale-105' : 'bg-teal-700 hover:bg-teal-800'
          }`}
          style={{ width: '52px', height: '52px' }}
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};
