import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Flame,
  Percent,
  PiggyBank,
  Plus,
  Shield,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { FixedDepositItem } from '../types';

interface SuperFdScreenProps {
  onBack: () => void;
  activeFds: FixedDepositItem[];
  onBookFd: (fdData: {
    principal: number;
    tenureMonths: number;
    interestRate: number;
    bankName: string;
    maturityAmount: number;
  }) => void;
}

export const SuperFdScreen: React.FC<SuperFdScreenProps> = ({
  onBack,
  activeFds,
  onBookFd,
}) => {
  const [depositAmount, setDepositAmount] = useState<number>(25000);
  const [tenure, setTenure] = useState<number>(12); // months
  const [selectedBank, setSelectedBank] = useState<string>('Suryoday Small Finance Bank');

  // Rates based on tenure
  const getInterestRate = (months: number) => {
    if (months === 6) return 8.6;
    if (months === 12) return 9.1;
    if (months === 24) return 9.5;
    return 9.25;
  };

  const rate = getInterestRate(tenure);
  // Compound interest approximation: A = P * (1 + r*t)
  const estimatedReturn = Math.round(depositAmount * (rate / 100) * (tenure / 12));
  const maturityAmount = depositAmount + estimatedReturn;

  const handleBookNow = () => {
    sounds.playKeypadClick();
    onBookFd({
      principal: depositAmount,
      tenureMonths: tenure,
      interestRate: rate,
      bankName: selectedBank,
      maturityAmount,
    });
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
          <h2 className="text-sm font-bold">superFD · High Yield Savings</h2>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <ShieldCheck className="w-3 h-3 fill-current" />
            RBI DICGC Insured up to ₹5,00,000
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-5 space-y-4">
        {/* Flagship Hero Card */}
        <div className="p-5 rounded-3xl bg-gradient-to-br from-[#122340] via-[#1A3358] to-[#1DB954] text-white shadow-xl shadow-emerald-950/20 relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-xs font-bold flex items-center gap-1">
              <Percent className="w-3.5 h-3.5" />
              Up to 9.5% p.a. Return
            </span>
            <span className="text-[11px] font-mono text-emerald-300 font-semibold">
              Zero Penalty Withdrawal
            </span>
          </div>

          <h3 className="text-2xl font-black tracking-tight leading-snug">
            Grow your idle bank balance with 3x higher interest
          </h3>
          <p className="text-xs text-slate-200 mt-1">
            Book 100% paperless digital Fixed Deposit instantly with UPI in under 60 seconds.
          </p>
        </div>

        {/* Interactive FD Calculator */}
        <div className="p-5 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Investment Amount
            </span>
            <span className="text-xl font-black font-mono text-slate-900 dark:text-white">
              ₹{depositAmount.toLocaleString('en-IN')}
            </span>
          </div>

          {/* Range Slider */}
          <input
            type="range"
            min={1000}
            max={100000}
            step={1000}
            value={depositAmount}
            onChange={(e) => setDepositAmount(Number(e.target.value))}
            className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-lg appearance-none cursor-pointer accent-[#5B3DF5]"
          />

          {/* Quick preset amounts */}
          <div className="flex justify-between gap-1.5 pt-1">
            {[10000, 25000, 50000, 100000].map((amt) => (
              <button
                key={amt}
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setDepositAmount(amt);
                }}
                className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  depositAmount === amt
                    ? 'bg-[#5B3DF5] text-white'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}
              >
                ₹{amt / 1000}k
              </button>
            ))}
          </div>

          {/* Tenure Selector */}
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
              Select Tenure
            </span>
            <div className="grid grid-cols-4 gap-2">
              {[
                { months: 6, label: '6 Months', rate: '8.6%' },
                { months: 12, label: '1 Year', rate: '9.1%' },
                { months: 24, label: '2 Years', rate: '9.5%' },
                { months: 36, label: '3 Years', rate: '9.2%' },
              ].map((item) => (
                <button
                  key={item.months}
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    setTenure(item.months);
                  }}
                  className={`p-2.5 rounded-2xl border text-center transition-all flex flex-col items-center ${
                    tenure === item.months
                      ? 'border-[#5B3DF5] bg-[#5B3DF5]/10 text-[#5B3DF5] font-bold shadow-xs'
                      : 'border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-50'
                  }`}
                >
                  <span className="text-xs font-bold">{item.label}</span>
                  <span className="text-[10px] text-emerald-600 font-extrabold mt-0.5">{item.rate}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Maturity Breakdown Summary Box */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#121217] border border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-400">Total Interest Earned</span>
              <span className="font-bold text-emerald-600 font-mono">+₹{estimatedReturn.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-slate-200/60 dark:border-slate-800">
              <span className="font-bold text-slate-800 dark:text-slate-200">Maturity Value ({rate}% p.a.)</span>
              <span className="text-base font-black font-mono text-[#5B3DF5]">
                ₹{maturityAmount.toLocaleString('en-IN')}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={handleBookNow}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-xl shadow-[#5B3DF5]/30 hover:opacity-95 active:scale-95 transition-all flex items-center justify-center gap-2"
          >
            <PiggyBank className="w-4 h-4" />
            Book Instant FD with UPI (₹{depositAmount.toLocaleString('en-IN')})
          </button>
        </div>

        {/* User's Active FDs */}
        <div className="space-y-2 pt-2">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            My Active Fixed Deposits ({activeFds.length})
          </span>

          <div className="space-y-3">
            {activeFds.map((fd) => (
              <div
                key={fd.id}
                className="p-4 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">{fd.bankName}</h4>
                    <p className="text-[10px] text-slate-400 font-mono">{fd.fdNumber}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                    {fd.interestRate}% p.a.
                  </span>
                </div>

                <div className="flex justify-between items-center text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px]">Principal</span>
                    <p className="font-bold font-mono">₹{fd.principal.toLocaleString('en-IN')}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px]">Maturity on {fd.maturityDate}</span>
                    <p className="font-bold font-mono text-emerald-600">₹{fd.maturityAmount.toLocaleString('en-IN')}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
