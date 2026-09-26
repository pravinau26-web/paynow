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
    <div className="fixed sm:absolute bottom-0 left-0 right-0 z-30 pointer-events-none flex justify-center pb-3 px-3">
      {/* Floating pill navigation bar */}
      <nav
        aria-label="App Navigation"
        className="pointer-events-auto w-full max-w-[22rem] h-14 bg-white/95 dark:bg-[#1A1A20]/95 backdrop-blur-md rounded-full shadow-2xl border border-slate-200/80 dark:border-slate-800/80 px-2.5 flex items-center justify-between"
      >
        {/* Tab 1: Home */}
        <button
          type="button"
          onClick={() => handleNav('home')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentScreen === 'home'
              ? 'text-[#5B3DF5]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Home className="w-4.5 h-4.5" strokeWidth={currentScreen === 'home' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Home</span>
        </button>

        {/* Tab 2: History */}
        <button
          type="button"
          onClick={() => handleNav('history')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentScreen === 'history'
              ? 'text-[#5B3DF5]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <History className="w-4.5 h-4.5" strokeWidth={currentScreen === 'history' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">History</span>
        </button>

        {/* Tab 3: Central Raised Scan & Pay FAB */}
        <div className="relative -top-4 flex items-center justify-center px-1">
          <button
            type="button"
            onClick={() => handleNav('scan')}
            aria-label="Scan & Pay"
            className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] text-white flex items-center justify-center shadow-xl shadow-[#5B3DF5]/40 hover:scale-105 active:scale-95 transition-transform ring-3 ring-white dark:ring-[#1A1A20] cursor-pointer"
          >
            <QrCode className="w-6 h-6" />
          </button>
        </div>

        {/* Tab 4: Rewards */}
        <button
          type="button"
          onClick={() => handleNav('rewards')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentScreen === 'rewards'
              ? 'text-[#5B3DF5]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <Gift className="w-4.5 h-4.5" strokeWidth={currentScreen === 'rewards' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Rewards</span>
        </button>

        {/* Tab 5: Profile */}
        <button
          type="button"
          onClick={() => handleNav('profile')}
          className={`flex flex-col items-center justify-center flex-1 h-full transition-colors cursor-pointer ${
            currentScreen === 'profile'
              ? 'text-[#5B3DF5]'
              : 'text-slate-400 hover:text-slate-600 dark:hover:text-slate-200'
          }`}
        >
          <User className="w-4.5 h-4.5" strokeWidth={currentScreen === 'profile' ? 2.5 : 2} />
          <span className="text-[10px] font-medium tracking-tight mt-0.5">Profile</span>
        </button>
      </nav>
    </div>
  );
};
