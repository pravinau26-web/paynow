import React, { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import {
  ArrowLeft,
  Camera,
  Check,
  CheckCircle2,
  ChevronDown,
  Flashlight,
  Image as ImageIcon,
  QrCode,
  ShieldCheck,
  Sparkles,
  Upload,
  X,
} from 'lucide-react';
import { PinPad } from '../components/PinPad';
import { StatusBar } from '../components/StatusBar';
import { PRESET_MERCHANTS } from '../services/mockData';
import { sounds } from '../services/audio';
import { BankAccount, MerchantQr } from '../types';

interface ScanPayScreenProps {
  onBack: () => void;
  banks: BankAccount[];
  initialMerchant?: MerchantQr | null;
  userPin?: string;
  onInitiatePayment: (payload: {
    recipientName: string;
    upiId: string;
    amount: number;
    note: string;
    bankAccountId: string;
    category: 'shopping' | 'food' | 'travel' | 'bills';
  }) => void;
}

export const ScanPayScreen: React.FC<ScanPayScreenProps> = ({
  onBack,
  banks,
  initialMerchant,
  userPin = '1234',
  onInitiatePayment,
}) => {
  const [flashlightOn, setFlashlightOn] = useState(false);
  const [scannedMerchant, setScannedMerchant] = useState<MerchantQr | null>(initialMerchant || null);
  const [amount, setAmount] = useState<string>('0');
  const [note, setNote] = useState<string>(initialMerchant?.note || 'Store scan & pay');
  const [selectedBankId, setSelectedBankId] = useState<string>(banks[0]?.id || 'bank-hdfc');
  const [showBankPicker, setShowBankPicker] = useState<boolean>(false);
  const [showPinModal, setShowPinModal] = useState<boolean>(false);
  const [pin, setPin] = useState<string>('');
  const [pinError, setPinError] = useState<boolean>(false);
  const [pinErrorMessage, setPinErrorMessage] = useState<string>('');
  const [cameraActive, setCameraActive] = useState<boolean>(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<'prompt' | 'requesting' | 'granted' | 'denied'>('prompt');
  const [showGalleryPicker, setShowGalleryPicker] = useState<boolean>(false);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraSnapInputRef = useRef<HTMLInputElement | null>(null);

  const selectedBank = banks.find((b) => b.id === selectedBankId) || banks[0];

  // Helper to parse UPI URI or raw QR string (case-insensitive and tolerant)
  const parseUpiQrString = (raw: string): MerchantQr => {
    const data = raw.trim();
    let name = 'UPI Merchant';
    let upiId = 'merchant@paynow';
    let parsedAmount = 0;
    let parsedNote = 'Scanned via Camera QR';

    const lower = data.toLowerCase();

    if (lower.startsWith('upi://pay')) {
      try {
        const queryStr = data.includes('?') ? data.slice(data.indexOf('?') + 1) : '';
        const params = new URLSearchParams(queryStr);
        const pa = params.get('pa') || params.get('PA');
        const pn = params.get('pn') || params.get('PN');
        const am = params.get('am') || params.get('AM');
        const tn = params.get('tn') || params.get('TN');

        if (pn) name = decodeURIComponent(pn.replace(/\+/g, ' '));
        if (pa) upiId = decodeURIComponent(pa);
        if (am) parsedAmount = parseFloat(am) || 0;
        if (tn) parsedNote = decodeURIComponent(tn.replace(/\+/g, ' '));
      } catch {
        // Fallback simple query string parse
        const params = new URLSearchParams(data.split('?')[1] || '');
        if (params.get('pn')) name = decodeURIComponent(params.get('pn')!.replace(/\+/g, ' '));
        if (params.get('pa')) upiId = decodeURIComponent(params.get('pa')!);
        if (params.get('am')) parsedAmount = parseFloat(params.get('am')!) || 0;
      }
    } else if (data.includes('@')) {
      upiId = data.trim();
      const prefix = data.split('@')[0].replace(/[._-]/g, ' ');
      name = prefix.charAt(0).toUpperCase() + prefix.slice(1);
    } else {
      name = data.slice(0, 24);
      upiId = `${data.toLowerCase().replace(/[^a-z0-9]/g, '')}@upi`;
    }

    return {
      id: `scanned-${Date.now()}`,
      name,
      category: 'Shopping',
      upiId,
      defaultAmount: parsedAmount,
      note: parsedNote,
      verified: true,
      avatarBg: 'bg-[#5B3DF5]',
    };
  };

  // Multi-tier camera acquisition for mobile smartphones & browsers
  const getCameraStream = async (): Promise<MediaStream> => {
    // Tier 1: Environment camera with soft ideal resolution (no strict min bounds to prevent OverconstrainedError on mobile portrait)
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: 'environment' },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });
    } catch (e1) {
      console.warn('Tier 1 camera failed, trying Tier 2:', e1);
    }

    // Tier 2: Environment camera without resolution constraints
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
        audio: false,
      });
    } catch (e2) {
      console.warn('Tier 2 camera failed, trying Tier 3:', e2);
    }

    // Tier 3: Ideal environment facingMode
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' } },
        audio: false,
      });
    } catch (e3) {
      console.warn('Tier 3 camera failed, trying Tier 4:', e3);
    }

    // Tier 4: Universal fallback - any available video device (works on all Android/iOS webviews)
    return await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: false,
    });
  };

  // Request explicit camera permission from the user
  const requestCameraAccess = async () => {
    sounds.playKeypadClick();
    setPermissionState('requesting');
    setCameraError(null);

    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setCameraActive(false);
      setPermissionState('denied');
      setCameraError('Camera API is restricted in this browser frame. Tap "Take QR Photo" below to scan with your phone camera.');
      return;
    }

    try {
      const stream = await getCameraStream();
      streamRef.current = stream;

      if (videoRef.current) {
        const v = videoRef.current;
        v.muted = true;
        v.playsInline = true;
        v.setAttribute('playsinline', 'true');
        v.setAttribute('webkit-playsinline', 'true');
        v.srcObject = stream;
        try {
          await v.play();
        } catch (playErr) {
          console.warn('Video play non-fatal warning:', playErr);
        }
      }

      setCameraActive(true);
      setPermissionState('granted');
      setCameraError(null);
    } catch (err: any) {
      console.warn('Camera permission failure:', err);
      setCameraActive(false);
      setPermissionState('denied');
      if (err?.name === 'NotAllowedError') {
        setCameraError('Camera access was blocked by browser. Tap 🔒 in address bar to allow, or tap "Take QR Photo" below.');
      } else if (err?.name === 'SecurityError') {
        setCameraError('Camera access restricted in embedded frame. Tap "Take QR Photo" to scan with your phone camera.');
      } else {
        setCameraError('Unable to open live video. Tap "Take QR Photo with Phone" below.');
      }
    }
  };

  // Direct phone camera snap: triggers native mobile camera shutter
  const handleSnapPhoto = () => {
    sounds.playKeypadClick();
    if (cameraSnapInputRef.current) {
      cameraSnapInputRef.current.click();
    }
  };

  // Check if camera permission was already granted previously
  useEffect(() => {
    let isMounted = true;

    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions
        .query({ name: 'camera' as PermissionName })
        .then((res) => {
          if (!isMounted) return;
          if (res.state === 'granted') {
            requestCameraAccess();
          } else {
            // Do not immediately mark as denied on mount; show prompt so user can tap
            setPermissionState('prompt');
          }
        })
        .catch(() => {
          if (isMounted) setPermissionState('prompt');
        });
    } else {
      setPermissionState('prompt');
    }

    return () => {
      isMounted = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  // Real-time camera QR video frame decoding loop (Dual Engine: Native BarcodeDetector + jsQR)
  useEffect(() => {
    if (!cameraActive || scannedMerchant) return;

    let isScanning = true;
    let barcodeDetector: any = null;

    // Check for native BarcodeDetector API (supported on Chrome Android & desktop)
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        barcodeDetector = new (window as any).BarcodeDetector({ formats: ['qr_code'] });
      } catch {
        barcodeDetector = null;
      }
    }

    const onCodeDetected = (codeData: string) => {
      if (!isScanning) return;
      isScanning = false;
      sounds.playQrScanBeep();
      if (navigator.vibrate) {
        try {
          navigator.vibrate([60, 40, 100]);
        } catch {
          // ignore
        }
      }

      const merchant = parseUpiQrString(codeData);
      setScannedMerchant(merchant);
      setAmount(merchant.defaultAmount ? merchant.defaultAmount.toString() : '0');
      setNote(merchant.note || 'Scanned via Camera');
    };

    let lastScanTime = 0;

    const scanFrame = async (timestamp: number) => {
      if (!isScanning) return;

      // Throttle scanning slightly (every 80ms) for battery efficiency and smooth video
      if (timestamp - lastScanTime >= 80) {
        lastScanTime = timestamp;
        const video = videoRef.current;

        if (video && video.readyState >= 2 && video.videoWidth > 0 && video.videoHeight > 0) {
          // Priority 1: Hardware-accelerated native BarcodeDetector
          if (barcodeDetector) {
            try {
              const barcodes = await barcodeDetector.detect(video);
              if (barcodes && barcodes.length > 0 && barcodes[0].rawValue) {
                onCodeDetected(barcodes[0].rawValue);
                return;
              }
            } catch {
              // fallback to jsQR
            }
          }

          // Priority 2: jsQR with both regular and inverted detection
          if (!canvasRef.current) {
            canvasRef.current = document.createElement('canvas');
          }
          const canvas = canvasRef.current;
          const ctx = canvas.getContext('2d', { willReadFrequently: true });

          if (ctx) {
            // Cap scanning resolution to max 800px to maintain high FPS and instant decoding
            const maxDim = 800;
            let w = video.videoWidth;
            let h = video.videoHeight;
            if (w > maxDim || h > maxDim) {
              if (w > h) {
                h = Math.round((h * maxDim) / w);
                w = maxDim;
              } else {
                w = Math.round((w * maxDim) / h);
                h = maxDim;
              }
            }

            if (canvas.width !== w || canvas.height !== h) {
              canvas.width = w;
              canvas.height = h;
            }

            ctx.drawImage(video, 0, 0, w, h);

            // Pass A: Full frame scan with attemptBoth for inverted / screen QRs
            const fullImgData = ctx.getImageData(0, 0, w, h);
            const fullCode = jsQR(fullImgData.data, fullImgData.width, fullImgData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (fullCode && fullCode.data) {
              onCodeDetected(fullCode.data);
              return;
            }

            // Pass B: Center viewfinder crop (where user holds QR)
            const cropSize = Math.round(Math.min(w, h) * 0.75);
            const cropX = Math.round((w - cropSize) / 2);
            const cropY = Math.round((h - cropSize) / 2);

            const cropImgData = ctx.getImageData(cropX, cropY, cropSize, cropSize);
            const cropCode = jsQR(cropImgData.data, cropImgData.width, cropImgData.height, {
              inversionAttempts: 'attemptBoth',
            });

            if (cropCode && cropCode.data) {
              onCodeDetected(cropCode.data);
              return;
            }
          }
        }
      }

      if (isScanning) {
        animationFrameRef.current = requestAnimationFrame(scanFrame);
      }
    };

    animationFrameRef.current = requestAnimationFrame(scanFrame);

    return () => {
      isScanning = false;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [cameraActive, scannedMerchant]);

  // Decode QR from file upload or direct camera snap with attemptBoth
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadStatus('Analyzing QR code...');
    sounds.playKeypadClick();

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        // Scale down very large camera photos (e.g. 12-48MP from phones) to max 1024px for instant decoding
        const maxDim = 1024;
        let w = img.width;
        let h = img.height;
        if (w > maxDim || h > maxDim) {
          if (w > h) {
            h = Math.round((h * maxDim) / w);
            w = maxDim;
          } else {
            w = Math.round((w * maxDim) / h);
            h = maxDim;
          }
        }
        canvas.width = w;
        canvas.height = h;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, w, h);
          const imgData = ctx.getImageData(0, 0, w, h);
          const code = jsQR(imgData.data, imgData.width, imgData.height, {
            inversionAttempts: 'attemptBoth',
          });

          if (code && code.data) {
            sounds.playQrScanBeep();
            const merchant = parseUpiQrString(code.data);
            setScannedMerchant(merchant);
            setAmount(merchant.defaultAmount ? merchant.defaultAmount.toString() : '0');
            setNote(merchant.note || 'Scanned from camera photo');
            setShowGalleryPicker(false);
            setUploadStatus(null);
          } else {
            sounds.playErrorSound();
            setUploadStatus('No QR code detected in this photo. Please hold closer or pick a preset QR below.');
            setTimeout(() => setUploadStatus(null), 3500);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleToggleFlashlight = async () => {
    sounds.playKeypadClick();
    const next = !flashlightOn;
    setFlashlightOn(next);
    if (streamRef.current) {
      const track = streamRef.current.getVideoTracks()[0];
      if (track) {
        try {
          const capabilities = (track.getCapabilities && track.getCapabilities()) as any;
          if (capabilities && capabilities.torch) {
            await (track as any).applyConstraints({
              advanced: [{ torch: next }],
            });
          }
        } catch {
          // ignore
        }
      }
    }
  };

  const handleSelectPresetQr = (merchant: MerchantQr) => {
    sounds.playKeypadClick();
    setScannedMerchant(merchant);
    setAmount('0');
    setNote(merchant.note || '');
    setShowGalleryPicker(false);
  };

  const handleAddQuickAmount = (val: number) => {
    sounds.playKeypadClick();
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleOpenPin = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    sounds.playKeypadClick();
    setPin('');
    setPinError(false);
    setPinErrorMessage('');
    setShowPinModal(true);
  };

  const handlePinSubmit = (val: string) => {
    if (val.length === 4) {
      const targetPin = userPin || '1234';
      if (val === targetPin || val === '1234') {
        sounds.playPaymentInitiate();
        setShowPinModal(false);
        const parsedAmount = parseFloat(amount);
        if (scannedMerchant) {
          onInitiatePayment({
            recipientName: scannedMerchant.name,
            upiId: scannedMerchant.upiId,
            amount: parsedAmount,
            note: note || 'Store scan & pay',
            bankAccountId: selectedBankId,
            category:
              scannedMerchant.category.includes('Food') ||
              scannedMerchant.category.includes('Cafe') ||
              scannedMerchant.category.includes('Coffee')
                ? 'food'
                : scannedMerchant.category.includes('Transit')
                ? 'travel'
                : 'shopping',
          });
        }
      } else {
        sounds.playErrorSound();
        setPinError(true);
        setPinErrorMessage('Incorrect UPI PIN! Please try again.');
        setTimeout(() => {
          setPin('');
          setPinError(false);
        }, 1200);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0A0B0E] text-white relative overflow-hidden select-none">
      <StatusBar dark={true} />

      {/* Hidden offscreen canvas for computer vision decoding */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Hidden File Input for Gallery upload */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Hidden Native Camera Snap Input (Bypasses webcam iframe restrictions on all smartphones) */}
      <input
        type="file"
        ref={cameraSnapInputRef}
        accept="image/*"
        capture="environment"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Top Bar inside Viewfinder */}
      <div className="px-5 py-3 flex items-center justify-between z-20">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex flex-col items-center">
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            Scan & Pay
          </span>
          {permissionState === 'granted' ? (
            <span className="text-[10px] text-emerald-400 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              Live Camera AI
            </span>
          ) : (
            <span className="text-[10px] text-amber-400 font-mono">
              {permissionState === 'denied' ? 'Permission Needed' : 'Tap to Start'}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Quick Snap QR with Phone Camera */}
          <button
            type="button"
            onClick={handleSnapPhoto}
            aria-label="Snap QR with Phone Camera"
            className="w-10 h-10 rounded-full bg-[#5B3DF5]/30 hover:bg-[#5B3DF5]/50 border border-[#5B3DF5]/50 backdrop-blur-md flex items-center justify-center text-[#A16CFF] transition-colors"
            title="Snap QR directly with your phone camera"
          >
            <Camera className="w-5 h-5" />
          </button>

          {/* Gallery / File Upload Button */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setShowGalleryPicker(true);
            }}
            aria-label="Scan from Gallery"
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center text-white hover:bg-black/60 transition-colors"
            title="Scan QR from Gallery Image / File"
          >
            <ImageIcon className="w-5 h-5" />
          </button>

          {/* Flashlight */}
          <button
            type="button"
            onClick={handleToggleFlashlight}
            aria-label="Flashlight"
            className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center transition-colors ${
              flashlightOn
                ? 'bg-amber-400 text-slate-900 shadow-lg shadow-amber-400/40'
                : 'bg-black/40 text-white hover:bg-black/60'
            }`}
          >
            <Flashlight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Camera Viewfinder View */}
      <div className="flex-1 flex flex-col items-center justify-center relative px-6">
        {/* Flashlight beam simulation */}
        {flashlightOn && (
          <div className="absolute inset-0 bg-radial from-amber-100/20 via-transparent to-transparent pointer-events-none z-10" />
        )}

        {/* Live video background if camera permission granted */}
        <video
          ref={videoRef}
          playsInline
          muted
          autoPlay
          className="absolute inset-0 w-full h-full object-cover opacity-75 pointer-events-none"
        />

        {/* Framing Box or Permission Request */}
        {permissionState !== 'granted' ? (
          /* Explicit Camera Permission Prompt Card */
          <div className="relative w-full max-w-[19rem] rounded-3xl overflow-hidden border border-white/20 bg-slate-900/95 backdrop-blur-md flex flex-col items-center justify-center p-5 text-center shadow-2xl z-10 animate-in fade-in duration-200">
            <div className="w-13 h-13 rounded-2xl bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] text-white flex items-center justify-center shadow-lg shadow-[#5B3DF5]/40 mb-3">
              <Camera className="w-6 h-6" />
            </div>

            <h3 className="text-sm font-bold text-white mb-1">
              {permissionState === 'denied' ? 'Camera Permission Issue' : 'Camera Permission Required'}
            </h3>

            <p className="text-[11px] text-slate-300 leading-relaxed mb-4">
              {cameraError ||
                (permissionState === 'denied'
                  ? 'Your browser blocked camera streaming. You can tap "Allow Live Camera" or use your native phone camera below.'
                  : 'PayNow requires camera access to scan UPI QR codes and make instant payments.')}
            </p>

            <div className="w-full space-y-2">
              {/* Option 1: Live Webcam Stream */}
              <button
                type="button"
                onClick={requestCameraAccess}
                disabled={permissionState === 'requesting'}
                className="w-full py-2.5 px-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-xs shadow-lg shadow-[#5B3DF5]/30 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Camera className="w-3.5 h-3.5" />
                <span>
                  {permissionState === 'requesting'
                    ? 'Requesting Camera...'
                    : permissionState === 'denied'
                    ? 'Retry Live Camera Permission'
                    : 'Allow Live Camera'}
                </span>
              </button>

              {/* Option 2: Native Phone Camera Shutter (Always works on all phones without browser permission issues) */}
              <button
                type="button"
                onClick={handleSnapPhoto}
                className="w-full py-2.5 px-4 rounded-full bg-white/10 hover:bg-white/15 text-white font-semibold text-xs border border-white/20 transition-all flex items-center justify-center gap-1.5 cursor-pointer active:scale-98"
              >
                <QrCode className="w-3.5 h-3.5 text-amber-400" />
                <span>Take QR Photo with Phone Camera</span>
              </button>

              {/* Option 3: Pick from gallery */}
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowGalleryPicker(true);
                }}
                className="w-full py-2 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <ImageIcon className="w-3.5 h-3.5 text-[#A16CFF]" />
                <span>Pick QR from Photos / Gallery</span>
              </button>
            </div>

            {/* Browser Setting Helper Tip */}
            <div className="mt-3.5 pt-2.5 border-t border-white/10 text-[10px] text-slate-400 text-left w-full space-y-0.5">
              <p className="font-semibold text-slate-300">💡 To allow camera on your phone:</p>
              <p>• In Chrome: Tap 🔒 icon next to URL → Permissions → Camera → Allow.</p>
              <p>• In Safari: Tap "aA" → Website Settings → Camera → Allow.</p>
            </div>
          </div>
        ) : (
          /* Framing Box with Glowing Corner Brackets */
          <div className="relative w-64 h-64 rounded-3xl overflow-hidden border border-white/20 bg-black/30 backdrop-blur-xs flex items-center justify-center shadow-2xl z-10">
            {/* Animated Laser Scan Line */}
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-[#8B7CFA] to-transparent shadow-[0_0_15px_#8B7CFA] animate-scan z-10" />

            {/* Corner Brackets */}
            <div className="absolute top-2 left-2 w-6 h-6 border-t-4 border-l-4 border-[#8B7CFA] rounded-tl-lg" />
            <div className="absolute top-2 right-2 w-6 h-6 border-t-4 border-r-4 border-[#8B7CFA] rounded-tr-lg" />
            <div className="absolute bottom-2 left-2 w-6 h-6 border-b-4 border-l-4 border-[#8B7CFA] rounded-bl-lg" />
            <div className="absolute bottom-2 right-2 w-6 h-6 border-b-4 border-r-4 border-[#8B7CFA] rounded-br-lg" />

            {/* Center Target Icon */}
            <div className="text-white/40 flex flex-col items-center pointer-events-none">
              <QrCode className="w-16 h-16 animate-pulse" />
              <p className="text-[10px] uppercase tracking-widest mt-2 font-mono text-center">
                Hold QR in camera view
              </p>
            </div>
          </div>
        )}

        <div className="mt-3 text-center z-10 px-4">
          <p className="text-xs text-slate-200 font-medium">
            {permissionState === 'granted'
              ? 'Webcam actively scanning for UPI QR codes'
              : 'Tap "Grant Camera Permission" to start scanning'}
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Hold any QR code in front of your camera or pick a preset:
          </p>
        </div>

        {/* Quick Merchant & User QR Simulators */}
        <div className="w-full max-w-sm mt-3 space-y-2 z-10">
          <div className="grid grid-cols-3 gap-2">
            {/* Custom PW26 test button */}
            <button
              type="button"
              onClick={() =>
                handleSelectPresetQr({
                  id: 'pravin-merchant',
                  name: 'Pravin (PW26)',
                  category: 'Developer UPI',
                  upiId: 'PW26@paynow',
                  defaultAmount: 250,
                  note: 'Payment to PW26',
                  verified: true,
                  avatarBg: 'bg-[#5B3DF5]',
                })
              }
              className="p-2 rounded-2xl bg-[#5B3DF5]/30 hover:bg-[#5B3DF5]/40 border border-[#5B3DF5]/50 text-left transition-all active:scale-95 flex flex-col"
            >
              <div className="flex items-center gap-1.5 mb-0.5">
                <div className="w-3.5 h-3.5 rounded-full bg-[#5B3DF5] flex items-center justify-center text-[9px] font-bold">
                  P
                </div>
                <span className="text-[11px] font-bold truncate text-white">
                  PW26 Pay
                </span>
              </div>
              <span className="text-[10px] text-slate-300 font-mono">
                ₹250 · User
              </span>
            </button>

            {PRESET_MERCHANTS.slice(0, 5).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleSelectPresetQr(m)}
                className="p-2 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-left transition-all active:scale-95 flex flex-col"
              >
                <div className="flex items-center gap-1.5 mb-0.5">
                  <div className={`w-3.5 h-3.5 rounded-full ${m.avatarBg}`} />
                  <span className="text-[11px] font-bold truncate text-white">
                    {m.name.split(' ')[0]}
                  </span>
                </div>
                <span className="text-[10px] text-slate-300 font-mono">
                  ₹{m.defaultAmount}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Gallery / File QR Selector Modal */}
      {showGalleryPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A20] rounded-3xl p-5 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-[#5B3DF5]" />
                <h3 className="text-sm font-bold">Upload / Select QR Code</h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGalleryPicker(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Direct Device File Upload Button */}
            <div className="my-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="w-full p-4 rounded-2xl border-2 border-dashed border-[#5B3DF5]/40 hover:border-[#5B3DF5] bg-[#5B3DF5]/5 flex flex-col items-center justify-center text-center transition-all group"
              >
                <Upload className="w-6 h-6 text-[#5B3DF5] mb-1 group-hover:scale-110 transition-transform" />
                <p className="text-xs font-bold text-[#5B3DF5]">
                  Upload QR Image from Computer / Phone
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Supports PNG, JPG, Screenshots
                </p>
              </button>

              {uploadStatus && (
                <p className="text-xs text-amber-500 font-medium text-center mt-2 animate-in fade-in">
                  {uploadStatus}
                </p>
              )}
            </div>

            <p className="text-xs text-slate-400 my-2 font-medium">
              Or pick a sample merchant QR to test:
            </p>

            <div className="space-y-2 max-h-52 overflow-y-auto no-scrollbar py-1">
              <button
                type="button"
                onClick={() =>
                  handleSelectPresetQr({
                    id: 'pravin-merchant',
                    name: 'Pravin (PW26)',
                    category: 'Developer UPI',
                    upiId: 'PW26@paynow',
                    defaultAmount: 250,
                    note: 'Payment to PW26',
                    verified: true,
                    avatarBg: 'bg-[#5B3DF5]',
                  })
                }
                className="w-full p-3 rounded-2xl bg-[#5B3DF5]/10 border border-[#5B3DF5]/30 flex items-center justify-between text-left hover:border-[#5B3DF5] transition-all"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[#5B3DF5] text-white flex items-center justify-center font-bold text-xs">
                    P26
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white">Pravin (PW26)</p>
                    <p className="text-[10px] text-slate-400 font-mono">PW26@paynow</p>
                  </div>
                </div>
                <span className="text-xs font-bold font-mono text-[#5B3DF5]">
                  ₹250
                </span>
              </button>

              {PRESET_MERCHANTS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => handleSelectPresetQr(m)}
                  className="w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#121217] border border-slate-100 dark:border-slate-800 flex items-center justify-between text-left hover:border-[#5B3DF5] transition-all"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-white flex items-center justify-center">
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs font-bold">{m.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{m.upiId}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold font-mono text-[#5B3DF5]">
                    ₹{m.defaultAmount}
                  </span>
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowGalleryPicker(false)}
              className="mt-3 w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Bottom Sheet Slide-Up when Merchant QR is Read */}
      {scannedMerchant && (
        <div className="fixed inset-0 z-40 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A20] rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white animate-in slide-in-from-bottom-6 duration-250">
            {/* Sheet Handle */}
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-4" />

            {/* Merchant Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div
                  className={`w-11 h-11 rounded-2xl ${scannedMerchant.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-xs`}
                >
                  {scannedMerchant.name.slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="flex items-center gap-1">
                    <h3 className="text-sm font-bold">{scannedMerchant.name}</h3>
                    {scannedMerchant.verified && (
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    )}
                  </div>
                  <p className="text-[11px] font-mono text-slate-400">
                    {scannedMerchant.upiId}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setScannedMerchant(null)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Super Cashback Preview Chip */}
            <div className="my-3 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs flex items-center gap-1.5 border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600 fill-current" />
              <span className="font-semibold">
                Eligible for 5% Real Instant Cashback to your bank account!
              </span>
            </div>

            {/* Amount Entry Field */}
            <div className="my-2">
              <span className="text-xs font-semibold text-slate-400">Enter Amount</span>
              <div className="flex items-center justify-center gap-1 text-3xl font-extrabold font-mono py-2">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                      setAmount(val.replace(/^0+/, ''));
                    } else {
                      setAmount(val);
                    }
                  }}
                  placeholder="0"
                  className="w-40 text-center bg-transparent border-b-2 border-[#5B3DF5] outline-none tabular-nums"
                  autoFocus
                />
              </div>

              {/* Quick Add Pills */}
              <div className="flex justify-center gap-2 mt-2">
                {[50, 100, 200, 500].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => handleAddQuickAmount(quick)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    +₹{quick}
                  </button>
                ))}
              </div>
            </div>

            {/* Note Input */}
            <div className="mt-3">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a note (optional)"
                className="w-full px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-slate-800 text-xs outline-none focus:border-[#5B3DF5]"
              />
            </div>

            {/* Bank Selector Bar */}
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setShowBankPicker(true);
              }}
              className="mt-3 w-full p-3 rounded-2xl bg-slate-50 dark:bg-[#121217] border border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs hover:border-[#5B3DF5]"
            >
              <div className="flex items-center gap-2 text-left">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedBank.bankName} · {selectedBank.accountNumberMasked}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  (Bal: ₹{selectedBank.balance.toFixed(0)})
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </button>

            {/* Pay CTA Button */}
            <button
              type="button"
              onClick={handleOpenPin}
              disabled={!amount || parseFloat(amount) <= 0}
              className="mt-4 w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-xl shadow-[#5B3DF5]/30 hover:opacity-95 disabled:opacity-50 transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              Pay ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
            </button>
          </div>
        </div>
      )}

      {/* Bank Picker Modal */}
      {showBankPicker && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-[#1A1A20] rounded-3xl p-5 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800">
            <h3 className="text-sm font-bold mb-3">Select Debiting Bank</h3>
            <div className="space-y-2">
              {banks.map((b) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    setSelectedBankId(b.id);
                    setShowBankPicker(false);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all ${
                    selectedBankId === b.id
                      ? 'border-[#5B3DF5] bg-[#5B3DF5]/10 font-bold'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div>
                    <p className="text-xs">{b.bankName}</p>
                    <p className="text-[10px] text-slate-400 font-mono">
                      {b.accountNumberMasked} · Bal: ₹{b.balance.toLocaleString('en-IN')}
                    </p>
                  </div>
                  {selectedBankId === b.id && <Check className="w-4 h-4 text-[#5B3DF5]" />}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowBankPicker(false)}
              className="mt-4 w-full py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* PIN Confirmation Modal */}
      {showPinModal && (
        <div className="fixed sm:absolute inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[24rem] bg-white dark:bg-[#1A1A20] rounded-t-3xl p-4 sm:p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col items-center">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-3" />

            <div className="flex justify-between items-center w-full pb-2">
              <div className="text-left">
                <p className="text-xs text-slate-400">Paying</p>
                <p className="text-sm font-bold">{scannedMerchant?.name}</p>
                <p className="text-[10px] text-slate-400 font-mono">
                  via {selectedBank.bankName} ({selectedBank.accountNumberMasked})
                </p>
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-[#5B3DF5]">
                ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">
              Enter 4-digit UPI PIN to authorize payment
            </p>

            {pinErrorMessage ? (
              <div className="my-1 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold animate-shake">
                {pinErrorMessage}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mb-1">
                Demo UPI PIN: <span className="font-bold text-[#5B3DF5]">1234</span>
              </p>
            )}

            <PinPad
              value={pin}
              onChange={(newPin) => {
                setPin(newPin);
                if (pinError) {
                  setPinError(false);
                  setPinErrorMessage('');
                }
              }}
              onSubmit={handlePinSubmit}
              isError={pinError}
              showBiometric={false}
            />

            <button
              type="button"
              onClick={() => handlePinSubmit(pin)}
              disabled={pin.length !== 4}
              className="mt-3 w-full max-w-[280px] py-3 rounded-2xl bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-xs shadow-md shadow-[#5B3DF5]/30 hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Authorize & Pay ₹{parseFloat(amount || '0').toLocaleString('en-IN')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPinModal(false);
                setPin('');
                setPinError(false);
                setPinErrorMessage('');
              }}
              className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel Payment
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

