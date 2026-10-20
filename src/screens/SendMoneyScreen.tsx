import React, { useState } from 'react';
import {
  ArrowLeft,
  ArrowUpRight,
  AtSign,
  Building2,
  Calculator,
  Check,
  ChevronDown,
  MessageSquare,
  Phone,
  Plus,
  QrCode,
  Search,
  Smartphone,
  Sparkles,
  User,
  Users,
  X,
} from 'lucide-react';
import { BiometricPrompt } from '../components/BiometricPrompt';
import { PinPad } from '../components/PinPad';
import { StatusBar } from '../components/StatusBar';
import { sounds } from '../services/audio';
import { BankAccount, Contact } from '../types';

interface SendMoneyScreenProps {
  onBack: () => void;
  contacts: Contact[];
  banks: BankAccount[];
  initialContact?: Contact | null;
  userPin?: string;
  biometricEnabled?: boolean;
  onInitiatePayment: (payload: {
    recipientName: string;
    upiId: string;
    amount: number;
    note: string;
    bankAccountId: string;
    category: 'transfer';
    skipAuth?: boolean;
  }) => void;
  onAddContact?: (contact: Contact) => void;
}

export const SendMoneyScreen: React.FC<SendMoneyScreenProps> = ({
  onBack,
  contacts,
  banks,
  initialContact,
  userPin = '1234',
  biometricEnabled = true,
  onInitiatePayment,
  onAddContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(initialContact || null);
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const [selectedBankId, setSelectedBankId] = useState(banks[0]?.id || 'bank-canara');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [showBiometricModal, setShowBiometricModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');

  const selectedBank = banks.find((b) => b.id === selectedBankId) || banks[0];

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.upiId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const recentContacts = contacts.filter((c) => c.isRecent);

  const handleSelectContact = (c: Contact) => {
    sounds.playKeypadClick();
    setSelectedContact(c);
    setAmount('0');
  };

  const handleKeypadPress = (val: string) => {
    sounds.playKeypadClick();
    if (val === 'backspace') {
      if (amount.length <= 1 || amount === '0') {
        setAmount('0');
      } else {
        setAmount(amount.slice(0, -1));
      }
      return;
    }

    if (val === '.') {
      if (!amount.includes('.')) {
        setAmount(amount + '.');
      }
      return;
    }

    if (amount === '0') {
      setAmount(val);
    } else {
      if (amount.length < 7) {
        setAmount(amount + val);
      }
    }
  };

  const handleProceedToPin = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    sounds.playKeypadClick();
    if (biometricEnabled) {
      setShowBiometricModal(true);
    } else {
      setPin('');
      setPinError(false);
      setPinErrorMessage('');
      setShowPinModal(true);
    }
  };

  const handleBiometricSuccess = () => {
    setShowBiometricModal(false);
    sounds.playPaymentInitiate();
    const parsedAmount = parseFloat(amount);
    const recipientTitle = selectedContact
      ? selectedContact.name
      : searchQuery.trim().toUpperCase() || 'RECEIVER';
    const recipientUpi = selectedContact
      ? selectedContact.upiId
      : searchQuery.includes('@')
      ? searchQuery
      : `${searchQuery.toLowerCase()}@paynow`;

    onInitiatePayment({
      recipientName: recipientTitle,
      upiId: recipientUpi,
      amount: parsedAmount,
      note: note || 'Money transfer via PayNow',
      bankAccountId: selectedBank.id,
      category: 'transfer',
      skipAuth: true,
    });
  };

  const handleBiometricCancelToPin = () => {
    setShowBiometricModal(false);
    setPin('');
    setPinError(false);
    setPinErrorMessage('');
    setShowPinModal(true);
  };

  const handlePinSubmit = (val: string) => {
    if (val.length === 4) {
      const targetPin = userPin || '1234';
      if (val === targetPin || val === '1234') {
        sounds.playPaymentInitiate();
        setShowPinModal(false);
        const parsedAmount = parseFloat(amount);
        const recipientTitle = selectedContact
          ? selectedContact.name
          : searchQuery.trim().toUpperCase() || 'RECEIVER';
        const recipientUpi = selectedContact
          ? selectedContact.upiId
          : searchQuery.includes('@')
          ? searchQuery
          : `${searchQuery.toLowerCase()}@paynow`;

        onInitiatePayment({
          recipientName: recipientTitle,
          upiId: recipientUpi,
          amount: parsedAmount,
          note: note || 'Money transfer via PayNow',
          bankAccountId: selectedBank.id,
          category: 'transfer',
          skipAuth: true,
        });
      } else {
        sounds.playErrorSound();
        setPinError(true);
        setPinErrorMessage('Incorrect UPI PIN! Please try again.');
        setTimeout(() => {
          setPin('');
          setPinError(false);
        }, 1200);
      }
    }
  };

  // Pastel Avatar colors helper matching super.money
  const getAvatarColor = (name: string) => {
    const char = (name.trim()[0] || 'M').toUpperCase();
    if (char === 'V') return 'bg-[#E8F8EE] text-[#00875A]';
    if (char === 'M') return 'bg-[#FFF0B3] text-[#974F00]';
    if (char === 'K') return 'bg-[#EAE6FF] text-[#5B3DF5]';
    if (char === 'A') return 'bg-[#FFEBE5] text-[#DE350B]';
    return 'bg-[#EAE6FF] text-[#5B3DF5]';
  };

  return (
    <div className="flex-1 min-h-0 flex flex-col bg-[#F7F8FA] dark:bg-[#0E0E12] text-slate-900 dark:text-white overflow-hidden select-none">
      <StatusBar dark={false} />

      {/* ========================================================================= */}
      {/* SCREEN A: CONTACT SELECTION / SEARCH SCREEN (Frame 00:00 - 00:08)          */}
      {/* ========================================================================= */}
      {!selectedContact ? (
        <div className="flex-1 flex flex-col overflow-y-auto no-scrollbar">
          {/* Header */}
          <div className="px-5 pt-3 pb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={onBack}
              className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>
            <button
              type="button"
              className="p-2 text-slate-700 dark:text-slate-300 hover:text-[#5B3DF5]"
              title="Help"
            >
              <MessageSquare className="w-5 h-5" />
            </button>
          </div>

          <div className="px-5 space-y-4 pb-28">
            {/* Title & UPI apps subtitle */}
            <div>
              <h1 className="text-2xl font-black text-[#5B3DF5] tracking-tight">
                Send money to
              </h1>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                <span>any UPI app</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">•</span>
                <span className="font-bold text-[#4285F4]">GPay</span>
                <span className="font-bold text-[#5F259F]">PhonePe</span>
                <span className="font-bold text-[#00BAF2]">Paytm</span>
              </div>
            </div>

            {/* Blue Reward Banner from video: "Pay any 10 friends & get ₹10" */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-[#4A32E5] to-[#5B3DF5] text-white flex items-center justify-between shadow-md shadow-[#5B3DF5]/20">
              <div className="flex items-center gap-2.5">
                <div className="px-2 py-1 rounded-lg bg-emerald-500 text-slate-900 font-black text-xs">
                  ₹10
                </div>
                <p className="text-xs sm:text-sm font-bold">
                  Pay any 10 friends & get ₹10
                </p>
              </div>
              <ArrowUpRight className="w-4 h-4 stroke-[2.5]" />
            </div>

            {/* Search Input Bar */}
            <div className="flex items-center gap-2.5 px-3.5 py-3 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-200/90 dark:border-slate-800 shadow-xs">
              <Search className="w-4 h-4 text-slate-400 shrink-0" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search number or name or UPI ID"
                className="flex-1 bg-transparent text-sm font-medium text-slate-900 dark:text-white placeholder:text-slate-400 outline-none"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="p-1 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* If user types custom UPI query, show 1-click Pay option */}
            {searchQuery.trim().length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const name = searchQuery.trim();
                  const upi = name.includes('@') ? name : `${name.toLowerCase()}@paynow`;
                  setSelectedContact({
                    id: `c-manual-${Date.now()}`,
                    name,
                    phone: '',
                    upiId: upi,
                    avatarBg: 'bg-[#E8F8EE] text-[#00875A]',
                    initials: name.slice(0, 2).toUpperCase(),
                  });
                  setAmount('0');
                }}
                className="w-full p-3.5 rounded-2xl bg-[#5B3DF5] text-white flex items-center justify-between shadow-md shadow-[#5B3DF5]/30 cursor-pointer animate-in fade-in"
              >
                <div className="text-left">
                  <p className="text-xs font-bold">Transfer to &quot;{searchQuery}&quot;</p>
                  <p className="text-[11px] text-white/80 font-mono">
                    {searchQuery.includes('@') ? searchQuery : `${searchQuery.toLowerCase()}@paynow`}
                  </p>
                </div>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            )}

            {/* Quick Links (4 icons from video) */}
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-wider mb-2">
                Quick links
              </h2>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Self pay', icon: <Smartphone className="w-5 h-5 text-slate-700 dark:text-slate-200" /> },
                  { label: 'Mobile', icon: <Phone className="w-5 h-5 text-slate-700 dark:text-slate-200" /> },
                  { label: 'UPI ID/no.', icon: <AtSign className="w-5 h-5 text-slate-700 dark:text-slate-200" /> },
                  { label: 'Bank A/c', icon: <Building2 className="w-5 h-5 text-slate-700 dark:text-slate-200" /> },
                ].map((item) => (
                  <button
                    key={item.label}
                    type="button"
                    onClick={() => sounds.playKeypadClick()}
                    className="flex flex-col items-center gap-1.5 p-2 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-150 dark:border-slate-800 shadow-xs hover:border-[#5B3DF5]/40 transition-all cursor-pointer"
                  >
                    <div className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {item.icon}
                    </div>
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300">
                      {item.label}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggested Horizontal Row */}
            <div>
              <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-wider mb-2">
                Suggested
              </h2>
              <div className="flex items-center gap-3 overflow-x-auto no-scrollbar pb-1">
                {contacts.slice(0, 5).map((c) => {
                  const initial = (c.name.trim()[0] || 'V').toUpperCase();
                  const color = getAvatarColor(c.name);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => handleSelectContact(c)}
                      className="flex flex-col items-center gap-1.5 shrink-0 group cursor-pointer"
                    >
                      <div
                        className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm shadow-xs ${color}`}
                      >
                        {initial}
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-300 w-16 truncate text-center">
                        {c.name.split(' ')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Section matching video Frame 00:05 */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-wider">
                Recent
              </h2>
              <div className="bg-white dark:bg-[#1A1A22] rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-150 dark:border-slate-800 overflow-hidden shadow-xs">
                {recentContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${getAvatarColor(
                          contact.name
                        )}`}
                      >
                        {(contact.name.trim()[0] || 'M').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {contact.phone || contact.upiId}
                        </p>
                        {contact.pastStatus && (
                          <p className="text-[11px] font-bold text-red-500 mt-0.5 truncate">
                            {contact.pastStatus}
                          </p>
                        )}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* All Contacts */}
            <div className="space-y-2">
              <h2 className="text-xs font-black text-slate-900 dark:text-white tracking-wider">
                All
              </h2>
              <div className="bg-white dark:bg-[#1A1A22] rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-150 dark:border-slate-800 overflow-hidden shadow-xs">
                {filteredContacts.map((contact) => (
                  <button
                    key={contact.id}
                    type="button"
                    onClick={() => handleSelectContact(contact)}
                    className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center font-black text-sm shrink-0 shadow-xs ${getAvatarColor(
                          contact.name
                        )}`}
                      >
                        {(contact.name.trim()[0] || 'M').toUpperCase()}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                          {contact.name}
                        </p>
                        <p className="text-xs text-slate-400 font-mono truncate">
                          {contact.phone || contact.upiId}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ========================================================================= */
        /* SCREEN B: AMOUNT ENTRY & PAYMENT SHEET (Exact matching Frame 00:09 - 00:11)*/
        /* ========================================================================= */
        <div className="flex-1 flex flex-col justify-between overflow-hidden">
          {/* Top Header */}
          <div className="p-4 flex items-start gap-3 border-b border-slate-100 dark:border-slate-800/60 shrink-0">
            <button
              type="button"
              onClick={() => {
                sounds.playKeypadClick();
                setSelectedContact(null);
              }}
              className="w-10 h-10 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 flex items-center justify-center text-slate-800 dark:text-slate-200 cursor-pointer shrink-0 mt-0.5"
            >
              <ArrowLeft className="w-5 h-5 stroke-[2.2]" />
            </button>

            <div className="min-w-0 flex-1">
              {/* Receiver Name */}
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight truncate">
                {selectedContact.name}
              </h1>

              {/* UPI ID */}
              <p className="text-xs font-mono text-slate-400 truncate mt-0.5">
                UPI ID: {selectedContact.upiId}
              </p>

              {/* Status pill & See history link (Frame 00:09) */}
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                  <span>↗</span>
                  <span>{selectedContact.pastStatus || "Failed ₹1 | 13 October '26"}</span>
                </span>
                <span className="text-[11px] font-bold text-[#5B3DF5] dark:text-[#8B7CFA] hover:underline cursor-pointer">
                  See history
                </span>
              </div>
            </div>
          </div>

          {/* Amount Display & Quick Add Note */}
          <div className="flex-1 flex flex-col items-center justify-center px-6 py-4">
            {/* Currency Symbol and Typed Digits */}
            <div className="flex items-baseline justify-center gap-1 font-sans">
              <span className="text-4xl sm:text-5xl font-black text-slate-400">
                ₹
              </span>
              <span className="text-6xl sm:text-7xl font-black text-slate-900 dark:text-white tracking-tight tabular-nums">
                {amount}
              </span>
            </div>

            {/* Buttons Row below amount: "Add a note" + Calculator button */}
            <div className="flex items-center gap-2.5 mt-5">
              <button
                type="button"
                onClick={() => setShowNoteInput(!showNoteInput)}
                className="px-4 py-2 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5 shadow-xs hover:bg-slate-50 cursor-pointer"
              >
                <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                <span>{note ? note : 'Add a note'}</span>
              </button>

              <button
                type="button"
                onClick={() => sounds.playKeypadClick()}
                className="w-9 h-9 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center font-bold text-xs shadow-xs hover:bg-slate-50 cursor-pointer"
                title="Calculator"
              >
                <span>+-×÷</span>
              </button>
            </div>

            {/* Note input if open */}
            {showNoteInput && (
              <div className="w-full max-w-xs mt-3 animate-in fade-in">
                <input
                  type="text"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="What is this for? (e.g. Dinner, Fuel)"
                  className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-700 text-xs font-medium outline-none text-slate-900 dark:text-white"
                  autoFocus
                />
              </div>
            )}
          </div>

          {/* Bottom Card: Bank Selector + Bright Green "Pay ₹{amount}" Button + Built-in Keypad */}
          <div className="px-5 pb-5 space-y-3 shrink-0">
            {/* Bank Selector Card (Frame 00:10) */}
            <div className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#1A1A22] border border-slate-200 dark:border-slate-800 flex items-center justify-between shadow-xs">
              <div className="flex items-center gap-2.5">
                <span className="w-6 h-6 rounded-lg bg-blue-500/20 text-blue-600 inline-flex items-center justify-center text-xs font-bold">
                  🏦
                </span>
                <span className="font-bold text-sm text-slate-900 dark:text-white">
                  {selectedBank.bankName.split(' ')[0]} {selectedBank.accountNumberMasked.slice(-4)}
                </span>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400" />
            </div>

            {/* Primary Pay Button: When amount is 0 -> disabled gray. When > 0 -> Bright Lime Green! */}
            <button
              type="button"
              disabled={parseFloat(amount) <= 0}
              onClick={handleProceedToPin}
              className={`w-full py-4 rounded-full text-base font-black transition-all flex items-center justify-center shadow-md cursor-pointer ${
                parseFloat(amount) > 0
                  ? 'bg-[#B4F726] text-slate-900 shadow-[#B4F726]/30 hover:bg-[#a5ec14] active:scale-98'
                  : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed shadow-none'
              }`}
            >
              Pay ₹{parseFloat(amount) > 0 ? parseFloat(amount).toLocaleString('en-IN') : '0'}
            </button>

            {/* Built-in Keypad matching mobile keyboard in video */}
            <div className="grid grid-cols-3 gap-1.5 pt-1">
              {['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'backspace'].map((key) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleKeypadPress(key)}
                  className="py-3.5 rounded-2xl bg-white dark:bg-[#1A1A22] text-slate-900 dark:text-white font-bold text-lg hover:bg-slate-100 dark:hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center cursor-pointer shadow-xs"
                >
                  {key === 'backspace' ? '⌫' : key}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* UPI PIN Modal */}
      {showPinModal && (
        <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex flex-col justify-end sm:justify-center items-center p-0 sm:p-4 animate-in fade-in">
          <div className="w-full max-w-sm bg-white dark:bg-[#1A1A22] rounded-t-3xl sm:rounded-3xl p-6 border border-slate-200 dark:border-slate-800 shadow-2xl text-center space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                ENTER 4-DIGIT UPI PIN
              </span>
              <button
                type="button"
                onClick={() => setShowPinModal(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-500">
              Paying <span className="font-bold text-slate-900 dark:text-white">₹{amount}</span> to{' '}
              <span className="font-bold text-slate-900 dark:text-white">{selectedContact?.name}</span>
            </p>

            {pinErrorMessage ? (
              <div className="my-1 px-3 py-1 bg-red-500/10 border border-red-500/30 rounded-xl text-red-500 text-xs font-semibold animate-shake">
                {pinErrorMessage}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 mb-1">
                Demo UPI PIN: <span className="font-bold text-[#5B3DF5]">1234</span>
              </p>
            )}

            <PinPad
              pinLength={4}
              value={pin}
              onChange={(newPin) => {
                setPin(newPin);
                if (pinError) {
                  setPinError(false);
                  setPinErrorMessage('');
                }
              }}
              onSubmit={handlePinSubmit}
              isError={pinError}
              showBiometric={biometricEnabled}
              onBiometricClick={() => {
                setShowPinModal(false);
                setShowBiometricModal(true);
              }}
            />
          </div>
        </div>
      )}

      {/* Fingerprint / FaceID Transaction Authorization Simulation Modal */}
      <BiometricPrompt
        isOpen={showBiometricModal}
        onSuccess={handleBiometricSuccess}
        onCancel={() => setShowBiometricModal(false)}
        onUsePin={handleBiometricCancelToPin}
        title="Authorize Payment"
        subtitle={`Verify biometric to pay ₹${parseFloat(amount || '0').toLocaleString('en-IN')}`}
        contextType="transaction"
        transactionDetails={{
          amount: parseFloat(amount || '0'),
          recipientName: selectedContact?.name || searchQuery || 'Receiver',
          upiId:
            selectedContact?.upiId ||
            (searchQuery.includes('@') ? searchQuery : `${searchQuery.toLowerCase()}@paynow`),
          bankName: selectedBank.bankName,
          accountNumberMasked: selectedBank.accountNumberMasked,
          note: note || 'Money transfer via PayNow',
        }}
      />
    </div>
  );
};
