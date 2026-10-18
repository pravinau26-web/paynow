import React, { useState } from 'react';
import {
  ArrowUpRight,
  Download,
  Fuel,
  RotateCcw,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Smartphone,
  User,
  X,
  Zap,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { BankAccount, Transaction } from '../types';
import { RepeatPaymentModal } from '../components/RepeatPaymentModal';

interface HistoryScreenProps {
  transactions: Transaction[];
  onSelectTransaction: (tx: Transaction) => void;
  onRepeatPayment?: (tx: Transaction, customAmount?: number, customNote?: string) => void;
  bankAccount?: BankAccount;
}

type FilterType = 'all' | 'debit' | 'credit' | 'cashback' | 'failed';

export const HistoryScreen: React.FC<HistoryScreenProps> = ({
  transactions,
  onSelectTransaction,
  onRepeatPayment,
  bankAccount,
}) => {
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [showFilters, setShowFilters] = useState(false);
  const [statementToast, setStatementToast] = useState<string | null>(null);
  const [repeatTx, setRepeatTx] = useState<Transaction | null>(null);

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
    if (filterType === 'failed') return tx.status === 'FAILED';
    return true;
  });

  // Helper: Format Date string e.g. "12th Oct • 10:51 PM"
  const formatTransactionTime = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const day = d.getDate();
      const ordinal =
        day === 1 || day === 21 || day === 31
          ? 'st'
          : day === 2 || day === 22
          ? 'nd'
          : day === 3 || day === 23
          ? 'rd'
          : 'th';
      const monthShort = d.toLocaleString('en-IN', { month: 'short' });
      const time = d.toLocaleString('en-IN', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
      return `${day}${ordinal} ${monthShort} • ${time}`;
    } catch {
      return 'Recent';
    }
  };

  // Helper: Get Month & Year label e.g. "October '26"
  const getMonthYearLabel = (isoString: string) => {
    try {
      const d = new Date(isoString);
      const month = d.toLocaleString('en-IN', { month: 'long' });
      const year = d.getFullYear().toString().slice(-2);
      return `${month} '${year}`;
    } catch {
      return "Recent '26";
    }
  };

  // Group transactions by Month (matching super.money video layout)
  const groupedByMonth = filtered.reduce<{
    [month: string]: { items: Transaction[]; totalSpent: number };
  }>((acc, tx) => {
    const monthKey = getMonthYearLabel(tx.timestamp);
    if (!acc[monthKey]) {
      acc[monthKey] = { items: [], totalSpent: 0 };
    }
    acc[monthKey].items.push(tx);
    if (tx.type === 'debit' && tx.status === 'SUCCESS') {
      acc[monthKey].totalSpent += tx.amount;
    }
    return acc;
  }, {});

  // Pastel Avatar colors matching super.money
  const getAvatarColors = (title: string, category?: string) => {
    const firstChar = (title.trim()[0] || 'P').toUpperCase();
    if (firstChar === 'P' || category === 'travel') {
      return 'bg-[#E8F8EE] text-[#00875A] dark:bg-[#003822]/40 dark:text-[#36B37E]';
    }
    if (firstChar === 'K' || category === 'transfer') {
      return 'bg-[#FFEBE5] text-[#DE350B] dark:bg-[#4D1B10]/40 dark:text-[#FF8F73]';
    }
    if (firstChar === 'S' || firstChar === 'A') {
      return 'bg-[#FFF0B3] text-[#974F00] dark:bg-[#423200]/40 dark:text-[#FFC400]';
    }
    if (firstChar === 'M') {
      return 'bg-[#FFF0B3] text-[#974F00] dark:bg-[#423200]/40 dark:text-[#FFC400]';
    }
    return 'bg-[#EAE6FF] text-[#5B3DF5] dark:bg-[#28224E]/40 dark:text-[#A16CFF]';
  };

  // Category Icon & Label
  const getCategoryTag = (category: string, title: string) => {
    const t = title.toLowerCase();
    if (category === 'travel' || t.includes('fuel') || t.includes('petrol')) {
      return { icon: <Fuel className="w-3 h-3 text-slate-400" />, label: 'Fuel' };
    }
    if (category === 'shopping' || category === 'food' || t.includes('vegetable') || t.includes('fruit')) {
      return { icon: <ShoppingBag className="w-3 h-3 text-slate-400" />, label: 'Grocery & Essential' };
    }
    if (category === 'bills') {
      return { icon: <Zap className="w-3 h-3 text-slate-400" />, label: 'Bill Payment' };
    }
    if (category === 'recharge') {
      return { icon: <Smartphone className="w-3 h-3 text-slate-400" />, label: 'Recharge' };
    }
    return null;
  };

  const handleDownloadStatement = () => {
    sounds.playKeypadClick();
    setStatementToast('Account statement exported successfully!');
    setTimeout(() => setStatementToast(null), 3000);
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white overflow-hidden select-none">
      <StatusBar dark={false} />

      {/* Top Header Bar matching super.money video */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 flex items-center justify-center font-bold text-sm shadow-xs">
            <User className="w-5 h-5" />
          </div>
          <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-900 dark:text-white">
            Payment history
          </h1>
        </div>

        {/* Statement Download Icon (tray with down arrow) */}
        <button
          type="button"
          onClick={handleDownloadStatement}
          className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-300 transition-colors cursor-pointer"
          title="Download Statement"
        >
          <Download className="w-5 h-5 stroke-[2.2]" />
        </button>
      </div>

      {/* Toast feedback */}
      {statementToast && (
        <div className="mx-5 mb-2 px-3.5 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold text-center animate-in fade-in">
          {statementToast}
        </div>
      )}

      {/* Search Input matching super.money */}
      <div className="px-5 my-1.5 shrink-0">
        <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-200/90 dark:border-slate-800 shadow-xs">
          <Search className="w-4 h-4 text-slate-400 shrink-0" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search your payments"
            className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
          />
          {search ? (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-1 transition-colors cursor-pointer ${
                showFilters || filterType !== 'all'
                  ? 'text-[#5B3DF5]'
                  : 'text-slate-700 dark:text-slate-300'
              }`}
              title="Filter Payments"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expandable Filter Tabs */}
      {showFilters && (
        <div className="px-5 flex items-center gap-2 overflow-x-auto no-scrollbar py-2 shrink-0 animate-in fade-in slide-in-from-top-1">
          {(
            [
              { id: 'all', label: 'All' },
              { id: 'debit', label: 'Paid' },
              { id: 'credit', label: 'Received' },
              { id: 'cashback', label: 'Cashback' },
              { id: 'failed', label: 'Failed' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setFilterType(tab.id);
              }}
              className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                filterType === tab.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 shadow-xs'
                  : 'bg-white dark:bg-[#1A1A22] text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Main Transactions List */}
      <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-5 pt-3 pb-36 sm:pb-32 space-y-6 overscroll-contain">
        {Object.keys(groupedByMonth).length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">
            No payments found matching &quot;{search}&quot;
          </div>
        ) : (
          Object.entries(groupedByMonth).map(([monthLabel, group]) => (
            <div key={monthLabel} className="space-y-3">
              {/* Month Group Header matching super.money video */}
              <div className="flex items-center justify-between pt-1">
                <div>
                  <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white tracking-tight">
                    {monthLabel}
                  </h2>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    You have spent{' '}
                    <span className="font-bold text-slate-900 dark:text-white">
                      ₹{group.totalSpent.toLocaleString('en-IN', { maximumFractionDigits: 2 })}
                    </span>{' '}
                    in this month
                  </p>
                </div>

                {/* Dark Square Button with ArrowUpRight */}
                <button
                  type="button"
                  onClick={() => sounds.playKeypadClick()}
                  className="w-7 h-7 rounded-lg bg-slate-900 dark:bg-slate-700 text-white flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all cursor-pointer shadow-xs"
                  title="View Monthly Breakdown"
                >
                  <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
                </button>
              </div>

              {/* Transactions List under Month */}
              <div className="space-y-2.5">
                {group.items.map((tx) => {
                  const isDebit = tx.type === 'debit';
                  const isFailed = tx.status === 'FAILED';
                  const categoryTag = getCategoryTag(tx.category, tx.title);
                  const avatarColor = getAvatarColors(tx.title, tx.category);
                  const initialLetter = (tx.title.trim()[0] || 'P').toUpperCase();
                  const last4Digits = bankAccount?.accountNumberMasked
                    ? bankAccount.accountNumberMasked.slice(-4)
                    : '9461';

                  return (
                    <div
                      key={tx.id}
                      onClick={() => {
                        sounds.playKeypadClick();
                        onSelectTransaction(tx);
                      }}
                      className="w-full bg-white dark:bg-[#1A1A22] rounded-2xl p-3.5 border border-slate-150 dark:border-slate-800/90 shadow-xs hover:border-[#5B3DF5]/40 transition-all cursor-pointer flex items-center justify-between gap-3 group active:scale-[0.99]"
                    >
                      {/* Left Side: Pastel Letter Avatar & Details */}
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        {/* Rounded Square Pastel Letter Avatar */}
                        <div
                          className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-base shrink-0 shadow-xs ${avatarColor}`}
                        >
                          {initialLetter}
                        </div>

                        {/* Title, Date & Category Tag */}
                        <div className="min-w-0 flex-1">
                          <p className="font-bold text-sm sm:text-base text-slate-900 dark:text-white truncate">
                            {tx.title}
                          </p>
                          <p className="text-xs text-slate-400 truncate mt-0.5">
                            {formatTransactionTime(tx.timestamp)}
                          </p>

                          {/* Category Tag pill if available */}
                          {categoryTag && (
                            <div className="flex items-center gap-1 mt-1 text-[11px] text-slate-400">
                              {categoryTag.icon}
                              <span>{categoryTag.label}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Right Side: Amount, Bank source / Failed status, Cashback badge */}
                      <div className="flex items-center gap-2.5 shrink-0 text-right">
                        <div>
                          {/* Amount */}
                          <p
                            className={`font-black text-sm sm:text-base tabular-nums ${
                              isFailed
                                ? 'text-slate-400 line-through'
                                : 'text-slate-900 dark:text-white'
                            }`}
                          >
                            ₹{tx.amount.toLocaleString('en-IN')}
                          </p>

                          {/* Bank Source / Failed Tag */}
                          {isFailed ? (
                            <p className="text-xs font-bold text-red-500 mt-0.5">
                              Failed
                            </p>
                          ) : (
                            <div className="flex items-center justify-end gap-1 text-[11px] text-slate-400 mt-0.5">
                              <span>From</span>
                              <span className="w-2.5 h-2.5 rounded-full bg-blue-500/20 text-blue-600 inline-flex items-center justify-center text-[7px] font-bold">
                                🏦
                              </span>
                              <span>• {last4Digits}</span>
                            </div>
                          )}

                          {/* Cashback Green Badge if earned */}
                          {tx.cashback > 0 && !isFailed && (
                            <div className="flex items-center justify-end gap-1 mt-0.5 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                              <Sparkles className="w-3 h-3 fill-current" />
                              <span>₹{tx.cashback.toFixed(1)}</span>
                            </div>
                          )}
                        </div>

                        {/* Pay Again circular button on row (as seen in video frame 00:13) */}
                        {isDebit && !isFailed && onRepeatPayment && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              sounds.playKeypadClick();
                              setRepeatTx(tx);
                            }}
                            className="flex flex-col items-center justify-center p-2 rounded-xl text-xs font-bold text-slate-900 dark:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors ml-1 cursor-pointer"
                            title="Pay again"
                          >
                            <RotateCcw className="w-4 h-4 text-emerald-600 mb-0.5" />
                            <span className="text-[10px]">Pay again</span>
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Repeat Payment Modal with Amount & Note Editing */}
      <RepeatPaymentModal
        isOpen={!!repeatTx}
        onClose={() => setRepeatTx(null)}
        recipientName={repeatTx?.title || ''}
        upiId={repeatTx?.upiId}
        originalAmount={repeatTx?.amount || 0}
        initialNote={repeatTx?.note || 'Repeat payment'}
        bankName={bankAccount?.bankName}
        bankLast4={bankAccount?.accountNumberMasked.slice(-4)}
        onConfirmPay={(newAmt, newNote) => {
          if (repeatTx && onRepeatPayment) {
            onRepeatPayment(repeatTx, newAmt, newNote);
          }
          setRepeatTx(null);
        }}
      />
    </div>
  );
};
