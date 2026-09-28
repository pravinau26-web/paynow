import React from 'react';
import { Gift, History, Home, QrCode, User } from 'lucide-react';
import { AppScreen } from '../types';
import { sounds } from '../services/audio';

interface BottomNavProps {
  currentScreen: AppScreen;
  onSelectScreen: (screen: AppScreen) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentScreen,
  onSelectScreen,
}) => {
  const handleNav = (screen: AppScreen) => {
    sounds.playKeypadClick();
    onSelectScreen(screen);
  };

  return (
    <div className="fixed bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-3 px-3">
      {/* Spacious, ergonomic bottom navigation bar */}
      <nav
        aria-label="App Navigation"
        className="pointer-events-auto w-full max-w-[25.5rem] h-[4.25rem] bg-white/98 dark:bg-[#15151D]/98 backdrop-blur-xl rounded-[1.75rem] shadow-[0_12px_32px_rgba(0,0,0,0.14)] dark:shadow-[0_14px_36px_rgba(0,0,0,0.55)] border border-slate-200/90 dark:border-slate-800/90 px-2 flex items-center justify-between select-none"
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer group ${
            currentScreen === 'home'
              ? 'text-[#5B3DF5] dark:text-[#8B7CFA] font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative flex flex-col items-center">
            <Home
              className="w-5.5 h-5.5 transition-transform group-hover:scale-105"
              strokeWidth={currentScreen === 'home' ? 2.5 : 2}
            />
            <span className="text-[11px] tracking-tight mt-1 leading-none">Home</span>
            {currentScreen === 'home' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-[#8B7CFA] mt-1 shadow-xs" />
            )}
          </div>
        </button>

        {/* Tab 2: History */}
        <button
          type="button"
          onClick={() => handleNav('history')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer group ${
            currentScreen === 'history'
              ? 'text-[#5B3DF5] dark:text-[#8B7CFA] font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative flex flex-col items-center">
            <History
              className="w-5.5 h-5.5 transition-transform group-hover:scale-105"
              strokeWidth={currentScreen === 'history' ? 2.5 : 2}
            />
            <span className="text-[11px] tracking-tight mt-1 leading-none">History</span>
            {currentScreen === 'history' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-[#8B7CFA] mt-1 shadow-xs" />
            )}
          </div>
        </button>

        {/* Tab 3: Central Elevated Super Scan & Pay FAB */}
        <div className="relative -top-5 flex flex-col items-center justify-center px-1">
          <button
            type="button"
            onClick={() => handleNav('scan')}
            aria-label="Scan & Pay"
            title="Scan any UPI QR Code"
            className="w-[3.75rem] h-[3.75rem] rounded-full bg-gradient-to-tr from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white flex items-center justify-center shadow-[0_8px_22px_rgba(91,61,245,0.48)] hover:shadow-[0_10px_26px_rgba(91,61,245,0.65)] hover:scale-105 active:scale-95 transition-all ring-4 ring-white dark:ring-[#15151D] cursor-pointer"
          >
            <QrCode className="w-7 h-7 drop-shadow-sm" strokeWidth={2.2} />
          </button>
        </div>

        {/* Tab 4: Rewards */}
        <button
          type="button"
          onClick={() => handleNav('rewards')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer group ${
            currentScreen === 'rewards'
              ? 'text-[#5B3DF5] dark:text-[#8B7CFA] font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative flex flex-col items-center">
            <Gift
              className="w-5.5 h-5.5 transition-transform group-hover:scale-105"
              strokeWidth={currentScreen === 'rewards' ? 2.5 : 2}
            />
            <span className="text-[11px] tracking-tight mt-1 leading-none">Rewards</span>
            {currentScreen === 'rewards' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-[#8B7CFA] mt-1 shadow-xs" />
            )}
          </div>
        </button>

        {/* Tab 5: Profile */}
        <button
          type="button"
          onClick={() => handleNav('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full py-1.5 transition-all cursor-pointer group ${
            currentScreen === 'profile'
              ? 'text-[#5B3DF5] dark:text-[#8B7CFA] font-bold'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <div className="relative flex flex-col items-center">
            <User
              className="w-5.5 h-5.5 transition-transform group-hover:scale-105"
              strokeWidth={currentScreen === 'profile' ? 2.5 : 2}
            />
            <span className="text-[11px] tracking-tight mt-1 leading-none">Profile</span>
            {currentScreen === 'profile' && (
              <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5] dark:bg-[#8B7CFA] mt-1 shadow-xs" />
            )}
          </div>
        </button>
      </nav>
    </div>
  );
};

