import React, { useState } from 'react';
import { ArrowDownLeft, ArrowUpRight, Check, Copy, Download, HelpCircle, MessageCircle, Repeat, Share2, Sparkles, X } from 'lucide-react';
import { Transaction } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral, shareToWhatsApp } from '../services/share';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRepeatPayment?: (tx: Transaction) => void;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onRepeatPayment,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [ticketRaised, setTicketRaised] = useState<string | null>(null);

  if (!transaction) return null;

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(transaction.upiRefNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const isDebit = transaction.type === 'debit';
  const formattedDate = new Date(transaction.timestamp).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const getShareReceiptText = () => {
    return `📄 UPI Payment Receipt\nAmount: ₹${transaction.amount.toLocaleString('en-IN')}\nStatus: ${transaction.status}\nTo: ${transaction.title}\nUPI Ref: ${transaction.upiRefNumber}\nDate: ${formattedDate}${transaction.cashback > 0 ? `\n🎉 Cashback Earned: ₹${transaction.cashback.toFixed(2)}` : ''}`;
  };

  const handleShareWhatsApp = () => {
    sounds.playKeypadClick();
    shareToWhatsApp(getShareReceiptText());
  };

  const handleShareGeneral = async () => {
    sounds.playKeypadClick();
    const res = await shareGeneral({
      title: `UPI Payment Receipt - ${transaction.title}`,
      text: getShareReceiptText(),
    });

    if (res === 'copied') {
      setSharedToast('Receipt details copied to clipboard!');
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  const handleReportIssue = () => {
    sounds.playKeypadClick();
    setTicketRaised(`Ticket #INC-${Math.floor(10000 + Math.random() * 90000)} created with NPCI dispute desk.`);
    setTimeout(() => setTicketRaised(null), 3500);
  };

  return (
    <div className="fixed sm:absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-[22rem] bg-white dark:bg-[#1A1A20] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 max-h-[85vh] sm:max-h-[38rem] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            UPI Transaction Receipt
          </span>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount & Status Hero */}
        <div className="py-5 text-center flex flex-col items-center">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-3 shadow-md ${
              transaction.status === 'FAILED'
                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                : isDebit
                ? 'bg-red-50 dark:bg-red-950/40 text-red-500'
                : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#1DB954]'
            }`}
          >
            {transaction.status === 'FAILED' ? (
              <X className="w-7 h-7 text-red-500 stroke-[3]" />
            ) : isDebit ? (
              <ArrowUpRight className="w-7 h-7" />
            ) : (
              <ArrowDownLeft className="w-7 h-7" />
            )}
          </div>

          <p className={`text-3xl font-extrabold font-mono tabular-nums ${transaction.status === 'FAILED' ? 'text-red-500 line-through' : 'text-slate-900 dark:text-white'}`}>
            {isDebit ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
          </p>

          <div className="flex items-center gap-1.5 mt-1 text-xs font-medium">
            <span
              className={`w-2 h-2 rounded-full ${
                transaction.status === 'SUCCESS'
                  ? 'bg-emerald-500'
                  : transaction.status === 'FAILED'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
              }`}
            />
            <span className={`font-semibold ${transaction.status === 'FAILED' ? 'text-red-500' : 'text-slate-600 dark:text-slate-300'}`}>
              {transaction.status === 'SUCCESS'
                ? 'Paid Successfully'
                : transaction.status === 'FAILED'
                ? 'Transaction Failed'
                : 'Pending'}
            </span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-400">{formattedDate}</span>
          </div>

          {transaction.status === 'FAILED' && (
            <div className="mt-2.5 px-3 py-1.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-[11px] font-medium max-w-xs">
              Declined by issuing bank. No money was deducted from your account.
            </div>
          )}

          {/* Real Cashback Pill */}
          {transaction.cashback > 0 && (
            <div className="mt-3 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-[#1DB954] text-xs font-semibold border border-emerald-500/20">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              +₹{transaction.cashback.toFixed(2)} Cashback Credited
            </div>
          )}
        </div>

        {/* Receipt Details Box */}
        <div className="bg-slate-50 dark:bg-[#121217] rounded-2xl p-4 text-xs space-y-3 border border-slate-100 dark:border-slate-800">
          <div className="flex justify-between items-start">
            <span className="text-slate-400">Paid To</span>
            <div className="text-right">
              <p className="font-bold text-slate-800 dark:text-slate-200">{transaction.title}</p>
              {transaction.upiId && (
                <p className="text-[11px] font-mono text-slate-400">{transaction.upiId}</p>
              )}
            </div>
          </div>

          {transaction.note && (
            <div className="flex justify-between items-start">
              <span className="text-slate-400">Note</span>
              <p className="text-right font-medium text-slate-700 dark:text-slate-300">
                {transaction.note}
              </p>
            </div>
          )}

          <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800">
            <span className="text-slate-400">Debited From</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              HDFC Bank · A/c **4829
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">UPI Ref (UTR)</span>
            <button
              type="button"
              onClick={handleCopyUtr}
              className="flex items-center gap-1 font-mono font-medium text-[#5B3DF5] hover:underline"
            >
              <span>{transaction.upiRefNumber}</span>
              {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-400">Payment Type</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              UPI P2M Instant Settlement
            </span>
          </div>
        </div>

        {/* Feedback message when shared */}
        {sharedToast && (
          <div className="mt-2 p-2 rounded-xl bg-emerald-500/10 text-emerald-600 text-[11px] text-center font-medium animate-in fade-in">
            {sharedToast}
          </div>
        )}

        {ticketRaised && (
          <div className="mt-2 p-2 rounded-xl bg-[#5B3DF5]/10 text-[#5B3DF5] text-[11px] text-center font-medium animate-in fade-in">
            {ticketRaised}
          </div>
        )}

        {/* Actions */}
        <div className="mt-4 space-y-2">
          {/* Direct WhatsApp Share Button */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            <MessageCircle className="w-4 h-4 fill-white" />
            <span>Share Receipt via WhatsApp</span>
          </button>

          {isDebit && onRepeatPayment && (
            <button
              type="button"
              onClick={() => {
                onClose();
                onRepeatPayment(transaction);
              }}
              className="w-full py-2.5 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-[#5B3DF5] to-[#8B7CFA] hover:opacity-95 shadow-xs flex items-center justify-center gap-1.5 transition-transform active:scale-98 cursor-pointer"
            >
              <Repeat className="w-3.5 h-3.5" />
              Repeat This Payment
            </button>
          )}

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleShareGeneral}
              className="py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Share2 className="w-3.5 h-3.5" />
              Share Link
            </button>

            <button
              type="button"
              onClick={handleShareGeneral}
              className="py-2.5 rounded-xl text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Download
            </button>
          </div>

          <button
            type="button"
            onClick={handleReportIssue}
            className="w-full py-1.5 text-center text-[11px] font-medium text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center justify-center gap-1 cursor-pointer"
          >
            <HelpCircle className="w-3 h-3" />
            Having an issue with this payment?
          </button>
        </div>
      </div>
    </div>
  );
};
