import React, { useState } from 'react';
import { Check, Copy, Share2, Sparkles, Users, X } from 'lucide-react';
import { sounds } from '../services/audio';
import { Contact, UserProfile } from '../types';

interface SplitBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  contacts: Contact[];
  user?: UserProfile;
  onRequestSent: (amountPerPerson: number, count: number, note: string) => void;
}

export const SplitBillModal: React.FC<SplitBillModalProps> = ({
  isOpen,
  onClose,
  contacts,
  user,
  onRequestSent,
}) => {
  const [totalAmount, setTotalAmount] = useState('1200');
  const [note, setNote] = useState('Dinner & Drinks split 🍕');
  const [selectedContacts, setSelectedContacts] = useState<string[]>([
    contacts[0]?.id || 'c1',
    contacts[1]?.id || 'c2',
  ]);
  const [copiedLink, setCopiedLink] = useState(false);

  if (!isOpen) return null;

  const total = parseFloat(totalAmount) || 0;
  // Included people = selected contacts + user
  const peopleCount = selectedContacts.length + 1;
  const splitAmount = peopleCount > 0 ? (total / peopleCount).toFixed(0) : '0';

  const toggleContact = (id: string) => {
    sounds.playKeypadClick();
    if (selectedContacts.includes(id)) {
      if (selectedContacts.length > 1) {
        setSelectedContacts(selectedContacts.filter((c) => c !== id));
      }
    } else {
      setSelectedContacts([...selectedContacts, id]);
    }
  };

  const handleSendRequest = () => {
    sounds.playSuccessChime();
    onRequestSent(parseFloat(splitAmount), selectedContacts.length, note);
    onClose();
  };

  const handleShareSplitLink = () => {
    sounds.playKeypadClick();
    const myVpa = user?.upiId || 'paynow@upi';
    const myName = user?.name || 'User';
    const shareText = `🍕 Split Bill Request: "${note}"\nTotal: ₹${total}\nPer person share: ₹${splitAmount}\nPlease transfer via UPI: upi://pay?pa=${encodeURIComponent(myVpa)}&pn=${encodeURIComponent(myName)}&am=${splitAmount}&tn=${encodeURIComponent(note)}`;
    if (navigator.share) {
      navigator.share({ title: 'PayNow Split Bill Request', text: shareText }).catch(() => {});
    } else if (navigator.clipboard) {
      navigator.clipboard.writeText(shareText);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  return (
    <div className="fixed sm:absolute inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs p-0 sm:p-3 animate-in fade-in duration-200">
      <div className="w-full max-w-[22rem] bg-white dark:bg-[#1A1A20] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl border-t sm:border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white max-h-[85vh] sm:max-h-[38rem] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[#5B3DF5]/10 text-[#5B3DF5] flex items-center justify-center">
              <Users className="w-4 h-4" />
            </div>
            <h3 className="text-sm font-bold">Split Bill & Request</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Total Bill Amount */}
        <div className="py-4 text-center">
          <span className="text-xs font-semibold text-slate-400">Total Bill Amount</span>
          <div className="flex items-center justify-center gap-1 text-3xl font-extrabold font-mono py-1">
            <span>₹</span>
            <input
              type="number"
              value={totalAmount}
              onChange={(e) => setTotalAmount(e.target.value)}
              className="w-36 text-center bg-transparent border-b-2 border-[#5B3DF5] outline-none"
            />
          </div>
          <input
            type="text"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a split description"
            className="w-full text-center text-xs text-slate-500 bg-transparent outline-none mt-1"
          />
        </div>

        {/* Split Breakdown Result */}
        <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-500/20 text-center my-2">
          <span className="text-xs text-emerald-800 dark:text-emerald-300 font-semibold">
            Each Person Pays ({peopleCount} people including you)
          </span>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-0.5">
            ₹{splitAmount}
          </p>
        </div>

        {/* Select Friends */}
        <div className="space-y-2 mt-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-1">
            Select Friends to Split With
          </span>
          <div className="space-y-2 max-h-48 overflow-y-auto no-scrollbar">
            {contacts.map((c) => {
              const isSelected = selectedContacts.includes(c.id);
              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => toggleContact(c.id)}
                  className={`w-full p-2.5 rounded-2xl border flex items-center justify-between text-left transition-all ${
                    isSelected
                      ? 'border-[#5B3DF5] bg-[#5B3DF5]/5 dark:bg-[#5B3DF5]/10'
                      : 'border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div className={`w-8 h-8 rounded-full ${c.avatarBg} text-white font-bold text-xs flex items-center justify-center`}>
                      {c.initials}
                    </div>
                    <div>
                      <p className="text-xs font-bold">{c.name}</p>
                      <p className="text-[10px] text-slate-400 font-mono">{c.upiId}</p>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-full flex items-center justify-center ${
                      isSelected ? 'bg-[#5B3DF5] text-white' : 'border border-slate-300 dark:border-slate-700'
                    }`}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Send Action */}
        <div className="mt-4 space-y-2">
          <button
            type="button"
            onClick={handleSendRequest}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white font-bold text-xs shadow-md shadow-[#5B3DF5]/30 active:scale-95 transition-all cursor-pointer"
          >
            Send In-App Requests (₹{splitAmount}/person)
          </button>

          <button
            type="button"
            onClick={handleShareSplitLink}
            className="w-full py-2.5 rounded-2xl text-xs font-bold text-white bg-[#25D366] hover:bg-[#20ba59] active:scale-98 transition-all flex items-center justify-center gap-1.5 shadow-xs cursor-pointer"
          >
            {copiedLink ? (
              <>
                <Check className="w-4 h-4" />
                <span>UPI Split Link Copied!</span>
              </>
            ) : (
              <>
                <Share2 className="w-4 h-4" />
                <span>Share Split Request Link</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
