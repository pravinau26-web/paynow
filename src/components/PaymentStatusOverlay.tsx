import React, { useEffect, useState } from 'react';
import { Clock, RefreshCw, Share2, Sparkles, X } from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentStatus, Transaction } from '../types';
import { sounds } from '../services/audio';

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
  upiId,
  cashbackEarned = 0,
  failureReason = 'Bank server timeout. No money was deducted.',
  onDone,
  onViewReceipt,
  onRetry,
  onSimulateFail,
}) => {
  const [displayAmount, setDisplayAmount] = useState(0);
  const [countdown, setCountdown] = useState(5);

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

  // Sound and confetti triggers on state change
  useEffect(() => {
    if (status === 'processing') {
      sounds.playPaymentInitiate();
    } else if (status === 'success') {
      sounds.playPaymentSuccess();

      // Confetti burst (tactile and pleasant)
      try {
        confetti({
          particleCount: 45,
          spread: 60,
          origin: { y: 0.45 },
          colors: ['#5B3DF5', '#1DB954', '#8B7CFA', '#FFD700'],
          disableForReducedMotion: true,
        });
      } catch {
        // fallback
      }

      // Settle number animation
      const duration = 600;
      const startTime = performance.now();
      const step = (currentTime: number) => {
        const progress = Math.min((currentTime - startTime) / duration, 1);
        setDisplayAmount(Math.floor(progress * amount));
        if (progress < 1) {
          requestAnimationFrame(step);
        } else {
          setDisplayAmount(amount);
        }
      };
      requestAnimationFrame(step);
    } else if (status === 'failed') {
      sounds.playPaymentFailure();
    }
  }, [status, amount]);

  return (
    <div className="fixed sm:absolute inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 animate-in fade-in duration-200">
      <div
        className={`w-full max-w-[22rem] bg-white dark:bg-[#1A1A20] rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center relative overflow-hidden transition-all duration-300 ${
          status === 'failed' ? 'animate-shake' : ''
        }`}
      >
        {/* Ambient background glow */}
        <div
          className={`absolute -top-24 left-1/2 -translate-x-1/2 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-40 transition-colors duration-500 ${
            status === 'processing'
              ? 'bg-[#5B3DF5]'
              : status === 'success'
              ? 'bg-[#1DB954]'
              : status === 'failed'
              ? 'bg-[#FF4D4F]'
              : 'bg-amber-500'
          }`}
        />

        {/* ========================================================================= */}
        {/* STATE 1: PROCESSING                                                        */}
        {/* ========================================================================= */}
        {status === 'processing' && (
          <div className="py-7 flex flex-col items-center relative">
            {/* Top Right "Fa" Minute Button to simulate payment failure within 5s */}
            {onSimulateFail && (
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  onSimulateFail();
                }}
                title="Fail payment (Fa)"
                aria-label="Simulate payment failure"
                className="absolute top-0 right-0 z-30 flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 hover:bg-red-500/20 active:scale-90 border border-red-500/30 text-red-500 hover:text-red-400 text-[10px] font-bold font-mono transition-all cursor-pointer shadow-xs"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping" />
                <span>Fa</span>
              </button>
            )}

            {/* Pulsing Breathing Gradient Loader */}
            <div className="relative w-28 h-28 flex items-center justify-center my-3">
              <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] opacity-30 animate-ping" />
              <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] opacity-40 animate-pulse-glow" />
              <div className="relative z-10 w-16 h-16 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] flex items-center justify-center shadow-lg shadow-[#5B3DF5]/40 animate-spin">
                <div className="w-12 h-12 rounded-full bg-white dark:bg-[#1A1A20] flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-[#5B3DF5] animate-spin" />
                </div>
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-3">
              Processing Payment
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-[240px] animate-pulse">
              Securing connection with issuing bank & NPCI rails...
            </p>

            {/* 5-second countdown progress bar */}
            <div className="w-full max-w-[210px] mt-3">
              <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono mb-1">
                <span>Auto-verifying:</span>
                <span className="font-bold text-[#5B3DF5] dark:text-[#8B7CFA]">{countdown}s</span>
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[#5B3DF5] to-[#8B7CFA] transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${Math.max(5, (countdown / 5) * 100)}%` }}
                />
              </div>
            </div>

            {/* Context dimmed */}
            <div className="mt-5 pt-3.5 border-t border-slate-100 dark:border-slate-800/80 w-full opacity-80">
              <p className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-200">
                ₹{amount.toLocaleString('en-IN')}
              </p>
              <p className="text-xs text-slate-500 mt-0.5 truncate">
                Paying to <span className="font-semibold">{recipientName}</span>
              </p>
              {upiId && (
                <p className="text-[11px] font-mono text-slate-400 mt-0.5">{upiId}</p>
              )}
            </div>

            <p className="text-[11px] text-amber-500 dark:text-amber-400 font-medium mt-3">
              Please do not press back or close the app
            </p>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2A: SUCCESS                                                          */}
        {/* ========================================================================= */}
        {status === 'success' && (
          <div className="py-4 flex flex-col items-center animate-in zoom-in-95 duration-300">
            {/* Draw-on SVG stroke checkmark inside green circle with spring bounce */}
            <div className="relative w-24 h-24 flex items-center justify-center my-3">
              <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-pulse" />
              <div className="w-20 h-20 rounded-full bg-[#1DB954] flex items-center justify-center shadow-xl shadow-emerald-500/30 scale-100 transition-transform">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path
                    className="animate-draw"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white mt-1">
              Payment Successful!
            </h3>

            {/* Settle amount with counter */}
            <div className="mt-2 text-3xl font-extrabold font-mono tabular-nums text-slate-900 dark:text-white">
              ₹{displayAmount.toLocaleString('en-IN')}
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Paid to <span className="font-semibold text-slate-800 dark:text-slate-200">{recipientName}</span>
            </p>
            {upiId && (
              <p className="text-[11px] font-mono text-slate-400">{upiId}</p>
            )}

            {/* Real Cashback Badge (super.money style) */}
            {cashbackEarned > 0 && (
              <div className="mt-4 px-4 py-2.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center gap-2 text-emerald-700 dark:text-emerald-300 animate-in slide-in-from-bottom-2 duration-300">
                <div className="w-7 h-7 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Sparkles className="w-4 h-4 fill-current" />
                </div>
                <div className="text-left text-xs">
                  <p className="font-bold text-emerald-800 dark:text-emerald-300">
                    +₹{cashbackEarned.toFixed(2)} Real Cash Credited!
                  </p>
                  <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                    Directly deposited to your linked bank account.
                  </p>
                </div>
              </div>
            )}

            {/* UPI Reference ID */}
            <p className="text-[11px] font-mono text-slate-400 mt-4">
              UPI Ref: UPI/{Math.floor(100000000000 + Math.random() * 900000000000)}
            </p>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={onViewReceipt}
                className="w-full py-3 rounded-full text-xs font-bold text-[#5B3DF5] bg-[#5B3DF5]/10 hover:bg-[#5B3DF5]/15 transition-colors flex items-center justify-center gap-1.5"
              >
                <Share2 className="w-3.5 h-3.5" />
                View & Share Receipt
              </button>
              <button
                type="button"
                onClick={onDone}
                className="w-full py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#5B3DF5] to-[#8B7CFA] hover:opacity-95 shadow-md shadow-[#5B3DF5]/30 transition-all active:scale-98"
              >
                Done
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2B: FAILURE                                                          */}
        {/* ========================================================================= */}
        {status === 'failed' && (
          <div className="py-4 flex flex-col items-center">
            {/* Draw-on X inside red circle */}
            <div className="relative w-24 h-24 flex items-center justify-center my-3">
              <div className="absolute inset-0 rounded-full bg-red-500/20" />
              <div className="w-20 h-20 rounded-full bg-[#FF4D4F] flex items-center justify-center shadow-xl shadow-red-500/30">
                <svg
                  className="w-10 h-10 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={3.5}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path className="animate-draw" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>

            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
              Payment Failed
            </h3>

            <div className="mt-2 text-2xl font-bold font-mono tabular-nums text-slate-700 dark:text-slate-300">
              ₹{amount.toLocaleString('en-IN')}
            </div>

            <div className="mt-3 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-xs text-red-600 dark:text-red-400">
              <p className="font-semibold">{failureReason}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                If any money was debited, it will be refunded within 2 business days.
              </p>
            </div>

            {/* Action buttons */}
            <div className="mt-6 flex flex-col gap-2 w-full">
              <button
                type="button"
                onClick={onRetry}
                className="w-full py-3 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#5B3DF5] to-[#8B7CFA] hover:opacity-95 shadow-md shadow-[#5B3DF5]/30 transition-all active:scale-98 cursor-pointer"
              >
                Retry Payment
              </button>
              <button
                type="button"
                onClick={onViewReceipt}
                className="w-full py-2.5 rounded-full text-xs font-semibold text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                View Transaction Details
              </button>
              <button
                type="button"
                onClick={onDone}
                className="w-full py-2 rounded-full text-xs font-semibold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* STATE 2C: PENDING                                                          */}
        {/* ========================================================================= */}
        {status === 'pending' && (
          <div className="py-4 flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-amber-500/20 border-2 border-amber-500 flex items-center justify-center my-3 text-amber-500 animate-pulse">
              <Clock className="w-10 h-10" />
            </div>

            <h3 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              Payment Pending
            </h3>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[250px]">
              Your payment is taking longer than usual with the recipient bank. We'll update status shortly.
            </p>

            <div className="mt-6 flex flex-col gap-2.5 w-full">
              <button
                type="button"
                onClick={onViewReceipt}
                className="w-full py-3 rounded-full text-xs font-bold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors"
              >
                Check Status in History
              </button>
              <button
                type="button"
                onClick={onDone}
                className="w-full py-2.5 rounded-full text-xs font-semibold text-[#5B3DF5]"
              >
                Go to Home
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
