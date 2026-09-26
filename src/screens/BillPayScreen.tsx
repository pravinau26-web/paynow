import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronRight, CreditCard, Flame, HelpCircle, Radio, Search, ShieldCheck, Sparkles, Tv, Wifi, Zap } from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { BillItem } from '../types';
import { INITIAL_BILLS } from '../services/mockData';

interface BillPayScreenProps {
  onBack: () => void;
  onPayBill: (bill: BillItem) => void;
}

export const BillPayScreen: React.FC<BillPayScreenProps> = ({
  onBack,
  onPayBill,
}) => {
  const [bills, setBills] = useState<BillItem[]>(INITIAL_BILLS);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [customBillerModal, setCustomBillerModal] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Bills', icon: Zap },
    { id: 'electricity', label: 'Electricity', icon: Zap },
    { id: 'fastag', label: 'FASTag', icon: ShieldCheck },
    { id: 'creditcard', label: 'Credit Card', icon: CreditCard },
    { id: 'dth', label: 'DTH / Cable', icon: Tv },
    { id: 'broadband', label: 'Broadband', icon: Wifi },
    { id: 'gas', label: 'Piped Gas', icon: Flame },
  ];

  const filteredBills = selectedCategory === 'all'
    ? bills
    : bills.filter((b) => b.billerType === selectedCategory);

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white pb-32 sm:pb-36 overflow-y-auto no-scrollbar select-none">
      <StatusBar dark={false} />

      {/* Top Bar */}
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
          <h2 className="text-sm font-bold">Bills & Recharges Hub</h2>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            BBPS Instant Settlement
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-5 space-y-4">
        {/* BBPS Assurance Banner */}
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-indigo-900 to-purple-900 text-white flex items-center justify-between shadow-xs">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white/20 flex items-center justify-center font-bold text-xs">
              BBPS
            </div>
            <div>
              <p className="text-xs font-bold">Bharat BillPay Assured</p>
              <p className="text-[10px] text-indigo-200">No convenience fee · Flat 2% cashback</p>
            </div>
          </div>
          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-slate-900 font-black text-[9px] uppercase">
            Zero Fee
          </span>
        </div>

        {/* Bill Categories Segmented Row */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Utility Categories
          </span>
          <div className="grid grid-cols-4 gap-2 mt-2">
            {categories.slice(1, 5).map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    setSelectedCategory(selectedCategory === cat.id ? 'all' : cat.id);
                  }}
                  className={`p-3 rounded-2xl flex flex-col items-center gap-1.5 transition-all text-center ${
                    selectedCategory === cat.id
                      ? 'bg-[#5B3DF5] text-white shadow-md shadow-[#5B3DF5]/30'
                      : 'bg-white dark:bg-[#1A1A20] text-slate-700 dark:text-slate-300 border border-slate-200/80 dark:border-slate-800/80 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-[10px] font-bold leading-tight">{cat.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Pending & Upcoming Bills List */}
        <div className="space-y-2 pt-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Pending Bills Due ({filteredBills.length})
            </span>
            {selectedCategory !== 'all' && (
              <button
                type="button"
                onClick={() => setSelectedCategory('all')}
                className="text-[11px] font-bold text-[#5B3DF5] hover:underline"
              >
                Show All
              </button>
            )}
          </div>

          <div className="space-y-3">
            {filteredBills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-[#5B3DF5]/60 transition-all flex flex-col justify-between gap-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-slate-100 dark:bg-slate-800 text-lg flex items-center justify-center shrink-0">
                      {bill.billerLogo}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {bill.billerName}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                        Consumer ID: {bill.consumerNumber}
                      </p>
                      <p className="text-[10px] text-amber-600 dark:text-amber-400 font-semibold mt-0.5">
                        Due: {bill.dueDate}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="text-lg font-black font-mono text-slate-900 dark:text-white">
                      ₹{bill.amount.toLocaleString('en-IN')}
                    </p>
                    <span className="text-[10px] font-bold text-emerald-600 flex items-center justify-end gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                      +₹{bill.cashback.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="text-[11px] text-slate-400">
                    {bill.billPeriod || 'Instant Verification'}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playKeypadClick();
                      onPayBill(bill);
                    }}
                    className="px-4 py-1.5 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white text-xs font-bold shadow-sm shadow-[#5B3DF5]/30 hover:opacity-95 active:scale-95 transition-all"
                  >
                    Pay Bill
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add New Biller Action Card */}
        <div className="p-4 rounded-3xl bg-slate-50 dark:bg-[#121217] border border-dashed border-slate-300 dark:border-slate-800 text-center">
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
            Have another utility bill to pay?
          </p>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Search across 20,000+ electricity, gas, water & municipal corporations
          </p>
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              alert('Biller directory search: Type biller name e.g. TNEB, Adani Gas, Torrent Power.');
            }}
            className="mt-3 px-4 py-2 rounded-full bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-xs font-bold text-[#5B3DF5] hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Search New Biller
          </button>
        </div>
      </div>
    </div>
  );
};
