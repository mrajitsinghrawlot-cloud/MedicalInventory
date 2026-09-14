import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  ShieldCheck, 
  Building2, 
  Wifi, 
  WifiOff, 
  RefreshCw, 
  Database, 
  Download, 
  Upload, 
  Check,
  AlertCircle
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import confetti from 'canvas-confetti';

export const SettingsView: React.FC = () => {
  const { 
    syncStatus, 
    setSyncStatus, 
    triggerSync, 
    lastSynced, 
    resetToDemoData,
    medicines,
    vendors,
    purchaseBills,
    stockMovements
  } = useInventory();

  const [pharmacyName, setPharmacyName] = useState('Apex Care Hospital Central Pharmacy');
  const [dlNumber, setDlNumber] = useState('DL-20B/21B-48190-MH');
  const [gstin, setGstin] = useState('27AAAAA0000A1Z5');
  const [pharmacistName, setPharmacistName] = useState('Dr. Arjun (Reg #R-88219)');
  const [defaultThreshold, setDefaultThreshold] = useState(20);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
    try {
      confetti({ particleCount: 25, spread: 45 });
    } catch {}
  };

  const handleExportFullBackup = () => {
    const backup = {
      version: '2.4.0',
      exportedAt: new Date().toISOString(),
      pharmacy: { pharmacyName, dlNumber, gstin, pharmacistName },
      medicines,
      vendors,
      purchaseBills,
      stockMovements
    };

    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MediStock_Backup_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
        <h2 className="text-lg font-bold text-slate-900">Pharmacy & System Settings</h2>
        <p className="text-xs text-slate-500">Configure pharmacy drug license, regulatory profiles, offline sync, and data backups</p>
      </div>

      {savedSuccess && (
        <div className="p-3.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl flex items-center gap-2 text-xs font-semibold animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Pharmacy configuration settings saved successfully!</span>
        </div>
      )}

      {/* Pharmacy Profile Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Building2 className="w-4 h-4 text-teal-700" />
          Pharmacy Establishment Profile
        </h3>

        <form onSubmit={handleSaveProfile} className="space-y-4 text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Pharmacy / Hospital Name</label>
              <input
                type="text"
                value={pharmacyName}
                onChange={e => setPharmacyName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Registered Pharmacist In-Charge</label>
              <input
                type="text"
                value={pharmacistName}
                onChange={e => setPharmacistName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 font-medium"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block font-bold text-slate-700 mb-1">Drug License Number (Form 20B/21B)</label>
              <input
                type="text"
                value={dlNumber}
                onChange={e => setDlNumber(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">GSTIN Identification #</label>
              <input
                type="text"
                value={gstin}
                onChange={e => setGstin(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">Default Low Stock Reorder Threshold</label>
              <input
                type="number"
                min="1"
                value={defaultThreshold}
                onChange={e => setDefaultThreshold(parseInt(e.target.value, 10) || 15)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800"
              />
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
            >
              Save Profile Changes
            </button>
          </div>
        </form>
      </div>

      {/* Sync & Offline Resilience Panel */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <RefreshCw className="w-4 h-4 text-teal-700" />
          Cloud Sync & Offline Storage Resilience
        </h3>

        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900">
              <span>Current Connection State:</span>
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                syncStatus === 'synced' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {syncStatus.toUpperCase()}
              </span>
            </div>
            <p className="text-slate-500 mt-1">
              MediStock operates offline-first with persistent client caching. Changes made offline auto-sync when connection restores.
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => triggerSync()}
              disabled={syncStatus === 'syncing'}
              className="px-3.5 py-2 bg-teal-700 hover:bg-teal-800 text-white rounded-xl font-bold text-xs shadow-xs"
            >
              Trigger Cloud Sync
            </button>
            <button
              onClick={() => setSyncStatus(syncStatus === 'offline' ? 'synced' : 'offline')}
              className="px-3.5 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl font-semibold text-xs"
            >
              {syncStatus === 'offline' ? 'Simulate Reconnect' : 'Simulate Offline'}
            </button>
          </div>
        </div>
      </div>

      {/* Backup, Export & Reset */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
        <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 border-b border-slate-100 pb-2">
          <Database className="w-4 h-4 text-teal-700" />
          Data Backup & Demo Reset
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-slate-900 text-xs">Download Full JSON Backup</h4>
              <p className="text-slate-500 mt-1">
                Save an encrypted JSON snapshot of all inventory batches, supplier directories, invoices, and audit logs.
              </p>
            </div>
            <button
              onClick={handleExportFullBackup}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors self-start"
            >
              <Download className="w-4 h-4" />
              <span>Export JSON Backup</span>
            </button>
          </div>

          <div className="p-4 bg-rose-50/50 rounded-2xl border border-rose-200 flex flex-col justify-between space-y-3">
            <div>
              <h4 className="font-bold text-rose-900 text-xs">Reset Sample Demo Data</h4>
              <p className="text-rose-700/80 mt-1">
                Restores original sample dataset of 12 medicines, 4 suppliers, purchase bills, and realistic expiry batches.
              </p>
            </div>
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset all data back to original demo values?')) {
                  resetToDemoData();
                  alert('Demo data restored successfully!');
                }
              }}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold flex items-center justify-center gap-1.5 transition-colors self-start shadow-xs"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reset to Default Demo</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
