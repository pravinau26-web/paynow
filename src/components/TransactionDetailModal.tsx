import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowLeft,
  ArrowUpRight,
  Check,
  Copy,
  Download,
  ExternalLink,
  HelpCircle,
  MessageCircle,
  Repeat,
  Share2,
  ShieldCheck,
  Sparkles,
  X,
} from 'lucide-react';
import { BankAccount, Transaction } from '../types';
import { sounds } from '../services/audio';
import { shareGeneral, shareToWhatsApp } from '../services/share';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onRepeatPayment?: (tx: Transaction) => void;
  userName?: string;
  bankAccount?: BankAccount;
}

export const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction,
  onClose,
  onRepeatPayment,
  userName = 'RAHUL SHARMA',
  bankAccount,
}) => {
  const [copied, setCopied] = useState(false);
  const [sharedToast, setSharedToast] = useState<string | null>(null);
  const [ticketRaised, setTicketRaised] = useState<string | null>(null);

  if (!transaction) return null;

  const isDebit = transaction.type === 'debit';

  // Format date and time
  const txDate = new Date(transaction.timestamp);
  const formattedDate = txDate.toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  // Account name in CAPS as requested
  const senderNameCaps = (userName || 'RAHUL SHARMA').toUpperCase();
  const receiverNameCaps = (transaction.title || 'MERCHANT').toUpperCase();

  // Account numbers last 4 digits for debiting account only
  const senderLast4 = bankAccount?.accountNumberMasked
    ? bankAccount.accountNumberMasked.slice(-4)
    : '4829';

  const handleCopyUtr = () => {
    sounds.playKeypadClick();
    navigator.clipboard?.writeText(transaction.upiRefNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getShareReceiptText = () => {
    if (isDebit) {
      return `⚡ SUPER PAY - UPI TRANSACTION RECEIPT
---------------------------------
Status: ${transaction.status === 'SUCCESS' ? 'PAID SUCCESSFULLY' : transaction.status}
Amount: ₹${transaction.amount.toLocaleString('en-IN')}
Date: ${formattedDate}

SENDER (DEBITED FROM):
Name: ${senderNameCaps}
Bank: ${bankAccount?.bankName || 'HDFC Bank'}
A/c No: •••• •••• ${senderLast4}

BENEFICIARY (PAID TO):
Name: ${receiverNameCaps}
${transaction.upiId ? `UPI ID: ${transaction.upiId}\n` : ''}UPI Ref (UTR): ${transaction.upiRefNumber}
${transaction.cashback > 0 ? `Cashback Credited: ₹${transaction.cashback.toFixed(2)}\n` : ''}Payment Mode: UPI Instant Settlement
---------------------------------
Super Pay · Safe & Secured by NPCI`;
    }

    return `⚡ SUPER PAY - UPI TRANSACTION RECEIPT
---------------------------------
Status: ${transaction.status === 'SUCCESS' ? 'RECEIVED SUCCESSFULLY' : transaction.status}
Amount: +₹${transaction.amount.toLocaleString('en-IN')}
Date: ${formattedDate}

CREDITED TO:
Name: ${senderNameCaps}
Bank: ${bankAccount?.bankName || 'HDFC Bank'}

RECEIVED FROM:
Name: ${receiverNameCaps}
${transaction.upiId ? `UPI ID: ${transaction.upiId}\n` : ''}UPI Ref (UTR): ${transaction.upiRefNumber}
Payment Mode: UPI Instant Settlement
---------------------------------
Super Pay · Safe & Secured by NPCI`;
  };

  const handleShareWhatsApp = () => {
    sounds.playKeypadClick();
    shareToWhatsApp(getShareReceiptText());
  };

  const handleShareGeneral = async () => {
    sounds.playKeypadClick();
    const res = await shareGeneral({
      title: `Super Pay Receipt - ${transaction.title}`,
      text: getShareReceiptText(),
    });

    if (res === 'copied') {
      setSharedToast('Receipt details copied to clipboard!');
      setTimeout(() => setSharedToast(null), 2500);
    }
  };

  const handleDownload = () => {
    sounds.playKeypadClick();
    const element = document.createElement('a');
    const file = new Blob([getShareReceiptText()], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `SuperPay_Receipt_${transaction.upiRefNumber.replace(/\//g, '_')}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    setSharedToast('Receipt downloaded successfully!');
    setTimeout(() => setSharedToast(null), 2500);
  };

  const handleReportIssue = () => {
    sounds.playKeypadClick();
    setTicketRaised(
      `Dispute #NPCI-${Math.floor(100000 + Math.random() * 900000)} registered. Our 24x7 resolution team will contact your bank within 2 hours.`
    );
    setTimeout(() => setTicketRaised(null), 4500);
  };

  return (
    <div className="fixed sm:absolute inset-0 z-50 bg-[#F7F8FC] dark:bg-[#0B0C10] text-slate-900 dark:text-white flex flex-col w-full h-full overflow-y-auto no-scrollbar animate-in slide-in-from-bottom-4 duration-250 select-none">
      {/* Top App Bar with back button */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-[#121319]/95 backdrop-blur-md px-4 py-3.5 flex items-center justify-between border-b border-slate-200/80 dark:border-slate-800/80">
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onClose();
          }}
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-700 dark:text-slate-200 transition-colors"
          title="Back to Previous Screen"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <img src="./logo.svg" alt="Super Pay" className="w-5 h-5 rounded-md" />
          <h2 className="text-sm font-bold tracking-tight text-slate-900 dark:text-white">
            Transaction Details
          </h2>
        </div>

        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onClose();
          }}
          className="w-9 h-9 rounded-full bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 flex items-center justify-center text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 px-4 py-5 max-w-lg mx-auto w-full space-y-4 pb-20">
        {/* Amount & Status Hero Card */}
        <div className="bg-white dark:bg-[#15161D] rounded-3xl p-6 text-center shadow-sm border border-slate-200/80 dark:border-slate-800/80 flex flex-col items-center">
          {/* Status Icon */}
          <div
            className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-md ${
              transaction.status === 'FAILED'
                ? 'bg-red-500/10 text-red-500 border-2 border-red-500/30'
                : transaction.status === 'SUCCESS'
                ? 'bg-emerald-500/15 text-emerald-500 border-2 border-emerald-500/30 shadow-emerald-500/10'
                : 'bg-amber-500/15 text-amber-500 border-2 border-amber-500/30'
            }`}
          >
            {transaction.status === 'FAILED' ? (
              <X className="w-8 h-8 text-red-500 stroke-[3]" />
            ) : transaction.status === 'SUCCESS' ? (
              <Check className="w-9 h-9 stroke-[3]" />
            ) : isDebit ? (
              <ArrowUpRight className="w-8 h-8" />
            ) : (
              <ArrowDownLeft className="w-8 h-8" />
            )}
          </div>

          {/* Amount */}
          <p
            className={`text-4xl font-extrabold font-mono tracking-tight tabular-nums ${
              transaction.status === 'FAILED'
                ? 'text-red-500 line-through opacity-80'
                : 'text-slate-900 dark:text-white'
            }`}
          >
            {isDebit ? '-' : '+'}₹{transaction.amount.toLocaleString('en-IN')}
          </p>

          {/* Status Label & Date */}
          <div className="flex items-center gap-1.5 mt-1.5 text-xs font-semibold">
            <span
              className={`w-2 h-2 rounded-full ${
                transaction.status === 'SUCCESS'
                  ? 'bg-emerald-500 animate-pulse'
                  : transaction.status === 'FAILED'
                  ? 'bg-red-500'
                  : 'bg-amber-500'
              }`}
            />
            <span
              className={
                transaction.status === 'SUCCESS'
                  ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                  : transaction.status === 'FAILED'
                  ? 'text-red-500 font-bold'
                  : 'text-amber-500 font-bold'
              }
            >
              {transaction.status === 'SUCCESS'
                ? 'Paid Successfully'
                : transaction.status === 'FAILED'
                ? 'Payment Failed'
                : 'Payment Pending'}
            </span>
            <span className="text-slate-300 dark:text-slate-600">·</span>
            <span className="text-slate-500 dark:text-slate-400 font-medium">
              {formattedDate}
            </span>
          </div>

          {transaction.status === 'FAILED' && (
            <div className="mt-3 px-3.5 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium max-w-sm">
              Payment was declined by issuing bank. If money was deducted, it will be refunded within 2 business days.
            </div>
          )}

          {/* Cashback Banner */}
          {transaction.cashback > 0 && (
            <div className="mt-3.5 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-500/30 shadow-xs">
              <Sparkles className="w-4 h-4 fill-emerald-500 text-emerald-600" />
              <span>+₹{transaction.cashback.toFixed(2)} Instant Cashback Credited</span>
            </div>
          )}
        </div>

        {/* Account & Transfer Details Card */}
        <div className="bg-white dark:bg-[#15161D] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800/80 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800/80">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Account & Transfer Details
            </span>
            <span className="text-[11px] font-semibold text-[#5B3DF5] bg-[#5B3DF5]/10 px-2 py-0.5 rounded-md">
              UPI Rail
            </span>
          </div>

          {/* Beneficiary / Paid To or Sender for Credit */}
          <div className="flex justify-between items-start">
            <span className="text-xs text-slate-500 font-medium">
              {isDebit ? 'Paid To (Receiver)' : 'Received From'}
            </span>
            <div className="text-right">
              {/* Account name in CAPS */}
              <p className="text-sm font-extrabold tracking-wide text-slate-900 dark:text-white">
                {receiverNameCaps}
              </p>
              {transaction.upiId && (
                <p className="text-xs font-mono font-medium text-[#5B3DF5] dark:text-[#8B7CFA] mt-0.5">
                  {transaction.upiId}
                </p>
              )}
            </div>
          </div>

          {/* Note if available */}
          {transaction.note && (
            <div className="flex justify-between items-start pt-2 border-t border-slate-100 dark:border-slate-800/60">
              <span className="text-xs text-slate-500 font-medium">Payment Note</span>
              <p className="text-xs text-right font-medium text-slate-700 dark:text-slate-300 max-w-[200px]">
                {transaction.note}
              </p>
            </div>
          )}

          {/* Sender / Debited From or Credited To */}
          <div className="flex justify-between items-start pt-2 border-t border-slate-100 dark:border-slate-800/60">
            <span className="text-xs text-slate-500 font-medium">
              {isDebit ? 'Debited From' : 'Credited To'}
            </span>
            <div className="text-right">
              {/* Name in CAPS */}
              <p className="text-xs font-extrabold tracking-wide text-slate-900 dark:text-white">
                {senderNameCaps}
              </p>
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mt-0.5">
                {bankAccount?.bankName || 'HDFC Bank'}
              </p>
              {/* Account Number Last 4 digits only for debit */}
              {isDebit && (
                <p className="text-[11px] font-mono font-bold text-slate-500 dark:text-slate-400 mt-0.5">
                  A/c No: •••• •••• {senderLast4}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* UPI Reference & Order Metadata Card */}
        <div className="bg-white dark:bg-[#15161D] rounded-3xl p-5 shadow-sm border border-slate-200/80 dark:border-slate-800/80 space-y-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block pb-1 border-b border-slate-100 dark:border-slate-800/80">
            UPI Verification & IDs
          </span>

          {/* UPI Ref / UTR with copy */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">UPI Ref (UTR)</span>
            <button
              type="button"
              onClick={handleCopyUtr}
              className="flex items-center gap-1.5 font-mono font-bold text-[#5B3DF5] dark:text-[#8B7CFA] bg-[#5B3DF5]/10 px-2.5 py-1 rounded-lg hover:bg-[#5B3DF5]/20 transition-colors"
              title="Click to copy UTR"
            >
              <span>{transaction.upiRefNumber}</span>
              {copied ? (
                <Check className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Copy className="w-3.5 h-3.5" />
              )}
            </button>
          </div>

          {/* Payment Type */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Payment Type</span>
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              UPI P2M Instant Settlement
            </span>
          </div>

          {/* NPCI Rail Status */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500 font-medium">Security Status</span>
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5" />
              NPCI Verified & Encrypted
            </span>
          </div>
        </div>

        {/* Notification Feedback Toast */}
        {sharedToast && (
          <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs text-center font-bold animate-in fade-in">
            {sharedToast}
          </div>
        )}

        {ticketRaised && (
          <div className="p-3.5 rounded-2xl bg-[#5B3DF5]/15 border border-[#5B3DF5]/30 text-[#5B3DF5] dark:text-[#8B7CFA] text-xs text-center font-bold animate-in fade-in leading-relaxed">
            {ticketRaised}
          </div>
        )}

        {/* Action Buttons Section */}
        <div className="space-y-2.5 pt-2">
          {/* Share via WhatsApp */}
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-98 transition-all flex items-center justify-center gap-2 shadow-md shadow-[#25D366]/20 cursor-pointer"
          >
            <MessageCircle className="w-5 h-5 fill-white" />
            <span>Share Receipt via WhatsApp</span>
          </button>

          {/* Repeat Payment if Debit */}
          {isDebit && onRepeatPayment && (
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                onClose();
                onRepeatPayment(transaction);
              }}
              className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] hover:opacity-95 shadow-md shadow-[#5B3DF5]/25 flex items-center justify-center gap-2 transition-transform active:scale-98 cursor-pointer"
            >
              <Repeat className="w-4 h-4" />
              <span>Repeat This Payment</span>
            </button>
          )}

          {/* Share Link & Download Buttons */}
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleShareGeneral}
              className="py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Share2 className="w-4 h-4 text-slate-500" />
              <span>Share Receipt</span>
            </button>

            <button
              type="button"
              onClick={handleDownload}
              className="py-3 rounded-2xl text-xs font-bold text-slate-700 dark:text-slate-200 bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
            >
              <Download className="w-4 h-4 text-slate-500" />
              <span>Download Text</span>
            </button>
          </div>

          {/* Help / Dispute */}
          <button
            type="button"
            onClick={handleReportIssue}
            className="w-full py-2.5 text-center text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-300 flex items-center justify-center gap-1.5 cursor-pointer transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Having an issue with this payment? Raise NPCI Dispute</span>
          </button>
        </div>
      </div>
    </div>
  );
};
