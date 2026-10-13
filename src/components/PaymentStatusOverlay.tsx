import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  HelpCircle,
  MessageSquare,
  RotateCcw,
  Share2,
  ShieldCheck,
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
  upiId = 'paytm.s16g8iz@pty',
  cashbackEarned = 0,
  failureReason = 'Bank server declined this transaction. No money was deducted.',
  transaction,
  onDone,
  onViewReceipt,
  onRetry,
}) => {
  const [countdown, setCountdown] = useState(5);
  const [copied, setCopied] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  // 5-second processing countdown timer
  useEffect(() => {
    if (status === 'processing') {
      setCountdown(5);
      const interval = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Audio and confetti triggers on state change
  useEffect(() => {
    if (status === 'processing') {
      sounds.playPaymentInitiate();
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
    } else if (status === 'failed') {
      sounds.playPaymentFailure();
    }
  }, [status]);

  const initialLetter = (recipientName.trim()[0] || 'P').toUpperCase();
  const upiRef = transaction?.upiRefNumber || `6651${Math.floor(10000000 + Math.random() * 90000000)}`;

  const now = new Date();
  const formattedFullDate = now.toLocaleString('en-IN', {
    month: 'long',
    day: 'numeric',
  }) + ' at ' + now.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  const monthYearLabel = now.toLocaleString('en-IN', { month: 'long' }) + " '" + now.getFullYear().toString().slice(-2);
  const day = now.getDate();
  const ordinal = day === 1 || day === 21 || day === 31 ? 'st' : day === 2 || day === 22 ? 'nd' : day === 3 || day === 23 ? 'rd' : 'th';
  const formattedShortDate = `${day}${ordinal} ${now.toLocaleString('en-IN', { month: 'short' })} • ${now.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(upiRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    sounds.playKeypadClick();
    const res = await shareGeneral({
      title: `Super Pay Receipt - ${recipientName}`,
      text: `⚡ SUPER PAY RECEIPT: Paid ₹${amount} to ${recipientName} (${upiId}). UPI Ref: ${upiRef}`,
    });
    if (res === 'copied') {
      setSharedToast('Receipt copied to clipboard!');
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  // =========================================================================
  // PROCESSING STATE (Clean countdown & security shield modal)
  // =========================================================================
  if (status === 'processing') {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 select-none animate-in fade-in">
        <div className="w-full max-w-sm bg-white dark:bg-[#1A1A22] rounded-3xl p-6 text-center shadow-2xl border border-slate-200 dark:border-slate-800">
          <div className="relative w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full border-4 border-[#5B3DF5]/20 animate-spin border-t-[#5B3DF5]" />
            <div className="w-14 h-14 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center font-black text-xl font-mono">
              {countdown}s
            </div>
          </div>

          <h3 className="text-xl font-black text-slate-900 dark:text-white">
            Authorizing UPI Rail
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Communicating with bank server...
          </p>

          <div className="mt-4 p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-700/60">
            <p className="text-2xl font-black font-mono text-slate-900 dark:text-white">
              ₹{amount.toLocaleString('en-IN')}
            </p>
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-0.5">
              Paying {recipientName}
            </p>
            <p className="text-[11px] font-mono text-slate-400">{upiId}</p>
          </div>

          <p className="text-[11px] text-amber-500 font-medium mt-4">
            Please do not press back or close the app
          </p>
        </div>
      </div>
    );
  }

  // =========================================================================
  // SUCCESS & FAILED STATES: Exact super.money full-screen layout from video!
  // =========================================================================
  const isFailed = status === 'failed';

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar matching super.money video (Frame 00:15) */}
      <div className="sticky top-0 z-20 bg-[#F7F8FA] dark:bg-[#0E0E12] px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        {/* Left: Back button */}
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onDone();
          }}
          className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Recipient avatar + Name + UPI ID */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-[200px] sm:max-w-xs">
          <div className="w-9 h-9 rounded-xl bg-[#E8F8EE] text-[#00875A] dark:bg-[#003822]/40 dark:text-[#36B37E] flex items-center justify-center font-black text-sm shrink-0">
            {initialLetter}
          </div>
          <div className="min-w-0 text-left">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
              {recipientName}
            </h2>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {upiId}
            </p>
          </div>
        </div>

        {/* Right: Help button */}
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

      {/* Shared Feedback Toast */}
      {sharedToast && (
        <div className="mx-4 mt-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-in fade-in">
          {sharedToast}
        </div>
      )}

      {/* Main Scrollable Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-3 space-y-4 pb-28">
        {/* MAIN PAYMENT SUCCESS CARD */}
        <div className="bg-white dark:bg-[#1A1A22] rounded-3xl p-5 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3.5">
          {/* Top Row: Amount & Status on Left, Big Green Checkmark on Right */}
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums font-sans">
                ₹{amount.toLocaleString('en-IN')}
              </h1>

              <p
                className={`text-sm sm:text-base font-bold mt-1 ${
                  isFailed ? 'text-red-500' : 'text-slate-900 dark:text-white'
                }`}
              >
                {isFailed ? 'Payment Failed' : 'Payment Successful'}
              </p>

              <p className="text-xs text-slate-400 mt-0.5">
                {formattedFullDate}
              </p>
            </div>

            {/* Signature Big Square Badge */}
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center shrink-0 shadow-md ${
                isFailed
                  ? 'bg-[#FF4D4F] text-white shadow-red-500/20'
                  : 'bg-[#00D09C] text-white shadow-[#00D09C]/25'
              }`}
            >
              {isFailed ? (
                <X className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5]" />
              ) : (
                <Check className="w-8 h-8 sm:w-9 sm:h-9 stroke-[3.5]" />
              )}
            </div>
          </div>

          {/* Cashback Banner matching super.money */}
          {cashbackEarned > 0 && !isFailed && (
            <div className="bg-[#E8F8EE] dark:bg-[#003822]/40 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[#00875A] dark:text-[#36B37E]">
              <span className="text-base">💵</span>
              <p className="text-xs sm:text-sm font-bold">
                You have earned ₹{cashbackEarned.toFixed(1)} cashback
              </p>
            </div>
          )}

          {isFailed && (
            <div className="bg-red-50 dark:bg-red-950/40 rounded-xl p-3 text-red-600 dark:text-red-400 text-xs font-medium">
              {failureReason}
            </div>
          )}

          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          {/* Paid to */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Paid to:</span>
            <div className="text-right">
              <p className="font-mono font-bold text-slate-900 dark:text-white">
                {upiId}
              </p>
              <div className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-[10px]">🏦</span>
                <span>Paytm Payments Bank</span>
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
              </div>
            </div>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          {/* UPI Reference ID */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">UPI Reference ID</span>
            <button
              type="button"
              onClick={handleCopyUtr}
              className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white hover:text-[#5B3DF5] cursor-pointer"
            >
              <span>{upiRef}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>

          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          {/* Payment method */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Payment method</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 inline-flex items-center justify-center text-[10px] font-bold">
                  🏦
                </span>
                <span>Canara 9461</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowBalance(!showBalance);
                }}
                className="font-bold text-[#5B3DF5] dark:text-[#8B7CFA] hover:underline cursor-pointer"
              >
                {showBalance ? '₹24,850.50' : 'Check balance'}
              </button>
            </div>
          </div>
        </div>

        {/* View more and Share Pill Buttons Row */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => setShowDetails(!showDetails)}
            className="py-3 px-4 rounded-full bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{showDetails ? 'Hide details' : 'View more'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-3 px-4 rounded-full bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>
        </div>

        {/* View More Drawer */}
        {showDetails && (
          <div className="bg-white dark:bg-[#1A1A22] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2 animate-in fade-in">
            <div className="flex justify-between text-slate-500">
              <span>Security Rail:</span>
              <span className="font-semibold text-emerald-600">NPCI 256-Bit Encrypted</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Debit Account:</span>
              <span className="font-semibold text-slate-900 dark:text-white">Canara Bank · **9461</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Transaction Type:</span>
              <span className="font-semibold text-slate-900 dark:text-white">UPI P2M Instant Rail</span>
            </div>
          </div>
        )}

        {/* PAST TRANSACTIONS SECTION */}
        <div className="space-y-2.5 pt-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Past Transactions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {monthYearLabel}
            </p>
          </div>

          <div className="w-full bg-white dark:bg-[#1A1A22] rounded-2xl p-3.5 border border-slate-150 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#5B3DF5] text-white flex items-center justify-center font-bold shadow-xs">
                <ArrowUpRight className="w-5 h-5 stroke-[2.5]" />
              </div>
              <div>
                <p className="font-bold text-sm text-slate-900 dark:text-white">
                  You Sent
                </p>
                <p className="text-xs text-slate-400">
                  {formattedShortDate}
                </p>
              </div>
            </div>

            <div className="text-right">
              <p className="font-black text-sm text-slate-900 dark:text-white tabular-nums">
                ₹{amount.toLocaleString('en-IN')}
              </p>
              <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 mt-0.5">
                <span>From</span>
                <span className="text-[10px]">🏦</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FIXED BOTTOM ACTION BAR matching super.money video (Frame 00:20 - 00:24) */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/95 dark:bg-[#121319]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center">
        <div className="w-full max-w-lg flex items-center gap-3">
          {/* Left Button: Pay again or Retry */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              if (isFailed) {
                onRetry();
              } else {
                onRetry();
              }
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-white dark:bg-[#1A1A22] border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>{isFailed ? 'Retry' : 'Pay again'}</span>
          </button>

          {/* Right Button: Done */}
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
