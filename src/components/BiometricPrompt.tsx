import React, { useState } from 'react';
import { Fingerprint } from 'lucide-react';
import { sounds } from '../services/audio';

interface BiometricPromptProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  title?: string;
  subtitle?: string;
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  title = 'Verify your identity',
  subtitle = 'Touch the fingerprint sensor or look at the screen',
}) => {
  const [isVerifying, setIsVerifying] = useState(false);
  const [successAnim, setSuccessAnim] = useState(false);

  if (!isOpen) return null;

  const handleTouchSensor = () => {
    if (isVerifying) return;
    setIsVerifying(true);
    sounds.playKeypadClick();

    setTimeout(() => {
      setSuccessAnim(true);
      sounds.playBiometricUnlock();
      setTimeout(() => {
        setIsVerifying(false);
        setSuccessAnim(false);
        onSuccess();
      }, 500);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a20] rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800 flex flex-col items-center">
        {/* Android bottom sheet drag handle */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-4" />

        <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center">
          {title}
        </h3>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 text-center">
          {subtitle}
        </p>

        {/* Interactive Fingerprint Sensor Area */}
        <div className="my-8 relative flex items-center justify-center">
          {/* Animated concentric ripples */}
          <div className="absolute w-28 h-28 rounded-full bg-[#5B3DF5]/10 animate-ping opacity-60" />
          <div className="absolute w-24 h-24 rounded-full bg-[#5B3DF5]/15 animate-pulse" />

          <button
            type="button"
            onClick={handleTouchSensor}
            className={`relative z-10 w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              successAnim
                ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/40'
                : isVerifying
                ? 'bg-[#5B3DF5] text-white scale-105'
                : 'bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white hover:scale-105 active:scale-95 shadow-[#5B3DF5]/30'
            }`}
          >
            <Fingerprint className={`w-10 h-10 ${isVerifying ? 'animate-pulse' : ''}`} />
          </button>
        </div>

        <p className="text-xs font-medium text-slate-400 text-center animate-pulse">
          Tap the sensor above to simulate Android Biometrics
        </p>

        <button
          type="button"
          onClick={onCancel}
          className="mt-6 w-full py-3 rounded-full text-sm font-semibold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
        >
          Use PIN instead
        </button>
      </div>
    </div>
  );
};
