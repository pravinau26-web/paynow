import React, { useState } from 'react';
import { Smartphone, Monitor, Volume2, VolumeX, Lock, ZoomIn, ZoomOut, Sun, Moon } from 'lucide-react';
import { sounds } from '../services/audio';
import { ThemeMode } from '../services/theme';

interface AndroidFrameProps {
  children: React.ReactNode;
  onLockApp?: () => void;
  isLocked?: boolean;
  themeMode?: ThemeMode;
  onToggleThemeMode?: () => void;
}

export const AndroidFrame: React.FC<AndroidFrameProps> = ({
  children,
  onLockApp,
  isLocked = false,
  themeMode = 'system',
  onToggleThemeMode,
}) => {
  const [deviceFrameMode, setDeviceFrameMode] = useState<boolean>(true);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [scale, setScale] = useState<number>(1);

  const toggleSound = () => {
    sounds.enabled = !sounds.enabled;
    setSoundEnabled(sounds.enabled);
  };

  const cycleScale = () => {
    sounds.playKeypadClick();
    if (scale === 1) setScale(0.9);
    else if (scale === 0.9) setScale(0.82);
    else setScale(1);
  };

  return (
    <div className="min-h-screen w-full bg-[#0a0b0e] flex flex-col items-center justify-center relative overflow-x-hidden selection:bg-[#5B3DF5]/30 selection:text-white">
      {/* Top Device Bar (Floating Developer / Showcase Controls - Desktop only) */}
      <header className="w-full max-w-4xl py-2 px-4 hidden sm:flex items-center justify-between z-40 text-xs text-slate-300">
        <div className="flex items-center gap-2.5">
          <img
            src="./logo.svg"
            alt="Super Pay Logo"
            className="w-7 h-7 rounded-lg shadow-md shadow-[#5B3DF5]/40 object-contain ring-1 ring-[#5B3DF5]/50"
          />
          <div className="flex items-baseline gap-2">
            <span className="font-bold tracking-tight text-white text-sm hidden sm:inline">
              Super Pay
            </span>
            <span className="text-[11px] text-slate-400 hidden md:inline">
              Next-Gen UPI Payments · Super Cashback
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom scale toggle for laptop screens */}
          <button
            type="button"
            onClick={cycleScale}
            aria-label="Adjust zoom scale"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Adjust phone scale for laptop view"
          >
            {scale === 1 ? <ZoomOut className="w-3.5 h-3.5 text-slate-400" /> : <ZoomIn className="w-3.5 h-3.5 text-[#8B7CFA]" />}
            <span className="text-[11px]">{Math.round(scale * 100)}%</span>
          </button>

          {/* Audio toggle */}
          <button
            type="button"
            onClick={toggleSound}
            aria-label="Toggle tactile sound"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
            title="Toggle app sounds (keypad clicks & chimes)"
          >
            {soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-emerald-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="text-[11px] hidden sm:inline">{soundEnabled ? 'Audio On' : 'Muted'}</span>
          </button>

          {/* Quick Lock / Unlock switch */}
          {onLockApp && !isLocked && (
            <button
              type="button"
              onClick={onLockApp}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              title="Lock app with PIN"
            >
              <Lock className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[11px] hidden sm:inline">Lock Screen</span>
            </button>
          )}

          {/* Theme Mode Quick Switch */}
          {onToggleThemeMode && (
            <button
              type="button"
              onClick={onToggleThemeMode}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              title={`Current theme: ${themeMode}. Click to toggle.`}
            >
              {themeMode === 'dark' ? (
                <Moon className="w-3.5 h-3.5 text-[#A16CFF]" />
              ) : themeMode === 'light' ? (
                <Sun className="w-3.5 h-3.5 text-amber-400" />
              ) : (
                <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
              )}
              <span className="text-[11px] capitalize hidden sm:inline">
                {themeMode === 'system' ? 'Auto Theme' : `${themeMode} Theme`}
              </span>
            </button>
          )}

          {/* Device Frame vs Full Screen Toggle */}
          <button
            type="button"
            onClick={() => setDeviceFrameMode(!deviceFrameMode)}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-[#5B3DF5]/20 hover:bg-[#5B3DF5]/30 text-[#8B7CFA] border border-[#5B3DF5]/40 transition-colors"
          >
            {deviceFrameMode ? (
              <>
                <Monitor className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Fit View</span>
              </>
            ) : (
              <>
                <Smartphone className="w-3.5 h-3.5" />
                <span className="text-[11px] font-medium">Android Phone Frame</span>
              </>
            )}
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="w-full flex-1 flex items-center justify-center p-0 sm:p-2">
        <div
          style={{
            transform: scale !== 1 ? `scale(${scale})` : undefined,
            transformOrigin: 'top center',
            transition: 'transform 0.2s ease',
          }}
          className="w-full flex justify-center"
        >
          {deviceFrameMode ? (
            /* Android Smartphone Bezel Chassis */
            <div className="relative w-full max-w-[27rem] h-[100dvh] sm:h-[min(54rem,calc(100dvh-3rem))] bg-black sm:rounded-[3rem] p-0 sm:p-[0.65rem] shadow-[0_25px_70px_rgba(91,61,245,0.25)] sm:ring-1 sm:ring-slate-800 flex flex-col overflow-hidden">
              {/* Outer phone rim buttons (pure decorative physical accents) */}
              <div className="hidden sm:block absolute -left-[2px] top-[9rem] w-[3px] h-[3rem] bg-slate-700 rounded-l-sm" />
              <div className="hidden sm:block absolute -left-[2px] top-[13rem] w-[3px] h-[3rem] bg-slate-700 rounded-l-sm" />
              <div className="hidden sm:block absolute -right-[2px] top-[10.5rem] w-[3px] h-[4rem] bg-slate-700 rounded-r-sm" />

              {/* Inner screen glass */}
              <div className="w-full h-full bg-[#FAFAFC] dark:bg-[#0E0E12] sm:rounded-[2.4rem] flex flex-col overflow-hidden relative shadow-inner">
                {/* Screen Content */}
                <div className="flex-1 flex flex-col overflow-hidden relative">
                  {children}
                </div>

                {/* Android Gesture Bar */}
                <div className="w-full py-1 flex justify-center bg-transparent pointer-events-none select-none shrink-0 z-30">
                  <div className="w-24 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
                </div>
              </div>
            </div>
          ) : (
            /* Responsive Viewport */
            <div className="w-full max-w-[27rem] h-[100dvh] sm:h-[min(54rem,calc(100dvh-3rem))] bg-[#FAFAFC] dark:bg-[#0E0E12] sm:rounded-[2rem] shadow-2xl flex flex-col overflow-hidden relative border border-slate-200 dark:border-slate-800">
              <div className="flex-1 flex flex-col overflow-hidden relative">
                {children}
              </div>
              {/* Android Gesture Bar */}
              <div className="w-full py-1 flex justify-center bg-transparent pointer-events-none select-none shrink-0 z-30">
                <div className="w-24 h-1 bg-slate-400 dark:bg-slate-600 rounded-full" />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

