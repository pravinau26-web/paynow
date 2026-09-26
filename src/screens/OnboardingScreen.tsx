import React, { useState } from 'react';
import {
  ArrowRight,
  Check,
  CheckCircle2,
  ChevronRight,
  Fingerprint,
  Lock,
  RefreshCw,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
} from 'lucide-react';
import { PinPad } from '../components/PinPad';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { BankAccount, UserProfile } from '../types';

interface OnboardingScreenProps {
  onComplete: (user: UserProfile, selectedBankId: string, updatedBanks?: BankAccount[]) => void;
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
  const [name, setName] = useState('RAHUL SHARMA');
  const [phone, setPhone] = useState('9876543210');
  const [otp, setOtp] = useState('');
  const [simulatedSmsToast, setSimulatedSmsToast] = useState(false);

  // Generate random last 4 digits for bank accounts on mount
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(() => {
    return availableBanks.map((b) => {
      const rand4 = Math.floor(1000 + Math.random() * 9000).toString();
      return {
        ...b,
        accountNumberMasked: `XXXXXX${rand4}`,
      };
    });
  });

  const [selectedBankId, setSelectedBankId] = useState(availableBanks[0]?.id || 'bank-hdfc');
  const [upiIdChoice, setUpiIdChoice] = useState('rahul.sharma@superpay');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMsg, setPinErrorMsg] = useState('');
  const [biometricEnabled, setBiometricEnabled] = useState(true);

  // Re-randomize account numbers
  const randomizeAccounts = () => {
    sounds.playKeypadClick();
    setBankAccounts((prev) =>
      prev.map((b) => {
        const rand4 = Math.floor(1000 + Math.random() * 9000).toString();
        return {
          ...b,
          accountNumberMasked: `XXXXXX${rand4}`,
        };
      })
    );
  };

  const startOnboarding = () => {
    sounds.playKeypadClick();
    setStep('mobile');
  };

  const handleMobileSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (phone.length < 10) return;
    sounds.playKeypadClick();
    setStep('otp');

    // Automatically update UPI handle based on name in CAPS
    const cleanHandle = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    setUpiIdChoice(`${cleanHandle || 'user'}@superpay`);

    // Simulate incoming SMS OTP banner after 600ms
    setTimeout(() => {
      setSimulatedSmsToast(true);
    }, 600);
  };

  const handleAutoFillOtp = () => {
    sounds.playKeypadClick();
    setOtp('482910');
    setSimulatedSmsToast(false);
    setTimeout(() => {
      setStep('bank-discovery');
    }, 450);
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
    setPin('1234');
    setConfirmPin('1234');
    setStep('biometric');
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
      name: name.trim().toUpperCase() || 'RAHUL SHARMA',
      phone: `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`,
      email: `${name.trim().toLowerCase().replace(/\s+/g, '.')}@example.com`,
      upiId: upiIdChoice || `${name.trim().toLowerCase().replace(/\s+/g, '')}@superpay`,
      pinHash: pin || '1234',
      biometricEnabled,
      soundEnabled: true,
      hapticsEnabled: true,
      isOnboarded: true,
      locked: false,
    };
    onComplete(newUser, selectedBankId, bankAccounts);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white relative overflow-hidden select-none">
      <StatusBar dark={false} />

      {/* Simulated SMS Notification Banner */}
      {simulatedSmsToast && (
        <div className="absolute top-4 left-3 right-3 z-50 p-3 bg-slate-900/95 backdrop-blur-md text-white rounded-2xl shadow-2xl border border-slate-700 flex items-center justify-between animate-in slide-in-from-top-4 duration-300">
          <div className="flex items-center gap-2.5">
            <img src="./logo.svg" alt="Super Pay" className="w-8 h-8 rounded-lg shadow-sm" />
            <div>
              <p className="text-xs font-bold text-white flex items-center gap-1.5">
                <span>Super Pay Verification</span>
                <span className="text-[10px] bg-[#5B3DF5] px-1.5 py-0.2 rounded font-mono">OTP</span>
              </p>
              <p className="text-[11px] text-slate-300">
                Code: <span className="font-mono font-bold text-amber-300">482910</span> (NPCI Secured)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={handleAutoFillOtp}
            className="px-3.5 py-1.5 bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-white rounded-full text-xs font-bold transition-all shadow-sm cursor-pointer"
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
          <div className="pt-6">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] dark:text-[#8B7CFA] text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5 fill-current" />
              <span>SUPERCHARGED UPI 2.0</span>
            </div>
          </div>

          <div className="flex flex-col items-center">
            {/* Super Pay Animated Logo */}
            <div className="relative w-32 h-32 flex items-center justify-center mb-5">
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-tr from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] opacity-30 blur-2xl animate-pulse" />
              <img
                src="./logo.svg"
                alt="Super Pay Logo"
                className="relative w-28 h-28 rounded-3xl shadow-2xl shadow-[#5B3DF5]/50 object-contain hover:scale-105 transition-transform"
              />
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Super Pay
            </h1>
            <p className="text-xs font-bold text-[#5B3DF5] dark:text-[#8B7CFA] uppercase tracking-wider mt-1">
              Next-Gen UPI Payments
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[270px] leading-relaxed">
              Scan any QR code. Real instant cashback (0.30% – 0.40%) deposited directly to your bank account on every payment.
            </p>
          </div>

          <div className="w-full space-y-3">
            <button
              type="button"
              onClick={startOnboarding}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white font-bold text-sm shadow-xl shadow-[#5B3DF5]/30 hover:opacity-95 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <div className="flex items-center justify-center gap-1 text-[11px] text-slate-400">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
              <span>Authorized by NPCI & RBI Partner Banks</span>
            </div>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 2. NAME & MOBILE NUMBER ENTRY                        */}
      {/* ---------------------------------------------------- */}
      {step === 'mobile' && (
        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-250">
          <div className="mt-2 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <img src="./logo.svg" alt="Super Pay" className="w-8 h-8 rounded-xl shadow-xs" />
              <span className="text-xs font-extrabold tracking-wider text-[#5B3DF5]">SUPER PAY SETUP</span>
            </div>
            <h2 className="text-2xl font-bold">Your Account Details</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter your name and mobile number to discover linked bank accounts.
            </p>
          </div>

          <form onSubmit={handleMobileSubmit} className="flex-1 flex flex-col justify-between">
            <div className="space-y-4">
              {/* Account Holder Name (CAPS) */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <User className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  <span>Account Holder Name (CAPS)</span>
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                  placeholder="E.G. RAHUL SHARMA"
                  className="w-full px-4 py-3 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-sm font-bold tracking-wider outline-none focus:ring-2 focus:ring-[#5B3DF5]"
                />
              </div>

              {/* Mobile Number */}
              <div>
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-1.5">
                  <Smartphone className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  <span>Mobile Number (Linked with Bank)</span>
                </label>
                <div className="flex items-center gap-3 p-3.5 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 shadow-xs focus-within:ring-2 focus-within:ring-[#5B3DF5]">
                  <div className="flex items-center gap-1.5 border-r border-slate-200 dark:border-slate-700 pr-3 font-bold text-xs">
                    <span>🇮🇳</span>
                    <span>+91</span>
                  </div>
                  <input
                    type="tel"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                    placeholder="Enter 10 digit number"
                    className="flex-1 bg-transparent text-base font-bold font-mono tracking-wider outline-none"
                  />
                </div>
              </div>

              <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#15151b] border border-slate-100 dark:border-slate-800/80 text-[11px] text-slate-500 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>Device SIM binding is encrypted via standard NPCI UPI protocols.</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={phone.length !== 10 || !name.trim()}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>Verify SIM & Link Banks</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 3. OTP VERIFICATION                                  */}
      {/* ---------------------------------------------------- */}
      {step === 'otp' && (
        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-250">
          <div className="mt-2 mb-5">
            <h2 className="text-2xl font-bold">Verify OTP</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Enter 6-digit OTP sent to <span className="font-semibold text-slate-900 dark:text-slate-100">+91 {phone}</span>
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
                  className="font-bold text-[#5B3DF5] hover:underline cursor-pointer"
                >
                  Resend SMS
                </button>
              </div>

              <div className="mt-6 p-3.5 rounded-2xl bg-[#5B3DF5]/10 border border-[#5B3DF5]/20 text-xs text-[#5B3DF5] dark:text-[#8B7CFA]">
                <p className="font-bold">💡 One-Time Setup</p>
                <p className="text-[11px] mt-0.5 opacity-90">
                  Subsequent payments in Super Pay will only require your PIN or biometric recognition.
                </p>
              </div>
            </div>

            <button
              type="button"
              disabled={otp.length !== 6}
              onClick={() => setStep('bank-discovery')}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 disabled:opacity-50 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>Confirm OTP</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 4. BANK DISCOVERY (RANDOM LAST 4 DIGITS & CAPS NAME) */}
      {/* ---------------------------------------------------- */}
      {step === 'bank-discovery' && (
        <div className="flex-1 flex flex-col p-6 animate-in slide-in-from-right duration-250">
          <div className="mt-1 mb-4 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold">Select Primary Bank</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Discovered 3 bank accounts linked to SIM
              </p>
            </div>
            {/* Randomize Account numbers button */}
            <button
              type="button"
              onClick={randomizeAccounts}
              title="Generate new random account numbers"
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-[11px] font-bold text-[#5B3DF5] hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Randomize A/c</span>
            </button>
          </div>

          <div className="flex-1 flex flex-col justify-between">
            <div className="space-y-3">
              {/* Account Holder Name in CAPS card */}
              <div className="p-3 rounded-2xl bg-slate-100 dark:bg-[#15151B] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-500">ACCOUNT HOLDER:</span>
                <span className="text-xs font-extrabold tracking-wider text-slate-900 dark:text-white">
                  {name.trim().toUpperCase() || 'RAHUL SHARMA'}
                </span>
              </div>

              {bankAccounts.map((bank) => {
                const isSelected = selectedBankId === bank.id;
                return (
                  <button
                    key={bank.id}
                    type="button"
                    onClick={() => {
                      sounds.playKeypadClick();
                      setSelectedBankId(bank.id);
                    }}
                    className={`w-full p-4 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                      isSelected
                        ? 'border-[#5B3DF5] bg-[#5B3DF5]/8 dark:bg-[#5B3DF5]/15 shadow-sm ring-1 ring-[#5B3DF5]'
                        : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#1A1A20] hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-slate-800 to-slate-950 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                        {bank.logo}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {bank.bankName}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                          Savings · A/c **{bank.accountNumberMasked.slice(-4)}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center ${
                        isSelected
                          ? 'bg-[#5B3DF5] text-white shadow-xs'
                          : 'border-2 border-slate-300 dark:border-slate-700'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5" />}
                    </div>
                  </button>
                );
              })}

              {/* UPI ID Customization */}
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Your Super Pay UPI Handle
                </span>
                <div className="flex items-center gap-1 mt-1 font-mono text-xs font-bold text-[#5B3DF5]">
                  <input
                    type="text"
                    value={upiIdChoice}
                    onChange={(e) => setUpiIdChoice(e.target.value)}
                    className="w-full bg-transparent outline-none border-b border-[#5B3DF5]/40 pb-0.5"
                  />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleBankConfirm}
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer mt-4"
            >
              <span>Link Bank Account & Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 5. SET 4-DIGIT PIN                                   */}
      {/* ---------------------------------------------------- */}
      {step === 'set-pin' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 animate-in slide-in-from-right duration-250">
          <div className="text-center mt-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center mx-auto mb-2.5">
              <Lock className="w-6 h-6" />
            </div>
            <h2 className="text-2xl font-bold">Set 4-Digit PIN</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              You will use this PIN to authorize payments and unlock the app.
            </p>
          </div>

          <div className="w-full flex-1 flex flex-col items-center justify-center">
            <PinPad value={pin} onChange={handleFirstPin} showBiometric={false} />
          </div>

          <p className="text-xs text-slate-400 pb-2">Step 1 of 2: Create a secure PIN</p>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 6. CONFIRM PIN                                       */}
      {/* ---------------------------------------------------- */}
      {step === 'confirm-pin' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 animate-in slide-in-from-right duration-250">
          <div className="text-center mt-3">
            <div className="w-12 h-12 rounded-2xl bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center mx-auto mb-2.5">
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
            className="text-xs font-semibold text-slate-400 hover:text-slate-600 pb-2 cursor-pointer"
          >
            Go back & change PIN
          </button>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 7. BIOMETRICS TOGGLE                                 */}
      {/* ---------------------------------------------------- */}
      {step === 'biometric' && (
        <div className="flex-1 flex flex-col items-center justify-between p-6 text-center animate-in slide-in-from-right duration-250">
          <div className="mt-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white flex items-center justify-center mx-auto mb-4 shadow-xl shadow-[#5B3DF5]/30">
              <Fingerprint className="w-10 h-10" />
            </div>
            <h2 className="text-2xl font-bold">Enable Biometric Login?</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[270px] leading-relaxed">
              Unlock Super Pay instantly with Fingerprint or Face ID without entering your PIN every time.
            </p>
          </div>

          <div className="w-full p-4 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 text-left flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-6 h-6 text-[#5B3DF5]" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">
                  Biometric Recognition
                </p>
                <p className="text-[11px] text-slate-400">Fingerprint & Face Authentication</p>
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
              className="w-full py-4 rounded-full bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white font-bold text-sm shadow-md shadow-[#5B3DF5]/30 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setBiometricEnabled(false);
                finishOnboarding();
              }}
              className="text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Skip for now
            </button>
          </div>
        </div>
      )}

      {/* ---------------------------------------------------- */}
      {/* 8. SUCCESS SCREEN WITH SUPER PAY BRANDING            */}
      {/* ---------------------------------------------------- */}
      {step === 'success' && (
        <div className="flex-1 flex flex-col items-center justify-between p-8 text-center animate-in zoom-in-95 duration-300">
          <div className="pt-4" />

          <div className="flex flex-col items-center">
            <div className="relative mb-3">
              <img
                src="./logo.svg"
                alt="Super Pay"
                className="w-20 h-20 rounded-2xl shadow-xl shadow-[#5B3DF5]/40"
              />
              <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-[#1DB954] text-white flex items-center justify-center shadow-md">
                <Check className="w-4 h-4 stroke-[3]" />
              </div>
            </div>

            <h2 className="text-2xl font-black text-slate-900 dark:text-white">
              All Set, {name.trim().toUpperCase()}!
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-[260px] leading-relaxed">
              Your primary bank account is linked and ready for lightning fast UPI payments.
            </p>

            <div className="mt-5 p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/25 text-xs text-emerald-800 dark:text-emerald-300 text-left w-full space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <Sparkles className="w-4 h-4 text-emerald-600" />
                <span>Super Cashback Activated</span>
              </div>
              <p className="text-[11px] text-emerald-700 dark:text-emerald-400">
                Earn real instant cashback (0.30% – 0.40%) on merchant QR scans, credited straight to your bank account!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleGoToHome}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#5B3DF5] via-[#7C3AED] to-[#00F0FF] text-white font-bold text-sm shadow-xl shadow-[#5B3DF5]/30 transition-all flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
          >
            <span>Launch Super Pay</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
