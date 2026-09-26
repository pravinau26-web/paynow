import React, { useState, useEffect, useCallback } from 'react';
import { Delete, Fingerprint } from 'lucide-react';
import { sounds } from '../services/audio';

interface PinPadProps {
  pinLength?: number;
  value: string;
  onChange: (pin: string) => void;
  onSubmit?: (pin: string) => void;
  isError?: boolean;
  onBiometricClick?: () => void;
  showBiometric?: boolean;
  disabled?: boolean;
}

export const PinPad: React.FC<PinPadProps> = ({
  pinLength = 4,
  value,
  onChange,
  onSubmit,
  isError = false,
  onBiometricClick,
  showBiometric = true,
  disabled = false,
}) => {
  const [activeKey, setActiveKey] = useState<string | null>(null);

  const handleKeyPress = useCallback(
    (num: string) => {
      if (disabled) return;
      sounds.playKeypadClick();
      setActiveKey(num);
      setTimeout(() => setActiveKey(null), 120);

      if (value.length < pinLength) {
        const nextVal = value + num;
        onChange(nextVal);
        if (nextVal.length === pinLength && onSubmit) {
          onSubmit(nextVal);
        }
      }
    },
    [disabled, value, pinLength, onChange, onSubmit]
  );

  const handleDelete = useCallback(() => {
    if (disabled || value.length === 0) return;
    sounds.playKeypadClick();
    onChange(value.slice(0, -1));
  }, [disabled, value, onChange]);

  // Physical keyboard listener for laptop users
  useEffect(() => {
    if (disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable)
      ) {
        // If a number, backspace, or enter is pressed, blur any background input so PIN pad works seamlessly
        if (/^[0-9]$/.test(e.key) || e.key === 'Backspace' || e.key === 'Enter') {
          target.blur();
        } else {
          return;
        }
      }

      if (/^[0-9]$/.test(e.key)) {
        e.preventDefault();
        handleKeyPress(e.key);
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Enter') {
        if (value.length === pinLength && onSubmit) {
          e.preventDefault();
          sounds.playKeypadClick();
          onSubmit(value);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [disabled, handleKeyPress, handleDelete, value, pinLength, onSubmit]);

  return (
    <div className="w-full flex flex-col items-center">
      {/* PIN Dots Display */}
      <div
        className={`flex items-center justify-center gap-4 py-4 ${
          isError ? 'animate-shake' : ''
        }`}
      >
        {Array.from({ length: pinLength }).map((_, idx) => {
          const isFilled = idx < value.length;
          return (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full transition-all duration-200 ${
                isError
                  ? 'bg-red-500 scale-110 shadow-sm shadow-red-500/50'
                  : isFilled
                  ? 'bg-[#5B3DF5] scale-125 shadow-md shadow-[#5B3DF5]/40 ring-2 ring-[#8B7CFA]/30'
                  : 'bg-slate-200 dark:bg-slate-700/80 border border-slate-300 dark:border-slate-600'
              }`}
            />
          );
        })}
      </div>

      {/* Numeric Keypad Grid */}
      <div className="grid grid-cols-3 gap-y-2 sm:gap-y-2.5 gap-x-4 sm:gap-x-5 w-full max-w-[16.5rem] mt-1 select-none">
        {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
          <button
            key={digit}
            type="button"
            disabled={disabled}
            onClick={() => handleKeyPress(digit)}
            className={`h-13 w-13 sm:h-14 sm:w-14 mx-auto rounded-full text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 active:bg-slate-200 dark:active:bg-slate-800 ${
              activeKey === digit
                ? 'bg-slate-200 dark:bg-slate-800 scale-95 ring-2 ring-[#5B3DF5]'
                : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
            }`}
          >
            {digit}
          </button>
        ))}

        {/* Bottom row: Biometric or empty, 0, Backspace */}
        <div className="h-13 w-13 sm:h-14 sm:w-14 mx-auto flex items-center justify-center">
          {showBiometric && onBiometricClick ? (
            <button
              type="button"
              disabled={disabled}
              onClick={() => {
                sounds.playKeypadClick();
                onBiometricClick();
              }}
              aria-label="Use Biometric Unlock"
              className="h-12 w-12 rounded-full text-[#5B3DF5] hover:bg-[#5B3DF5]/10 flex items-center justify-center transition-transform active:scale-90 cursor-pointer"
            >
              <Fingerprint className="w-7 h-7" />
            </button>
          ) : (
            <div />
          )}
        </div>

        <button
          type="button"
          disabled={disabled}
          onClick={() => handleKeyPress('0')}
          className={`h-13 w-13 sm:h-14 sm:w-14 mx-auto rounded-full text-xl sm:text-2xl font-semibold text-slate-800 dark:text-slate-100 flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 active:bg-slate-200 dark:active:bg-slate-800 ${
            activeKey === '0'
              ? 'bg-slate-200 dark:bg-slate-800 scale-95 ring-2 ring-[#5B3DF5]'
              : 'hover:bg-slate-100 dark:hover:bg-slate-800/60'
          }`}
        >
          0
        </button>

        <button
          type="button"
          disabled={disabled}
          onClick={handleDelete}
          aria-label="Delete"
          className="h-13 w-13 sm:h-14 sm:w-14 mx-auto rounded-full text-slate-600 dark:text-slate-300 flex items-center justify-center cursor-pointer transition-all duration-150 active:scale-90 hover:bg-slate-100 dark:hover:bg-slate-800/60"
        >
          <Delete className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>
    </div>
  );
};
