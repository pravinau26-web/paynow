import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Info,
  MessageSquare,
  QrCode,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentStatus, Transaction } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral } from '../services/share';

interface PaymentStatusOverlayProps {
  status: PaymentStatus;
  amount: number;
  recipientName: string;
  upiId?: string;
  cashbackEarned?: number;
  failureReason?: string;
  transaction?: Transaction | null;
  onDone: () => void;
  onViewReceipt: () => void;
  onRetry: () => void;
  onSimulateFail?: () => void;
}

export const PaymentStatusOverlay: React.FC<PaymentStatusOverlayProps> = ({
  status,
  amount,
  recipientName,
  upiId = '9597512723@ptyes',
  cashbackEarned = 0,
  failureReason,
  transaction,
  onDone,
  onViewReceipt,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [showFullDetails, setShowFullDetails] = useState(false);
  const [stepStage, setStepStage] = useState<'animating' | 'receipt'>('animating');

  // Trigger sounds & confetti
  useEffect(() => {
    if (status === 'processing') {
      sounds.playPaymentInitiate();
      setStepStage('animating');
    } else if (status === 'success') {
      sounds.playPaymentSuccess();
      try {
        confetti({
          particleCount: 50,
          spread: 70,
          origin: { y: 0.35 },
          colors: ['#00D09C', '#B4F726', '#5B3DF5', '#FFD700'],
          disableForReducedMotion: true,
        });
      } catch {
        // fallback
      }
      // After 1.8 seconds transition to full receipt
      const t = setTimeout(() => {
        setStepStage('receipt');
      }, 1800);
      return () => clearTimeout(t);
    } else if (status === 'failed') {
      sounds.playPaymentFailure();
      // After 1.8 seconds transition to full receipt
      const t = setTimeout(() => {
        setStepStage('receipt');
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [status]);

  const upiRef = transaction?.upiRefNumber || '665176711122';

  const now = new Date();
  const formattedFullDate =
    now.toLocaleString('en-IN', {
      month: 'long',
      day: 'numeric',
    }) +
    ' at ' +
    now.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(upiRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    sounds.playKeypadClick();
    const isFailed = status === 'failed';
    const res = await shareGeneral({
      title: `Super Pay Receipt - ${recipientName}`,
      text: `⚡ SUPER PAY RECEIPT: ${isFailed ? 'Payment Failed' : 'Paid'} ₹${amount} to ${recipientName} (${upiId}). UPI Ref: ${upiRef}`,
    });
    if (res === 'copied') {
      setSharedToast('Receipt copied to clipboard!');
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  const isFailed = status === 'failed';

  // =========================================================================
  // STAGE 1: "Payment in process" OR Brief Transition (Frames 00:17 - 00:21)
  // =========================================================================
  if (status === 'processing' || (stepStage === 'animating' && (status === 'success' || status === 'failed'))) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white flex flex-col justify-between items-center p-6 select-none animate-in fade-in">
        {/* Top Spacer */}
        <div className="w-full flex justify-end">
          <span className="text-[10px] font-mono text-slate-400">NPCI SECURE</span>
        </div>

        {/* Center Animated 3D Squircle with faint QR watermark behind (Frame 00:17 - 00:20) */}
        <div className="flex flex-col items-center text-center max-w-xs relative my-auto">
          {/* Faint QR watermark pattern in background */}
          <div className="absolute -inset-10 flex items-center justify-center opacity-10 pointer-events-none">
            <QrCode className="w-56 h-56 text-slate-500" />
          </div>

          {/* 3D-styled Blue Squircle Icon */}
          <div className="relative mb-6">
            {status === 'processing' ? (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#3B28D0] via-[#5B3DF5] to-[#7C3AED] shadow-2xl shadow-[#5B3DF5]/40 flex items-center justify-center text-white border-2 border-white/20 animate-pulse">
                <img src="./logo.svg" alt="Super Pay" className="w-12 h-12 object-contain" />
              </div>
            ) : isFailed ? (
              <div className="w-24 h-24 rounded-3xl bg-[#FF4D4F] shadow-2xl shadow-red-500/40 flex items-center justify-center text-white border-2 border-white/20 animate-in zoom-in-95">
                <X className="w-14 h-14 stroke-[3]" />
              </div>
            ) : (
              <div className="w-24 h-24 rounded-3xl bg-[#00D09C] shadow-2xl shadow-[#00D09C]/40 flex items-center justify-center text-white border-2 border-white/20 animate-in zoom-in-95">
                <Check className="w-14 h-14 stroke-[3.5]" />
              </div>
            )}
          </div>

          {/* Status Text & Recipient (Exact typography from Frame 00:18) */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            {status === 'processing'
              ? 'Payment in process'
              : isFailed
              ? 'Payment failed'
              : 'Payment successful'}
          </h2>

          <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-1">
            to {recipientName}
          </p>

          <p className="text-4xl font-black font-sans text-slate-900 dark:text-white mt-3 tabular-nums">
            ₹{amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Bottom Partner Branding: "Powered by UPI | YES BANK" (Frame 00:18) */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400 pb-4">
          <span>Powered by</span>
          <span className="font-mono text-slate-700 dark:text-slate-200">UPI</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#005A9C] font-extrabold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-red-500" /> YES BANK
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: EXACT SERRATED TICKET RECEIPT CARD (Frame 00:22 - 00:26)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Bar with < Back and 💬 Help pill */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-[#F7F8FA] dark:bg-[#0E0E12]">
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onDone();
          }}
          className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onViewReceipt();
          }}
          className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1A22] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
        >
          <MessageSquare className="w-3.5 h-3.5 text-slate-500" />
          <span>Help</span>
        </button>
      </div>

      {/* Toast Feedback */}
      {sharedToast && (
        <div className="mx-4 mt-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-in fade-in">
          {sharedToast}
        </div>
      )}

      {/* Scrollable Receipt Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-6 py-4 space-y-4 pb-28">
        {/* Ticket Box with Serrated Edge Effect */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A22]">
          {/* Top Receipt Body */}
          <div className="p-5 space-y-4">
            {/* Amount, Status, and Square Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-4xl font-black font-sans text-slate-900 dark:text-white tabular-nums">
                  ₹{amount.toLocaleString('en-IN')}
                </h1>
                <p
                  className={`text-sm sm:text-base font-bold mt-1 ${
                    isFailed ? 'text-red-500' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isFailed ? 'Payment failed' : 'Payment Successful'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{formattedFullDate}</p>
              </div>

              {/* Square Icon Badge (Frame 00:22) */}
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                  isFailed
                    ? 'bg-[#FF4D4F] text-white shadow-red-500/20'
                    : 'bg-[#00D09C] text-white shadow-[#00D09C]/25'
                }`}
              >
                {isFailed ? (
                  <X className="w-8 h-8 stroke-[3.5]" />
                ) : (
                  <Check className="w-8 h-8 stroke-[3.5]" />
                )}
              </div>
            </div>

            {/* Recipient Details */}
            <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {recipientName}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {upiId}
              </p>
            </div>

            {/* Two Action Buttons: View Details & Share receipt (Frame 00:22) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowFullDetails(!showFullDetails)}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>{showFullDetails ? 'Hide Details' : 'View Details'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-50 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share receipt</span>
              </button>
            </div>

            {showFullDetails && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2 animate-in fade-in">
                <div className="flex justify-between text-slate-500">
                  <span>UPI Ref (UTR):</span>
                  <button
                    type="button"
                    onClick={handleCopyUtr}
                    className="font-mono font-bold text-[#5B3DF5] flex items-center gap-1"
                  >
                    <span>{upiRef}</span>
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Debited from:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">Canara Bank · **9461</span>
                </div>
              </div>
            )}
          </div>

          {/* Perforated Serrated Zig-zag border */}
          <div className="w-full h-3 bg-repeat-x flex items-center justify-between px-1 opacity-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-slate-400 -my-1" />
            ))}
          </div>

          {/* Bottom Blue/Purple Info Banner (Exact text from Frame 00:23) */}
          <div className="p-4 bg-[#5B3DF5] text-white flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              {isFailed
                ? failureReason ||
                  'Payment decline as receiver doesnot have an active account. Request another QR or bank details from receiver. Any money deducted is auto-refunded, usually within 30 min and max 72 hours. Check source A/c statement for refund.'
                : cashbackEarned > 0
                ? `You have earned ₹${cashbackEarned.toFixed(1)} instant cashback! Real cash credited directly to your Canara Bank account.`
                : 'Payment settled instantly via NPCI 256-bit encrypted UPI rail.'}
            </p>
          </div>
        </div>

        {/* Faded Typography Watermark: "make life super" (Frame 00:23) */}
        <div className="text-center pt-2 select-none">
          <p className="text-3xl sm:text-4xl font-black text-slate-300 dark:text-slate-800 tracking-tight lowercase">
            make life super
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mt-2">
            <span>Powered by</span>
            <span className="font-mono text-slate-600 dark:text-slate-300">UPI</span>
            <span>|</span>
            <span className="text-[#005A9C] font-extrabold">YES BANK</span>
            <span>|</span>
            <span className="font-bold text-slate-600 dark:text-slate-300">super.money</span>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR matching super.money video (Frame 00:23 - 00:26) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/95 dark:bg-[#121319]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center">
        <div className="w-full max-w-lg flex items-center gap-3">
          {/* Left Button: "Try again" (if failed) / "Pay again" (if success) */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              onRetry();
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-white dark:bg-[#1A1A22] border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isFailed ? 'Try again' : 'Pay again'}</span>
          </button>

          {/* Right Button: "Done" (Bright super.money lime-green pill button) */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              onDone();
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-[#B4F726] hover:bg-[#a6ec15] text-slate-900 text-sm font-black shadow-sm shadow-[#B4F726]/30 active:scale-98 transition-all flex items-center justify-center cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
