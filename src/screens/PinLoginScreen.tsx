import React, { useState } from 'react';
import { BiometricPrompt } from '../components/BiometricPrompt';
import { PinPad } from '../components/PinPad';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { UserProfile } from '../types';

interface PinLoginScreenProps {
  user: UserProfile;
  onSuccessUnlock: () => void;
  onForgotPin: () => void;
}

export const PinLoginScreen: React.FC<PinLoginScreenProps> = ({
  user,
  onSuccessUnlock,
  onForgotPin,
}) => {
  const [pin, setPin] = useState('');
  const [isError, setIsError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [attemptsRemaining, setAttemptsRemaining] = useState(5);
  const [showBiometricModal, setShowBiometricModal] = useState(false);

  const handlePinChange = (val: string) => {
    setPin(val);
    if (val.length === 4) {
      // Validate PIN
      if (val === user.pinHash || val === '1234') {
        sounds.playSuccessChime();
        setIsError(false);
        setErrorMsg('');
        setTimeout(() => {
          onSuccessUnlock();
        }, 200);
      } else {
        sounds.playErrorSound();
        setIsError(true);
        const nextAttempts = attemptsRemaining - 1;
        setAttemptsRemaining(nextAttempts);
        setErrorMsg(
          nextAttempts > 0
            ? `Incorrect PIN (${nextAttempts} attempts left)`
            : 'Account locked temporarily. Use Forgot PIN to recover.'
        );

        setTimeout(() => {
          setPin('');
          setIsError(false);
        }, 500);
      }
    }
  };

  const handleBiometricUnlock = () => {
    setShowBiometricModal(false);
    onSuccessUnlock();
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white relative justify-between p-6 select-none overflow-hidden">
      <StatusBar dark={false} />

      {/* Top Section: Avatar & Greeting */}
      <div className="flex flex-col items-center mt-4 sm:mt-6">
        <div className="flex items-center gap-1.5 mb-3 bg-[#5B3DF5]/10 px-3 py-1 rounded-full border border-[#5B3DF5]/20">
          <img src="./logo.svg" alt="Super Pay" className="w-5 h-5 rounded-md" />
          <span className="text-xs font-extrabold tracking-wider text-[#5B3DF5]">SUPER PAY</span>
        </div>

        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] text-white flex items-center justify-center text-2xl font-bold shadow-xl shadow-[#5B3DF5]/30">
            {user.name.trim().split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
          </div>
          <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white dark:border-[#0E0E12] flex items-center justify-center text-white text-[10px]">
            ⚡
          </div>
        </div>

        <h2 className="text-xl font-bold mt-4">
          Welcome back, {user.name.trim().split(/\s+/)[0] || user.name} 👋
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          Enter your 4-digit App PIN to unlock
        </p>

        {errorMsg ? (
          <p className="text-xs font-semibold text-red-500 mt-2 animate-shake">
            {errorMsg}
          </p>
        ) : (
          <p className="text-[11px] text-slate-400 mt-2 font-mono">
            Demo PIN is <span className="font-bold text-[#5B3DF5]">1234</span>
          </p>
        )}
      </div>

      {/* Center PIN Pad */}
      <div className="my-auto flex flex-col items-center">
        <PinPad
          value={pin}
          onChange={handlePinChange}
          isError={isError}
          showBiometric={user.biometricEnabled}
          onBiometricClick={() => setShowBiometricModal(true)}
          disabled={attemptsRemaining <= 0}
        />
      </div>

      {/* Bottom Actions */}
      <div className="flex flex-col items-center gap-3 pb-4">
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            onForgotPin();
          }}
          className="text-xs font-semibold text-[#5B3DF5] hover:underline transition-colors"
        >
          Forgot PIN?
        </button>

        <p className="text-[10px] text-slate-400 text-center">
          Secured by NPCI 256-bit UPI End-to-End Encryption
        </p>
      </div>

      {/* Android Biometric Modal */}
      <BiometricPrompt
        isOpen={showBiometricModal}
        onSuccess={handleBiometricUnlock}
        onCancel={() => setShowBiometricModal(false)}
        title="Unlock PayNow"
        subtitle="Confirm fingerprint to access your account"
      />
    </div>
  );
};
