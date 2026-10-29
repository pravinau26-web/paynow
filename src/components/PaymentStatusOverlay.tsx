import React, { useEffect, useState } from 'react';
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Copy,
  Gift,
  Info,
  MessageSquare,
  Pencil,
  QrCode,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { PaymentStatus, Transaction } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral } from '../services/share';
import { generateUpiRefNumber } from '../services/upi';
import { RepeatPaymentModal } from './RepeatPaymentModal';

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
  onRetry: (customAmount?: number, customNote?: string) => void;
  onSimulateFail?: () => void;
}

export const PaymentStatusOverlay: React.FC<PaymentStatusOverlayProps> = ({
  status,
  amount,
  recipientName,
  upiId = 'ganesankadhi@okaxis',
  cashbackEarned = 0,
  failureReason,
  transaction,
  onDone,
  onViewReceipt,
  onRetry,
  onSimulateFail,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [stepStage, setStepStage] = useState<'animating' | 'receipt'>('animating');
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [detailsAccordionOpen, setDetailsAccordionOpen] = useState(true);
  const [showDiwaliBanner, setShowDiwaliBanner] = useState(false);
  const [rewardTokens, setRewardTokens] = useState(0);
  const [openedGiftIndex, setOpenedGiftIndex] = useState<number | null>(null);
  const [giftRewardAmount, setGiftRewardAmount] = useState<number | null>(null);
  const [showSmsNotif, setShowSmsNotif] = useState(false);

  // Trigger sounds, confetti, and transitions
  useEffect(() => {
    if (status === 'processing') {
      sounds.playPaymentInitiate();
      setStepStage('animating');
      setShowSmsNotif(false);
      setShowDiwaliBanner(false);
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
      // Transition to full receipt after 2.4 seconds to allow full sound and video animation to play
      const t = setTimeout(() => {
        setStepStage('receipt');
        // Drop down simulated bank SMS notification matching video (Frame 00:32)
        setTimeout(() => setShowSmsNotif(true), 1200);
        // Show promotional sale banner matching video (Frame 00:24)
        setTimeout(() => setShowDiwaliBanner(true), 2500);
      }, 2400);
      return () => clearTimeout(t);
    } else if (status === 'failed') {
      sounds.playPaymentFailure();
      const t = setTimeout(() => {
        setStepStage('receipt');
      }, 1800);
      return () => clearTimeout(t);
    }
  }, [status]);

  const upiRef = transaction?.upiRefNumber || generateUpiRefNumber();
  const superTxId = 'SMTX77F3B57D3EA348BA83FBA625066AD9E';

  const now = new Date();
  const formattedMonthDay = now.toLocaleString('en-IN', {
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = now.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedFullDateTime = `${now.getDate()} ${now.toLocaleString('en-IN', {
    month: 'long',
  })} ${now.getFullYear()} • ${formattedTime.toUpperCase().replace(/\s+/g, '')}`;

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(upiRef);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopySuperTxId = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(superTxId);
    setCopiedTxId(true);
    setTimeout(() => setCopiedTxId(false), 2000);
  };

  const handleShare = async () => {
    sounds.playKeypadClick();
    const isFailed = status === 'failed';
    const res = await shareGeneral({
      title: `Super Pay Receipt - ${recipientName}`,
      text: `Sent you payment via UPI using super.money. Let me know when you get it: https://link.super.money/tBaiJWTJLyMb\n\n₹${amount} paid to ${recipientName} (${upiId}). UPI Ref: ${upiRef}`,
    });
    if (res === 'copied') {
      setSharedToast('Receipt link copied to clipboard!');
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  const handleTapGift = (index: number) => {
    if (openedGiftIndex !== null) return;
    sounds.playCoinSound();
    setOpenedGiftIndex(index);
    const winAmt = Math.round((Math.random() * 5 + 1) * 100) / 100;
    setGiftRewardAmount(winAmt);
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.6 },
        colors: ['#FFD700', '#B4F726', '#00D09C', '#FF69B4'],
      });
    } catch {
      // fallback
    }
  };

  const isFailed = status === 'failed';
  const effectiveCashbackPct =
    amount > 0 && cashbackEarned > 0
      ? ((cashbackEarned / amount) * 100).toFixed(2)
      : '0.14';

  // =========================================================================
  // STAGE 1: "Payment in process" OR Brief Transition (Frames 00:19 - 00:21)
  // =========================================================================
  if (
    status === 'processing' ||
    (stepStage === 'animating' && (status === 'success' || status === 'failed'))
  ) {
    return (
      <div className="fixed inset-0 z-50 bg-[#F7F8FA] text-slate-900 flex flex-col justify-between items-center p-6 select-none animate-in fade-in">
        {/* Top Header Row with NPCI Secure and FA Fail Simulation Button */}
        <div className="w-full flex items-center justify-between">
          <span className="text-[10px] font-mono text-slate-400">NPCI SECURE</span>

          {status === 'processing' && onSimulateFail && (
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                onSimulateFail();
              }}
              title="Simulate Payment Failure (FA)"
              className="px-3.5 py-1 rounded-full bg-red-100/90 hover:bg-red-200 active:scale-90 border border-red-300 text-red-500 font-black text-xs tracking-wider flex items-center gap-1.5 cursor-pointer shadow-xs transition-all"
            >
              <span className="w-2 h-2 rounded-full bg-red-400 animate-pulse" />
              <span>FA</span>
            </button>
          )}
        </div>

        {/* Center Animated 3D Squircle with faint QR watermark behind (Frame 00:19 - 00:21) */}
        <div className="flex flex-col items-center text-center max-w-xs w-full relative my-auto">
          {/* Faint QR watermark pattern in background */}
          <div className="absolute -inset-10 flex items-center justify-center opacity-10 pointer-events-none">
            <QrCode className="w-56 h-56 text-slate-500" />
          </div>

          {/* 3D-styled Blue Squircle Icon with Side FA Button */}
          <div className="relative mb-6 flex items-center justify-center">
            {status === 'processing' ? (
              <div className="w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#3B28D0] via-[#5B3DF5] to-[#7C3AED] shadow-2xl shadow-[#5B3DF5]/40 flex items-center justify-center text-white border-2 border-white/20 animate-pulse">
                <img src="./logo.svg" alt="Super Pay" className="w-12 h-12 object-contain" />
              </div>
            ) : isFailed ? (
              <div className="w-24 h-24 rounded-3xl bg-[#FF4D4F] shadow-2xl shadow-red-500/40 flex items-center justify-center text-white border-2 border-white/20 animate-in zoom-in-95">
                <X className="w-14 h-14 stroke-[3]" />
              </div>
            ) : (
              /* EXACT 3D FLOATING BLOCKS ANIMATION MATCHING c1121d69-f43e-4cea-a604-fa97ec79045c_06af75a4.mp4 */
              <div className="relative flex items-center justify-center my-0 select-none animate-in zoom-in-90 duration-300">
                <video
                  src="./assets/aistudio/payment_success_badge_anim.mp4"
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-72 h-72 sm:w-80 sm:h-80 object-contain mix-blend-multiply pointer-events-none"
                >
                  <source src="./assets/aistudio/payment_success_badge_anim.webm" type="video/webm" />
                  <source src="./assets/aistudio/payment_success_badge_anim.mp4" type="video/mp4" />
                  <img
                    src="./assets/aistudio/payment_success_badge_anim.gif"
                    alt="Payment successful animation"
                    className="w-72 h-72 sm:w-80 sm:h-80 object-contain mix-blend-multiply"
                  />
                </video>
              </div>
            )}
          </div>

          {/* Status Text & Recipient (Exact typography from Frame 00:19 - 00:20) */}
          <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
            {status === 'processing'
              ? 'Payment in process'
              : isFailed
              ? 'Payment failed'
              : 'Payment successful'}
          </h2>

          <p className="text-sm font-medium text-slate-500 mt-1">
            to {recipientName.toUpperCase()}
          </p>

          <p className="text-4xl font-black font-sans text-slate-900 mt-3 tabular-nums">
            ₹{amount.toLocaleString('en-IN')}
          </p>
        </div>

        {/* Bottom Partner Branding: "Powered by UPI | YES BANK" (Frame 00:19) */}
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 pb-4">
          <span>Powered by</span>
          <span className="font-mono text-slate-700">UPI</span>
          <span className="text-slate-300">|</span>
          <span className="text-[#005A9C] font-extrabold flex items-center gap-1">
            <Check className="w-3.5 h-3.5 text-red-500" /> YES BANK
          </span>
        </div>
      </div>
    );
  }

  // =========================================================================
  // STAGE 2: EXACT SUPER.MONEY VIDEO RECEIPT & REWARDS SCREEN (Frame 00:22 - 00:26)
  // =========================================================================
  return (
    <div className="fixed inset-0 z-50 bg-[#F4F5F9] text-slate-900 flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200">
      {/* Simulated Android Bank SMS Push Notification (Matching Frame 00:32) */}
      {showSmsNotif && (
        <div className="fixed top-2 inset-x-3 z-50 p-3 bg-slate-900/95 text-white rounded-2xl shadow-2xl border border-slate-700/80 flex items-start gap-3 text-xs animate-in slide-in-from-top-4 duration-300">
          <div className="w-8 h-8 rounded-full bg-[#5B3DF5] text-white flex items-center justify-center font-bold text-sm shrink-0 shadow-md">
            🏦
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="font-black text-slate-100">Canara Bank • Now</span>
              <button
                type="button"
                onClick={() => setShowSmsNotif(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <p className="text-[11px] text-slate-300 mt-0.5 leading-tight">
              Dear Customer, Acct XXXXX9461 Dr. INR {amount}.00. UPI Ref: {upiRef}
            </p>
          </div>
        </div>
      )}

      {/* Top Bar: Solid Purple with Back Arrow, super.money logo, and Message Help icon (Frame 00:22) */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between bg-[#5B3DF5] text-white shadow-md">
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onDone();
          }}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
          title="Back to Home"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Center Logo with super.money brand */}
        <div className="flex items-center gap-1.5 font-black text-white text-base tracking-tight">
          <img src="./logo.svg" alt="super.money" className="w-5 h-5 rounded-sm object-contain" />
          <span className="lowercase">super.money</span>
        </div>

        {/* Right Help Message Icon */}
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onViewReceipt();
          }}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
          title="Help & Support"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Toast Feedback */}
      {sharedToast && (
        <div className="mx-4 mt-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 text-xs font-bold text-center animate-in fade-in">
          {sharedToast}
        </div>
      )}

      {/* Scrollable Content Container */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-3 space-y-4 pb-24">
        {/* ========================================================================= */}
        {/* WHITE RECEIPT CARD (Matching Exact Frame 00:22 - 00:24)                   */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3.5">
          {/* Top Row: Large Amount + Green Square Checkmark Badge */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-black font-sans text-slate-900 tracking-tight tabular-nums">
              ₹{amount.toLocaleString('en-IN')}
            </h1>

            {/* Rounded Square Checkmark Badge (Exact Frame 00:22) */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isFailed
                  ? 'bg-red-500 text-white'
                  : 'bg-[#00D09C] text-white'
              }`}
            >
              {isFailed ? (
                <X className="w-5 h-5 stroke-[3.5]" />
              ) : (
                <Check className="w-5 h-5 stroke-[3.5]" />
              )}
            </div>
          </div>

          {/* Recipient Name in Bold Uppercase */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {recipientName.toUpperCase()}
          </h2>

          {/* Date, Time, Ref ID with Copy button */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500">
            <span>
              {formattedMonthDay} at {formattedTime}
            </span>
            <span>•</span>
            <button
              type="button"
              onClick={handleCopyUtr}
              className="inline-flex items-center gap-1 font-mono hover:text-[#5B3DF5] cursor-pointer"
            >
              <span>Ref ID: {upiRef}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          {/* Instant Cashback Pill / Status Banner (Frame 00:22) */}
          <div className="pt-0.5">
            {isFailed ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-500/10 text-red-500 text-xs font-bold border border-red-500/20">
                <span>⚠️ Payment failed · No money debited</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#E8F8EE] text-[#00875A] text-xs font-bold border border-emerald-500/20">
                <span className="text-sm">🌿</span>
                <span>{effectiveCashbackPct}% cashback earned</span>
              </span>
            )}
          </div>

          {/* 3 Horizontal Action Buttons: Pay again | View details | Share (Frame 00:22) */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* 1. Pay again button */}
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setShowRepeatModal(true);
              }}
              className="py-2.5 px-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <Pencil className="w-3 h-3 text-[#5B3DF5]" />
              <span>{isFailed ? 'Try again' : 'Pay again'}</span>
            </button>

            {/* 2. View details button */}
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setShowDetailsSheet(true);
              }}
              className="py-2.5 px-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
            >
              <Info className="w-3 h-3 text-slate-500" />
              <span>View details</span>
            </button>

            {/* 3. Share button (Bright WhatsApp green matching Frame 00:22) */}
            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-2 rounded-2xl bg-[#00D09C] hover:bg-[#00BA8C] text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#00D09C]/25"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REWARDS SECTION: TAP ON GIFTS TO UNLOCK (Exact Frame 00:22 - 00:24)       */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-1">
          {/* Header Row: "Tap on gifts to unlock rewards" + "TAP & REVEAL" + Tokens count */}
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Tap on gifts to unlock rewards
              </h3>
              <p className="text-[11px] font-black text-[#5B3DF5] tracking-wider uppercase mt-0.5">
                TAP & REVEAL
              </p>
            </div>

            {/* Reward tokens counter pill */}
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAE6FF] text-[#5B3DF5] text-xs font-black shadow-xs">
              <Gift className="w-3.5 h-3.5" />
              <span>{rewardTokens}</span>
            </div>
          </div>

          {/* Interactive Conveyor Belt with 3D Gift Boxes (Matching Frame 00:23) */}
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-100 to-slate-200 p-4 border border-slate-200/60 overflow-hidden shadow-inner">
            {/* Conveyor Belt animated pattern lines */}
            <div className="absolute inset-x-0 bottom-1 h-3 bg-slate-300 rounded-full flex items-center justify-around px-2 opacity-50" />

            <div className="grid grid-cols-3 gap-3 relative z-10 py-1">
              {[
                { id: 0, color: 'from-[#FF6584] to-[#FF8DA1]', ribbon: '#FFD700', label: 'Surprise' },
                { id: 1, color: 'from-[#6C4CFA] to-[#8B7CFA]', ribbon: '#FFFFFF', label: 'Cashback' },
                { id: 2, color: 'from-[#00D09C] to-[#26E6B0]', ribbon: '#FFD700', label: 'Gold Bonus' },
              ].map((box) => (
                <button
                  key={box.id}
                  type="button"
                  onClick={() => handleTapGift(box.id)}
                  className={`group relative flex flex-col items-center justify-center p-3 rounded-2xl bg-gradient-to-b ${
                    box.color
                  } shadow-lg text-white cursor-pointer transition-all duration-200 hover:-translate-y-1 active:scale-95 ${
                    openedGiftIndex === box.id ? 'ring-4 ring-yellow-400 scale-105' : ''
                  }`}
                >
                  <Gift className="w-10 h-10 mb-1 drop-shadow-md group-hover:rotate-6 transition-transform" />
                  <span className="text-[10px] font-black uppercase tracking-wider text-white drop-shadow-xs">
                    {openedGiftIndex === box.id ? 'UNLOCKED!' : box.label}
                  </span>
                </button>
              ))}
            </div>

            {/* Revealed Gift Reward Popup */}
            {giftRewardAmount !== null && (
              <div className="mt-3 p-3 rounded-2xl bg-white border border-emerald-500/30 text-center space-y-1 animate-in zoom-in-95 duration-200 shadow-md">
                <p className="text-xs font-black text-emerald-600 flex items-center justify-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>₹{giftRewardAmount} Extra Reward Won!</span>
                </p>
                <p className="text-[10px] text-slate-500">
                  Real cash deposited direct to your Canara Bank account
                </p>
              </div>
            )}
          </div>

          {/* Two Promotional Cards (Exact match of Frame 00:23) */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            {/* Card 1: Save in Gold */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
              <span className="self-start text-[10px] font-black px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600">
                3% CASHBACK
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  Save in gold & get 3% cashback
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Starts with just ₹10</p>
              </div>
            </div>

            {/* Card 2: Tuition Fee */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-2">
              <span className="self-start text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600">
                0.99% FEE
              </span>
              <div>
                <p className="text-xs font-bold text-slate-900 leading-snug">
                  Pay tuition fee via credit card
                </p>
                <p className="text-[10px] text-slate-400 mt-0.5">Instant transfer</p>
              </div>
            </div>
          </div>
        </div>

        {/* Faded Branding Watermark: "make life super" (Matching Frame 00:23) */}
        <div className="text-center pt-2 select-none opacity-80">
          <p className="text-2xl sm:text-3xl font-black text-slate-300 tracking-tight lowercase">
            make life super
          </p>
          <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 mt-1">
            <span>Powered by</span>
            <span className="font-mono text-slate-600">UPI</span>
            <span>|</span>
            <span className="text-[#005A9C] font-extrabold">YES BANK</span>
            <span>|</span>
            <span className="font-bold text-slate-600">super.money</span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* DETAILS BOTTOM SHEET MODAL (Exact match of Video Frame 00:27 - 00:41)      */}
      {/* ========================================================================= */}
      {showDetailsSheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-4 select-none"
        >
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t border-slate-200 text-slate-900 flex flex-col max-h-[85vh] overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-6 duration-300">
            {/* Top Drag Handle */}
            <div className="w-12 h-1.5 bg-slate-300 rounded-full mx-auto mb-3 shrink-0" />

            {/* Header: "Details" + Close button */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xl font-black text-slate-900">Details</h3>
              <button
                type="button"
                onClick={() => setShowDetailsSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details Key-Value Rows (Exact fields from Frame 00:28 - 00:30) */}
            <div className="divide-y divide-slate-100 text-xs py-1">
              {/* Date and time */}
              <div className="py-3">
                <span className="text-slate-400 text-[11px] block">Date and time</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  {formattedFullDateTime}
                </span>
              </div>

              {/* Payment Method */}
              <div className="py-3">
                <span className="text-slate-400 text-[11px] block">Payment Method</span>
                <span className="font-bold text-slate-900 text-xs mt-0.5 block">
                  Canara 9461
                </span>
              </div>

              {/* Paid to */}
              <div className="py-3 space-y-1">
                <span className="text-slate-400 text-[11px] block">Paid to</span>
                <div className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 inline-flex items-center justify-center text-[10px] font-bold">
                    G
                  </span>
                  <span className="font-mono text-slate-900 text-xs">
                    {upiId}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-slate-500 text-[11px]">
                  <span className="text-orange-500 font-bold">🏦</span>
                  <span>Bank of Baroda</span>
                </div>
              </div>

              {/* UPI Transaction ID */}
              <div className="py-3 flex items-center justify-between">
                <div>
                  <span className="text-slate-400 text-[11px] block">UPI Transaction ID</span>
                  <span className="font-mono font-bold text-slate-900 text-xs mt-0.5 block">
                    {upiRef}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopyUtr}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 cursor-pointer"
                  title="Copy UPI Ref"
                >
                  {copied ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Super.Money transaction ID */}
              <div className="py-3 flex items-center justify-between">
                <div className="min-w-0 pr-2">
                  <span className="text-slate-400 text-[11px] block">
                    Super.Money transaction ID
                  </span>
                  <span className="font-mono text-[11px] text-slate-700 break-all block mt-0.5">
                    {superTxId}
                  </span>
                </div>
                <button
                  type="button"
                  onClick={handleCopySuperTxId}
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 shrink-0 cursor-pointer"
                  title="Copy Super ID"
                >
                  {copiedTxId ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>

              {/* Collapsible Payment Details Timeline (Frame 00:30 - 00:35) */}
              <div className="py-3">
                <button
                  type="button"
                  onClick={() => setDetailsAccordionOpen(!detailsAccordionOpen)}
                  className="w-full flex items-center justify-between text-left cursor-pointer"
                >
                  <span className="font-black text-slate-900 text-xs">
                    Payment Details
                  </span>
                  {detailsAccordionOpen ? (
                    <ChevronUp className="w-4 h-4 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-400" />
                  )}
                </button>

                {detailsAccordionOpen && (
                  <div className="mt-3 pl-2 relative border-l-2 border-emerald-500 space-y-3 ml-2 text-xs">
                    {/* Step 1: Payment initiated */}
                    <div className="relative pl-3">
                      <span className="absolute -left-[13px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      <p className="font-bold text-slate-900">Payment initiated</p>
                    </div>

                    {/* Step 2: Money debited from your bank */}
                    <div className="relative pl-3">
                      <span className="absolute -left-[13px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      <p className="font-bold text-slate-900">
                        Money debited from your bank
                      </p>
                    </div>

                    {/* Step 3: Money received by recipient */}
                    <div className="relative pl-3">
                      <span className="absolute -left-[13px] top-0.5 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center text-[10px]">
                        ✓
                      </span>
                      <p className="font-bold text-slate-900">
                        Money received by {recipientName.toUpperCase()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* PROMOTIONAL POPUP SALE BANNER (Matching Video Frame 00:24)                */}
      {/* ========================================================================= */}
      {showDiwaliBanner && (
        <div className="fixed bottom-0 inset-x-0 z-40 p-4 flex justify-center animate-in slide-in-from-bottom-6 duration-300">
          <div className="w-full max-w-md rounded-3xl bg-gradient-to-r from-[#FF5182] via-[#7B3FE4] to-[#5B3DF5] p-4 text-white shadow-2xl relative overflow-hidden flex items-center justify-between">
            <button
              type="button"
              onClick={() => setShowDiwaliBanner(false)}
              className="absolute top-2 right-2 p-1 text-white/70 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <span className="text-[10px] font-black tracking-widest uppercase opacity-80">
                super SALE
              </span>
              <h4 className="text-base font-black tracking-tight leading-tight">
                DIWALI SALE IS LIVE
              </h4>
              <p className="text-[11px] text-white/80 mt-0.5">Pay in 3 | No Fee</p>
            </div>

            <button
              type="button"
              onClick={() => setShowDiwaliBanner(false)}
              className="py-2 px-4 rounded-full bg-white text-slate-900 text-xs font-black shadow-md hover:bg-slate-100 cursor-pointer shrink-0"
            >
              Shop now
            </button>
          </div>
        </div>
      )}

      {/* Repeat / Edit Amount Payment Modal */}
      <RepeatPaymentModal
        isOpen={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        recipientName={recipientName}
        upiId={upiId}
        originalAmount={amount}
        initialNote={isFailed ? 'Retry payment' : 'Repeat payment'}
        bankName="Canara Bank"
        bankLast4="9461"
        onConfirmPay={(newAmt, newNote) => {
          setShowRepeatModal(false);
          onRetry(newAmt, newNote);
        }}
      />
    </div>
  );
};
