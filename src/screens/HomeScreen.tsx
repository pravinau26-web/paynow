import React, { useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpRight,
  Bell,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  Percent,
  PiggyBank,
  Plus,
  QrCode,
  Receipt,
  RefreshCw,
  Send,
  Smartphone,
  Sparkles,
  Users,
  Volume2,
  Play,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { AppScreen, BankAccount, Contact, DealOffer, NotificationItem, Transaction, UserProfile } from '../types';
import { DEAL_OFFERS } from '../services/mockData';

interface HomeScreenProps {
  user: UserProfile;
  banks: BankAccount[];
  transactions: Transaction[];
  contacts: Contact[];
  notifications: NotificationItem[];
  onNavigate: (screen: AppScreen) => void;
  onSelectTransaction: (tx: Transaction) => void;
  onQuickPayContact: (contact: Contact) => void;
  onOpenNotifications: () => void;
  onOpenMyQr: () => void;
  onAddMoney: (amount: number) => void;
  onOpenSplitBill: () => void;
  onOpenOffers: () => void;
  onSelectDeal: (deal: DealOffer) => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  user,
  banks,
  transactions,
  contacts,
  notifications,
  onNavigate,
  onSelectTransaction,
  onQuickPayContact,
  onOpenNotifications,
  onOpenMyQr,
  onAddMoney,
  onOpenSplitBill,
  onOpenOffers,
  onSelectDeal,
}) => {
  const [showBalance, setShowBalance] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const [showAddMoneyModal, setShowAddMoneyModal] = useState(false);
  const [showSoundTesterModal, setShowSoundTesterModal] = useState(false);
  const [customAddAmount, setCustomAddAmount] = useState('1000');

  const primaryBank = banks.find((b) => b.isPrimary) || banks[0];
  const unreadNotifsCount = notifications.filter((n) => !n.read).length;

  const handleRefreshBalance = () => {
    sounds.playKeypadClick();
    setIsRefreshingBalance(true);
    setTimeout(() => {
      setIsRefreshingBalance(false);
    }, 600);
  };

  const handleAddMoneySubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanStr = customAddAmount.replace(/[^0-9.]/g, '');
    const val = parseFloat(cleanStr);
    if (!isNaN(val) && val > 0) {
      onAddMoney(val);
      setShowAddMoneyModal(false);
      setCustomAddAmount('1000');
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white pb-32 sm:pb-36 overflow-y-auto no-scrollbar">
      <StatusBar dark={false} />

      {/* Top Bar: Profile avatar + Greeting + Action Icons */}
      <div className="px-5 pt-2 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              type="button"
              onClick={() => onNavigate('profile')}
              className="w-10 h-10 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white flex items-center justify-center font-bold text-sm shadow-md shadow-[#5B3DF5]/30 hover:scale-105 active:scale-95 transition-transform"
            >
              {user.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
            </button>
            <img
              src="./logo.svg"
              alt="Super Pay"
              className="absolute -bottom-1 -right-1 w-4.5 h-4.5 rounded-full ring-2 ring-white dark:ring-[#0E0E12] shadow-xs"
            />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#5B3DF5] dark:text-[#8B7CFA] bg-[#5B3DF5]/10 px-1.5 py-0.5 rounded-md">
                Super Pay
              </span>
            </div>
            <h2 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
              {user.name} 👋
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Sound preview / test button */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setShowSoundTesterModal(true);
            }}
            aria-label="Test Sounds"
            title="UPI Sound Effects (Preview)"
            className="w-9 h-9 rounded-full bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-[#5B3DF5] flex items-center justify-center shadow-xs hover:bg-slate-50 transition-colors"
          >
            <Volume2 className="w-4 h-4" />
          </button>

          {/* Personal QR button */}
          <button
            type="button"
            onClick={onOpenMyQr}
            aria-label="View My QR Code"
            className="w-9 h-9 rounded-full bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs hover:bg-slate-50 transition-colors"
          >
            <QrCode className="w-4 h-4" />
          </button>

          {/* Notifications bell */}
          <button
            type="button"
            onClick={onOpenNotifications}
            aria-label="Notifications"
            className="w-9 h-9 rounded-full bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shadow-xs relative hover:bg-slate-50 transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-[#FF4D4F] ring-2 ring-white dark:ring-[#1A1A20]" />
            )}
          </button>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {/* ========================================================================= */}
        {/* HERO BALANCE CARD (Vibrant Gradient, super.money inspired)                 */}
        {/* ========================================================================= */}
        <div className="relative rounded-3xl p-5 text-white bg-gradient-to-br from-[#6C4CFA] via-[#7F53FB] to-[#A16CFF] shadow-xl shadow-[#5B3DF5]/25 overflow-hidden">
          {/* Subtle geometric circles in background */}
          <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-white/10 blur-xl pointer-events-none" />
          <div className="absolute -top-12 -left-12 w-32 h-32 rounded-full bg-white/10 blur-lg pointer-events-none" />

          {/* Card Top Row: Bank Info & Eye Toggle */}
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-white/20 text-[11px] font-bold tracking-wide backdrop-blur-xs">
                {primaryBank?.bankName || 'HDFC Bank'}
              </span>
              <span className="text-[11px] opacity-80 font-mono">
                {primaryBank?.accountNumberMasked || 'XXXXXX4829'}
              </span>
            </div>

            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setShowBalance(!showBalance);
              }}
              className="p-1.5 rounded-full hover:bg-white/15 transition-colors"
              aria-label={showBalance ? 'Hide balance' : 'Show balance'}
            >
              {showBalance ? <Eye className="w-4 h-4 opacity-90" /> : <EyeOff className="w-4 h-4 opacity-90" />}
            </button>
          </div>

          {/* Card Middle: Balance Display */}
          <div className="relative z-10 mt-3 mb-4">
            <span className="text-xs uppercase font-medium tracking-wider opacity-80">
              Total Account Balance
            </span>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-3xl sm:text-4xl font-extrabold font-mono tabular-nums tracking-tight">
                {showBalance
                  ? `₹${(primaryBank?.balance || 0).toLocaleString('en-IN', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}`
                  : '••••••••'}
              </span>

              <button
                type="button"
                onClick={handleRefreshBalance}
                aria-label="Refresh balance"
                className={`p-1 rounded-full hover:bg-white/15 transition-transform ${
                  isRefreshingBalance ? 'animate-spin' : ''
                }`}
              >
                <RefreshCw className="w-4 h-4 opacity-80" />
              </button>
            </div>
            <p className="text-[11px] opacity-75 font-mono mt-0.5">
              UPI ID: {user.upiId || primaryBank?.upiId}
            </p>
          </div>

          {/* Card Bottom: Quick Actions */}
          <div className="relative z-10 pt-3 border-t border-white/20 flex items-center gap-2">
            <button
              type="button"
              onClick={() => setShowAddMoneyModal(true)}
              className="flex-1 py-2 px-3 rounded-full bg-white text-[#5B3DF5] font-bold text-xs flex items-center justify-center gap-1.5 shadow-md active:scale-95 transition-transform hover:bg-white/95"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Money
            </button>

            <button
              type="button"
              onClick={() => onNavigate('send')}
              className="flex-1 py-2 px-3 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-xs text-white font-bold text-xs flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
            >
              <Send className="w-3.5 h-3.5" />
              Send Money
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUPER CASHBACK HIGHLIGHT BANNER (super.money core differentiator)         */}
        {/* ========================================================================= */}
        <div
          onClick={onOpenOffers}
          className="p-3.5 rounded-2xl bg-emerald-500/10 dark:bg-emerald-950/30 border border-emerald-500/25 flex items-center justify-between cursor-pointer hover:bg-emerald-500/15 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#1DB954] text-white flex items-center justify-center shrink-0 shadow-sm shadow-emerald-500/30">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <p className="text-xs font-bold text-emerald-800 dark:text-emerald-300">
                Flat 5% Instant Real Cashback Deals
              </p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400">
                Direct to your bank on merchant QR scans. No scratch cards.
              </p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-emerald-600 shrink-0" />
        </div>

        {/* ========================================================================= */}
        {/* QUICK ACTIONS GRID                                                        */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs">
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              UPI Payments & Services
            </span>
          </div>

          <div className="grid grid-cols-4 gap-2 text-center">
            {/* Action 1: Scan & Pay */}
            <button
              type="button"
              onClick={() => onNavigate('scan')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white flex items-center justify-center shadow-md shadow-[#5B3DF5]/30">
                <QrCode className="w-6 h-6" />
              </div>
              <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200">
                Scan QR
              </span>
            </button>

            {/* Action 2: To Contact */}
            <button
              type="button"
              onClick={() => onNavigate('send')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 text-[#5B3DF5] flex items-center justify-center">
                <Send className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                To Contact
              </span>
            </button>

            {/* Action 3: Recharge */}
            <button
              type="button"
              onClick={() => onNavigate('recharge')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 text-amber-600 flex items-center justify-center">
                <Smartphone className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Recharge
              </span>
            </button>

            {/* Action 4: Bill Pay */}
            <button
              type="button"
              onClick={() => onNavigate('billpay')}
              className="flex flex-col items-center gap-1.5 p-2 rounded-2xl hover:bg-slate-50 dark:hover:bg-slate-800/60 transition-colors"
            >
              <div className="w-12 h-12 rounded-2xl bg-rose-50 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200">
                Bill Pay
              </span>
            </button>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* SUPER.MONEY FLAGSHIP CARDS: SUPERCARD & SUPERFD                           */}
        {/* ========================================================================= */}
        <div className="grid grid-cols-2 gap-3">
          {/* superCard Card */}
          <div
            onClick={() => onNavigate('supercard')}
            className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white cursor-pointer hover:scale-[1.02] active:scale-98 transition-transform shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-[#5B3DF5] flex items-center justify-center text-xs font-black">
                  S
                </div>
                <span className="px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold text-[9px]">
                  5% Cash
                </span>
              </div>
              <h4 className="text-xs font-bold">superCard</h4>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                Limit ₹1,00,000
              </p>
            </div>
            <p className="text-[10px] text-[#8B7CFA] font-semibold mt-3 flex items-center gap-0.5">
              RuPay UPI Credit <ChevronRight className="w-3 h-3" />
            </p>
          </div>

          {/* superFD Card */}
          <div
            onClick={() => onNavigate('superfd')}
            className="p-4 rounded-3xl bg-gradient-to-br from-slate-900 to-emerald-950 text-white cursor-pointer hover:scale-[1.02] active:scale-98 transition-transform shadow-md flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-600 flex items-center justify-center text-xs font-black">
                  %
                </div>
                <span className="px-1.5 py-0.5 rounded bg-white/20 text-white font-bold text-[9px]">
                  9.5% p.a.
                </span>
              </div>
              <h4 className="text-xs font-bold">superFD</h4>
              <p className="text-[10px] text-slate-300 font-mono mt-0.5">
                RBI Insured ₹5L
              </p>
            </div>
            <p className="text-[10px] text-emerald-400 font-semibold mt-3 flex items-center gap-0.5">
              Instant Booking <ChevronRight className="w-3 h-3" />
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* FREQUENT CONTACTS & SPLIT BILL ROW                                        */}
        {/* ========================================================================= */}
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Quick Pay & Split
            </span>
            <button
              type="button"
              onClick={onOpenSplitBill}
              className="text-xs font-bold text-[#5B3DF5] flex items-center gap-1 hover:underline"
            >
              <Users className="w-3.5 h-3.5" />
              Split Bill
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
            {contacts.map((contact) => (
              <button
                key={contact.id}
                type="button"
                onClick={() => onQuickPayContact(contact)}
                className="flex flex-col items-center gap-1 shrink-0 p-1 group"
              >
                <div
                  className={`w-13 h-13 rounded-full ${contact.avatarBg} text-white font-bold text-sm flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform`}
                >
                  {contact.initials}
                </div>
                <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-16 truncate text-center">
                  {contact.name.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RECENT TRANSACTIONS LIST                                                  */}
        {/* ========================================================================= */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Recent Transactions
            </span>
            <button
              type="button"
              onClick={() => onNavigate('history')}
              className="text-xs font-bold text-[#5B3DF5] hover:underline"
            >
              History
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {transactions.slice(0, 5).map((tx) => {
              const isDebit = tx.type === 'debit';
              const isFailed = tx.status === 'FAILED';
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="py-2.5 flex items-center justify-between cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition-colors gap-2"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div
                      className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
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

                    <div className="text-xs min-w-0 flex-1">
                      <p className="font-bold text-slate-900 dark:text-white truncate">
                        {tx.title}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate">
                        <span className="truncate">{tx.note || tx.subtitle}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <p
                      className={`font-mono font-bold text-xs tabular-nums ${
                        isFailed
                          ? 'text-red-500 line-through'
                          : isDebit
                          ? 'text-slate-900 dark:text-white'
                          : 'text-[#1DB954]'
                      }`}
                    >
                      {isFailed ? `₹${tx.amount.toLocaleString('en-IN')}` : `${isDebit ? '-' : '+'}₹${tx.amount.toLocaleString('en-IN')}`}
                    </p>
                    {isFailed ? (
                      <span className="text-[9px] font-bold text-red-500 block">
                        Failed
                      </span>
                    ) : tx.cashback > 0 ? (
                      <span className="text-[10px] font-semibold text-[#1DB954] flex items-center justify-end gap-0.5">
                        <Sparkles className="w-2.5 h-2.5 fill-current" />
                        +₹{tx.cashback.toFixed(0)} cash
                      </span>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE OFFERS CAROUSEL                                               */}
        {/* ========================================================================= */}
        <div className="space-y-2 pb-2">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Cashback Deals
            </span>
            <button
              type="button"
              onClick={onOpenOffers}
              className="text-xs font-bold text-[#5B3DF5] hover:underline"
            >
              See all
            </button>
          </div>

          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-2">
            {DEAL_OFFERS.map((deal) => (
              <div
                key={deal.id}
                onClick={() => onSelectDeal(deal)}
                className={`w-64 p-4 rounded-3xl bg-gradient-to-br ${deal.bannerBg} text-white shrink-0 shadow-sm cursor-pointer hover:scale-[1.02] active:scale-98 transition-transform`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                    {deal.tag}
                  </span>
                  <span className="text-lg">{deal.logo}</span>
                </div>
                <h4 className="text-sm font-bold mt-1">{deal.title}</h4>
                <p className="text-[11px] text-slate-200 mt-0.5">
                  {deal.highlight}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add Money Modal */}
      {showAddMoneyModal && (
        <div className="fixed sm:absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="w-full max-w-[20rem] bg-white dark:bg-[#1A1A20] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Add Money to Bank
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Simulate instant bank transfer top-up
            </p>

            <form onSubmit={handleAddMoneySubmit} noValidate className="mt-4 space-y-3">
              <div className="flex items-center justify-center gap-1 text-2xl font-bold font-mono">
                <span>₹</span>
                <input
                  type="number"
                  inputMode="decimal"
                  min="1"
                  step="any"
                  value={customAddAmount}
                  onChange={(e) => setCustomAddAmount(e.target.value)}
                  className="w-32 text-center bg-transparent border-b-2 border-[#5B3DF5] outline-none text-slate-900 dark:text-white font-mono"
                  autoFocus
                  placeholder="100"
                />
              </div>

              <div className="flex justify-center gap-1.5 pt-2 flex-wrap">
                {[100, 500, 1000, 2000, 5000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => {
                      sounds.playKeypadClick();
                      setCustomAddAmount(amt.toString());
                    }}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors cursor-pointer"
                  >
                    +₹{amt}
                  </button>
                ))}
              </div>

              <div className="pt-4 flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddMoneyModal(false)}
                  className="flex-1 py-2.5 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 cursor-pointer hover:bg-slate-200"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleAddMoneySubmit()}
                  disabled={!customAddAmount || parseFloat(customAddAmount) <= 0}
                  className="flex-1 py-2.5 rounded-full text-xs font-bold text-white bg-gradient-to-r from-[#5B3DF5] to-[#8B7CFA] shadow-md shadow-[#5B3DF5]/30 cursor-pointer hover:opacity-95 disabled:opacity-40 transition-all active:scale-95"
                >
                  Add Now
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sound Effects Preview Modal */}
      {showSoundTesterModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A20] rounded-3xl p-5 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center">
                  <Volume2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    UPI Sound Effects Preview
                  </h3>
                  <p className="text-[11px] text-slate-400">Tap to test alert tones</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowSoundTesterModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2.5">
              {/* Success Sound */}
              <button
                type="button"
                onClick={() => {
                  sounds.enabled = true;
                  sounds.playPaymentSuccess();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-between transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <div>
                    <p className="text-sm font-bold leading-tight">Payment Success ▶</p>
                    <p className="text-[11px] opacity-75 font-normal">Authentic UPI Chime (~4s)</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>

              {/* Failure Sound */}
              <button
                type="button"
                onClick={() => {
                  sounds.enabled = true;
                  sounds.playPaymentFailure();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-between transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <div>
                    <p className="text-sm font-bold leading-tight">Payment Failure ▶</p>
                    <p className="text-[11px] opacity-75 font-normal">Decline / Error Alert (~1.2s)</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-rose-500 text-white flex items-center justify-center shadow-xs">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>

              {/* Initiate Sound */}
              <button
                type="button"
                onClick={() => {
                  sounds.enabled = true;
                  sounds.playPaymentInitiate();
                }}
                className="w-full py-3 px-3.5 rounded-2xl bg-[#5B3DF5]/10 hover:bg-[#5B3DF5]/20 border border-[#5B3DF5]/30 text-[#5B3DF5] dark:text-[#A16CFF] text-xs font-bold flex items-center justify-between transition-all active:scale-98 cursor-pointer"
              >
                <div className="flex items-center gap-2.5 text-left">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#5B3DF5]" />
                  <div>
                    <p className="text-sm font-bold leading-tight">Transaction Initiate ▶</p>
                    <p className="text-[11px] opacity-75 font-normal">Subtle Confirmation Tone (~0.2s)</p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-full bg-[#5B3DF5] text-white flex items-center justify-center shadow-xs">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </button>
            </div>

            <p className="text-[10px] text-slate-400 text-center pt-1">
              💡 These tones play automatically during payments. You can also upload custom audio files in Profile settings.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
