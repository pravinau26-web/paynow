import React, { useState } from 'react';
import { ArrowLeft, Check, ChevronDown, Radio, Search, Sparkles, Zap } from 'lucide-react';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { Contact, RechargePlan } from '../types';
import { OPERATOR_PLANS } from '../services/mockData';

interface RechargeScreenProps {
  onBack: () => void;
  contacts: Contact[];
  onSelectPlanToPay: (plan: RechargePlan, phone: string, operator: string) => void;
}

export const RechargeScreen: React.FC<RechargeScreenProps> = ({
  onBack,
  contacts,
  onSelectPlanToPay,
}) => {
  const [phone, setPhone] = useState('98765 43210');
  const [operator, setOperator] = useState<'Jio' | 'Airtel' | 'Vi'>('Jio');
  const [circle, setCircle] = useState('Karnataka & Bangalore');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchFilter, setSearchFilter] = useState('');

  const plans = OPERATOR_PLANS[operator] || OPERATOR_PLANS['Jio'];

  const filteredPlans = plans.filter((p) => {
    if (selectedCategory !== 'All' && p.category !== selectedCategory) return false;
    if (searchFilter && !p.price.toString().includes(searchFilter) && !p.description.toLowerCase().includes(searchFilter.toLowerCase())) {
      return false;
    }
    return true;
  });

  const categories = ['All', 'Popular', '5G Unlimited', 'Entertainment', 'Annual'];

  const handlePickContact = (c: Contact) => {
    sounds.playKeypadClick();
    setPhone(c.phone.replace('+91 ', ''));
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white pb-32 sm:pb-36 overflow-y-auto no-scrollbar select-none">
      <StatusBar dark={false} />

      {/* Top App Bar */}
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
          <h2 className="text-sm font-bold">Mobile Recharge</h2>
          <p className="text-[10px] text-emerald-600 font-semibold flex items-center justify-center gap-1">
            <Sparkles className="w-3 h-3 fill-current" />
            Flat 5% Instant Real Cashback
          </p>
        </div>
        <div className="w-10" />
      </div>

      <div className="p-5 space-y-4">
        {/* Mobile Number & Operator Selector Card */}
        <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Mobile Number
            </span>
            <div className="flex items-center gap-2 mt-1">
              <span className="font-bold text-sm text-slate-500">🇮🇳 +91</span>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ''))}
                placeholder="Enter 10 digit number"
                className="flex-1 bg-transparent text-base font-bold font-mono outline-none text-slate-900 dark:text-white"
              />
            </div>
          </div>

          {/* Operator Pills */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
            <span className="text-slate-400 font-medium">Operator:</span>
            <div className="flex items-center gap-1.5">
              {(['Jio', 'Airtel', 'Vi'] as const).map((op) => (
                <button
                  key={op}
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    setOperator(op);
                  }}
                  className={`px-3 py-1 rounded-full font-bold text-xs transition-all ${
                    operator === op
                      ? 'bg-[#5B3DF5] text-white shadow-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                  }`}
                >
                  {op}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400">
            <span>Circle: <strong className="text-slate-700 dark:text-slate-300">{circle}</strong></span>
            <button
              type="button"
              onClick={() => {
                const nextCircle = circle.includes('Karnataka') ? 'Tamil Nadu & Chennai' : 'Karnataka & Bangalore';
                setCircle(nextCircle);
              }}
              className="text-[#5B3DF5] font-semibold hover:underline"
            >
              Change Circle
            </button>
          </div>
        </div>

        {/* Quick Pick Contacts Row */}
        <div>
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Recharge for Contacts
          </span>
          <div className="flex items-center gap-2 mt-1.5 overflow-x-auto no-scrollbar pb-1">
            {contacts.slice(0, 5).map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => handlePickContact(c)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 shrink-0 text-xs font-semibold hover:border-[#5B3DF5] transition-colors"
              >
                <div className={`w-4 h-4 rounded-full ${c.avatarBg} text-[9px] text-white flex items-center justify-center font-bold`}>
                  {c.initials}
                </div>
                <span>{c.name.split(' ')[0]}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Plan Category Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setSelectedCategory(cat);
              }}
              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900'
                  : 'bg-white dark:bg-[#1A1A20] text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Plans List */}
        <div className="space-y-3">
          {filteredPlans.map((plan) => (
            <div
              key={plan.id}
              className="p-4 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200/80 dark:border-slate-800/80 shadow-xs hover:border-[#5B3DF5]/60 transition-all flex flex-col justify-between gap-3"
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl font-black font-mono tracking-tight text-slate-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold text-[10px] flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 fill-current" />
                      +₹{plan.cashback.toFixed(2)} Cashback
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    onSelectPlanToPay(plan, phone, operator);
                  }}
                  className="px-4 py-2 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white text-xs font-bold shadow-md shadow-[#5B3DF5]/30 hover:opacity-95 active:scale-95 transition-all shrink-0"
                >
                  Recharge
                </button>
              </div>

              {/* Badges row */}
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500 font-mono">
                <span>Validity: <strong className="text-slate-700 dark:text-slate-300">{plan.validity}</strong></span>
                <span>Data: <strong className="text-slate-700 dark:text-slate-300">{plan.data}</strong></span>
                <span>Voice: <strong className="text-slate-700 dark:text-slate-300">{plan.voice}</strong></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
