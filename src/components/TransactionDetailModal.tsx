import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Check,
  Copy,
  Info,
  MessageSquare,
  Pencil,
  RotateCcw,
  Share2,
  Sparkles,
  X,
} from 'lucide-react';
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
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [ticketRaised, setTicketRaised] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showRepeatModal, setShowRepeatModal] = useState(false);

  useEffect(() => {
    if (transaction) {
      setShowDetails(false);
      setShowRepeatModal(false);
      setShowHelpModal(false);
    }
  }, [transaction]);

  if (!transaction) return null;

  const isDebit = transaction.type === 'debit';
  const isFailed = transaction.status === 'FAILED';

  // Format date matching screenshot: "18 October at 10:27 pm"
  const txDate = new Date(transaction.timestamp);
  const formattedFullDate =
    txDate.toLocaleString('en-IN', {
      day: 'numeric',
      month: 'long',
    }) +
    ' at ' +
    txDate.toLocaleString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).toLowerCase();

  const bankName = bankAccount?.bankName || 'Canara Bank';
  const bankLast4 = bankAccount?.accountNumberMasked ? bankAccount.accountNumberMasked.slice(-4) : '9461';

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
UPI ID: ${transaction.upiId || 'rohitv@paynow'}
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

  return (
    <div className="fixed inset-0 z-50 bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white flex flex-col w-full h-full overflow-hidden select-none animate-in fade-in duration-200">
      {/* Top Header Bar matching screenshot (< Back and Help pill) */}
      <div className="sticky top-0 z-20 px-4 py-3 flex items-center justify-between border-b border-slate-200/50 dark:border-slate-800/50 bg-[#F7F8FA] dark:bg-[#0E0E12]">
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onClose();
          }}
          className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer"
          title="Back"
        >
          <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
        </button>

        <button
          type="button"
          onClick={handleHelp}
          className="px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-slate-700 bg-white dark:bg-[#1A1A22] text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 flex items-center gap-1.5 shadow-xs cursor-pointer"
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
        {/* Ticket Box with Serrated Edge Effect matching exact uploaded screenshot */}
        <div className="relative rounded-3xl overflow-hidden shadow-sm border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A22]">
          {/* Top Receipt Body */}
          <div className="p-5 space-y-4">
            {/* Amount, Status, and Square Badge */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h1 className="text-4xl font-black font-sans text-slate-900 dark:text-white tabular-nums">
                  ₹{transaction.amount.toLocaleString('en-IN')}
                </h1>
                <p
                  className={`text-sm sm:text-base font-bold mt-1 ${
                    isFailed ? 'text-red-500' : 'text-slate-900 dark:text-white'
                  }`}
                >
                  {isFailed ? 'Payment Failed' : 'Payment Successful'}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">{formattedFullDate}</p>
              </div>

              {/* Square Icon Badge */}
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
                {transaction.title}
              </h3>
              <p className="text-xs font-mono text-slate-400 mt-0.5">
                {transaction.upiId || 'rohitv@paynow'}
              </p>
            </div>

            {/* Two Action Buttons: View Details & Share receipt (Matching screenshot) */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowDetails(!showDetails);
                }}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Info className="w-3.5 h-3.5 text-slate-500" />
                <span>{showDetails ? 'Hide Details' : 'View Details'}</span>
              </button>

              <button
                type="button"
                onClick={handleShare}
                className="py-2.5 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center justify-center gap-1.5 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
              >
                <Share2 className="w-3.5 h-3.5 text-slate-500" />
                <span>Share receipt</span>
              </button>
            </div>

            {/* Drawer with details if expanded */}
            {showDetails && (
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 text-xs space-y-2 animate-in fade-in">
                <div className="flex justify-between text-slate-500">
                  <span>UPI Ref (UTR):</span>
                  <button
                    type="button"
                    onClick={handleCopyUtr}
                    className="font-mono font-bold text-[#5B3DF5] flex items-center gap-1"
                  >
                    <span>{transaction.upiRefNumber}</span>
                    {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Debited from:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {bankName} · **{bankLast4}
                  </span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>Security Rail:</span>
                  <span className="font-semibold text-emerald-600">NPCI 256-Bit Encrypted</span>
                </div>
                {transaction.note && (
                  <div className="flex justify-between text-slate-500">
                    <span>Note:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">
                      {transaction.note}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Perforated Serrated Zig-zag border */}
          <div className="w-full h-3 bg-repeat-x flex items-center justify-between px-1 opacity-20">
            {Array.from({ length: 24 }).map((_, i) => (
              <div key={i} className="w-2 h-2 rounded-full bg-slate-400 -my-1" />
            ))}
          </div>

          {/* Bottom Blue/Purple Info Banner matching exact screenshot */}
          <div className="p-4 bg-[#5B3DF5] text-white flex items-start gap-3">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p className="text-xs leading-relaxed font-medium">
              {isFailed
                ? 'Payment decline as receiver doesnot have an active account. Request another QR or bank details from receiver. Any money deducted is auto-refunded, usually within 30 min and max 72 hours. Check source A/c statement for refund.'
                : transaction.cashback > 0
                ? `You have earned ₹${transaction.cashback} instant cashback! Real cash credited directly to your ${bankName} account.`
                : 'Payment settled instantly via NPCI 256-bit encrypted UPI rail.'}
            </p>
          </div>
        </div>

        {/* Faded Typography Watermark: "make life super" */}
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

      {/* FIXED BOTTOM ACTION BAR matching exact screenshot */}
      <div className="fixed bottom-0 left-0 right-0 z-30 p-4 bg-white/95 dark:bg-[#121319]/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800/80 flex items-center justify-center">
        <div className="w-full max-w-lg flex items-center gap-3">
          {/* Left Button: "Pay again" with Amount Edit Modal Trigger */}
          {isDebit && onRepeatPayment && (
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setShowRepeatModal(true);
              }}
              className="flex-1 py-3.5 px-4 rounded-full bg-white dark:bg-[#1A1A22] border-2 border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white text-sm font-bold shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-98 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Pay again</span>
              <span className="p-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500">
                <Pencil className="w-3 h-3 text-[#5B3DF5]" />
              </span>
            </button>
          )}

          {/* Right Button: "Done" (Bright super.money lime-green pill button) */}
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
          <div className="bg-white dark:bg-[#1A1A22] rounded-3xl p-5 max-w-sm w-full space-y-3.5 shadow-2xl border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
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
