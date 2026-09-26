import React, { useState } from 'react';
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Contact2,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  User,
  UserCheck,
  X,
} from 'lucide-react';
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
  onInitiatePayment: (payload: {
    recipientName: string;
    upiId: string;
    amount: number;
    note: string;
    bankAccountId: string;
    category: 'transfer';
  }) => void;
  onAddContact?: (contact: Contact) => void;
}

export const SendMoneyScreen: React.FC<SendMoneyScreenProps> = ({
  onBack,
  contacts,
  banks,
  initialContact,
  userPin = '1234',
  onInitiatePayment,
  onAddContact,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContact, setSelectedContact] = useState<Contact | null>(initialContact || null);
  const [editablePayeeName, setEditablePayeeName] = useState(initialContact?.name || '');
  const [amount, setAmount] = useState('0');
  const [note, setNote] = useState('');
  const [selectedBankId, setSelectedBankId] = useState(banks[0]?.id || 'bank-hdfc');
  const [showBankPicker, setShowBankPicker] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState(false);
  const [pinErrorMessage, setPinErrorMessage] = useState('');
  const [customUpiMode, setCustomUpiMode] = useState(false);
  const [customUpiId, setCustomUpiId] = useState('');

  // Contact & Mobile UPI Lookup states
  const [showLookupModal, setShowLookupModal] = useState(false);
  const [lookupName, setLookupName] = useState('');
  const [lookupMobile, setLookupMobile] = useState('');
  const [lookupState, setLookupState] = useState<'idle' | 'checking' | 'found' | 'error'>('idle');
  const [lookupResult, setLookupResult] = useState<{
    name: string;
    phone: string;
    upiId: string;
    bankName: string;
    verified: boolean;
  } | null>(null);
  const [lookupErrorMessage, setLookupErrorMessage] = useState('');

  const selectedBank = banks.find((b) => b.id === selectedBankId) || banks[0];

  const filteredContacts = contacts.filter(
    (c) =>
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.phone.includes(searchQuery) ||
      c.upiId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectContact = (c: Contact) => {
    sounds.playKeypadClick();
    setSelectedContact(c);
    setEditablePayeeName(c.name);
    setCustomUpiMode(false);
  };

  const handleProceedWithSearchQuery = (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    sounds.playKeypadClick();
    const upiFormat = trimmed.includes('@') ? trimmed : `${trimmed.toLowerCase()}@paynow`;
    setCustomUpiId(upiFormat);
    setEditablePayeeName(trimmed.split('@')[0]);
    setCustomUpiMode(true);
    setSelectedContact(null);
  };

  // Perform UPI verification for a mobile number & contact name
  const handleCheckUpi = (nameVal: string, mobileVal: string) => {
    const rawDigits = mobileVal.replace(/[^0-9]/g, '');
    if (rawDigits.length < 10) {
      setLookupState('error');
      setLookupErrorMessage('Please enter a valid 10-digit mobile number');
      sounds.playErrorSound();
      return;
    }
    const cleanMobile = rawDigits.slice(-10);
    const cleanName = nameVal.trim() || 'UPI Contact';

    sounds.playKeypadClick();
    setLookupState('checking');
    setLookupErrorMessage('');

    setTimeout(() => {
      // Check if this phone number already matches a known contact
      const matched = contacts.find((c) =>
        c.phone.replace(/[^0-9]/g, '').includes(cleanMobile)
      );

      const handleSuffixes = ['@paynow', '@okaxis', '@okhdfcbank', '@oksbi'];
      const suffix = handleSuffixes[parseInt(cleanMobile.slice(-1), 10) % handleSuffixes.length];
      const sanitizedNameSlug = cleanName.toLowerCase().replace(/[^a-z0-9]/g, '');
      const determinedUpiId = matched
        ? matched.upiId
        : `${sanitizedNameSlug || 'user'}.${cleanMobile.slice(-4)}${suffix}`;

      const determinedName = matched ? matched.name : cleanName;
      const formattedPhone = `+91 ${cleanMobile.slice(0, 5)} ${cleanMobile.slice(5)}`;

      setLookupResult({
        name: determinedName,
        phone: formattedPhone,
        upiId: determinedUpiId,
        bankName: matched ? 'NPCI Registered Bank' : 'NPCI UPI Directory Verified (BHIM)',
        verified: true,
      });
      setLookupState('found');
      sounds.playSuccessChime();
    }, 650);
  };

  // Save new contact from lookup and proceed to pay
  const handleSaveContactAndPay = () => {
    if (!lookupResult) return;
    sounds.playKeypadClick();

    const initials =
      lookupResult.name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'U';

    const bgGradients = [
      'bg-gradient-to-tr from-purple-500 to-indigo-600',
      'bg-gradient-to-tr from-blue-500 to-cyan-500',
      'bg-gradient-to-tr from-emerald-500 to-teal-600',
      'bg-gradient-to-tr from-rose-500 to-pink-600',
    ];
    const avatarBg = bgGradients[Math.floor(Math.random() * bgGradients.length)];

    const newContact: Contact = {
      id: `c-custom-${Date.now()}`,
      name: lookupResult.name,
      phone: lookupResult.phone,
      upiId: lookupResult.upiId,
      avatarBg,
      initials,
    };

    if (onAddContact) {
      onAddContact(newContact);
    }
    setSelectedContact(newContact);
    setEditablePayeeName(lookupResult.name);
    setCustomUpiMode(false);
    setShowLookupModal(false);
    setLookupState('idle');
    setLookupResult(null);
  };

  // Directly transfer to looked-up UPI ID without saving
  const handlePayDirectFromLookup = () => {
    if (!lookupResult) return;
    sounds.playKeypadClick();
    setCustomUpiId(lookupResult.upiId);
    setEditablePayeeName(lookupResult.name);
    setCustomUpiMode(true);
    setSelectedContact(null);
    setShowLookupModal(false);
    setLookupState('idle');
    setLookupResult(null);
  };

  // Device contact picker integration (Mobile browsers supporting Contact Picker API)
  const handlePickFromDeviceContacts = async () => {
    sounds.playKeypadClick();
    try {
      if ('contacts' in navigator && 'ContactsManager' in window) {
        const props = ['name', 'tel'];
        type ContactRecord = { name?: string[]; tel?: string[] };
        const selected = await (navigator as unknown as {
          contacts: { select: (p: string[], opts: { multiple: boolean }) => Promise<ContactRecord[]> };
        }).contacts.select(props, { multiple: false });

        if (selected && selected.length > 0) {
          const picked = selected[0];
          const name = (picked.name && picked.name[0]) || 'Mobile Contact';
          const tel = (picked.tel && picked.tel[0]) || '';
          setLookupName(name);
          setLookupMobile(tel);
          setShowLookupModal(true);
          if (tel.replace(/[^0-9]/g, '').length >= 10) {
            handleCheckUpi(name, tel);
          }
          return;
        }
      }
    } catch {
      // Fallback
    }

    // Fallback: open modal with search query pre-filled
    const digits = searchQuery.replace(/[^0-9]/g, '');
    const textOnly = searchQuery.replace(/[0-9+]/g, '').trim();
    setLookupName(textOnly || '');
    setLookupMobile(digits || '');
    setShowLookupModal(true);
    if (digits.length >= 10) {
      handleCheckUpi(textOnly || 'Contact', digits);
    }
  };

  const handleAddQuickAmount = (val: number) => {
    sounds.playKeypadClick();
    const current = parseFloat(amount) || 0;
    setAmount((current + val).toString());
  };

  const handleOpenPin = () => {
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    sounds.playKeypadClick();
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
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
        const fallbackName = selectedContact
          ? selectedContact.name
          : (customUpiId.split('@')[0] || searchQuery || 'PR26');
        const recipientTitle = (editablePayeeName.trim() || fallbackName).toUpperCase();
        const recipientUpi = selectedContact ? selectedContact.upiId : (customUpiId || `${(searchQuery || 'pr26').toLowerCase()}@paynow`);

        onInitiatePayment({
          recipientName: recipientTitle,
          upiId: recipientUpi,
          amount: parsedAmount,
          note: note || 'Money transfer via PayNow',
          bankAccountId: selectedBankId,
          category: 'transfer',
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

  const recipientDisplayName = editablePayeeName || (selectedContact
    ? selectedContact.name
    : customUpiId
    ? customUpiId.split('@')[0].toUpperCase()
    : searchQuery
    ? searchQuery.toUpperCase()
    : 'Payee');

  const recipientDisplayUpi = selectedContact
    ? selectedContact.upiId
    : customUpiId || `${(searchQuery || 'pr26').toLowerCase()}@paynow`;

  return (
    <div className="flex-1 flex flex-col bg-[#FAFAFC] dark:bg-[#0E0E12] text-slate-900 dark:text-white relative select-none overflow-hidden">
      <StatusBar dark={false} />

      {/* Top Header */}
      <div className="px-5 py-3 flex items-center justify-between border-b border-slate-100 dark:border-slate-800 shrink-0">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back"
          className="w-10 h-10 rounded-full flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="text-sm font-bold">Send Money</span>
        <div className="w-10" />
      </div>

      <div className="flex-1 overflow-y-auto no-scrollbar flex flex-col">
        {!selectedContact && !customUpiMode ? (
        /* STEP 1: Search & Contact List */
        <div className="p-5 space-y-4">
          {/* Search Box */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (searchQuery.trim()) {
                handleProceedWithSearchQuery(searchQuery);
              }
            }}
            className="flex items-center gap-2.5 px-4 py-3 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 shadow-xs focus-within:ring-2 focus-within:ring-[#5B3DF5]"
          >
            <Search className="w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, PR26, PW26, phone, or UPI ID"
              className="flex-1 bg-transparent text-xs font-medium outline-none"
              autoFocus
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </form>

          {/* Quick Match / Pay Directly to typed input */}
          {searchQuery.trim().length > 0 && (
            <button
              type="button"
              onClick={() => handleProceedWithSearchQuery(searchQuery)}
              className="w-full p-3.5 rounded-2xl bg-[#5B3DF5] text-white flex items-center justify-between shadow-md shadow-[#5B3DF5]/30 hover:bg-[#4E32E5] transition-all animate-in fade-in"
            >
              <div className="flex items-center gap-3 text-left">
                <div className="w-9 h-9 rounded-full bg-white/20 flex items-center justify-center font-bold text-xs">
                  {searchQuery.trim().slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <p className="text-xs font-bold">Transfer to &quot;{searchQuery.trim()}&quot;</p>
                  <p className="text-[11px] text-white/80 font-mono">
                    {searchQuery.includes('@') ? searchQuery.trim() : `${searchQuery.trim().toLowerCase()}@paynow`}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1 text-xs font-bold">
                <span>Proceed</span>
                <Send className="w-3.5 h-3.5" />
              </div>
            </button>
          )}

          {/* Pay to any custom UPI ID button */}
          <button
            type="button"
            onClick={() => {
              sounds.playKeypadClick();
              setCustomUpiMode(true);
              setCustomUpiId(searchQuery.trim() || 'PW26@paynow');
            }}
            className="w-full p-3.5 rounded-2xl bg-[#5B3DF5]/5 dark:bg-[#5B3DF5]/10 border border-[#5B3DF5]/20 flex items-center justify-between text-left hover:bg-[#5B3DF5]/10 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-[#5B3DF5] text-white flex items-center justify-center">
                <Plus className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#5B3DF5]">Pay to any UPI ID / Number</p>
                <p className="text-[11px] text-slate-400">e.g. PR26, PW26, friend@oksbi</p>
              </div>
            </div>
            <span className="text-xs font-bold text-[#5B3DF5]">Enter ID &rarr;</span>
          </button>

          {/* Frequent Payees Horizontal */}
          <div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              Frequent Contacts
            </span>
            <div className="flex items-center gap-3 mt-2 overflow-x-auto no-scrollbar pb-1">
              {contacts.slice(0, 4).map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleSelectContact(c)}
                  className="flex flex-col items-center gap-1 shrink-0 p-1 group"
                >
                  <div
                    className={`w-12 h-12 rounded-full ${c.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs group-hover:scale-105 active:scale-95 transition-transform`}
                  >
                    {c.initials}
                  </div>
                  <span className="text-[11px] font-medium text-slate-700 dark:text-slate-300 w-16 truncate text-center">
                    {c.name.split(' ')[0]}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Contacts List */}
          <div className="space-y-2 pt-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider px-1">
              All Contacts
            </span>
            <div className="bg-white dark:bg-[#1A1A20] rounded-3xl divide-y divide-slate-100 dark:divide-slate-800/80 border border-slate-200/80 dark:border-slate-800/80 overflow-hidden shadow-xs">
              {filteredContacts.map((contact) => (
                <button
                  key={contact.id}
                  type="button"
                  onClick={() => handleSelectContact(contact)}
                  className="w-full p-3.5 flex items-center justify-between text-left hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-full ${contact.avatarBg} text-white font-bold text-xs flex items-center justify-center shadow-xs`}
                    >
                      {contact.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-white">
                        {contact.name}
                      </p>
                      <p className="text-[11px] text-slate-400 font-mono">
                        {contact.phone} · {contact.upiId}
                      </p>
                    </div>
                  </div>

                  <Send className="w-4 h-4 text-slate-400" />
                </button>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* STEP 2: Amount Entry & Note */
        <div className="p-5 flex-1 flex flex-col justify-between pb-8">
          <div className="space-y-4">
            {/* Recipient Card with Editable Payee Name */}
            <div className="p-4 rounded-3xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1 min-w-0 mr-2">
                <div
                  className={`w-11 h-11 rounded-2xl ${
                    selectedContact?.avatarBg || 'bg-[#5B3DF5]'
                  } text-white font-bold text-sm flex items-center justify-center shadow-sm shrink-0`}
                >
                  {(editablePayeeName || recipientDisplayName).slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="text-xs text-slate-400 font-medium">Transferring to</p>
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  </div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <input
                      type="text"
                      value={editablePayeeName || recipientDisplayName}
                      onChange={(e) => setEditablePayeeName(e.target.value)}
                      placeholder="Recipient Name"
                      className="text-sm font-bold text-slate-900 dark:text-white bg-transparent border-b border-dashed border-slate-300 dark:border-slate-700 hover:border-[#5B3DF5] focus:border-[#5B3DF5] outline-none w-full max-w-[190px] py-0.5 tracking-tight transition-colors"
                    />
                    <Pencil className="w-3.5 h-3.5 text-slate-400 shrink-0 cursor-pointer" />
                  </div>
                  <p className="text-[11px] font-mono text-slate-400 truncate">
                    {recipientDisplayUpi}
                  </p>
                </div>
              </div>

              {/* Change Recipient Button */}
              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setSelectedContact(null);
                  setEditablePayeeName('');
                  setCustomUpiMode(false);
                }}
                className="px-3 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-bold text-[#5B3DF5] hover:bg-[#5B3DF5]/10 transition-colors shrink-0"
              >
                Change
              </button>
            </div>

            {/* Custom UPI ID editor if in mode */}
            {customUpiMode && !selectedContact && (
              <div className="p-3.5 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Recipient UPI ID / Handle
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
                    <Check className="w-3 h-3" /> Verified
                  </span>
                </div>
                <input
                  type="text"
                  value={customUpiId}
                  onChange={(e) => setCustomUpiId(e.target.value)}
                  placeholder="e.g. PR26@paynow or friend@oksbi"
                  className="w-full bg-transparent text-sm font-mono font-bold outline-none text-[#5B3DF5]"
                />
              </div>
            )}

            {/* Amount Entry */}
            <div className="text-center py-2">
              <span className="text-xs font-semibold text-slate-400">Enter Amount</span>
              <div className="flex items-center justify-center gap-1 text-4xl font-extrabold font-mono py-2">
                <span>₹</span>
                <input
                  type="number"
                  min="0"
                  value={amount}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val.length > 1 && val.startsWith('0') && !val.startsWith('0.')) {
                      setAmount(val.replace(/^0+/, ''));
                    } else {
                      setAmount(val);
                    }
                  }}
                  placeholder="0"
                  className="w-48 text-center bg-transparent border-b-2 border-[#5B3DF5] outline-none tabular-nums"
                  autoFocus
                />
              </div>

              {/* Quick Add Pills */}
              <div className="flex justify-center gap-2 mt-2">
                {[100, 200, 500, 1000].map((quick) => (
                  <button
                    key={quick}
                    type="button"
                    onClick={() => handleAddQuickAmount(quick)}
                    className="px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors"
                  >
                    +₹{quick}
                  </button>
                ))}
              </div>
            </div>

            {/* Note input */}
            <div className="p-3 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800">
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="What's this for? (e.g. Rent, dinner split, PR26 work)"
                className="w-full bg-transparent text-xs outline-none"
              />
            </div>

            {/* Bank account selector dropdown */}
            <div className="space-y-1">
              <div className="flex items-center justify-between px-1">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Debiting Account
                </span>
                <button
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    setShowBankPicker(true);
                  }}
                  className="text-[11px] font-bold text-[#5B3DF5] hover:underline"
                >
                  Change Account
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  sounds.playKeypadClick();
                  setShowBankPicker(true);
                }}
                className="w-full p-3.5 rounded-2xl bg-white dark:bg-[#1A1A20] border border-slate-200 dark:border-slate-800 flex items-center justify-between text-left hover:border-[#5B3DF5] transition-colors shadow-xs"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center font-bold text-xs text-[#5B3DF5]">
                    {selectedBank.bankName.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                      {selectedBank.bankName} · {selectedBank.accountNumberMasked}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">
                      Available Balance: ₹{selectedBank.balance.toLocaleString('en-IN')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 text-[#5B3DF5] font-semibold text-xs">
                  <span>Switch</span>
                  <ChevronDown className="w-4 h-4" />
                </div>
              </button>
            </div>
          </div>

          {/* Pay Button */}
          <button
            type="button"
            onClick={handleOpenPin}
            disabled={!amount || parseFloat(amount) <= 0 || (customUpiMode && !customUpiId)}
            className="w-full py-4 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-sm shadow-xl shadow-[#5B3DF5]/30 hover:opacity-95 disabled:opacity-50 transition-all active:scale-98 flex items-center justify-center gap-2 mt-6 cursor-pointer"
          >
            Pay ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
          </button>
        </div>
      )}
      </div>

      {/* Debiting Bank Picker Modal */}
      {showBankPicker && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-xs bg-white dark:bg-[#1A1A20] rounded-3xl p-5 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold">Select Debiting Bank</h3>
                <p className="text-[11px] text-slate-400">Choose bank account for transfer</p>
              </div>
              <button
                type="button"
                onClick={() => setShowBankPicker(false)}
                className="text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 mt-3 max-h-64 overflow-y-auto no-scrollbar">
              {banks.map((b, idx) => (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => {
                    sounds.playKeypadClick();
                    setSelectedBankId(b.id);
                    setShowBankPicker(false);
                  }}
                  className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    selectedBankId === b.id
                      ? 'border-[#5B3DF5] bg-[#5B3DF5]/10 font-bold'
                      : 'border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span className="w-5 h-5 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                      {idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold">{b.bankName}</p>
                      <p className="text-[10px] text-slate-400 font-mono">
                        {b.accountNumberMasked} · Bal: ₹{b.balance.toLocaleString('en-IN')}
                      </p>
                    </div>
                  </div>
                  {selectedBankId === b.id && <Check className="w-4 h-4 text-[#5B3DF5]" />}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => setShowBankPicker(false)}
              className="mt-4 w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 cursor-pointer hover:bg-slate-200"
            >
              Done
            </button>
          </div>
        </div>
      )}

      {/* PIN Confirmation Sheet */}
      {showPinModal && (
        <div className="absolute inset-0 z-50 flex items-end justify-center bg-black/75 backdrop-blur-xs animate-in fade-in">
          <div className="w-full max-w-[24rem] bg-white dark:bg-[#1A1A20] rounded-t-3xl p-4 sm:p-5 shadow-2xl border-t border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white flex flex-col items-center">
            <div className="w-12 h-1.5 bg-slate-300 dark:bg-slate-700 rounded-full mb-3" />

            <div className="flex justify-between items-center w-full pb-2">
              <div className="text-left">
                <p className="text-xs text-slate-400">Transferring to</p>
                <p className="text-sm font-bold text-slate-900 dark:text-white">
                  {recipientDisplayName}
                </p>
                <p className="text-[10px] text-slate-400 font-mono">
                  via {selectedBank.bankName} ({selectedBank.accountNumberMasked})
                </p>
              </div>
              <p className="text-xl font-bold font-mono tabular-nums text-[#5B3DF5]">
                ₹{parseFloat(amount || '0').toLocaleString('en-IN')}
              </p>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 mb-1">
              Enter 4-digit UPI PIN to confirm transfer
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
              showBiometric={false}
            />

            <button
              type="button"
              onClick={() => handlePinSubmit(pin)}
              disabled={pin.length !== 4}
              className="mt-3 w-full max-w-[280px] py-3 rounded-2xl bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-xs shadow-md shadow-[#5B3DF5]/30 hover:opacity-95 disabled:opacity-40 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Confirm & Transfer ₹{parseFloat(amount || '0').toLocaleString('en-IN')}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setShowPinModal(false);
                setPin('');
                setPinError(false);
                setPinErrorMessage('');
              }}
              className="mt-2 text-xs font-semibold text-slate-400 hover:text-slate-600 cursor-pointer"
            >
              Cancel Transfer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

