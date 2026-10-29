import React, { useState, useEffect } from 'react';
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
import { BankAccount, Transaction } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral } from '../services/share';
import { RepeatPaymentModal } from './RepeatPaymentModal';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRepeatPayment?: (tx: Transaction, customAmount?: number, customNote?: string) => void;
  userName?: string;
  bankAccount?: BankAccount;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onRepeatPayment,
  userName = 'PRAVIN',
  bankAccount,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedTxId, setCopiedTxId] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [ticketRaised, setTicketRaised] = useState<string | null>(null);
  const [showDetailsSheet, setShowDetailsSheet] = useState(false);
  const [isDetailsExpanded, setIsDetailsExpanded] = useState(false);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [detailsAccordionOpen, setDetailsAccordionOpen] = useState(true);
  const [showRepeatModal, setShowRepeatModal] = useState(false);
  const [openedGiftIndex, setOpenedGiftIndex] = useState<number | null>(null);
  const [giftRewardAmount, setGiftRewardAmount] = useState<number | null>(null);

  useEffect(() => {
    if (transaction) {
      setShowDetailsSheet(false);
      setIsDetailsExpanded(false);
      setShowRepeatModal(false);
      setShowHelpModal(false);
      setOpenedGiftIndex(null);
      setGiftRewardAmount(null);
    }
  }, [transaction]);

  // Drag handle gesture to expand details sheet upward
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchStartY === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - touchStartY;
    if (deltaY < -25 && !isDetailsExpanded) {
      setIsDetailsExpanded(true);
      setTouchStartY(null);
    } else if (deltaY > 35 && isDetailsExpanded) {
      setIsDetailsExpanded(false);
      setTouchStartY(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStartY(null);
  };

  if (!transaction) return null;

  const isDebit = transaction.type === 'debit';
  const isFailed = transaction.status === 'FAILED';

  const txDate = new Date(transaction.timestamp);
  const formattedMonthDay = txDate.toLocaleString('en-IN', {
    month: 'long',
    day: 'numeric',
  });
  const formattedTime = txDate.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
  const formattedFullDateTime = `${txDate.getDate()} ${txDate.toLocaleString('en-IN', {
    month: 'long',
  })} ${txDate.getFullYear()} • ${formattedTime.toUpperCase().replace(/\s+/g, '')}`;

  const bankName = bankAccount?.bankName || 'Canara Bank';
  const bankLast4 = bankAccount?.accountNumberMasked
    ? bankAccount.accountNumberMasked.slice(-4)
    : '9461';

  const superTxId = 'SMTX77F3B57D3EA348BA83FBA625066AD9E';

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(transaction.upiRefNumber);
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
    const res = await shareGeneral({
      title: `Super Pay Receipt - ${transaction.title}`,
      text: `Sent you payment via UPI using super.money. Let me know when you get it: https://link.super.money/tBaiJWTJLyMb\n\n₹${transaction.amount} paid to ${transaction.title} (${transaction.upiId || 'payee@paynow'}). UPI Ref: ${transaction.upiRefNumber}`,
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

  const handleRaiseDispute = () => {
    sounds.playKeypadClick();
    const tid = `TKT-${Math.floor(100000 + Math.random() * 900000)}`;
    setTicketRaised(`Ticket #${tid} raised. Resolved in 24 hours.`);
  };

  const effectiveCashbackPct =
    transaction.amount > 0 && transaction.cashback > 0
      ? ((transaction.cashback / transaction.amount) * 100).toFixed(2)
      : '0.14';

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 bg-[#F4F5F9] text-slate-900 flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* Top Bar: Solid Purple with Back Arrow, super.money logo, and Help Message Icon */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between bg-[#5B3DF5] text-white shadow-md">
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onClose();
          }}
          className="w-10 h-10 rounded-full hover:bg-white/10 flex items-center justify-center text-white cursor-pointer transition-colors"
          title="Back"
        >
          <ArrowLeft className="w-6 h-6 stroke-[2.2]" />
        </button>

        {/* Brand Logo & Name */}
        <div className="flex items-center gap-1.5 font-black text-white text-base tracking-tight">
          <img src="./logo.svg" alt="super.money" className="w-5 h-5 rounded-sm object-contain" />
          <span className="lowercase">super.money</span>
        </div>

        {/* Right Help Message Icon */}
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            setShowHelpModal(true);
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

      {/* Scrollable Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-3 space-y-4 pb-24">
        {/* ========================================================================= */}
        {/* WHITE RECEIPT CARD (Exact Video Style Frame 00:22 - 00:24)                */}
        {/* ========================================================================= */}
        <div className="rounded-3xl bg-white p-5 shadow-sm border border-slate-200/80 space-y-3.5">
          {/* Top Row: Amount + Checkmark Badge */}
          <div className="flex items-center justify-between">
            <h1 className="text-3xl sm:text-4xl font-black font-sans text-slate-900 tracking-tight tabular-nums">
              ₹{transaction.amount.toLocaleString('en-IN')}
            </h1>

            {/* Rounded Square Checkmark Badge */}
            <div
              className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                isFailed ? 'bg-red-500 text-white' : 'bg-[#00D09C] text-white'
              }`}
            >
              {isFailed ? (
                <X className="w-5 h-5 stroke-[3.5]" />
              ) : (
                <Check className="w-5 h-5 stroke-[3.5]" />
              )}
            </div>
          </div>

          {/* Recipient Title in Bold Uppercase */}
          <h2 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
            {transaction.title.toUpperCase()}
          </h2>

          {/* Date, Time, Ref ID with Copy Button */}
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
              <span>Ref ID: {transaction.upiRefNumber}</span>
              {copied ? (
                <Check className="w-3 h-3 text-emerald-500" />
              ) : (
                <Copy className="w-3 h-3 text-slate-400" />
              )}
            </button>
          </div>

          {/* Cashback Pill / Status Banner */}
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

          {/* 3 Horizontal Action Buttons: Pay again | View details | Share */}
          <div className="grid grid-cols-3 gap-2 pt-2">
            {/* 1. Pay again button */}
            {isDebit && onRepeatPayment && (
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowRepeatModal(true);
                }}
                className="py-2.5 px-2 rounded-2xl border border-slate-200 bg-white text-slate-900 text-xs font-bold hover:bg-slate-50 active:scale-95 transition-all flex items-center justify-center gap-1 cursor-pointer shadow-xs"
              >
                <Pencil className="w-3 h-3 text-[#5B3DF5]" />
                <span>Pay again</span>
              </button>
            )}

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

            {/* 3. Share button (WhatsApp green) */}
            <button
              type="button"
              onClick={handleShare}
              className="py-2.5 px-2 rounded-2xl bg-[#00D09C] hover:bg-[#00BA8C] text-white text-xs font-bold active:scale-95 transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-[#00D09C]/25"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Share</span>
            </button>
          </div>

          {/* Inline Payment Details Timeline matching video tick marks (Frame 00:30 - 00:35) */}
          <div className="pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between pb-2">
              <span className="font-black text-slate-900 text-xs sm:text-sm">
                Payment Details
              </span>
              <span className="text-[11px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                {isFailed ? 'Declined' : 'Success'}
              </span>
            </div>

            <div className="mt-2 pl-2 relative border-l-2 border-[#00D09C] space-y-3.5 ml-2.5 text-xs">
              <div className="relative pl-3.5">
                <span className="absolute -left-[14px] top-0.5 w-5 h-5 rounded-full bg-[#00D09C] text-white flex items-center justify-center shadow-xs">
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <p className="font-black text-slate-900 text-xs sm:text-sm">Payment initiated</p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">{formattedTime}</p>
              </div>

              <div className="relative pl-3.5">
                <span
                  className={`absolute -left-[14px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${
                    isFailed ? 'bg-red-500 text-white' : 'bg-[#00D09C] text-white'
                  }`}
                >
                  {isFailed ? <X className="w-3.5 h-3.5 stroke-[3]" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <p className="font-black text-slate-900 text-xs sm:text-sm">
                  {isFailed ? 'Declined by issuing bank' : 'Money debited from your bank'}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  {bankName} (A/c ••{bankLast4})
                </p>
              </div>

              <div className="relative pl-3.5">
                <span
                  className={`absolute -left-[14px] top-0.5 w-5 h-5 rounded-full flex items-center justify-center shadow-xs ${
                    isFailed ? 'bg-slate-300 text-slate-500' : 'bg-[#00D09C] text-white'
                  }`}
                >
                  {isFailed ? <X className="w-3.5 h-3.5 stroke-[3]" /> : <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </span>
                <p className="font-black text-slate-900 text-xs sm:text-sm">
                  {isFailed ? 'No money debited from your account' : `Money received by ${transaction.title.toUpperCase()}`}
                </p>
                <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                  {transaction.upiId || 'ganesankadhi@okaxis'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* REWARDS SECTION: TAP ON GIFTS TO UNLOCK (Exact Video Frame 00:22 - 00:24) */}
        {/* ========================================================================= */}
        <div className="space-y-3 pt-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                Tap on gifts to unlock rewards
              </h3>
              <p className="text-[11px] font-black text-[#5B3DF5] tracking-wider uppercase mt-0.5">
                TAP & REVEAL
              </p>
            </div>

            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#EAE6FF] text-[#5B3DF5] text-xs font-black shadow-xs">
              <Gift className="w-3.5 h-3.5" />
              <span>0</span>
            </div>
          </div>

          {/* Interactive Conveyor Belt with Gift Boxes */}
          <div className="relative rounded-3xl bg-gradient-to-b from-slate-100 to-slate-200 p-4 border border-slate-200/60 overflow-hidden shadow-inner">
            <div className="grid grid-cols-3 gap-3 relative z-10 py-1">
              {[
                { id: 0, color: 'from-[#FF6584] to-[#FF8DA1]', label: 'Surprise' },
                { id: 1, color: 'from-[#6C4CFA] to-[#8B7CFA]', label: 'Cashback' },
                { id: 2, color: 'from-[#00D09C] to-[#26E6B0]', label: 'Gold Bonus' },
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

          {/* Two Promotional Cards */}
          <div className="grid grid-cols-2 gap-3 pt-1">
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

        {/* Faded Typography Watermark */}
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
      {/* DETAILS BOTTOM SHEET MODAL (Frame 00:27 - 00:41)                          */}
      {/* ========================================================================= */}
      {/* ========================================================================= */}
      {/* DETAILS BOTTOM SHEET MODAL (Exact match of WhatsApp screenshot)           */}
      {/* ========================================================================= */}
      {showDetailsSheet && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200 p-0 sm:p-4 select-none"
          onClick={() => setShowDetailsSheet(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            className={`w-full max-w-md bg-white rounded-t-[32px] sm:rounded-3xl px-6 pt-3 pb-8 shadow-2xl border-t border-slate-100 text-slate-900 flex flex-col transition-all duration-300 ease-out overflow-y-auto no-scrollbar ${
              isDetailsExpanded ? 'h-[95vh] sm:h-[92vh]' : 'h-[65vh] sm:h-[62vh]'
            }`}
          >
            {/* Top Drag Handle ("kodu") - swipe up or tap to expand upward to top */}
            <div
              className="w-full flex flex-col items-center pt-1 pb-3 cursor-grab active:cursor-grabbing"
              onClick={() => setIsDetailsExpanded(!isDetailsExpanded)}
              title="Drag or tap to expand to full height"
            >
              <div className="w-14 h-1.25 bg-slate-300 hover:bg-slate-400 rounded-full transition-colors" />
            </div>

            {/* Header: "Details" in vibrant Indigo/Purple matching screenshot */}
            <div className="flex items-center justify-between pb-2 pt-1">
              <h2 className="text-[22px] font-extrabold text-[#4840EC] tracking-tight">
                Details
              </h2>
              <button
                type="button"
                onClick={() => setShowDetailsSheet(false)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-600 cursor-pointer"
                title="Close"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Details Key-Value Rows matching exact typography */}
            <div className="space-y-4 pt-2">
              {/* Date and time */}
              <div>
                <p className="text-[13px] text-slate-500 font-normal">Date and time</p>
                <p className="text-[15px] font-semibold text-slate-900 mt-1">
                  {formattedFullDateTime}
                </p>
              </div>

              {/* Payment Method */}
              <div>
                <p className="text-[13px] text-slate-500 font-normal">Payment Method</p>
                <p className="text-[15px] font-semibold text-slate-900 mt-1">
                  {bankName} {bankLast4}
                </p>
              </div>

              {/* Paid to */}
              <div>
                <p className="text-[13px] text-slate-500 font-normal">Paid to</p>
                <div className="flex items-center gap-2 mt-1">
                  <QrCode className="w-4 h-4 text-slate-700 stroke-[2] shrink-0" />
                  <span className="text-[15px] font-semibold text-slate-900 break-all">
                    {transaction.upiId || 'ganesankadhi@okaxis'}
                  </span>
                </div>
              </div>

              {/* UPI Transaction ID */}
              <div>
                <p className="text-[13px] text-slate-500 font-normal">UPI Transaction Id</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[15px] font-semibold text-slate-900 font-mono tracking-tight">
                    {transaction.upiRefNumber}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyUtr}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-500 active:scale-95 transition-all cursor-pointer"
                    title="Copy UPI Transaction ID"
                  >
                    {copied ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Super.Money transaction ID */}
              <div>
                <p className="text-[13px] text-slate-500 font-normal">Super.Money transaction ID</p>
                <div className="flex items-center justify-between mt-1">
                  <span className="text-[13.5px] font-mono font-medium text-slate-900 break-all pr-2 leading-relaxed">
                    {superTxId}
                  </span>
                  <button
                    type="button"
                    onClick={handleCopySuperTxId}
                    className="p-1 rounded-md hover:bg-slate-100 text-slate-500 shrink-0 active:scale-95 transition-all cursor-pointer"
                    title="Copy Super.Money ID"
                  >
                    {copiedTxId ? (
                      <Check className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <Copy className="w-4 h-4 text-slate-600" />
                    )}
                  </button>
                </div>
              </div>

              {/* Collapsible Payment Details Accordion */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => setDetailsAccordionOpen(!detailsAccordionOpen)}
                  className="w-full flex items-center justify-between text-left py-2 cursor-pointer"
                >
                  <span className="text-[15px] font-bold text-slate-900">
                    Payment Details
                  </span>
                  <ChevronUp
                    className={`w-4 h-4 text-slate-500 transition-transform duration-200 ${
                      detailsAccordionOpen ? '' : 'rotate-180'
                    }`}
                  />
                </button>

                {detailsAccordionOpen && (
                  <div className="relative pl-7 space-y-5 mt-3 select-none">
                    {/* Dotted vertical line connecting ticks */}
                    <div className="absolute left-[9px] top-2.5 bottom-2.5 w-px border-l-2 border-dotted border-slate-300 pointer-events-none" />

                    {/* Step 1: Payment initiated */}
                    <div className="relative">
                      <span className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#00D09C] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <p className="text-[14px] font-medium text-slate-900 leading-tight">
                        Payment initiated
                      </p>
                    </div>

                    {/* Step 2: Money debited from your bank */}
                    <div className="relative">
                      <span className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#00D09C] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <p className="text-[14px] font-medium text-slate-900 leading-tight">
                        {isFailed ? 'Declined by issuing bank' : 'Money debited from your bank'}
                      </p>
                    </div>

                    {/* Step 3: Money received by recipient */}
                    <div className="relative">
                      <span className="absolute -left-7 top-0 w-5 h-5 rounded-full bg-[#00D09C] text-white flex items-center justify-center shadow-xs">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </span>
                      <p className="text-[14px] font-medium text-slate-900 leading-tight">
                        {isFailed ? 'No money debited from your account' : `Money received by ${transaction.title}`}
                      </p>
                      {transaction.upiId && (
                        <p className="text-[12.5px] text-slate-500 mt-0.5 font-normal">
                          {transaction.upiId}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Repeat Payment Modal with Amount & Note Editing */}
      <RepeatPaymentModal
        isOpen={showRepeatModal}
        onClose={() => setShowRepeatModal(false)}
        recipientName={transaction.title}
        upiId={transaction.upiId}
        originalAmount={transaction.amount}
        initialNote={transaction.note || 'Repeat payment'}
        bankName={bankName}
        bankLast4={bankLast4}
        onConfirmPay={(newAmt, newNote) => {
          onClose();
          if (onRepeatPayment) {
            onRepeatPayment(transaction, newAmt, newNote);
          }
        }}
      />

      {/* Help / Dispute Dialog Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#5B3DF5]" />
                <span>NPCI Dispute Support</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 leading-relaxed">
              If money was debited but the beneficiary did not receive it, NPCI auto-reconciles within 2 to 24 hours.
            </p>

            {ticketRaised ? (
              <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-emerald-600 text-xs font-bold text-center">
                {ticketRaised}
              </div>
            ) : (
              <button
                type="button"
                onClick={handleRaiseDispute}
                className="w-full py-3 rounded-2xl bg-[#5B3DF5] text-white font-bold text-xs shadow-md shadow-[#5B3DF5]/30 hover:opacity-90 active:scale-98 transition-all cursor-pointer"
              >
                Raise Immediate Dispute
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
