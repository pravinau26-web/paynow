import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Copy,
  Eye,
  EyeOff,
  Flame,
  Lock,
  QrCode,
  Shield,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Zap,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { SuperCardInfo } from '../types';

interface SuperCardScreenProps {
  onBack: () => void;
  cardInfo: SuperCardInfo;
  userName?: string;
  onPayCardBill: (amount: number) => void;
  onToggleFreeze: () => void;
  onScanWithCard: () => void;
}

export const SuperCardScreen: React.FC<SuperCardScreenProps> = ({
  onBack,
  cardInfo,
  userName,
  onPayCardBill,
  onToggleFreeze,
  onScanWithCard,
}) => {
  const [isFlipped, setIsFlipped] = useState(false);
  const [showCvv, setShowCvv] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopyCard = () => {
    navigator.clipboard?.writeText(cardInfo.cardNumberMasked);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white pb-32 sm:pb-36 overflow-y-auto no-scrollbar select-none">
      <StatusBar dark={false} />

      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h2 className="text-sm font-bold">superCard · RuPay UPI</h2>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            5% Cashback on Every Merchant Scan
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-5 space-y-4">
        {/* Virtual Credit Card (Interactive 3D-styled card) */}
        <div
          onClick={() => {
            sounds.playKeypadClick();
            setIsFlipped(!isFlipped);
          }}
          className={`relative w-full h-52 rounded-3xl p-6 text-white cursor-pointer shadow-2xl transition-all duration-500 overflow-hidden ${
            cardInfo.isFrozen
              ? 'bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900 grayscale'
              : 'bg-gradient-to-br from-[#1c1d24] via-[#2d2050] to-[#5B3DF5]'
          }`}
        >
          {/* Futuristic ambient grid & glow */}
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-[#A16CFF]/20 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-40 h-40 rounded-full bg-[#1DB954]/20 blur-xl pointer-events-none" />

          {/* Frozen Watermark */}
          {cardInfo.isFrozen && (
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center z-20">
              <span className="px-4 py-1.5 rounded-full bg-cyan-500/20 border border-cyan-400 text-cyan-300 font-bold text-xs flex items-center gap-1.5">
                <Snowflake className="w-4 h-4 animate-spin" />
                CARD TEMPORARILY FROZEN
              </span>
            </div>
          )}

          {!isFlipped ? (
            /* Card Front */
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-tr from-[#6C4CFA] to-[#A16CFF] flex items-center justify-center font-black text-xs shadow-md">
                    S
                  </div>
                  <span className="font-bold tracking-tight text-sm">superCard</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-bold tracking-wider text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/30">
                  <Sparkles className="w-3 h-3 fill-current" />
                  5% CASHBACK
                </div>
              </div>

              {/* EMV Chip & Contactless */}
              <div className="flex items-center gap-2 my-auto">
                <div className="w-10 h-7 rounded-md bg-amber-300/80 border border-amber-400 shadow-inner" />
                <span className="text-[10px] text-slate-300 font-mono">RuPay Credit on UPI</span>
              </div>

              <div>
                <p className="font-mono text-lg font-bold tracking-widest text-slate-100">
                  {cardInfo.cardNumberMasked}
                </p>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-300">
                  <span className="font-semibold uppercase tracking-wider">
                    {userName ? userName.toUpperCase() : cardInfo.cardHolder}
                  </span>
                  <span className="font-mono">VALID THRU {cardInfo.expiry}</span>
                </div>
              </div>
            </div>
          ) : (
            /* Card Back */
            <div className="relative z-10 h-full flex flex-col justify-between">
              <div className="w-full h-8 bg-black/80 -mx-6 mt-1" />
              <div className="flex items-center justify-between px-2">
                <span className="text-xs text-slate-300">CVV Security Code:</span>
                <span className="px-3 py-1 rounded bg-white text-slate-900 font-mono font-bold text-sm tracking-widest">
                  {showCvv ? cardInfo.cvv : '•••'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400 text-center">
                Tap card again to flip to front. Protected by NPCI 2FA.
              </p>
            </div>
          )}
        </div>

        {/* Card Controls Bar */}
        <div className="grid grid-cols-3 gap-2">
          <button
            type="button"
            onClick={handleCopyCard}
            className="p-3 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors"
          >
            <Copy className="w-4 h-4 text-[#5B3DF5]" />
            <span>{copied ? 'Copied!' : 'Copy Number'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setShowCvv(!showCvv);
            }}
            className="p-3 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 text-xs font-bold text-slate-700 dark:text-slate-300 flex flex-col items-center gap-1 hover:bg-slate-50 transition-colors"
          >
            {showCvv ? <EyeOff className="w-4 h-4 text-[#5B3DF5]" /> : <Eye className="w-4 h-4 text-[#5B3DF5]" />}
            <span>{showCvv ? 'Hide CVV' : 'View CVV'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              onToggleFreeze();
            }}
            className={`p-3 rounded-2xl border text-xs font-bold flex flex-col items-center gap-1 transition-colors ${
              cardInfo.isFrozen
                ? 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-400 text-cyan-600'
                : 'bg-white dark:bg-[#1A1A20] border-slate-200/80 dark:border-slate-800/80 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
            }`}
          >
            <Snowflake className="w-4 h-4 text-cyan-500" />
            <span>{cardInfo.isFrozen ? 'Unfreeze' : 'Freeze Card'}</span>
          </button>
        </div>

        {/* Credit Limit & Outstanding Balance Card */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                Available Credit Limit
              </span>
              <p className="text-2xl font-black font-mono text-slate-900 dark:text-white mt-0.5">
                ₹{cardInfo.availableLimit.toLocaleString('en-IN')}
              </p>
              <p className="text-[11px] text-slate-400">
                Total Pre-Approved: ₹{cardInfo.totalLimit.toLocaleString('en-IN')}
              </p>
            </div>

            <button
              type="button"
              onClick={onScanWithCard}
              className="px-4 py-2.5 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-xs shadow-md shadow-[#5B3DF5]/30 flex items-center gap-1.5 active:scale-95 transition-all"
            >
              <QrCode className="w-4 h-4" />
              Scan & Pay
            </button>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="w-full h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className="h-full bg-[#5B3DF5] rounded-full"
                style={{ width: `${(cardInfo.usedLimit / cardInfo.totalLimit) * 100}%` }}
              />
            </div>
            <div className="flex justify-between text-[11px] text-slate-400">
              <span>Used: ₹{cardInfo.usedLimit.toLocaleString('en-IN')}</span>
              <span>Due: {cardInfo.dueDate}</span>
            </div>
          </div>

          {/* Bill payment CTA */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-slate-400">Total Bill Due</span>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                ₹{cardInfo.usedLimit.toLocaleString('en-IN')}
              </p>
            </div>
            <button
              type="button"
              onClick={() => onPayCardBill(cardInfo.usedLimit)}
              className="px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs shadow-sm transition-all"
            >
              Pay Card Bill
            </button>
          </div>
        </div>

        {/* Benefits breakdown */}
        <div className="p-4 rounded-3xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 space-y-2">
          <div className="flex items-center gap-2 font-bold">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Why superCard on UPI?</span>
          </div>
          <ul className="space-y-1 text-[11px] opacity-90 pl-1">
            <li>• No physical card needed — link directly to UPI Scan & Pay</li>
            <li>• Flat 5% real cashback on all merchant QR payments</li>
            <li>• Up to 45 days interest-free credit period</li>
          </ul>
        </div>
      </div>
    </div>
  );
};
