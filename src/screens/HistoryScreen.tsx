import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowDownLeft,
  ArrowUpRight,
  Search,
  Sparkles,
  X,
  XCircle,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { Transaction } from '../types';

interface HistoryScreenProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
}

type FilterType = 'all' | 'debit' | 'credit' | 'cashback';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  transactions,
  onSelectTransaction,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');

  // Counts for each tab
  const counts = {
    all: transactions.length,
    debit: transactions.filter((t) => t.type === 'debit').length,
    credit: transactions.filter((t) => t.type === 'credit').length,
    cashback: transactions.filter((t) => t.category === 'cashback' || t.cashback > 0).length,
  };

  // Filter transactions
  const filtered = transactions.filter((tx) => {
    const matchesSearch =
      tx.title.toLowerCase().includes(search.toLowerCase()) ||
      tx.upiRefNumber.toLowerCase().includes(search.toLowerCase()) ||
      (tx.note && tx.note.toLowerCase().includes(search.toLowerCase())) ||
      (tx.upiId && tx.upiId.toLowerCase().includes(search.toLowerCase()));

    if (!matchesSearch) return false;
    if (filterType === 'debit') return tx.type === 'debit';
    if (filterType === 'credit') return tx.type === 'credit';
    if (filterType === 'cashback') return tx.category === 'cashback' || tx.cashback > 0;
    return true;
  });

  // Group by date
  const groupTransactions = (list: Transaction[]) => {
    const groups: { [key: string]: Transaction[] } = {
      Today: [],
      Yesterday: [],
      'Earlier This Week': [],
      Older: [],
    };

    const now = new Date();
    const todayStr = now.toDateString();

    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const yesterdayStr = yesterday.toDateString();

    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    list.forEach((tx) => {
      const txDate = new Date(tx.timestamp);
      const txDateStr = txDate.toDateString();

      if (txDateStr === todayStr) {
        groups['Today'].push(tx);
      } else if (txDateStr === yesterdayStr) {
        groups['Yesterday'].push(tx);
      } else if (txDate > oneWeekAgo) {
        groups['Earlier This Week'].push(tx);
      } else {
        groups['Older'].push(tx);
      }
    });

    return groups;
  };

  const grouped = groupTransactions(filtered);

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white overflow-hidden select-none">
      <StatusBar dark={false} />

      {/* Header */}
      <div className="px-5 pt-3 pb-1 shrink-0">
        <h2 className="text-xl font-extrabold tracking-tight">
          Transaction History
        </h2>
        <p className="text-xs text-slate-400 mt-0.5">
          All UPI debits, credits, and instant cashback records
        </p>
      </div>

      {/* Search Bar */}
      <div className="px-5 my-2 shrink-0">
        <div className="flex items-center gap-2 px-3.5 py-2.5 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 shadow-xs">
          <Search className="w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, UPI Ref, or note"
            className="flex-1 bg-transparent text-xs font-medium outline-none"
          />
          {search && (
            <button type="button" onClick={() => setSearch('')}>
              <X className="w-4 h-4 text-slate-400" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Tabs (Functional segmented pills with live counts) */}
      <div className="px-5 flex items-center gap-2 overflow-x-auto no-scrollbar py-1 shrink-0 w-full">
        {(
          [
            { id: 'all', label: 'All Transactions', count: counts.all },
            { id: 'debit', label: 'Paid / Debits', count: counts.debit },
            { id: 'credit', label: 'Received / Credits', count: counts.credit },
            { id: 'cashback', label: 'Cashback', count: counts.cashback },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setFilterType(tab.id);
            }}
            className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-150 cursor-pointer flex items-center gap-1.5 ${
              filterType === tab.id
                ? 'bg-[#5B3DF5] text-white shadow-sm shadow-[#5B3DF5]/30'
                : 'bg-white dark:bg-[#1A1A20] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60'
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                filterType === tab.id
                  ? 'bg-white/25 text-white'
                  : 'bg-slate-100 dark:bg-slate-800 text-slate-500'
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Full-box Transactions Scroll Area with generous bottom padding */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-4 sm:px-5 pt-3 pb-36 sm:pb-32 space-y-4 overscroll-contain">
        {Object.entries(grouped).map(([groupTitle, items]) => {
          if (items.length === 0) return null;
          return (
            <div key={groupTitle} className="space-y-2">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  {groupTitle}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {items.length} {items.length === 1 ? 'record' : 'records'}
                </span>
              </div>

              {/* Transaction full-width individual cards */}
              <div className="space-y-2.5">
                {items.map((tx) => {
                  const isDebit = tx.type === 'debit';
                  const isFailed = tx.status === 'FAILED';
                  const isPending = tx.status === 'PENDING';
                  const dateStr = new Date(tx.timestamp).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        sounds.playKeypadClick();
                        onSelectTransaction(tx);
                      }}
                      className="w-full bg-white dark:bg-[#1A1A20] rounded-2xl p-3.5 border border-slate-200/90 dark:border-slate-800 shadow-xs hover:border-[#5B3DF5]/40 transition-all cursor-pointer flex flex-col gap-2 group active:scale-[0.99]"
                    >
                      {/* Top Row: Icon, Title, Status Pill, Amount */}
                      <div className="flex items-center justify-between gap-2.5">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div
                            className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-xs ${
                              isFailed
                                ? 'bg-red-500/10 text-red-500 border border-red-500/20'
                                : tx.category === 'cashback'
                                ? 'bg-emerald-500/10 text-[#1DB954]'
                                : isDebit
                                ? 'bg-red-50 dark:bg-red-950/40 text-red-500'
                                : 'bg-emerald-50 dark:bg-emerald-950/40 text-[#1DB954]'
                            }`}
                          >
                            {isFailed ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : tx.category === 'cashback' ? (
                              <Sparkles className="w-5 h-5 fill-current" />
                            ) : isDebit ? (
                              <ArrowUpRight className="w-5 h-5" />
                            ) : (
                              <ArrowDownLeft className="w-5 h-5" />
                            )}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="font-black text-sm sm:text-base text-slate-900 dark:text-white truncate">
                              {tx.title}
                            </p>
                            <p className="text-xs text-slate-400 truncate mt-0.5">
                              {tx.note || tx.subtitle}
                            </p>
                          </div>
                        </div>

                        {/* Amount & Status Badge */}
                        <div className="text-right shrink-0">
                          <p
                            className={`font-mono font-black text-sm sm:text-base tabular-nums ${
                              isFailed
                                ? 'text-red-500 line-through'
                                : isDebit
                                ? 'text-slate-900 dark:text-white'
                                : 'text-[#1DB954]'
                            }`}
                          >
                            {isFailed
                              ? `₹${tx.amount.toLocaleString('en-IN')}`
                              : `${isDebit ? '-' : '+'}₹${tx.amount.toLocaleString('en-IN')}`}
                          </p>

                          <div className="mt-0.5 flex justify-end">
                            {isFailed ? (
                              <span className="text-[9px] font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-2 py-0.5 rounded-full border border-red-500/20">
                                ✕ Failed
                              </span>
                            ) : isPending ? (
                              <span className="text-[9px] font-semibold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full">
                                ⏳ Pending
                              </span>
                            ) : (
                              <span className="text-[9px] font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                ✓ Successful
                              </span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Bank / UPI Ref details and time */}
                      <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
                        <span className="truncate flex-1 min-w-0 font-mono text-[10px]">
                          {tx.upiRefNumber}
                        </span>

                        <div className="flex items-center gap-2 shrink-0">
                          {tx.cashback > 0 && (
                            <span className="text-[10px] font-semibold text-[#1DB954] flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5 fill-current" />
                              +₹{tx.cashback.toFixed(0)} cash
                            </span>
                          )}
                          <span className="text-[10px]">{dateStr}</span>
                        </div>
                      </div>

                      {/* Failed helper row */}
                      {isFailed && (
                        <div className="mt-0.5 px-2.5 py-1 rounded-lg bg-red-500/5 border border-red-500/15 flex items-center justify-between text-[10px] text-red-500">
                          <span className="flex items-center gap-1 truncate">
                            <AlertCircle className="w-3 h-3 shrink-0" />
                            <span>Declined by bank · No money deducted</span>
                          </span>
                          <span className="font-bold underline cursor-pointer shrink-0 ml-1">
                            Retry
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 && (
          <div className="py-20 text-center text-xs text-slate-400 flex flex-col items-center">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-2">
              <Search className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-600 dark:text-slate-300">No transactions found</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Try adjusting your filter or search query
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
