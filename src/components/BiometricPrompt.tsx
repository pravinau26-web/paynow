import React, { useState, useEffect } from 'react';
import {
  Check,
  CreditCard,
  Fingerprint,
  KeyRound,
  Lock,
  Scan,
  ShieldCheck,
  Smile,
  Sparkles,
  Unlock,
  X,
} from 'lucide-react';
import { sounds } from '../services/audio';

export type BiometricMode = 'fingerprint' | 'faceid';

export interface TransactionAuthDetails {
  amount: number;
  recipientName: string;
  upiId?: string;
  bankName?: string;
  accountNumberMasked?: string;
  note?: string;
}

interface BiometricPromptProps {
  isOpen: boolean;
  onSuccess: () => void;
  onCancel: () => void;
  onUsePin?: () => void;
  title?: string;
  subtitle?: string;
  contextType?: 'login' | 'transaction';
  userName?: string;
  transactionDetails?: TransactionAuthDetails;
  initialMode?: BiometricMode;
}

export const BiometricPrompt: React.FC<BiometricPromptProps> = ({
  isOpen,
  onSuccess,
  onCancel,
  onUsePin,
  title,
  subtitle,
  contextType = 'login',
  userName,
  transactionDetails,
  initialMode = 'fingerprint',
}) => {
  const [mode, setMode] = useState<BiometricMode>(initialMode);
  const [isScanning, setIsScanning] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setIsScanning(false);
      setIsSuccess(false);
      setScanProgress(0);
      setMode(initialMode);
    }
  }, [isOpen, initialMode]);

  if (!isOpen) return null;

  const resolvedTitle =
    title ||
    (contextType === 'transaction' ? 'Authorize Payment' : 'Unlock Super Pay');

  const resolvedSubtitle =
    subtitle ||
    (contextType === 'transaction'
      ? `Verify your biometric to approve payment of ₹${transactionDetails?.amount?.toLocaleString(
          'en-IN'
        ) || ''}`
      : 'Touch the fingerprint sensor or glance at the camera');

  // Trigger Fingerprint scan simulation
  const handleScanFingerprint = () => {
    if (isScanning || isSuccess) return;
    setIsScanning(true);
    setScanProgress(10);
    sounds.playKeypadClick();

    const pInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 90) {
          clearInterval(pInterval);
          return 90;
        }
        return prev + 25;
      });
    }, 120);

    setTimeout(() => {
      clearInterval(pInterval);
      setScanProgress(100);
      setIsSuccess(true);
      sounds.playBiometricUnlock();

      setTimeout(() => {
        setIsScanning(false);
        setIsSuccess(false);
        onSuccess();
      }, 550);
    }, 650);
  };

  // Trigger Face ID scan simulation
  const handleScanFaceId = () => {
    if (isScanning || isSuccess) return;
    setIsScanning(true);
    setScanProgress(15);
    sounds.playKeypadClick();

    const pInterval = setInterval(() => {
      setScanProgress((prev) => {
        if (prev >= 95) {
          clearInterval(pInterval);
          return 95;
        }
        return prev + 25;
      });
    }, 130);

    setTimeout(() => {
      clearInterval(pInterval);
      setScanProgress(100);
      setIsSuccess(true);
      sounds.playBiometricUnlock();

      setTimeout(() => {
        setIsScanning(false);
        setIsSuccess(false);
        onSuccess();
      }, 600);
    }, 750);
  };

  const handleTriggerCurrentScan = () => {
    if (mode === 'fingerprint') {
      handleScanFingerprint();
    } else {
      handleScanFaceId();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-200 p-0 sm:p-4 select-none"
    >
      <div className="w-full max-w-md bg-white dark:bg-[#14151C] rounded-t-3xl sm:rounded-3xl p-5 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col items-center relative overflow-hidden transition-all max-h-[92vh] overflow-y-auto no-scrollbar">
        {/* Subtle Ambient Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 bg-gradient-to-b from-[#5B3DF5]/15 to-transparent blur-2xl pointer-events-none" />

        {/* Drag handle pill on mobile */}
        <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-3 shrink-0" />

        {/* Top Header Row with Shield and Close */}
        <div className="w-full flex items-center justify-between pb-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>NPCI 256-Bit Biometric Shield</span>
          </div>

          <button
            type="button"
            onClick={onCancel}
            className="w-8 h-8 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Title & Subtitle */}
        <div className="text-center mt-1 w-full">
          <h3 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight">
            {resolvedTitle}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
            {resolvedSubtitle}
          </p>
        </div>

        {/* Transaction Summary Card (Shown if authorizing a payment) */}
        {contextType === 'transaction' && transactionDetails && (
          <div className="w-full mt-3.5 p-3.5 rounded-2xl bg-[#F7F8FA] dark:bg-[#1C1D26] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between shadow-xs">
            <div className="text-left min-w-0 pr-2">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Paying To
              </span>
              <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                {transactionDetails.recipientName}
              </p>
              {transactionDetails.upiId && (
                <p className="text-[11px] font-mono text-slate-400 truncate">
                  {transactionDetails.upiId}
                </p>
              )}
              {transactionDetails.bankName && (
                <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1">
                  <span>🏦</span>
                  <span>{transactionDetails.bankName}</span>
                </p>
              )}
            </div>

            <div className="text-right shrink-0">
              <span className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                Amount
              </span>
              <p className="text-xl sm:text-2xl font-black font-mono text-[#5B3DF5] dark:text-[#8B7CFA] tabular-nums">
                ₹{transactionDetails.amount.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        )}

        {/* Mode Switcher Tabs: Fingerprint vs Face ID */}
        <div className="w-full max-w-[280px] p-1 bg-slate-100 dark:bg-[#1E1F2A] rounded-2xl flex items-center justify-between gap-1 my-4 border border-slate-200/60 dark:border-slate-800">
          <button
            type="button"
            onClick={() => {
              if (mode !== 'fingerprint') {
                sounds.playKeypadClick();
                setMode('fingerprint');
                setIsScanning(false);
                setIsSuccess(false);
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'fingerprint'
                ? 'bg-white dark:bg-[#2B2C3A] text-[#5B3DF5] dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Fingerprint className="w-3.5 h-3.5" />
            <span>Fingerprint</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (mode !== 'faceid') {
                sounds.playKeypadClick();
                setMode('faceid');
                setIsScanning(false);
                setIsSuccess(false);
              }
            }}
            className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              mode === 'faceid'
                ? 'bg-white dark:bg-[#2B2C3A] text-[#5B3DF5] dark:text-white shadow-sm'
                : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <Scan className="w-3.5 h-3.5" />
            <span>Face ID</span>
          </button>
        </div>

        {/* ========================================================================= */}
        {/* INTERACTIVE BIOMETRIC SIMULATION AREA                                     */}
        {/* ========================================================================= */}
        <div className="w-full py-2 flex flex-col items-center justify-center">
          {mode === 'fingerprint' ? (
            /* 1. FINGERPRINT SENSOR SIMULATION */
            <div className="flex flex-col items-center">
              <div className="relative my-4 flex items-center justify-center">
                {/* Concentric ripples */}
                <div
                  className={`absolute w-36 h-36 rounded-full transition-all duration-500 ${
                    isSuccess
                      ? 'bg-emerald-500/20 scale-110'
                      : isScanning
                      ? 'bg-[#5B3DF5]/20 animate-ping'
                      : 'bg-[#5B3DF5]/10 animate-pulse'
                  }`}
                />
                <div
                  className={`absolute w-28 h-28 rounded-full transition-all duration-300 ${
                    isSuccess
                      ? 'bg-emerald-500/30'
                      : isScanning
                      ? 'bg-[#5B3DF5]/25 animate-pulse'
                      : 'bg-[#5B3DF5]/15'
                  }`}
                />

                {/* Interactive Sensor Pad Button */}
                <button
                  type="button"
                  onClick={handleScanFingerprint}
                  disabled={isScanning || isSuccess}
                  aria-label="Simulate Fingerprint Sensor"
                  className={`relative z-10 w-24 h-24 rounded-full flex flex-col items-center justify-center transition-all duration-300 shadow-2xl cursor-pointer ${
                    isSuccess
                      ? 'bg-emerald-500 text-white scale-110 shadow-emerald-500/50 ring-4 ring-emerald-400/40'
                      : isScanning
                      ? 'bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white scale-105 shadow-[#5B3DF5]/50 ring-4 ring-[#5B3DF5]/40'
                      : 'bg-gradient-to-tr from-[#4A32E5] via-[#5B3DF5] to-[#8B7CFA] text-white hover:scale-105 active:scale-95 shadow-[#5B3DF5]/40 hover:shadow-[#5B3DF5]/60'
                  }`}
                >
                  {isSuccess ? (
                    <Check className="w-12 h-12 stroke-[3] animate-in zoom-in-75 duration-300" />
                  ) : (
                    <>
                      <Fingerprint
                        className={`w-12 h-12 transition-all ${
                          isScanning ? 'scale-110 animate-pulse text-[#B4F726]' : 'text-white'
                        }`}
                      />
                      {/* Laser scanning sweep line across fingerprint */}
                      {isScanning && (
                        <div className="absolute inset-x-3 top-3 h-1 bg-gradient-to-r from-transparent via-[#B4F726] to-transparent rounded-full shadow-lg shadow-[#B4F726] animate-scan" />
                      )}
                    </>
                  )}
                </button>
              </div>

              {/* Status and instruction */}
              <div className="text-center mt-1">
                {isSuccess ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Fingerprint Matched · Identity Confirmed</span>
                  </p>
                ) : isScanning ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#5B3DF5] dark:text-[#8B7CFA] animate-pulse">
                      Reading fingerprint pattern...
                    </p>
                    <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-[#5B3DF5] transition-all duration-150"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleScanFingerprint}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5B3DF5] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Tap or hold sensor to simulate Fingerprint</span>
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* 2. FACE ID SCANNER SIMULATION */
            <div className="flex flex-col items-center">
              <div className="relative my-3 flex items-center justify-center">
                {/* Face ID Viewfinder Frame */}
                <div
                  className={`relative w-44 h-44 rounded-3xl p-3 flex flex-col items-center justify-center transition-all duration-300 ${
                    isSuccess
                      ? 'border-2 border-emerald-500 bg-emerald-500/10 shadow-lg shadow-emerald-500/20'
                      : isScanning
                      ? 'border border-[#5B3DF5]/60 bg-[#5B3DF5]/10 shadow-lg shadow-[#5B3DF5]/20'
                      : 'border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-[#181922]'
                  }`}
                >
                  {/* Top TrueDepth Camera Notch / Indicator */}
                  <div className="absolute top-2 w-10 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full flex items-center justify-center">
                    <span
                      className={`w-1 h-1 rounded-full ${
                        isScanning ? 'bg-red-500 animate-ping' : 'bg-slate-400'
                      }`}
                    />
                  </div>

                  {/* 4 Glowing Corner Reticles (Face ID Style) */}
                  <div
                    className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 rounded-tl-lg transition-colors duration-300 ${
                      isSuccess
                        ? 'border-emerald-500'
                        : isScanning
                        ? 'border-[#5B3DF5]'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}
                  />
                  <div
                    className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 rounded-tr-lg transition-colors duration-300 ${
                      isSuccess
                        ? 'border-emerald-500'
                        : isScanning
                        ? 'border-[#5B3DF5]'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}
                  />
                  <div
                    className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 rounded-bl-lg transition-colors duration-300 ${
                      isSuccess
                        ? 'border-emerald-500'
                        : isScanning
                        ? 'border-[#5B3DF5]'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}
                  />
                  <div
                    className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 rounded-br-lg transition-colors duration-300 ${
                      isSuccess
                        ? 'border-emerald-500'
                        : isScanning
                        ? 'border-[#5B3DF5]'
                        : 'border-slate-400 dark:border-slate-600'
                    }`}
                  />

                  {/* Center Face Graphic or Success Unlock */}
                  {isSuccess ? (
                    <div className="flex flex-col items-center justify-center animate-in zoom-in-75 duration-300 text-emerald-500">
                      <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-1">
                        <Unlock className="w-9 h-9 stroke-[2.5]" />
                      </div>
                      <span className="text-[11px] font-black tracking-wider uppercase text-emerald-600 dark:text-emerald-400">
                        Face Verified
                      </span>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={handleScanFaceId}
                      disabled={isScanning}
                      className="relative w-full h-full flex flex-col items-center justify-center cursor-pointer group"
                    >
                      {/* Stylized Face Contour Mesh */}
                      <div className="relative w-20 h-24 rounded-[40px] border-2 border-dashed border-slate-300 dark:border-slate-600 flex flex-col items-center justify-center transition-all group-hover:border-[#5B3DF5]">
                        <Smile
                          className={`w-10 h-10 transition-colors ${
                            isScanning
                              ? 'text-[#5B3DF5] animate-pulse'
                              : 'text-slate-400 group-hover:text-[#5B3DF5]'
                          }`}
                        />
                        {/* Eye and facial tracking dots */}
                        <div className="absolute top-6 left-4 w-1.5 h-1.5 rounded-full bg-[#5B3DF5]/60 animate-ping" />
                        <div className="absolute top-6 right-4 w-1.5 h-1.5 rounded-full bg-[#5B3DF5]/60 animate-ping" />
                      </div>

                      {/* Moving laser scan line across face */}
                      {isScanning && (
                        <div className="absolute inset-x-3 top-3 h-1 bg-gradient-to-r from-transparent via-[#5B3DF5] to-transparent rounded-full shadow-lg shadow-[#5B3DF5] animate-scan" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Status and instruction */}
              <div className="text-center mt-1">
                {isSuccess ? (
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center justify-center gap-1.5 animate-in fade-in">
                    <Check className="w-4 h-4 stroke-[2.5]" />
                    <span>Face ID Recognized · Access Granted</span>
                  </p>
                ) : isScanning ? (
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-[#5B3DF5] dark:text-[#8B7CFA] animate-pulse">
                      Analyzing 3D facial contours...
                    </p>
                    <div className="w-32 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mx-auto overflow-hidden">
                      <div
                        className="h-full bg-[#5B3DF5] transition-all duration-150"
                        style={{ width: `${scanProgress}%` }}
                      />
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleScanFaceId}
                    className="text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-[#5B3DF5] flex items-center justify-center gap-1 cursor-pointer transition-colors"
                  >
                    <span>Glance at screen or tap to simulate Face ID</span>
                  </button>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Quick Simulation Trigger Button */}
        <div className="w-full mt-3 flex items-center gap-2">
          <button
            type="button"
            onClick={handleTriggerCurrentScan}
            disabled={isScanning || isSuccess}
            className={`w-full py-3 px-4 rounded-2xl font-bold text-xs transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md ${
              isSuccess
                ? 'bg-emerald-500 text-white shadow-emerald-500/20'
                : 'bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white hover:opacity-95 shadow-[#5B3DF5]/30 active:scale-98'
            }`}
          >
            {isSuccess ? (
              <>
                <Check className="w-4 h-4 stroke-[2.5]" />
                <span>Authentication Successful</span>
              </>
            ) : isScanning ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Verifying Biometric...</span>
              </>
            ) : (
              <>
                {mode === 'fingerprint' ? (
                  <Fingerprint className="w-4 h-4" />
                ) : (
                  <Scan className="w-4 h-4" />
                )}
                <span>
                  {contextType === 'transaction'
                    ? `Authorize with ${mode === 'fingerprint' ? 'Fingerprint' : 'Face ID'}`
                    : `Unlock with ${mode === 'fingerprint' ? 'Fingerprint' : 'Face ID'}`}
                </span>
              </>
            )}
          </button>
        </div>

        {/* Fallback to PIN Button */}
        <button
          type="button"
          onClick={() => {
            sounds.playKeypadClick();
            if (onUsePin) {
              onUsePin();
            } else {
              onCancel();
            }
          }}
          className="mt-2.5 w-full py-2.5 rounded-2xl text-xs font-bold text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <KeyRound className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {contextType === 'transaction' ? 'Use UPI PIN instead' : 'Use App PIN instead'}
          </span>
        </button>
      </div>
    </div>
  );
};
