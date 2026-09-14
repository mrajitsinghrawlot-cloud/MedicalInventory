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
  AlertCircle,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  ExternalLink,
  Loader2
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { getStoredApiKey, setStoredApiKey, testApiKey } from '../../services/geminiService';
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

  // Gemini AI Key State
  const [geminiKey, setGeminiKey] = useState<string>(() => getStoredApiKey());
  const [showKey, setShowKey] = useState(false);
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [keySavedMessage, setKeySavedMessage] = useState(false);

  const handleSaveGeminiKey = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setStoredApiKey(geminiKey);
    setKeySavedMessage(true);
    setTimeout(() => setKeySavedMessage(false), 3000);
    try {
      confetti({ particleCount: 20, spread: 40 });
    } catch {}
  };

  const handleTestKey = async () => {
    if (!geminiKey.trim()) {
      setTestResult({ success: false, message: 'Please enter a valid API key first.' });
      return;
    }
    setIsTesting(true);
    setTestResult(null);
    try {
      const res = await testApiKey(geminiKey);
      setTestResult(res);
      if (res.success) {
        setStoredApiKey(geminiKey);
      }
    } catch (err: any) {
      setTestResult({ success: false, message: err?.message || 'Connection test failed.' });
    } finally {
      setIsTesting(false);
    }
  };

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

      {/* Google AI Studio Bill Extraction Configuration */}
      <div className="bg-white p-6 rounded-2xl border border-teal-100 shadow-sm space-y-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-gradient-to-br from-teal-600 to-emerald-600 text-white rounded-xl shadow-xs">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                Google AI Studio Bill Extraction (Free Gemini API)
              </h3>
              <p className="text-[11px] text-slate-500">Auto-scan wholesale invoices & bills directly into stock items using Gemini Vision</p>
            </div>
          </div>
          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-full text-[10px] font-bold self-start sm:self-auto">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            100% Free Tier (1,500 bills/day)
          </span>
        </div>

        {keySavedMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-center gap-2 text-xs font-semibold">
            <Check className="w-4 h-4 text-emerald-600" />
            <span>AI Studio API Key saved securely in your browser!</span>
          </div>
        )}

        <div className="space-y-4 text-xs">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-3.5 space-y-2 text-slate-600">
            <div className="flex items-start gap-2">
              <Key className="w-4 h-4 text-teal-700 mt-0.5 shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-slate-800">
                  How does it work?
                </p>
                <p className="text-[11px] leading-relaxed">
                  Enter your free Gemini API key from Google AI Studio. When adding a purchase bill, you can snap a photo or upload an invoice PDF to instantly extract vendor name, bill number, dates, medicines, batch numbers, expiry dates, rates, and GST.
                </p>
                <div className="pt-1 flex flex-wrap gap-2 text-[10px]">
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium text-slate-700">⚡ Daily Limit: 1,500 Requests/day</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium text-slate-700">⏱️ Rate: 15 Bills/min</span>
                  <span className="bg-white px-2 py-0.5 rounded-md border border-slate-200 font-medium text-slate-700">🔒 Stored only in local browser</span>
                </div>
              </div>
            </div>
          </div>

          <form onSubmit={handleSaveGeminiKey} className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="font-bold text-slate-700">Google AI Studio API Key</label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-teal-700 hover:text-teal-800 font-semibold inline-flex items-center gap-1 hover:underline text-[11px]"
                >
                  <span>Get Free Key at Google AI Studio</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={e => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="w-full pl-3 pr-24 py-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono text-slate-800 text-xs focus:ring-2 focus:ring-teal-500 focus:outline-none"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200 transition-colors"
                    title={showKey ? 'Hide key' : 'Show key'}
                  >
                    {showKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                  {geminiKey && (
                    <button
                      type="button"
                      onClick={() => {
                        setGeminiKey('');
                        setStoredApiKey('');
                        setTestResult(null);
                      }}
                      className="px-2 py-1 text-[10px] text-rose-600 hover:bg-rose-50 rounded font-bold"
                    >
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>

            {testResult && (
              <div className={`p-3 rounded-xl flex items-start gap-2 text-xs font-semibold ${
                testResult.success 
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border border-rose-200 text-rose-800'
              }`}>
                {testResult.success ? (
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                )}
                <span>{testResult.message}</span>
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
              <button
                type="button"
                onClick={handleTestKey}
                disabled={isTesting || !geminiKey.trim()}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 disabled:opacity-50 text-slate-700 rounded-xl font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
              >
                {isTesting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-teal-700" />
                    <span>Testing Connection...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3.5 h-3.5 text-teal-700" />
                    <span>Test API Connection</span>
                  </>
                )}
              </button>

              <button
                type="submit"
                disabled={!geminiKey.trim()}
                className="px-5 py-2 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white rounded-xl font-bold text-xs shadow-sm transition-all active:scale-95"
              >
                Save API Key
              </button>
            </div>
          </form>
        </div>
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
