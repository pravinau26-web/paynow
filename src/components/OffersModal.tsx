import React from 'react';
import { ArrowRight, QrCode, Sparkles, Tag, X } from 'lucide-react';
import { sounds } from '../services/audio';
import { DealOffer } from '../types';
import { DEAL_OFFERS } from '../services/mockData';

interface OffersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDeal: (deal: DealOffer) => void;
}

export const OffersModal: React.FC<OffersModalProps> = ({
  isOpen,
  onClose,
  onSelectDeal,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed sm:absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-[22rem] bg-white dark:bg-[#1A1A20] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[85vh] sm:max-h-[38rem] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm font-bold flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-emerald-500 fill-current" />
              Super Cashback Deals
            </h3>
            <p className="text-[11px] text-slate-400">Direct-to-bank cash discounts</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3">
          {DEAL_OFFERS.map((deal) => (
            <div
              key={deal.id}
              className={`p-4 rounded-3xl bg-gradient-to-br ${deal.bannerBg} text-white shadow-md space-y-3`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2.5">
                  <span className="text-2xl">{deal.logo}</span>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-300">
                      {deal.tag}
                    </span>
                    <h4 className="text-sm font-black">{deal.brand}</h4>
                  </div>
                </div>

                <span className="px-2 py-0.5 rounded-full bg-white/20 text-[10px] font-black tracking-wide">
                  {deal.cashbackPercent}% CASH
                </span>
              </div>

              <div>
                <p className="text-xs font-bold text-slate-100">{deal.title}</p>
                <p className="text-[11px] text-slate-300 mt-0.5">{deal.highlight}</p>
              </div>

              <div className="pt-2 border-t border-white/10 flex items-center justify-between">
                <span className="text-[10px] text-slate-300">Scan & Pay at Store</span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    onSelectDeal(deal);
                    onClose();
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-white text-slate-900 font-bold text-xs flex items-center gap-1 hover:bg-slate-100 transition-colors shadow-xs"
                >
                  <QrCode className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  Pay at {deal.brand}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
