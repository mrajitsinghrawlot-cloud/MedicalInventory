import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Barcode, 
  Camera, 
  Check, 
  Search, 
  Sparkles, 
  AlertCircle, 
  Zap, 
  Plus, 
  Volume2, 
  VolumeX,
  ShoppingCart,
  Layers,
  ArrowRight,
  Upload,
  RefreshCw,
  Copy,
  CheckCheck
} from 'lucide-react';
import { useInventory } from '../../context/InventoryContext';
import { Medicine } from '../../types/inventory';
import { formatCurrency, formatDate } from '../../utils/formatters';

interface BarcodeScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMedicine?: (medicine: Medicine) => void;
  title?: string;
  subtitle?: string;
  actionButtonLabel?: string;
}

export const BarcodeScannerModal: React.FC<BarcodeScannerModalProps> = ({ 
  isOpen, 
  onClose,
  onSelectMedicine,
  title = "Barcode & QR Optical Scanner",
  subtitle = "Scan blister packs, boxes, or bottles for instant dispensing",
  actionButtonLabel = "Select & Use Item"
}) => {
  const { medicines, setSelectedMedicine, navigate } = useInventory();
  
  const [manualCode, setManualCode] = useState('');
  const [scannedResult, setScannedResult] = useState<Medicine | 'NOT_FOUND' | null>(null);
  const [unmatchedCode, setUnmatchedCode] = useState<string | null>(null);
  const [scannerStatus, setScannerStatus] = useState<'INITIALIZING' | 'SCANNING' | 'SUCCESS' | 'ERROR'>('INITIALIZING');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [cameras, setCameras] = useState<Array<{ id: string; label: string }>>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string>('');
  const [copied, setCopied] = useState(false);
  const [isScanningFile, setIsScanningFile] = useState(false);

  const scannerInstanceRef = useRef<any>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Play synthetic retail barcode scanner confirmation beep
  const playBeep = () => {
    if (!soundEnabled) return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1900, audioCtx.currentTime); // 1.9kHz crisp supermarket beep
      gain.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.12);
    } catch {}

    // Haptic vibration feedback on phones
    try {
      if (typeof navigator !== 'undefined' && navigator.vibrate) {
        navigator.vibrate([80, 40, 80]);
      }
    } catch {}
  };

  // Process any decoded barcode text from camera, photo upload, or manual entry
  const processDecodedBarcode = (code: string) => {
    const trimmed = code.trim();
    if (!trimmed) return;

    playBeep();
    setManualCode(trimmed);
    setScannerStatus('SUCCESS');

    // Look for match in existing medicines inventory
    const found = medicines.find(
      m => m.barcode === trimmed || 
           m.barcode.toLowerCase() === trimmed.toLowerCase() ||
           m.batchNumber.toLowerCase() === trimmed.toLowerCase() ||
           (trimmed.length > 5 && m.barcode.includes(trimmed)) ||
           (m.barcode.length > 5 && trimmed.includes(m.barcode))
    );

    if (found) {
      setScannedResult(found);
      setUnmatchedCode(null);
    } else {
      setScannedResult('NOT_FOUND');
      setUnmatchedCode(trimmed);
    }
  };

  // Initialize and start live camera barcode scanning
  useEffect(() => {
    if (!isOpen) {
      // Clean up when closed
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().catch(() => {}).then(() => {
              try { scannerInstanceRef.current?.clear(); } catch {}
              scannerInstanceRef.current = null;
            });
          } else {
            try { scannerInstanceRef.current.clear(); } catch {}
            scannerInstanceRef.current = null;
          }
        } catch {}
      }
      setScannedResult(null);
      setUnmatchedCode(null);
      setManualCode('');
      setScannerStatus('INITIALIZING');
      setCameraError(null);
      return;
    }

    let isMounted = true;
    const readerElementId = 'html5-barcode-scanner-view';

    const initScanner = async () => {
      // Small timeout to allow modal animation & DOM mounting
      await new Promise(res => setTimeout(res, 120));
      if (!isMounted) return;

      const element = document.getElementById(readerElementId);
      if (!element) return;

      try {
        setScannerStatus('INITIALIZING');
        setCameraError(null);

        // Dynamically import Html5Qrcode on demand
        const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

        // Fetch available camera devices
        try {
          const devices = await Html5Qrcode.getCameras();
          if (devices && devices.length > 0) {
            const cameraList = devices.map(d => ({ id: d.id, label: d.label || `Camera ${d.id.slice(0, 4)}` }));
            if (isMounted) setCameras(cameraList);
          }
        } catch (e) {
          // Cameras enumeration might be restricted before permission
        }

        // Initialize Html5Qrcode instance
        const html5QrCode = new Html5Qrcode(readerElementId, {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX,
            Html5QrcodeSupportedFormats.ITF,
            Html5QrcodeSupportedFormats.CODABAR
          ],
          verbose: false
        });

        scannerInstanceRef.current = html5QrCode;

        // Determine camera configuration
        const cameraConfig = selectedCameraId 
          ? { deviceId: { exact: selectedCameraId } }
          : { facingMode: 'environment' };

        const scanConfig = {
          fps: 20, // 20 frames per second for high-speed scanning
          qrbox: { width: 260, height: 160 },
          aspectRatio: 1.333334,
          disableFlip: false
        };

        await html5QrCode.start(
          cameraConfig,
          scanConfig,
          (decodedText) => {
            if (isMounted && decodedText) {
              processDecodedBarcode(decodedText);
            }
          },
          () => {
            // Frame search callback - normal per-frame scan attempt
          }
        );

        if (isMounted) {
          setScannerStatus('SCANNING');
        }
      } catch (err: any) {
        if (isMounted) {
          setScannerStatus('ERROR');
          const msg = err?.message || '';
          if (msg.includes('NotAllowedError') || msg.includes('Permission')) {
            setCameraError('Camera permission was denied. Please allow camera access in your browser or use the image upload / test buttons below.');
          } else if (msg.includes('NotFound') || msg.includes('DevicesNotFoundError')) {
            setCameraError('No camera found on this device. You can upload an image of the barcode or use manual input.');
          } else {
            setCameraError('Unable to start live camera video stream. You can upload an image or select test barcodes below.');
          }
        }
      }
    };

    initScanner();

    return () => {
      isMounted = false;
      if (scannerInstanceRef.current) {
        try {
          if (scannerInstanceRef.current.isScanning) {
            scannerInstanceRef.current.stop().catch(() => {}).then(() => {
              try { scannerInstanceRef.current?.clear(); } catch {}
              scannerInstanceRef.current = null;
            });
          } else {
            try { scannerInstanceRef.current.clear(); } catch {}
            scannerInstanceRef.current = null;
          }
        } catch {}
      }
    };
  }, [isOpen, selectedCameraId]);

  // Restart scanning after result inspected
  const handleRestartScan = async () => {
    setScannedResult(null);
    setUnmatchedCode(null);
    setManualCode('');
    setScannerStatus('SCANNING');
  };

  // Scan from photo or file upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsScanningFile(true);
      setCameraError(null);

      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');

      // Create a temporary scanner instance if main is busy
      let qrScanner = scannerInstanceRef.current;
      if (!qrScanner) {
        qrScanner = new Html5Qrcode('html5-barcode-scanner-view', {
          formatsToSupport: [
            Html5QrcodeSupportedFormats.EAN_13,
            Html5QrcodeSupportedFormats.EAN_8,
            Html5QrcodeSupportedFormats.CODE_128,
            Html5QrcodeSupportedFormats.CODE_39,
            Html5QrcodeSupportedFormats.UPC_A,
            Html5QrcodeSupportedFormats.UPC_E,
            Html5QrcodeSupportedFormats.QR_CODE,
            Html5QrcodeSupportedFormats.DATA_MATRIX
          ],
          verbose: false
        });
      }

      const decodedText = await qrScanner.scanFile(file, true);
      if (decodedText) {
        processDecodedBarcode(decodedText);
      }
    } catch (err: any) {
      setCameraError('Could not detect a clear barcode in this photo. Please make sure the barcode is well-lit and in sharp focus.');
    } finally {
      setIsScanningFile(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  // Apply selected medicine result
  const handleApplyResult = () => {
    if (scannedResult && scannedResult !== 'NOT_FOUND') {
      if (onSelectMedicine) {
        onSelectMedicine(scannedResult);
      } else {
        setSelectedMedicine(scannedResult);
        navigate('inventory');
      }
      onClose();
    }
  };

  // Use unmatched barcode for registration / new medicine form
  const handleUseUnmatchedBarcode = () => {
    if (!unmatchedCode) return;

    const draftMedicine: Medicine = {
      id: `MED-${Date.now()}`,
      name: '',
      genericName: '',
      category: 'Antibiotics',
      form: 'Tablet',
      strength: '',
      unitsPerPack: 10,
      packUnitLabel: '10 Tabs / Strip',
      manufacturer: '',
      batchNumber: `BAT-${Math.floor(1000 + Math.random() * 9000)}`,
      barcode: unmatchedCode,
      expiryDate: new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString().split('T')[0],
      purchasePrice: 0,
      mrp: 0,
      defaultSellingPrice: 0,
      stockQuantity: 10,
      minStockThreshold: 5,
      rackLocation: 'Rack A - Shelf 1',
      scheduleType: 'OTC',
      requiresPrescription: false,
      status: 'In Stock',
      gstRate: 12,
      hsnCode: '30049099'
    };

    if (onSelectMedicine) {
      onSelectMedicine(draftMedicine);
    } else {
      setSelectedMedicine(draftMedicine);
      navigate('inventory');
    }
    onClose();
  };

  const handleCopyCode = () => {
    if (unmatchedCode) {
      navigator.clipboard.writeText(unmatchedCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Manual Quick Lookup handler
  const handleLookup = (code: string) => {
    processDecodedBarcode(code);
  };

  const handleSimulateScan = (med: Medicine) => {
    setManualCode(med.barcode);
    playBeep();
    setScannedResult(med);
    setUnmatchedCode(null);
    setScannerStatus('SUCCESS');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs"
            onClick={onClose}
          />

          {/* Modal Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.94, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 16 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden z-10 flex flex-col max-h-[92vh]"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-500 text-slate-950 flex items-center justify-center shadow-md">
                  <Barcode className="w-5 h-5 stroke-[2.5]" />
                </div>
                <div>
                  <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                    {title}
                    <span className="px-1.5 py-0.5 bg-emerald-400 text-slate-950 text-[10px] font-black rounded uppercase">
                      Optical Live
                    </span>
                  </h2>
                  <p className="text-xs text-slate-300">{subtitle}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs active:scale-95 transition-all"
                  title={soundEnabled ? 'Beep sound enabled' : 'Beep sound muted'}
                >
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-400" /> : <VolumeX className="w-4 h-4 text-slate-400" />}
                </button>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Body Content */}
            <div className="p-5 space-y-4 overflow-y-auto text-xs flex-1">
              {/* Real Optical Viewfinder Canvas & Camera */}
              <div className="relative bg-slate-950 rounded-2xl overflow-hidden border-2 border-teal-500/80 shadow-inner flex flex-col items-center justify-center min-h-[220px]">
                {/* HTML5-QRCode Target Element */}
                <div 
                  id="html5-barcode-scanner-view" 
                  className="w-full h-full min-h-[200px] overflow-hidden rounded-2xl"
                />

                {/* Laser scanline animation */}
                {scannerStatus === 'SCANNING' && !scannedResult && (
                  <div className="absolute inset-0 pointer-events-none flex flex-col items-center justify-center">
                    {/* Pulsing red optical line */}
                    <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-rose-500 to-transparent shadow-[0_0_15px_#f43f5e] animate-pulse" />
                    
                    {/* Bounding target brackets */}
                    <div className="w-64 h-32 border border-teal-400/50 rounded-xl relative">
                      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-teal-400" />
                      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-teal-400" />
                      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-teal-400" />
                      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-teal-400" />
                    </div>
                  </div>
                )}

                {/* Loading / Ready status badge */}
                <div className="absolute bottom-2 px-3 py-1 bg-black/80 backdrop-blur-md rounded-full text-teal-200 text-[10px] font-medium flex items-center gap-1.5 z-10">
                  <span className={`w-2 h-2 rounded-full ${
                    scannerStatus === 'SCANNING' ? 'bg-emerald-400 animate-ping' :
                    scannerStatus === 'SUCCESS' ? 'bg-teal-400' : 'bg-amber-400'
                  }`} />
                  <span>
                    {scannerStatus === 'SCANNING' && 'Position barcode in view — auto detects in real-time'}
                    {scannerStatus === 'INITIALIZING' && 'Initializing camera lens & barcode parser...'}
                    {scannerStatus === 'SUCCESS' && 'Barcode decoded successfully!'}
                    {scannerStatus === 'ERROR' && 'Camera offline — upload photo or type code'}
                  </span>
                </div>
              </div>

              {/* Camera Switcher & Photo Upload Toolbar */}
              <div className="flex items-center justify-between gap-2 pt-1">
                {cameras.length > 1 && (
                  <select
                    value={selectedCameraId}
                    onChange={(e) => setSelectedCameraId(e.target.value)}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl text-[11px] font-medium text-slate-700 focus:outline-none"
                  >
                    <option value="">Switch Camera (Default Back)</option>
                    {cameras.map(c => (
                      <option key={c.id} value={c.id}>{c.label}</option>
                    ))}
                  </select>
                )}

                <div className="flex items-center gap-1.5 ml-auto">
                  <input
                    type="file"
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isScanningFile}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-900 border border-slate-200 rounded-xl text-[11px] font-semibold text-slate-700 transition-colors flex items-center gap-1.5 shadow-2xs"
                  >
                    <Upload className="w-3.5 h-3.5 text-teal-600" />
                    <span>{isScanningFile ? 'Scanning photo...' : 'Scan from Photo'}</span>
                  </button>

                  {scannedResult && (
                    <button
                      type="button"
                      onClick={handleRestartScan}
                      className="px-3 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 rounded-xl text-[11px] font-bold transition-colors flex items-center gap-1 shadow-2xs"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Scan Next Item</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Error Message if Camera Access Denied */}
              {cameraError && (
                <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <div className="font-bold">Camera Tip</div>
                    <p className="mt-0.5 text-amber-700">{cameraError}</p>
                  </div>
                </div>
              )}

              {/* Scanned Result Match Card */}
              {scannedResult && scannedResult !== 'NOT_FOUND' && (
                <div className="p-4 bg-gradient-to-br from-emerald-50 to-teal-50 border-2 border-emerald-400 rounded-2xl space-y-3 shadow-sm animate-in fade-in zoom-in-95">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="px-2 py-0.5 bg-emerald-600 text-white text-[10px] font-extrabold rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3 stroke-[3]" />
                          <span>Barcode Matched</span>
                        </span>
                        <span className="font-mono text-[11px] text-slate-600 font-bold bg-white px-2 py-0.5 rounded-md border border-slate-200">
                          {scannedResult.barcode}
                        </span>
                      </div>
                      <h3 className="font-extrabold text-slate-900 text-base mt-1.5">{scannedResult.name}</h3>
                      <p className="text-xs text-slate-600 font-medium">{scannedResult.genericName}</p>
                    </div>

                    <div className="text-right">
                      <div className="font-extrabold text-teal-900 text-base">
                        {formatCurrency(scannedResult.defaultSellingPrice || scannedResult.mrp)}
                      </div>
                      <div className="text-[10px] text-emerald-700 font-bold">
                        {scannedResult.stockQuantity} strips in stock
                      </div>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-emerald-200/80 flex items-center justify-between text-[11px] text-slate-600">
                    <span className="font-mono">Batch: <strong>{scannedResult.batchNumber}</strong></span>
                    <span>Rack: <strong>{scannedResult.rackLocation}</strong></span>
                    <span>Pack: <strong>{scannedResult.unitsPerPack} tabs/strip</strong></span>
                  </div>

                  {/* Action Button */}
                  <button
                    type="button"
                    onClick={handleApplyResult}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-700/20 transition-all active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <ShoppingCart className="w-4 h-4" />
                    <span>{actionButtonLabel} ({scannedResult.name})</span>
                  </button>
                </div>
              )}

              {/* Unregistered Barcode Detected (Not yet in catalogue) */}
              {scannedResult === 'NOT_FOUND' && unmatchedCode && (
                <div className="p-4 bg-amber-50 border-2 border-amber-300 text-amber-900 rounded-2xl space-y-3 animate-in fade-in">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2">
                      <div className="w-8 h-8 rounded-xl bg-amber-200 text-amber-800 flex items-center justify-center shrink-0">
                        <Barcode className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="font-extrabold text-xs text-amber-900">
                          Optical Barcode Captured: <span className="font-mono font-bold bg-white px-2 py-0.5 rounded border border-amber-300">{unmatchedCode}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 mt-1">
                          This barcode is not linked to any existing medicine yet. You can register it now or copy the digits.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1">
                    <button
                      type="button"
                      onClick={handleCopyCode}
                      className="px-3 py-1.5 bg-white hover:bg-amber-100 border border-amber-300 rounded-xl text-xs font-semibold text-amber-900 flex items-center gap-1.5 transition-colors"
                    >
                      {copied ? <CheckCheck className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copied ? 'Copied!' : 'Copy Digits'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleUseUnmatchedBarcode}
                      className="flex-1 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Register As New Medicine</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Click-to-Scan Instant Test Chips */}
              <div className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                    <span>Quick Demo Barcodes (Click to Test):</span>
                  </span>
                  <span className="text-[10px] text-slate-400">Simulate physical scan</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {medicines.slice(0, 6).map(m => (
                    <button
                      key={m.id}
                      type="button"
                      onClick={() => handleSimulateScan(m)}
                      className="px-2.5 py-1.5 bg-white hover:bg-teal-50 hover:text-teal-900 hover:border-teal-400 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-700 transition-all flex items-center gap-1.5 shadow-2xs active:scale-95"
                    >
                      <Barcode className="w-3 h-3 text-slate-400" />
                      <span>{m.name.split(' ')[0]}</span>
                      <span className="font-mono text-[9px] text-slate-400">#{m.barcode.slice(-4)}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Manual Input or Physical USB Barcode Gun field */}
              <div className="space-y-1">
                <label className="block text-[11px] font-bold text-slate-600">
                  Manual Barcode / Hardware USB Laser Gun Input:
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Barcode className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      placeholder="Scan with USB gun or enter 890... / batch #"
                      value={manualCode}
                      onChange={e => {
                        setManualCode(e.target.value);
                        if (e.target.value.length >= 8) {
                          handleLookup(e.target.value);
                        }
                      }}
                      onKeyDown={e => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleLookup(manualCode);
                        }
                      }}
                      className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 font-mono font-bold focus:outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleLookup(manualCode)}
                    className="px-4 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1"
                  >
                    <Search className="w-3.5 h-3.5" />
                    <span>Search</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-5 py-3.5 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
              <span className="text-[11px] text-slate-400 font-medium">
                Supports EAN-13, QR, UPC & USB Scanners
              </span>
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-xl text-xs font-semibold active:scale-95 transition-all"
              >
                Close Scanner
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
