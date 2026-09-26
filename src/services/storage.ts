import {
  BankAccount,
  Contact,
  FixedDepositItem,
  NotificationItem,
  SuperCardInfo,
  Transaction,
  UserProfile,
} from '../types';
import {
  INITIAL_BANKS,
  INITIAL_CONTACTS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SUPER_CARD,
  INITIAL_SUPER_FDS,
  INITIAL_TRANSACTIONS,
} from './mockData';

const STORAGE_KEYS = {
  USER_PROFILE: 'paynow_user_profile_v1',
  BANKS: 'paynow_banks_v1',
  TRANSACTIONS: 'paynow_transactions_v1',
  NOTIFICATIONS: 'paynow_notifications_v1',
  SUPER_CARD: 'paynow_super_card_v1',
  SUPER_FDS: 'paynow_super_fds_v1',
  CONTACTS: 'paynow_contacts_v1',
};

// Default User Profile
const DEFAULT_USER: UserProfile = {
  name: 'RAHUL SHARMA',
  phone: '+91 98765 43210',
  email: 'rahul.sharma@example.com',
  upiId: 'rahul.sharma@superpay',
  pinHash: '1234', // Constant 4-digit PIN (1234)
  biometricEnabled: true,
  soundEnabled: true,
  hapticsEnabled: true,
  isOnboarded: true, // Default to true so user immediately sees PIN login, can reset to onboarding
  locked: true,
};

export const storage = {
  getUserProfile(): UserProfile {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_PROFILE);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return DEFAULT_USER;
  },

  saveUserProfile(profile: UserProfile): void {
    try {
      localStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    } catch {
      // fallback
    }
  },

  getBanks(): BankAccount[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BANKS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_BANKS;
  },

  saveBanks(banks: BankAccount[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.BANKS, JSON.stringify(banks));
    } catch {
      // fallback
    }
  },

  getTransactions(): Transaction[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_TRANSACTIONS;
  },

  saveTransactions(txs: Transaction[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(txs));
    } catch {
      // fallback
    }
  },

  getNotifications(): NotificationItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.NOTIFICATIONS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_NOTIFICATIONS;
  },

  saveNotifications(notifs: NotificationItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.NOTIFICATIONS, JSON.stringify(notifs));
    } catch {
      // fallback
    }
  },

  getSuperCard(): SuperCardInfo {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPER_CARD);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_SUPER_CARD;
  },

  saveSuperCard(card: SuperCardInfo): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPER_CARD, JSON.stringify(card));
    } catch {
      // fallback
    }
  },

  getSuperFds(): FixedDepositItem[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.SUPER_FDS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_SUPER_FDS;
  },

  saveSuperFds(fds: FixedDepositItem[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.SUPER_FDS, JSON.stringify(fds));
    } catch {
      // fallback
    }
  },

  getContacts(): Contact[] {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.CONTACTS);
      if (data) return JSON.parse(data);
    } catch {
      // fallback
    }
    return INITIAL_CONTACTS;
  },

  saveContacts(contacts: Contact[]): void {
    try {
      localStorage.setItem(STORAGE_KEYS.CONTACTS, JSON.stringify(contacts));
    } catch {
      // fallback
    }
  },

  // Reset entire application to fresh demo state
  resetAll(): void {
    localStorage.removeItem(STORAGE_KEYS.USER_PROFILE);
    localStorage.removeItem(STORAGE_KEYS.BANKS);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.NOTIFICATIONS);
    localStorage.removeItem(STORAGE_KEYS.SUPER_CARD);
    localStorage.removeItem(STORAGE_KEYS.SUPER_FDS);
    localStorage.removeItem(STORAGE_KEYS.CONTACTS);
  },
};
