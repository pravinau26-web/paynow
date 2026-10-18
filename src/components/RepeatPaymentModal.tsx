import React, { useState, useEffect } from 'react';
import {
  ChevronRight,
  MessageSquare,
  RotateCcw,
  X,
} from 'lucide-react';
import { sounds } from '../services/audio';

interface RepeatPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientName: string;
  upiId?: string;
  originalAmount: number;
  initialNote?: string;
  bankName?: string;
  bankLast4?: string;
  onConfirmPay: (amount: number, note: string) => void;
  onOpenInKeypad?: (amount: number, note: string) => void;
}

export const RepeatPaymentModal: React.FC<RepeatPaymentModalProps> = ({
  isOpen,
  onClose,
  recipientName,
  upiId = 'payee@paynow',
  originalAmount,
  initialNote = 'Repeat payment',
  bankName = 'Canara Bank',
  bankLast4 = '9461',
  onConfirmPay,
  onOpenInKeypad,
}) => {
  const [amountStr, setAmountStr] = useState<string>(originalAmount.toString());
  const [note, setNote] = useState<string>(initialNote);
  const [showNoteField, setShowNoteField] = useState<boolean>(false);
  const [inputError, setInputError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setAmountStr(originalAmount.toString());
      setNote(initialNote);
      setInputError(null);
      setShowNoteField(false);
    }
  }, [isOpen, originalAmount, initialNote]);

  if (!isOpen) return null;

  const currentAmountNum = parseFloat(amountStr) || 0;

  const handleQuickAdd = (addVal: number) => {
    sounds.playKeypadClick();
    const curr = parseFloat(amountStr) || 0;
    const next = Math.max(1, Math.round(curr + addVal));
    setAmountStr(next.toString());
    setInputError(null);
  };

  const handleReset = () => {
    sounds.playKeypadClick();
    setAmountStr(originalAmount.toString());
    setInputError(null);
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    // Allow numbers and decimal point
    if (/^\d*\.?\d*$/.test(val)) {
      setAmountStr(val);
      if (parseFloat(val) > 100000) {
        setInputError('UPI limit is ₹1,00,000 per transaction');
      } else {
        setInputError(null);
      }
    }
  };

  const handlePay = () => {
    const finalAmount = parseFloat(amountStr);
    if (isNaN(finalAmount) || finalAmount <= 0) {
      sounds.playPaymentFailure();
      setInputError('Please enter a valid amount greater than ₹0');
      return;
    }
    if (finalAmount > 100000) {
      sounds.playPaymentFailure();
      setInputError('UPI limit is ₹1,00,000 per transaction');
      return;
    }
    sounds.playKeypadClick();
    onClose();
    onConfirmPay(finalAmount, note.trim() || 'Repeat payment');
  };

  // Pastel Avatar initial
  const initialChar = (recipientName.trim()[0] || 'P').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-end sm:items-center justify-center p-0 sm:p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-sm bg-white dark:bg-[#1A1A22] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-slate-900 dark:text-white space-y-4 animate-in slide-in-from-bottom-6 duration-200">
        {/* Mobile handle indicator */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto sm:hidden" />

        {/* Modal Header */}
        <div className="flex items-center justify-between pb-1">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[#5B3DF5]/15 text-[#5B3DF5] flex items-center justify-center">
              <RotateCcw className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 dark:text-white">
                Repeat Payment
              </h2>
              <p className="text-[11px] text-slate-400">
                Edit amount or note before paying
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              onClose();
            }}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Recipient Details Pill */}
        <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#121319] border border-slate-150 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#EAE6FF] text-[#5B3DF5] dark:bg-[#5B3DF5]/20 dark:text-[#8B7CFA] flex items-center justify-center font-black text-base shrink-0 shadow-xs">
              {initialChar}
            </div>
            <div className="min-w-0">
              <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                {recipientName}
              </p>
              <p className="text-xs font-mono text-slate-400 truncate">
                {upiId}
              </p>
            </div>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 shrink-0">
            UPI Verified
          </span>
        </div>

        {/* Amount Input Section */}
        <div className="p-4 rounded-2xl bg-gradient-to-b from-[#5B3DF5]/5 to-transparent dark:from-[#5B3DF5]/10 border-2 border-[#5B3DF5]/30 text-center space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400">
            <span>EDIT AMOUNT</span>
            {currentAmountNum !== originalAmount && (
              <button
                type="button"
                onClick={handleReset}
                className="text-[#5B3DF5] dark:text-[#8B7CFA] hover:underline flex items-center gap-1 cursor-pointer"
              >
                <span>Original: ₹{originalAmount}</span>
              </button>
            )}
          </div>

          {/* Large Editable Number Input */}
          <div className="flex items-center justify-center gap-1 font-sans py-1">
            <span className="text-3xl sm:text-4xl font-black text-[#5B3DF5] select-none">
              ₹
            </span>
            <input
              type="text"
              inputMode="decimal"
              value={amountStr}
              onChange={handleAmountChange}
              placeholder="0"
              autoFocus
              className="w-48 text-center text-4xl sm:text-5xl font-black text-slate-900 dark:text-white bg-transparent outline-none tabular-nums"
            />
          </div>

          {inputError && (
            <p className="text-xs font-bold text-red-500 animate-shake">
              {inputError}
            </p>
          )}

          {/* Quick Add Chips */}
          <div className="flex items-center justify-center gap-1.5 pt-2 flex-wrap">
            {[50, 100, 500, 1000].map((chipVal) => (
              <button
                key={chipVal}
                type="button"
                onClick={() => handleQuickAdd(chipVal)}
                className="px-2.5 py-1 rounded-full text-xs font-bold bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-[#5B3DF5] hover:text-[#5B3DF5] active:scale-95 transition-all shadow-2xs cursor-pointer"
              >
                +₹{chipVal}
              </button>
            ))}
            <button
              type="button"
              onClick={handleReset}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-700 dark:hover:text-slate-200 active:scale-95 transition-all cursor-pointer"
              title="Reset to original"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Note Editor */}
        <div>
          {!showNoteField && !note ? (
            <button
              type="button"
              onClick={() => setShowNoteField(true)}
              className="text-xs font-semibold text-[#5B3DF5] dark:text-[#8B7CFA] hover:underline flex items-center gap-1 cursor-pointer"
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Add a note (optional)</span>
            </button>
          ) : (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#121319] border border-slate-200 dark:border-slate-800">
              <MessageSquare className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What is this for? (e.g. Rent, Groceries)"
                className="flex-1 bg-transparent text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              {note && (
                <button
                  type="button"
                  onClick={() => setNote('')}
                  className="p-0.5 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Source Bank Info */}
        <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 px-1">
          <span>Debiting from:</span>
          <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
            <span>🏦</span>
            <span>{bankName} · **{bankLast4}</span>
          </span>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2 pt-1">
          {/* Main Bright Lime-Green Pay Button */}
          <button
            type="button"
            onClick={handlePay}
            disabled={currentAmountNum <= 0 || !!inputError}
            className={`w-full py-4 rounded-full font-black text-sm sm:text-base flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer ${
              currentAmountNum > 0 && !inputError
                ? 'bg-[#B4F726] hover:bg-[#a5ec14] text-slate-900 shadow-[#B4F726]/30 active:scale-98'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
            }`}
          >
            <span>
              Pay ₹{currentAmountNum > 0 ? currentAmountNum.toLocaleString('en-IN') : '0'}
            </span>
            <ChevronRight className="w-4 h-4 stroke-[3]" />
          </button>

          {/* Secondary: Open in Keypad */}
          {onOpenInKeypad && (
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                onClose();
                onOpenInKeypad(currentAmountNum, note);
              }}
              className="w-full py-2.5 text-xs font-bold text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 text-center cursor-pointer"
            >
              Open with on-screen keypad
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
