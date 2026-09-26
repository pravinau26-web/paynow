import React, { useState } from 'react';
import { ArrowRight, Check, CheckCircle2, ChevronRight, Fingerprint, Lock, ShieldCheck, Smartphone, Sparkles } from 'lucide-react';
import { PinPad } from '../components/PinPad';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { BankAccount, UserProfile } from '../types';

interface OnboardingScreenProps {
  onComplete: (user: UserProfile, selectedBankId: string) => void;
  availableBanks: BankAccount[];
}

type OnboardingStep =
  | 'splash'
  | 'mobile'
  | 'otp'
  | 'bank-discovery'
  | 'set-pin'
  | 'confirm-pin'
  | 'biometric'
  | 'success';

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onComplete,
  availableBanks,
}) => {
  const [step, setStep] = useState<OnboardingStep>('splash');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [simulatedSmsToast, setSimulatedSmsToast] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(availableBanks[0]?.id || 'bank-hdfc');
  const [upiIdChoice, setUpiIdChoice] = useState('rahul.sharma@paynow');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Splash auto-transition or tap
  const startOnboarding = () => {
    sounds.playKeypadClick();
    setStep('mobile');
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    sounds.playKeypadClick();
    setStep('otp');

    // Simulate incoming SMS OTP banner after 700ms
    setTimeout(() => {
      setSimulatedSmsToast(true);
    }, 700);
  };

  const handleAutoFillOtp = () => {
    sounds.playKeypadClick();
    setOtp('482910');
    setSimulatedSmsToast(false);
    setTimeout(() => {
      setStep('bank-discovery');
    }, 500);
  };

  const handleOtpChange = (val: string) => {
    setOtp(val);
    if (val.length === 6) {
      setTimeout(() => {
        setStep('bank-discovery');
      }, 400);
    }
  };

  const handleBankConfirm = () => {
    sounds.playKeypadClick();
    setStep('set-pin');
  };

  const handleFirstPin = (val: string) => {
    setPin(val);
    if (val.length === 4) {
      setTimeout(() => {
        setStep('confirm-pin');
      }, 300);
    }
  };

  const handleConfirmPin = (val: string) => {
    setConfirmPin(val);
    if (val.length === 4) {
      if (val === pin) {
        sounds.playSuccessChime();
        setPinError(false);
        setTimeout(() => {
          setStep('biometric');
        }, 300);
      } else {
        sounds.playErrorSound();
        setPinError(true);
        setPinErrorMsg('PINs do not match. Please re-enter.');
        setTimeout(() => {
          setConfirmPin('');
          setPinError(false);
        }, 900);
      }
    }
  };

  const finishOnboarding = () => {
    sounds.playSuccessChime();
    setStep('success');
  };

  const handleGoToHome = () => {
    sounds.playKeypadClick();
    const newUser: UserProfile = {
      name: 'Rahul Sharma',
      phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
      email: 'rahul.sharma@example.com',
      upiId: upiIdChoice,
      pinHash: pin || '1234',
      biometricEnabled,
      soundEnabled: true,
      hapticsEnabled: true,
      isOnboarded: true,
      locked: false,
    };
    onComplete(newUser, selectedBankId);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white relative overflow-hidden">
      <StatusBar dark={false} />

      {/* Simulated SMS Notification Banner */}
      {simulatedSmsToast && (
        <div className="absolute top-12 left-3 right-3 z-50 p-3 bg-slate-900 text-white rounded-2xl shadow-xl border border-slate-700 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-[#5B3DF5] flex items-center justify-center font-bold text-xs">
              SMS
            </div>
            <div>
              <p className="text-xs font-semibold">PayNow Verification</p>
              <p className="text-[11px] text-slate-300">
                OTP: <span className="font-mono font-bold text-amber-300">482910</span> (valid for 5 mins)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFillOtp}
            className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-full text-xs font-bold transition-all shadow-sm"
          >
            Auto Fill
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 1. SPLASH SCREEN                                     */}
      {/* ---------------------------------------------------- */}
      {step === 'splash' && (
        <div className="flex-1 flex flex-col items-center justify-between p-8 text-center animate-in fade-in duration-300">
          <div className="pt-12">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-semibold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              UPI 2.0 Supercharged
            </div>
          </div>

          <div className="flex flex-col items-center">
            {/* Animated Logo */}
            <div className="relative w-28 h-28 flex items-center justify-center mb-6">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#5B3DF5] to-[#A16CFF] opacity-30 blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-[#6C4CFA] to-[#A16CFF] flex items-center justify-center text-white shadow-xl shadow-[#5B3DF5]/40 rotate-3 transition-transform hover:rotate-0">
                <span className="font-black text-4xl tracking-tighter">P</span>
                <span className="font-light text-2xl">⚡</span>
              </div>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight">PayNow</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 max-w-[260px] leading-relaxed">
              Uncluttered UPI. Real cash straight to your bank account on every QR scan.
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={startOnboarding}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-lg shadow-[#5B3DF5]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              Get Started
              <ArrowRight className="w-4 h-4" />
            </button>
            <p className="text-[11px] text-slate-400">
              Secured by NPCI & RBI Authorized Bank Rails
            </p>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. MOBILE NUMBER ENTRY                               */}
      {/* ---------------------------------------------------- */}
      {step === 'mobile' && (
        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-250">
          <div className="mt-4 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center mb-4">
              <Smartphone className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Enter your Mobile Number</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              We will verify your SIM to discover and link your bank accounts.
            </p>
          </div>

          <form onSubmit={handleMobileSubmit} className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-3 p-4 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 shadow-sm focus-within:ring-2 focus-within:ring-[#5B3DF5]">
                <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3 font-semibold text-sm">
                  <span>🇮🇳</span>
                  <span>+91</span>
                </div>
                <input
                  type="tel"
                  maxLength={10}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                  placeholder="Enter 10 digit number"
                  className="flex-1 bg-transparent text-lg font-bold font-mono tracking-wider outline-none"
                  autoFocus
                />
              </div>

              <div className="mt-4 p-3 rounded-xl bg-slate-50 dark:bg-[#15151b] border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Device SIM binding is encrypted via standard UPI protocols.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={phone.length !== 10}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              Verify SIM & Proceed
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. OTP VERIFICATION (ONE-TIME ONLY)                 */}
      {/* ---------------------------------------------------- */}
      {step === 'otp' && (
        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-250">
          <div className="mt-4 mb-6">
            <h2 className="text-2xl font-bold">Verify OTP</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              6-digit one-time password sent to <span className="font-semibold text-slate-800 dark:text-slate-200">+91 {phone}</span>
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div>
              <div className="flex justify-center gap-2 my-4">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className={`w-11 h-13 rounded-xl border flex items-center justify-center font-mono text-xl font-bold transition-all ${
                      otp[i]
                        ? 'border-[#5B3DF5] bg-[#5B3DF5]/10 text-slate-900 dark:text-white'
                        : i === otp.length
                        ? 'border-[#5B3DF5] bg-white dark:bg-[#1A1A20] ring-2 ring-[#5B3DF5]/20'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A20]'
                    }`}
                  >
                    {otp[i] || ''}
                  </div>
                ))}
              </div>

              <input
                type="tel"
                maxLength={6}
                value={otp}
                onChange={(e) => handleOtpChange(e.target.value.replace(/\D/g, ''))}
                className="opacity-0 w-full h-8 cursor-pointer"
                autoFocus
              />

              <div className="flex justify-between items-center text-xs text-slate-500 mt-2">
                <span>Didn't receive code?</span>
                <button
                  type="button"
                  onClick={() => setSimulatedSmsToast(true)}
                  className="font-bold text-[#5B3DF5] hover:underline"
                >
                  Resend SMS
                </button>
              </div>

              <div className="mt-6 p-3 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200/40 text-xs text-purple-700 dark:text-purple-300">
                <p className="font-semibold">💡 One-Time Verification Notice</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  This is the only time you will ever need an OTP. Subsequent app opens will only require your PIN or Biometrics.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={otp.length !== 6}
              onClick={() => setStep('bank-discovery')}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              Confirm OTP
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. BANK ACCOUNT DISCOVERY & LINKING                  */}
      {/* ---------------------------------------------------- */}
      {step === 'bank-discovery' && (
        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-250">
          <div className="mt-2 mb-4">
            <h2 className="text-2xl font-bold">Select Primary Bank</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Found 3 accounts linked to SIM (+91 {phone})
            </p>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {availableBanks.map((bank) => {
                const isSelected = selectedBankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      sounds.playKeypadClick();
                      setSelectedBankId(bank.id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                      isSelected
                        ? 'border-[#5B3DF5] bg-[#5B3DF5]/5 dark:bg-[#5B3DF5]/10 shadow-sm'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A20] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                        {bank.logo}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {bank.bankName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Savings · {bank.accountNumberMasked}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#5B3DF5] text-white'
                          : 'border-2 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}

              {/* UPI ID Customization */}
              <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800">
                <span className="text-xs font-semibold text-slate-500">Your UPI Handle</span>
                <div className="flex items-center gap-1 mt-1 font-mono text-xs font-bold text-[#5B3DF5]">
                  <input
                    type="text"
                    value={upiIdChoice}
                    onChange={(e) => setUpiIdChoice(e.target.value)}
                    className="w-full bg-transparent outline-none border-b border-[#5B3DF5]/30 pb-0.5"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBankConfirm}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              Link Bank & Set PIN
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. SET UPI / APP PIN (STEP 1)                        */}
      {/* ---------------------------------------------------- */}
      {step === 'set-pin' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 animate-in slide-in-from-right duration-250">
          <div className="text-center mt-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center mx-auto mb-3">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Set 4-Digit PIN</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You will use this PIN to log in and authorize payments.
            </p>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <PinPad
              value={pin}
              onChange={handleFirstPin}
              showBiometric={false}
            />
          </div>

          <p className="text-xs text-slate-400 pb-2">
            Step 1 of 2: Create a secure PIN
          </p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. CONFIRM PIN (STEP 2)                              */}
      {/* ---------------------------------------------------- */}
      {step === 'confirm-pin' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 animate-in slide-in-from-right duration-250">
          <div className="text-center mt-4">
            <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center mx-auto mb-3">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Confirm your PIN</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Re-enter the 4-digit PIN to confirm
            </p>
            {pinErrorMsg && (
              <p className="text-xs font-semibold text-red-500 mt-2 animate-shake">
                {pinErrorMsg}
              </p>
            )}
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <PinPad
              value={confirmPin}
              onChange={handleConfirmPin}
              isError={pinError}
              showBiometric={false}
            />
          </div>

          <button
            type="button"
            onClick={() => {
              setPin('');
              setConfirmPin('');
              setStep('set-pin');
            }}
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 pb-2"
          >
            Go back & change PIN
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. BIOMETRIC SHORTCUT (OPTIONAL)                     */}
      {/* ---------------------------------------------------- */}
      {step === 'biometric' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 text-center animate-in slide-in-from-right duration-250">
          <div className="mt-6">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#5B3DF5]/30">
              <Fingerprint className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">Enable Biometric Login?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[260px] leading-relaxed">
              Unlock PayNow faster using Android Fingerprint or Face Unlock without typing your PIN every time.
            </p>
          </div>

          <div className="w-full p-4 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-[#5B3DF5]" />
              <div>
                <p className="text-xs font-bold">Android Biometrics</p>
                <p className="text-[11px] text-slate-400">Fingerprint & Face Recognition</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={biometricEnabled}
              onChange={(e) => setBiometricEnabled(e.target.checked)}
              className="w-5 h-5 accent-[#5B3DF5] cursor-pointer"
            />
          </div>

          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={finishOnboarding}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 transition-all flex items-center justify-center gap-2 active:scale-98"
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setBiometricEnabled(false);
                finishOnboarding();
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. ONBOARDING SUCCESS SCREEN                         */}
      {/* ---------------------------------------------------- */}
      {step === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-between p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="pt-8" />

          <div className="flex flex-col items-center">
            <div className="w-20 h-20 rounded-full bg-[#1DB954] text-white flex items-center justify-center mb-4 shadow-xl shadow-emerald-500/30 animate-in zoom-in-50 duration-300">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <h2 className="text-2xl font-black">All Set, Rahul!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[250px] leading-relaxed">
              Your HDFC Bank account is linked and ready for lightning fast UPI payments.
            </p>

            <div className="mt-6 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-xs text-emerald-800 dark:text-emerald-300 text-left w-full space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Super Cashback Activated</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Earn flat 5% instant cashback on all merchant QR scans, deposited directly to your bank account!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoToHome}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-xl shadow-[#5B3DF5]/30 transition-all flex items-center justify-center gap-2 active:scale-98"
          >
            Launch PayNow
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
