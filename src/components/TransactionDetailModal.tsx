import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  FileText,
  HelpCircle,
  MessageSquare,
  Pencil,
  Repeat,
  RotateCcw,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
import { BankAccount, Transaction } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral, shareToWhatsApp } from '../services/share';

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
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [ticketRaised, setTicketRaised] = useState<string | null>(null);
  const [showBalance, setShowBalance] = useState(false);
  const [isEditingAmount, setIsEditingAmount] = useState<boolean>(false);
  const [repeatAmount, setRepeatAmount] = useState<string>('');
  const [repeatNote, setRepeatNote] = useState<string>('');
  const [showFullViewMore, setShowFullViewMore] = useState(false);

  useEffect(() => {
    if (transaction) {
      setRepeatAmount(transaction.amount.toString());
      setRepeatNote(transaction.note || 'Repeat payment');
      setIsEditingAmount(false);
      setShowBalance(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isDebit = transaction.type === 'debit';
  const isFailed = transaction.status === 'FAILED';

  // Format date matching super.money video: "October 12 at 10:51 PM"
  const txDate = new Date(transaction.timestamp);
  const formattedFullDate = txDate.toLocaleString('en-IN', {
    month: 'long',
    day: 'numeric',
  }) + ' at ' + txDate.toLocaleString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Short month label for Past Transactions
  const monthYearLabel = txDate.toLocaleString('en-IN', { month: 'long' }) + " '" + txDate.getFullYear().toString().slice(-2);
  const dayOrdinal = txDate.getDate() + (
    txDate.getDate() === 1 || txDate.getDate() === 21 || txDate.getDate() === 31 ? 'st' :
    txDate.getDate() === 2 || txDate.getDate() === 22 ? 'nd' :
    txDate.getDate() === 3 || txDate.getDate() === 23 ? 'rd' : 'th'
  );
  const formattedShortDate = `${dayOrdinal} ${txDate.toLocaleString('en-IN', { month: 'short' })} • ${txDate.toLocaleString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true })}`;

  const bankName = bankAccount?.bankName || 'Canara Bank';
  const bankLast4 = bankAccount?.accountNumberMasked ? bankAccount.accountNumberMasked.slice(-4) : '9461';
  const availableBalance = bankAccount?.balance ?? 24850.50;

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(transaction.upiRefNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareReceiptText = () => {
    return `⚡ SUPER PAY - PAYMENT RECEIPT
---------------------------------
Status: ${isFailed ? 'FAILED' : 'SUCCESSFUL'}
Paid to: ${transaction.title}
UPI ID: ${transaction.upiId || 'paytm.s16g8iz@pty'}
Amount: ₹${transaction.amount.toLocaleString('en-IN')}
Date: ${formattedFullDate}
UPI Ref: ${transaction.upiRefNumber}
Debited from: ${bankName} (A/c **${bankLast4})
${transaction.cashback > 0 ? `Cashback Earned: ₹${transaction.cashback}\n` : ''}---------------------------------
Verified by NPCI UPI Rails`;
  };

  const handleShare = async () => {
    sounds.playKeypadClick();
    const res = await shareGeneral({
      title: `Super Pay Receipt - ${transaction.title}`,
      text: getShareReceiptText(),
    });
    if (res === 'copied') {
      setSharedToast('Receipt copied to clipboard!');
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  const handleHelp = () => {
    sounds.playKeypadClick();
    setShowHelpModal(true);
  };

  const handleRaiseDispute = () => {
    sounds.playKeypadClick();
    setTicketRaised(
      `Dispute #NPCI-${Math.floor(100000 + Math.random() * 900000)} created. Your bank is notified and resolution will arrive within 2 hours.`
    );
    setTimeout(() => {
      setTicketRaised(null);
      setShowHelpModal(false);
    }, 3500);
  };

  const initialLetter = (transaction.title.trim()[0] || 'P').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar matching super.money video (Frame 00:15) */}
      <div className="sticky top-0 z-20 bg-[#F7F8FA] dark:bg-[#0E0E12] px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50">
        {/* Left: Back button */}
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onClose();
          }}
          className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 transition-colors cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        {/* Center: Recipient avatar + Name + UPI ID */}
        <div className="flex items-center gap-2.5 min-w-0 max-w-[200px] sm:max-w-xs">
          {/* Pastel square avatar */}
          <div className="w-9 h-9 rounded-xl bg-[#E8F8EE] text-[#00875A] dark:bg-[#003822]/40 dark:text-[#36B37E] flex items-center justify-center font-black text-sm shrink-0">
            {initialLetter}
          </div>
          <div className="min-w-0 text-left">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate leading-tight">
              {transaction.title}
            </h2>
            <p className="text-[11px] font-mono text-slate-400 truncate">
              {transaction.upiId || 'paytm.s16g8iz@pty'}
            </p>
          </div>
        </div>

        {/* Right: Help button pill */}
        <button
          type="button"
          onClick={handleHelp}
          className="px-3 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1A22] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
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

      {/* Main Scrollable Content */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 sm:px-5 py-3 space-y-4 pb-28">
        {/* MAIN PAYMENT SUCCESS CARD (Exact super.money look from video frame 00:15) */}
        <div className="bg-white dark:bg-[#1A1A22] rounded-3xl p-5 border border-slate-150 dark:border-slate-800 shadow-sm space-y-3.5">
          {/* Top Row: Amount & Status on Left, Big Green Checkmark on Right */}
          <div className="flex items-start justify-between gap-3">
            <div>
              {/* Big bold amount */}
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums font-sans">
                ₹{transaction.amount.toLocaleString('en-IN')}
              </h1>

              {/* Payment status text */}
              <p
                className={`text-sm sm:text-base font-bold mt-1 ${
                  isFailed
                    ? 'text-red-500'
                    : 'text-slate-900 dark:text-white'
                }`}
              >
                {isFailed ? 'Payment Failed' : 'Payment Successful'}
              </p>

              {/* Timestamp */}
              <p className="text-xs text-slate-400 mt-0.5">
                {formattedFullDate}
              </p>
            </div>

            {/* Signature Big Square Badge (Green with white Checkmark, or Red with X) */}
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
          {transaction.cashback > 0 && !isFailed && (
            <div className="bg-[#E8F8EE] dark:bg-[#003822]/40 rounded-xl px-3.5 py-2.5 flex items-center gap-2 text-[#00875A] dark:text-[#36B37E]">
              <span className="text-base">💵</span>
              <p className="text-xs sm:text-sm font-bold">
                You have earned ₹{transaction.cashback} cashback
              </p>
            </div>
          )}

          {/* Divider line */}
          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          {/* Paid to: */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Paid to:</span>
            <div className="text-right">
              <p className="font-mono font-bold text-slate-900 dark:text-white">
                {transaction.upiId || 'paytm.s16g8iz@pty'}
              </p>
              <div className="flex items-center justify-end gap-1.5 text-slate-500 dark:text-slate-400 mt-0.5">
                <span className="text-[10px]">🏦</span>
                <span>Paytm Payments Bank</span>
                <span className="w-2.5 h-2.5 rounded-full border border-slate-300 dark:border-slate-600 inline-block" />
              </div>
            </div>
          </div>

          {/* Divider line */}
          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          {/* UPI Reference ID */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">UPI Reference ID</span>
            <button
              type="button"
              onClick={handleCopyUtr}
              className="flex items-center gap-1.5 font-mono font-bold text-slate-900 dark:text-white hover:text-[#5B3DF5] cursor-pointer transition-colors"
              title="Copy UPI Ref"
            >
              <span>{transaction.upiRefNumber}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>
          </div>

          {/* Divider line */}
          <hr className="border-slate-100 dark:border-slate-800/80 my-2" />

          {/* Payment method */}
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Payment method</span>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-slate-900 dark:text-white font-medium">
                <span className="w-4 h-4 rounded-full bg-blue-500/20 text-blue-600 inline-flex items-center justify-center text-[10px] font-bold">
                  🏦
                </span>
                <span>{bankName.split(' ')[0]} {bankLast4}</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowBalance(!showBalance);
                }}
                className="font-bold text-[#5B3DF5] dark:text-[#8B7CFA] hover:underline cursor-pointer"
              >
                {showBalance ? `₹${availableBalance.toLocaleString('en-IN')}` : 'Check balance'}
              </button>
            </div>
          </div>
        </div>

        {/* View more and Share Pill Buttons Row matching video */}
        <div className="grid grid-cols-2 gap-3 pt-0.5">
          <button
            type="button"
            onClick={() => setShowFullViewMore(!showFullViewMore)}
            className="py-3 px-4 rounded-full bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            <span>{showFullViewMore ? 'Hide details' : 'View more'}</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="py-3 px-4 rounded-full bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer transition-all"
          >
            <Share2 className="w-4 h-4 text-slate-500" />
            <span>Share</span>
          </button>
        </div>

        {/* View More Drawer if expanded */}
        {showFullViewMore && (
          <div className="bg-white dark:bg-[#1A1A22] rounded-2xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2 animate-in fade-in">
            <div className="flex justify-between text-slate-500">
              <span>Security Rail:</span>
              <span className="font-semibold text-emerald-600">NPCI 256-Bit Encrypted</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Debit Account:</span>
              <span className="font-semibold text-slate-900 dark:text-white">{bankName} · **{bankLast4}</span>
            </div>
            <div className="flex justify-between text-slate-500">
              <span>Transaction Type:</span>
              <span className="font-semibold text-slate-900 dark:text-white">UPI P2M Instant Rail</span>
            </div>
          </div>
        )}

        {/* Editable Repeat Payment Box (Preserving custom amount edit requested by user) */}
        {isEditingAmount && isDebit && onRepeatPayment && (
          <div className="rounded-3xl p-4 bg-gradient-to-b from-[#5B3DF5]/10 via-[#5B3DF5]/5 to-transparent dark:from-[#5B3DF5]/20 border border-[#5B3DF5]/30 space-y-3 shadow-xs animate-in fade-in">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wider">
                Edit Amount to Repeat
              </span>
              <button
                type="button"
                onClick={() => setIsEditingAmount(false)}
                className="text-xs font-bold text-slate-500 hover:text-slate-800"
              >
                Cancel
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 space-y-2">
              <div className="flex items-center justify-center gap-1.5">
                <span className="text-3xl font-black text-[#5B3DF5]">₹</span>
                <input
                  type="number"
                  min="1"
                  max="500000"
                  value={repeatAmount}
                  onChange={(e) => setRepeatAmount(e.target.value)}
                  className="w-full text-center text-3xl font-black font-mono tracking-tight bg-transparent text-slate-900 dark:text-white border-b-2 border-[#5B3DF5] py-1 outline-none tabular-nums"
                  placeholder="0"
                />
              </div>

              {/* Quick Preset chips */}
              <div className="flex items-center justify-center gap-1.5 flex-wrap pt-1">
                <button
                  type="button"
                  onClick={() => setRepeatAmount(transaction.amount.toString())}
                  className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  Original (₹{transaction.amount})
                </button>
                {[100, 500, 1000].map((extra) => (
                  <button
                    key={extra}
                    type="button"
                    onClick={() => {
                      const curr = parseFloat(repeatAmount) || 0;
                      setRepeatAmount((curr + extra).toString());
                    }}
                    className="px-2 py-1 rounded-full text-[11px] font-bold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                  >
                    +₹{extra}
                  </button>
                ))}
              </div>

              {/* Note input */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center gap-2">
                <span className="text-[11px] font-semibold text-slate-400">Note:</span>
                <input
                  type="text"
                  value={repeatNote}
                  onChange={(e) => setRepeatNote(e.target.value)}
                  className="flex-1 text-xs bg-slate-50 dark:bg-slate-800/60 px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 outline-none"
                  placeholder="Payment note"
                />
              </div>
            </div>
          </div>
        )}

        {/* PAST TRANSACTIONS SECTION (Exact layout matching super.money video) */}
        <div className="space-y-2.5 pt-2">
          <div>
            <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
              Past Transactions
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              {monthYearLabel}
            </p>
          </div>

          {/* Past Transaction Item Card */}
          <div className="w-full bg-white dark:bg-[#1A1A22] rounded-2xl p-3.5 border border-slate-150 dark:border-slate-800 shadow-xs flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              {/* Purple/Blue Square with ArrowUpRight */}
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
                ₹{transaction.amount.toLocaleString('en-IN')}
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
          {/* Left Button: "Pay again" (White pill button with border) */}
          {isDebit && onRepeatPayment && (
            <button
              type="button"
              onClick={() => {
                if (isEditingAmount) {
                  const num = parseFloat(repeatAmount);
                  const finalAmt = !isNaN(num) && num > 0 ? num : transaction.amount;
                  sounds.playKeypadClick();
                  onClose();
                  onRepeatPayment(transaction, finalAmt, repeatNote);
                } else {
                  // Direct 1-tap repeat or quick prompt
                  sounds.playKeypadClick();
                  onClose();
                  onRepeatPayment(transaction);
                }
              }}
              onContextMenu={(e) => {
                e.preventDefault();
                setIsEditingAmount(true);
              }}
              className="flex-1 py-3.5 px-4 rounded-full bg-white dark:bg-[#1A1A22] border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Pay again</span>
              {!isEditingAmount && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    sounds.playKeypadClick();
                    setIsEditingAmount(true);
                  }}
                  className="p-1 hover:text-[#5B3DF5]"
                  title="Edit amount before paying"
                >
                  <Pencil className="w-3 h-3 text-slate-400" />
                </button>
              )}
            </button>
          )}

          {/* Right Button: "Done" (Super.money Signature Green Pill Button) */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              onClose();
            }}
            className="flex-1 py-3.5 px-4 rounded-full bg-[#B4F726] hover:bg-[#a6ec15] text-slate-900 text-sm font-black shadow-sm shadow-[#B4F726]/30 active:scale-98 transition-all flex items-center justify-center cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>

      {/* Help / Dispute Dialog Modal */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#1A1A22] rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-[#5B3DF5]" />
                Payment Support
              </h3>
              <button
                type="button"
                onClick={() => setShowHelpModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Having an issue with this transaction to {transaction.title}? We can raise an automated NPCI dispute directly with {bankName}.
            </p>

            {ticketRaised ? (
              <div className="p-3 rounded-xl bg-emerald-500/15 text-emerald-600 font-bold text-xs">
                {ticketRaised}
              </div>
            ) : (
              <div className="space-y-2 pt-1">
                <button
                  type="button"
                  onClick={handleRaiseDispute}
                  className="w-full py-2.5 rounded-xl bg-[#5B3DF5] text-white text-xs font-bold shadow-xs hover:bg-[#4d32d0] transition-colors"
                >
                  Raise NPCI Bank Dispute
                </button>
                <button
                  type="button"
                  onClick={() => setShowHelpModal(false)}
                  className="w-full py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs font-bold"
                >
                  Close
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
