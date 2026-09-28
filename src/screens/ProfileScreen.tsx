import React, { useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  CreditCard,
  Fingerprint,
  HelpCircle,
  KeyRound,
  Lock,
  LogOut,
  Plus,
  QrCode,
  RotateCcw,
  Shield,
  Smartphone,
  Volume2,
  Play,
  Pencil,
  User,
  Phone,
  AtSign,
  AlertCircle,
  Zap,
  CheckCircle2,
  Upload,
  RefreshCw,
  Music,
  FileAudio,
  X,
  Sun,
  Moon,
  Palette,
} from 'lucide-react';
import { PinPad } from '../components/PinPad';
import { StatusBar } from '../components/StatusBar';
import { sounds, CustomToneMeta } from '../services/audio';
import { ThemeMode } from '../services/theme';
import { BankAccount, UserProfile } from '../types';

interface ProfileScreenProps {
  user: UserProfile;
  banks: BankAccount[];
  themeMode: ThemeMode;
  onSetThemeMode: (mode: ThemeMode) => void;
  onUpdateUser: (updated: Partial<UserProfile>) => void;
  onSetPrimaryBank: (bankId: string) => void;
  onOpenMyQr: () => void;
  onLockApp: () => void;
  onResetApp: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  user,
  banks,
  themeMode,
  onSetThemeMode,
  onUpdateUser,
  onSetPrimaryBank,
  onOpenMyQr,
  onLockApp,
  onResetApp,
}) => {
  // Edit Profile States
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [editName, setEditName] = useState(user.name);
  const [editPhone, setEditPhone] = useState(user.phone);
  const [editUpiId, setEditUpiId] = useState(user.upiId);
  const [showToast, setShowToast] = useState(false);

  // Custom Audio Tones State
  const [customTones, setCustomTones] = useState<CustomToneMeta>(sounds.getCustomToneMeta());
  const [soundToast, setSoundToast] = useState<string | null>(null);

  // Super Pay Reset Modal State
  const [showResetConfirmModal, setShowResetConfirmModal] = useState(false);

  // Change PIN States
  const [showChangePinModal, setShowChangePinModal] = useState(false);
  const [changePinStep, setChangePinStep] = useState<'old' | 'new' | 'confirm'>('old');
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmNewPin, setConfirmNewPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMsg, setPinErrorMsg] = useState('');

  const [showAddBankModal, setShowAddBankModal] = useState(false);

  const handleOpenEditProfile = () => {
    sounds.playKeypadClick();
    setEditName(user.name);
    setEditPhone(user.phone);
    setEditUpiId(user.upiId);
    setShowEditProfileModal(true);
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editName.trim()) return;

    sounds.playPaymentInitiate();
    onUpdateUser({
      name: editName.trim(),
      phone: editPhone.trim(),
      upiId: editUpiId.trim() || `${editName.trim().toLowerCase().replace(/\s+/g, '.')}@paynow`,
    });
    setShowEditProfileModal(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2500);
  };

  // Custom Audio File Upload Handler
  const handleAudioUpload = (type: 'success' | 'failure' | 'initiate', file: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUri = e.target?.result as string;
      if (dataUri) {
        await sounds.setCustomSound(type, dataUri, file.name);
        setCustomTones(sounds.getCustomToneMeta());
        const label =
          type === 'success'
            ? 'Payment Success'
            : type === 'failure'
            ? 'Payment Failure'
            : 'Transaction Initiate';
        setSoundToast(`Custom ${label} tone loaded: "${file.name}"`);
        setTimeout(() => setSoundToast(null), 3500);

        // Immediate audio preview so user can verify
        if (type === 'success') sounds.playPaymentSuccess();
        else if (type === 'failure') sounds.playPaymentFailure();
        else sounds.playPaymentInitiate();
      }
    };
    reader.readAsDataURL(file);
  };

  const handleResetTone = (type: 'success' | 'failure' | 'initiate') => {
    sounds.resetSound(type);
    setCustomTones(sounds.getCustomToneMeta());
    const label =
      type === 'success'
        ? 'Payment Success'
        : type === 'failure'
        ? 'Payment Failure'
        : 'Transaction Initiate';
    setSoundToast(`Reset ${label} to default built-in tone`);
    setTimeout(() => setSoundToast(null), 2500);
  };

  const handleStartChangePin = () => {
    sounds.playKeypadClick();
    setOldPin('');
    setNewPin('');
    setConfirmNewPin('');
    setChangePinStep('old');
    setPinError(false);
    setPinErrorMsg('');
    setShowChangePinModal(true);
  };

  const handleOldPinSubmit = (val: string) => {
    setOldPin(val);
    if (val.length === 4) {
      if (val === user.pinHash || val === '1234') {
        sounds.playSuccessChime();
        setPinError(false);
        setPinErrorMsg('');
        setTimeout(() => setChangePinStep('new'), 300);
      } else {
        sounds.playErrorSound();
        setPinError(true);
        setPinErrorMsg('Current PIN is incorrect');
        setTimeout(() => {
          setOldPin('');
          setPinError(false);
        }, 600);
      }
    }
  };

  const handleNewPinSubmit = (val: string) => {
    setNewPin(val);
    if (val.length === 4) {
      sounds.playKeypadClick();
      setTimeout(() => setChangePinStep('confirm'), 300);
    }
  };

  const handleConfirmNewPinSubmit = (val: string) => {
    setConfirmNewPin(val);
    if (val.length === 4) {
      if (val === newPin) {
        sounds.playSuccessChime();
        onUpdateUser({ pinHash: newPin });
        setShowChangePinModal(false);
        alert('App PIN changed successfully!');
      } else {
        sounds.playErrorSound();
        setPinError(true);
        setPinErrorMsg('New PINs do not match');
        setTimeout(() => {
          setConfirmNewPin('');
          setPinError(false);
        }, 600);
      }
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white pb-32 sm:pb-36 overflow-y-auto no-scrollbar select-none">
      <StatusBar dark={false} />

      {/* Top Profile Header */}
      <div className="px-5 pt-3 pb-4 flex flex-col items-center text-center">
        {showToast && (
          <div className="mb-3 px-4 py-2 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Profile updated successfully!</span>
          </div>
        )}

        <div className="relative mb-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white flex items-center justify-center font-bold text-2xl shadow-xl shadow-[#5B3DF5]/30">
            {user.name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'RS'}
          </div>
          {/* Edit Profile pencil on avatar */}
          <button
            type="button"
            onClick={handleOpenEditProfile}
            className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-[#5B3DF5] text-white flex items-center justify-center border-2 border-white dark:border-[#0E0E12] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="Edit Profile Name & Details"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          {/* QR Code button */}
          <button
            type="button"
            onClick={onOpenMyQr}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-slate-900 text-white flex items-center justify-center border-2 border-white dark:border-[#0E0E12] shadow-sm hover:scale-105 active:scale-95 transition-all cursor-pointer"
            title="My UPI QR Code"
          >
            <QrCode className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            {user.name}
          </h2>
          <button
            type="button"
            onClick={handleOpenEditProfile}
            className="text-slate-400 hover:text-[#5B3DF5] transition-colors"
            title="Edit Name"
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
        </div>

        <p className="text-xs text-slate-400 font-mono mt-0.5">{user.phone}</p>
        <div className="mt-2 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] text-xs font-mono font-semibold">
          <span>{user.upiId}</span>
        </div>

        {/* Change Profile Name Button */}
        <button
          type="button"
          onClick={handleOpenEditProfile}
          className="mt-3.5 inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white dark:bg-[#1A1A20] hover:bg-[#5B3DF5]/10 hover:border-[#5B3DF5] text-[#5B3DF5] text-xs font-bold border border-slate-200 dark:border-slate-800 shadow-xs transition-all active:scale-95 cursor-pointer"
        >
          <Pencil className="w-3.5 h-3.5" />
          <span>Edit Profile Details</span>
        </button>
      </div>

      <div className="px-5 space-y-4">
        {/* Linked Bank Accounts */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Linked Bank Accounts
            </span>
            <button
              type="button"
              onClick={() => setShowAddBankModal(true)}
              className="text-xs font-bold text-[#5B3DF5] flex items-center gap-1 hover:underline"
            >
              <Plus className="w-3.5 h-3.5" />
              Add Bank
            </button>
          </div>

          <div className="space-y-2">
            {banks.map((bank) => (
              <div
                key={bank.id}
                className={`p-3.5 rounded-2xl border transition-all flex items-center justify-between ${
                  bank.isPrimary
                    ? 'border-[#5B3DF5] bg-[#5B3DF5]/5 dark:bg-[#5B3DF5]/10'
                    : 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-[#15151b]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center justify-center">
                    {bank.logo}
                  </div>
                  <div className="text-xs">
                    <div className="flex items-center gap-1.5">
                      <p className="font-bold text-slate-900 dark:text-white">
                        {bank.bankName}
                      </p>
                      {bank.isPrimary && (
                        <span className="px-1.5 py-0.2 rounded-md bg-[#5B3DF5] text-white text-[9px] font-bold">
                          Primary
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-400 font-mono">
                      {bank.accountNumberMasked} · Bal: ₹{bank.balance.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>

                {!bank.isPrimary && (
                  <button
                    type="button"
                    onClick={() => {
                      sounds.playKeypadClick();
                      onSetPrimaryBank(bank.id);
                    }}
                    className="text-[11px] font-semibold text-[#5B3DF5] hover:underline"
                  >
                    Set Primary
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security & Preferences */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-1 divide-y divide-slate-100 dark:divide-slate-800/80">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
            Display & Appearance
          </span>

          {/* Theme Mode Selector (Dark, Light, Auto) */}
          <div className="py-3 px-1 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Palette className="w-5 h-5 text-[#5B3DF5]" />
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white">App Theme (தீம் மோட்)</p>
                  <p className="text-[11px] text-slate-400">
                    {themeMode === 'system'
                      ? 'Auto (Phone settings / போன் செட்டிங்ஸ்)'
                      : themeMode === 'dark'
                      ? 'Black Theme (இருண்ட பிளாக் தீம்)'
                      : 'White Theme (வெளிச்ச ஒயிட் தீம்)'}
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] uppercase">
                {themeMode}
              </span>
            </div>

            {/* 3-Way Segmented Control */}
            <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/60 dark:border-slate-700/60">
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  onSetThemeMode('light');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'light'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-200'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5 text-amber-500" />
                <span>Light</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  onSetThemeMode('dark');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'dark'
                    ? 'bg-[#121217] text-white shadow-sm ring-1 ring-[#5B3DF5]/40'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5 text-[#A16CFF]" />
                <span>Dark</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  onSetThemeMode('system');
                }}
                className={`py-2 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  themeMode === 'system'
                    ? 'bg-gradient-to-r from-[#5B3DF5] to-[#7C3AED] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Auto</span>
              </button>
            </div>
          </div>

          <div className="pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2 px-1">
              Security & Controls
            </span>
          </div>

          {/* Change PIN */}
          <button
            type="button"
            onClick={handleStartChangePin}
            className="w-full py-3 px-1 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-xl transition-colors"
          >
            <div className="flex items-center gap-3">
              <KeyRound className="w-5 h-5 text-[#5B3DF5]" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Change App PIN</p>
                <p className="text-[11px] text-slate-400">Update your 4-digit security PIN</p>
              </div>
            </div>
            <ChevronRight className="w-4 h-4 text-slate-400" />
          </button>

          {/* Biometrics Toggle */}
          <div className="py-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Fingerprint className="w-5 h-5 text-[#5B3DF5]" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Android Biometrics</p>
                <p className="text-[11px] text-slate-400">Unlock with Fingerprint or Face</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={user.biometricEnabled}
              onChange={(e) => {
                sounds.playKeypadClick();
                onUpdateUser({ biometricEnabled: e.target.checked });
              }}
              className="w-5 h-5 accent-[#5B3DF5] cursor-pointer"
            />
          </div>

          {/* Audio Sounds Toggle */}
          <div className="py-3 px-1 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="w-5 h-5 text-[#5B3DF5]" />
              <div>
                <p className="text-xs font-bold text-slate-900 dark:text-white">Audio & Keypad Clicks</p>
                <p className="text-[11px] text-slate-400">Sound effects on tap & payment</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={user.soundEnabled}
              onChange={(e) => {
                sounds.enabled = e.target.checked;
                onUpdateUser({ soundEnabled: e.target.checked });
              }}
              className="w-5 h-5 accent-[#5B3DF5] cursor-pointer"
            />
          </div>

          {/* Sound Testing & Custom Upload Section */}
          <div className="pt-3 pb-1 px-1">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[11px] font-bold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                <Volume2 className="w-3.5 h-3.5 text-[#5B3DF5]" />
                UPI Sound Effects & Custom Tones
              </span>
              <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mb-3">
              Play tones or upload your own custom audio files (.mp3, .wav, .m4a) for payment alerts:
            </p>

            {soundToast && (
              <div className="mb-3 px-3.5 py-2 rounded-xl bg-[#5B3DF5]/10 border border-[#5B3DF5]/30 text-[#5B3DF5] dark:text-[#A16CFF] text-xs font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-1">
                <Music className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">{soundToast}</span>
              </div>
            )}

            <div className="space-y-2.5">
              {/* 1. SUCCESS SOUND */}
              <div className="p-3.5 rounded-2xl bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                      <Volume2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Payment Success Tone
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {customTones.isCustomSuccess
                          ? `Custom: ${customTones.successFileName}`
                          : 'Default UPI signature bell & chime (~4s)'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      customTones.isCustomSuccess
                        ? 'bg-emerald-500 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {customTones.isCustomSuccess ? 'Custom' : 'Default'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  {/* Play / Test Button */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.enabled = true;
                      sounds.playPaymentSuccess();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-emerald-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-emerald-600 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Test Play</span>
                  </button>

                  {/* Upload Custom Audio Button */}
                  <label className="flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-[#1A1A20] border border-emerald-500/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-emerald-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{customTones.isCustomSuccess ? 'Change Audio' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAudioUpload('success', file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Reset to Default */}
                  {customTones.isCustomSuccess && (
                    <button
                      type="button"
                      onClick={() => handleResetTone('success')}
                      title="Reset to default chime"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 2. FAILURE SOUND */}
              <div className="p-3.5 rounded-2xl bg-rose-500/5 dark:bg-rose-500/10 border border-rose-500/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-500">
                      <AlertCircle className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Payment Failure Tone
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {customTones.isCustomFailure
                          ? `Custom: ${customTones.failureFileName}`
                          : 'Default UPI decline & error buzzer (~1.2s)'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      customTones.isCustomFailure
                        ? 'bg-rose-500 text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {customTones.isCustomFailure ? 'Custom' : 'Default'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  {/* Play / Test Button */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.enabled = true;
                      sounds.playPaymentFailure();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-rose-500 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-rose-600 active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Test Play</span>
                  </button>

                  {/* Upload Custom Audio Button */}
                  <label className="flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-[#1A1A20] border border-rose-500/40 text-rose-600 dark:text-rose-400 text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-rose-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{customTones.isCustomFailure ? 'Change Audio' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAudioUpload('failure', file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Reset to Default */}
                  {customTones.isCustomFailure && (
                    <button
                      type="button"
                      onClick={() => handleResetTone('failure')}
                      title="Reset to default decline buzzer"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* 3. INITIATE SOUND */}
              <div className="p-3.5 rounded-2xl bg-[#5B3DF5]/5 dark:bg-[#5B3DF5]/10 border border-[#5B3DF5]/20 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-full bg-[#5B3DF5]/20 flex items-center justify-center text-[#5B3DF5]">
                      <Zap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-xs font-bold text-slate-900 dark:text-white">
                          Transaction Initiate Tone
                        </p>
                        <span className="w-1.5 h-1.5 rounded-full bg-[#5B3DF5]" />
                      </div>
                      <p className="text-[10px] text-slate-400 truncate max-w-[190px]">
                        {customTones.isCustomInitiate
                          ? `Custom: ${customTones.initiateFileName}`
                          : 'Default subtle confirmation pulse (~0.2s)'}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                      customTones.isCustomInitiate
                        ? 'bg-[#5B3DF5] text-white shadow-xs'
                        : 'bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    {customTones.isCustomInitiate ? 'Custom' : 'Default'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-0.5">
                  {/* Play / Test Button */}
                  <button
                    type="button"
                    onClick={() => {
                      sounds.enabled = true;
                      sounds.playPaymentInitiate();
                    }}
                    className="flex-1 py-1.5 px-3 rounded-xl bg-[#5B3DF5] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-[#4d32d0] active:scale-95 transition-all cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current ml-0.5" />
                    <span>Test Play</span>
                  </button>

                  {/* Upload Custom Audio Button */}
                  <label className="flex-1 py-1.5 px-3 rounded-xl bg-white dark:bg-[#1A1A20] border border-[#5B3DF5]/40 text-[#5B3DF5] dark:text-[#A16CFF] text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs hover:bg-slate-50 dark:hover:bg-slate-800 active:scale-95 transition-all cursor-pointer">
                    <Upload className="w-3 h-3" />
                    <span>{customTones.isCustomInitiate ? 'Change Audio' : 'Upload File'}</span>
                    <input
                      type="file"
                      accept="audio/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleAudioUpload('initiate', file);
                        e.target.value = '';
                      }}
                    />
                  </label>

                  {/* Reset to Default */}
                  {customTones.isCustomInitiate && (
                    <button
                      type="button"
                      onClick={() => handleResetTone('initiate')}
                      title="Reset to default pulse"
                      className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-300 transition-colors cursor-pointer"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Account Actions */}
        <div className="bg-white dark:bg-[#1A1A20] rounded-3xl p-4 border border-slate-200/80 dark:border-slate-800/80 shadow-xs space-y-2">
          {/* Lock App */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              onLockApp();
            }}
            className="w-full py-2.5 px-3 rounded-2xl flex items-center gap-3 text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors text-amber-600 dark:text-amber-400"
          >
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold">Lock App (Show PIN Screen)</span>
          </button>

          {/* Reset App to fresh demo onboarding */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setShowResetConfirmModal(true);
            }}
            className="w-full py-2.5 px-3 rounded-2xl flex items-center gap-3 text-left hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors text-slate-500 hover:text-red-500 cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
            <span className="text-xs font-bold">Reset Demo to First-Time Onboarding</span>
          </button>
        </div>
      </div>

      {/* Change PIN Modal */}
      {showChangePinModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A20] rounded-t-3xl p-6 shadow-2xl border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col items-center">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-3" />

            <div className="flex justify-between items-center w-full pb-2">
              <h3 className="text-base font-bold">Change App PIN</h3>
              <button
                type="button"
                onClick={() => setShowChangePinModal(false)}
                className="text-slate-400"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-2 text-center">
              {changePinStep === 'old'
                ? 'Enter your current 4-digit PIN (default: 1234)'
                : changePinStep === 'new'
                ? 'Enter your new 4-digit PIN'
                : 'Confirm your new 4-digit PIN'}
            </p>

            {pinErrorMsg && (
              <p className="text-xs font-bold text-red-500 mb-2 animate-shake">
                {pinErrorMsg}
              </p>
            )}

            {changePinStep === 'old' && (
              <PinPad
                value={oldPin}
                onChange={handleOldPinSubmit}
                isError={pinError}
                showBiometric={false}
              />
            )}

            {changePinStep === 'new' && (
              <PinPad
                value={newPin}
                onChange={handleNewPinSubmit}
                showBiometric={false}
              />
            )}

            {changePinStep === 'confirm' && (
              <PinPad
                value={confirmNewPin}
                onChange={handleConfirmNewPinSubmit}
                isError={pinError}
                showBiometric={false}
              />
            )}
          </div>
        </div>
      )}

      {/* Add Bank Modal */}
      {showAddBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-[#1A1A20] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Link Bank Account
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Select your bank to discover accounts
            </p>

            <div className="my-4 space-y-2 text-left">
              {['Kotak Mahindra Bank', 'Punjab National Bank', 'Bank of Baroda'].map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => {
                    sounds.playSuccessChime();
                    setShowAddBankModal(false);
                    alert(`${b} linked successfully! Account XXXXXX3912 ready.`);
                  }}
                  className="w-full p-3 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-bold flex items-center justify-between"
                >
                  <span>{b}</span>
                  <ChevronRight className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowAddBankModal(false)}
              className="w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A20] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center">
                  <Pencil className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Edit Profile Details
                  </h3>
                  <p className="text-[11px] text-slate-400">Update your name, mobile, and UPI ID</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowEditProfileModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Avatar Preview */}
            <div className="flex justify-center">
              <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-[#5B3DF5] to-[#8B7CFA] text-white flex items-center justify-center font-bold text-xl shadow-lg shadow-[#5B3DF5]/20">
                {editName.trim().split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase() || 'U'}
              </div>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-4">
              {/* Full Name */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => {
                    setEditName(e.target.value);
                  }}
                  placeholder="e.g. Pravin Kumar"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#141419] text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/40"
                />
              </div>

              {/* Phone Number */}
              <div className="space-y-1.5 text-left">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#5B3DF5]" />
                  Mobile Number
                </label>
                <input
                  type="tel"
                  required
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#141419] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/40"
                />
              </div>

              {/* UPI ID */}
              <div className="space-y-1.5 text-left">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                    <AtSign className="w-3.5 h-3.5 text-[#5B3DF5]" />
                    UPI Address (VPA)
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      if (editName.trim()) {
                        const generated = `${editName.trim().toLowerCase().replace(/\s+/g, '.')}@paynow`;
                        setEditUpiId(generated);
                      }
                    }}
                    className="text-[10px] text-[#5B3DF5] font-semibold hover:underline"
                  >
                    Auto-fill from name
                  </button>
                </div>
                <input
                  type="text"
                  required
                  value={editUpiId}
                  onChange={(e) => setEditUpiId(e.target.value)}
                  placeholder="name@paynow"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-[#141419] text-sm text-slate-900 dark:text-white font-mono focus:outline-none focus:ring-2 focus:ring-[#5B3DF5]/40"
                />
              </div>

              <div className="pt-2 flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowEditProfileModal(false)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#5B3DF5] hover:bg-[#4d32d0] text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-md shadow-[#5B3DF5]/30 transition-all active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>Save Changes</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Super Pay Reset Demo Confirmation Modal */}
      {showResetConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A20] rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 text-center animate-in zoom-in-95 duration-200 space-y-4">
            <div className="relative mx-auto w-16 h-16 flex items-center justify-center">
              <img
                src="./logo.svg"
                alt="Super Pay"
                className="w-16 h-16 rounded-2xl shadow-xl shadow-[#5B3DF5]/30 object-contain ring-2 ring-[#5B3DF5]/40"
              />
            </div>

            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-[#5B3DF5]/10 text-[#5B3DF5] dark:text-[#8B7CFA] text-[10px] font-extrabold uppercase tracking-wider mb-1">
                SUPER PAY RESET
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Reset to Onboarding?
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 leading-relaxed">
                This will clear all new transactions, reset bank balances, and take you through the complete Super Pay onboarding setup with custom name and account numbers.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={() => {
                  sounds.playSuccessChime();
                  setShowResetConfirmModal(false);
                  onResetApp();
                }}
                className="w-full py-3.5 rounded-2xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-500/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Yes, Reset to Super Pay Onboarding</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowResetConfirmModal(false);
                }}
                className="w-full py-3 rounded-2xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold text-xs transition-colors cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
