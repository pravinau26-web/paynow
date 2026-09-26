import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, ChevronRight, Gift, Sparkles, TrendingUp, Zap } from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { Transaction } from '../types';

interface RewardsScreenProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

export const RewardsScreen: React.FC<RewardsScreenProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [animatedTotal, setAnimatedTotal] = useState(0);

  // Compute total cashback from transactions
  const totalCashback = transactions.reduce((acc, curr) => acc + (curr.cashback || 0), 180.75);
  const cashbackTxList = transactions.filter((t) => t.cashback > 0 || t.category === 'cashback');

  useEffect(() => {
    const duration = 800;
    const start = performance.now();
    const target = Math.round(totalCashback);

    const step = (time: number) => {
      const progress = Math.min((time - start) / duration, 1);
      setAnimatedTotal(Math.floor(progress * target));
      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setAnimatedTotal(target);
      }
    };
    requestAnimationFrame(step);
  }, [totalCashback]);

  // Gamified Tier Progress
  const nextTierGoal = 500;
  const progressPercent = Math.min(Math.round((totalCashback / nextTierGoal) * 100), 100);

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white pb-32 sm:pb-36 overflow-y-auto no-scrollbar select-none">
      <StatusBar dark={false} />

      {/* Header */}
      <div className="px-5 pt-3 pb-2">
        <h2 className="text-xl font-extrabold tracking-tight">
          Real Cashback
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          100% Real money. Deposited straight into your bank account.
        </p>
      </div>

      <div className="px-5 space-y-4 mt-2">
        {/* ========================================================================= */}
        {/* TOTAL CASHBACK HERO CARD                                                  */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl p-6 bg-gradient-to-br from-[#1DB954] via-[#179644] to-[#0E682D] text-white shadow-xl shadow-emerald-500/20 overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-36 h-36 rounded-full bg-white/10 blur-xl pointer-events-none" />

          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              Total Cashback Earned
            </span>
            <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-bold">
              Direct to Bank
            </span>
          </div>

          <div className="text-4xl sm:text-5xl font-extrabold font-mono tabular-nums tracking-tight my-2">
            ₹{animatedTotal.toLocaleString('en-IN')}
          </div>

          <p className="text-xs text-emerald-100 mt-1">
            Zero locked wallets. Zero scratch card coupons. Genuine currency.
          </p>

          {/* Gamified Tier Progress */}
          <div className="mt-5 pt-4 border-t border-white/20">
            <div className="flex items-center justify-between text-xs font-semibold mb-1.5">
              <span>Super Tier 2 (5% Cashback)</span>
              <span>₹{Math.max(0, nextTierGoal - Math.round(totalCashback))} to Tier 3</span>
            </div>
            <div className="w-full h-2 rounded-full bg-black/20 overflow-hidden">
              <div
                className="h-full bg-white rounded-full transition-all duration-700"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-[10px] text-emerald-200 mt-1">
              Tier 3 unlocks 7% flat cashback on all merchant QR payments.
            </p>
          </div>
        </div>

        {/* Why PayNow Cashback is Different */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            The super.money Promise
          </span>

          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20">
              <CheckCircle2 className="w-5 h-5 text-[#1DB954] mx-auto mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">No Scratch Cards</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Real cash every time</p>
            </div>

            <div className="p-3 rounded-2xl bg-indigo-50 dark:bg-indigo-950/30 border border-[#5B3DF5]/20">
              <TrendingUp className="w-5 h-5 text-[#5B3DF5] mx-auto mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Auto Credit</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Direct to bank A/c</p>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-500/20">
              <Zap className="w-5 h-5 text-purple-600 mx-auto mb-1" />
              <p className="font-bold text-slate-800 dark:text-slate-200">Instant</p>
              <p className="text-[10px] text-slate-400 mt-0.5">Under 2 seconds</p>
            </div>
          </div>
        </div>

        {/* Cashback Ledger */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cashback Credit History
            </span>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {cashbackTxList.map((tx) => (
              <div
                key={tx.id}
                onClick={() => onSelectTransaction(tx)}
                className="py-3 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 text-[#1DB954] flex items-center justify-center">
                    <Sparkles className="w-4 h-4 fill-current" />
                  </div>
                  <div className="text-xs">
                    <p className="font-bold text-slate-900 dark:text-white">
                      {tx.title}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      Credited to HDFC Bank A/c **4829
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="font-mono font-bold text-xs tabular-nums text-[#1DB954]">
                    +₹{(tx.cashback || tx.amount).toFixed(2)}
                  </p>
                  <span className="text-[10px] text-emerald-600 font-semibold">
                    Success
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
