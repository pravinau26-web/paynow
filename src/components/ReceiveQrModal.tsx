import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  Check,
  Copy,
  Download,
  MessageCircle,
  QrCode,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { UserProfile } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral, shareToWhatsApp } from '../services/share';

interface ReceiveQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
}

export const ReceiveQrModal: React.FC<ReceiveQrModalProps> = ({
  isOpen,
  onClose,
  user,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showAmountInput, setShowAmountInput] = useState<boolean>(false);
  const [shareToast, setShareToast] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Generate UPI URI
  const parsedAmount = parseFloat(customAmount);
  const hasValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

  const upiPayload = hasValidAmount
    ? `upi://pay?pa=${encodeURIComponent(user.upiId)}&pn=${encodeURIComponent(user.name)}&am=${parsedAmount.toFixed(2)}&cu=INR&tn=Payment%20to%20${encodeURIComponent(user.name)}`
    : `upi://pay?pa=${encodeURIComponent(user.upiId)}&pn=${encodeURIComponent(user.name)}&cu=INR`;

  // Render QR Code onto Canvas whenever payload changes
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;

    QRCode.toCanvas(
      canvasRef.current,
      upiPayload,
      {
        width: 200,
        margin: 1.5,
        color: {
          dark: '#14141A',
          light: '#FFFFFF',
        },
        errorCorrectionLevel: 'H',
      },
      (error) => {
        if (error) {
          console.error('QR rendering error:', error);
        }
      }
    );
  }, [isOpen, upiPayload]);

  if (!isOpen) return null;

  const handleCopy = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(user.upiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    sounds.playSuccessChime();
    if (canvasRef.current) {
      const link = document.createElement('a');
      link.download = `UPI-QR-${user.name.replace(/\s+/g, '_')}${hasValidAmount ? `-Rs${parsedAmount}` : ''}.png`;
      link.href = canvasRef.current.toDataURL('image/png');
      link.click();
      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    sounds.playKeypadClick();
    const text = hasValidAmount
      ? `Hi! Please pay ₹${parsedAmount.toLocaleString('en-IN')} to ${user.name} via UPI.\nUPI ID: ${user.upiId}\nLink: ${upiPayload}`
      : `Hi! Please pay to ${user.name} via UPI.\nUPI ID: ${user.upiId}\nLink: ${upiPayload}`;
    shareToWhatsApp(text);
  };

  const handleShareGeneric = async () => {
    sounds.playKeypadClick();
    const text = hasValidAmount
      ? `Pay ₹${parsedAmount.toLocaleString('en-IN')} to ${user.name} via UPI: ${user.upiId}`
      : `Pay to ${user.name} via UPI: ${user.upiId}`;

    const res = await shareGeneral({
      title: `Pay ${user.name} via UPI`,
      text,
      url: upiPayload,
    });

    if (res === 'copied') {
      setShareToast('UPI Payment link copied to clipboard!');
      setTimeout(() => setShareToast(null), 2500);
    }
  };

  return (
    <div className="fixed sm:absolute inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-[21.5rem] bg-white dark:bg-[#1A1A20] rounded-3xl p-4 sm:p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative max-h-[92vh] overflow-y-auto no-scrollbar">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-3.5 right-3.5 w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-11 h-11 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] text-white font-bold text-base flex items-center justify-center mx-auto mb-1.5 shadow-md shadow-[#5B3DF5]/30">
          {user.name.slice(0, 2).toUpperCase()}
        </div>

        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
          {user.name}
        </h3>
        <p className="text-[11px] text-slate-400">Scan to pay with any UPI App</p>

        {/* Real Dynamic QR Code Canvas Box */}
        <div className="mt-3 p-3 bg-white rounded-2xl border-2 border-slate-100 dark:border-slate-800 shadow-inner flex flex-col items-center justify-center relative">
          <div className="relative p-1.5 bg-white rounded-xl">
            <canvas
              ref={canvasRef}
              className="rounded-lg shadow-xs mx-auto"
              style={{ width: '180px', height: '180px' }}
            />
            {/* Center Super Pay logo overlay badge */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="w-8 h-8 rounded-lg bg-white shadow-md border border-slate-200 p-0.5 flex items-center justify-center">
                <img src="./logo.svg" alt="Super Pay" className="w-full h-full rounded-md object-contain" />
              </div>
            </div>
          </div>

          {hasValidAmount && (
            <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-bold font-mono">
              <span>Requesting ₹{parsedAmount.toLocaleString('en-IN')}</span>
            </div>
          )}

          <div className="mt-1 flex items-center gap-1 text-[10px] font-semibold text-emerald-600">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NPCI Verified UPI QR</span>
          </div>
        </div>

        {/* Optional Add Amount Toggle for requesting specific payment */}
        <div className="mt-2.5">
          {!showAmountInput ? (
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setShowAmountInput(true);
              }}
              className="text-[11px] font-semibold text-[#5B3DF5] hover:underline cursor-pointer"
            >
              + Add amount to request specific payment
            </button>
          ) : (
            <div className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-50 dark:bg-[#121217] border border-slate-200 dark:border-slate-800">
              <span className="text-xs font-bold font-mono text-slate-400 pl-1.5">₹</span>
              <input
                type="number"
                min="1"
                placeholder="Enter amount (e.g. 500)"
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="flex-1 bg-transparent text-xs font-bold font-mono outline-none text-slate-800 dark:text-slate-100"
                autoFocus
              />
              {customAmount && (
                <button
                  type="button"
                  onClick={() => setCustomAmount('')}
                  className="text-slate-400 hover:text-slate-600 text-xs px-1"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* UPI ID Copy Bar */}
        <div className="mt-2.5 flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-[#121217] border border-slate-100 dark:border-slate-800 text-xs">
          <span className="font-mono text-[11px] font-medium text-slate-700 dark:text-slate-300 truncate">
            {user.upiId}
          </span>
          <button
            type="button"
            onClick={handleCopy}
            className="flex items-center gap-1 text-[#5B3DF5] font-semibold ml-2 hover:underline cursor-pointer"
          >
            {copied ? (
              <>
                <Check className="w-3 h-3 text-emerald-500" />
                <span className="text-emerald-500 text-[10px]">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3 h-3" />
                <span className="text-[10px]">Copy</span>
              </>
            )}
          </button>
        </div>

        {downloaded && (
          <p className="text-[10px] text-emerald-600 font-medium mt-1">
            QR code image downloaded to gallery!
          </p>
        )}

        {shareToast && (
          <p className="text-[10px] text-emerald-600 font-medium mt-1">
            {shareToast}
          </p>
        )}

        {/* WhatsApp & Share Actions */}
        <div className="mt-3 space-y-1.5">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share via WhatsApp</span>
          </button>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={handleDownload}
              className="py-2 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Save Image
            </button>
            <button
              type="button"
              onClick={handleShareGeneric}
              className="py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-[#5B3DF5] to-[#8B7CFA] hover:opacity-95 shadow-xs flex items-center justify-center gap-1 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Link
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
