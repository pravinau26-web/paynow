export type AppScreen =
  | 'onboarding'
  | 'pin-login'
  | 'home'
  | 'scan'
  | 'send'
  | 'recharge'
  | 'billpay'
  | 'supercard'
  | 'superfd'
  | 'history'
  | 'rewards'
  | 'profile';

export type PaymentStatus = 'processing' | 'success' | 'failed' | 'pending';

export interface BankAccount {
  id: string;
  bankName: string;
  logo: string;
  accountNumberMasked: string; // e.g. "XXXXXX4829"
  accountType: 'Savings' | 'Current';
  balance: number; // in Rupees
  isPrimary: boolean;
  upiId: string;
}

export interface Transaction {
  id: string;
  upiRefNumber: string; // UTR: e.g. "UPI/42890123901"
  type: 'debit' | 'credit';
  title: string;
  subtitle: string;
  upiId?: string;
  amount: number;
  cashback: number; // 0 if none
  timestamp: string; // ISO string
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  category: 'shopping' | 'food' | 'travel' | 'recharge' | 'transfer' | 'bills' | 'cashback' | 'superfd';
  bankAccountId: string;
  note?: string;
}

export interface Contact {
  id: string;
  name: string;
  phone: string;
  upiId: string;
  avatarBg: string;
  initials: string;
  isRecent?: boolean;
}

export interface MerchantQr {
  id: string;
  name: string;
  category: string;
  upiId: string;
  defaultAmount?: number;
  note?: string;
  verified: boolean;
  avatarBg: string;
}

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
  upiId: string;
  avatarUrl?: string;
  pinHash: string; // 4-digit PIN stored securely
  biometricEnabled: boolean;
  soundEnabled: boolean;
  hapticsEnabled: boolean;
  isOnboarded: boolean;
  locked: boolean;
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'cashback' | 'payment' | 'security' | 'offer';
  amount?: number;
  txId?: string;
}

export interface RechargePlan {
  id: string;
  price: number;
  validity: string;
  data: string;
  voice: string;
  category: 'Popular' | '5G Unlimited' | 'Data Only' | 'Annual' | 'Entertainment';
  cashback: number;
  description: string;
  ottBadges?: string[];
}

export interface BillItem {
  id: string;
  billerType: 'electricity' | 'fastag' | 'dth' | 'broadband' | 'creditcard' | 'gas';
  billerName: string;
  billerLogo: string;
  consumerNumber: string;
  amount: number;
  dueDate: string;
  cashback: number;
  billPeriod?: string;
}

export interface SuperCardInfo {
  cardNumberMasked: string; // "•••• •••• •••• 8824"
  cardHolder: string;
  expiry: string; // "08/30"
  cvv: string; // "742"
  totalLimit: number; // 100000
  availableLimit: number; // 87520
  usedLimit: number; // 12480
  minDue: number; // 1200
  dueDate: string; // "15th Oct"
  cashbackEarnedThisCycle: number;
  isFrozen: boolean;
  network: 'RuPay' | 'UPI Credit';
}

export interface FixedDepositItem {
  id: string;
  fdNumber: string;
  bankName: string;
  principal: number;
  interestRate: number; // e.g. 9.1
  tenureMonths: number;
  maturityAmount: number;
  maturityDate: string;
  status: 'Active' | 'Matured';
  rbiInsured: boolean;
}

export interface DealOffer {
  id: string;
  brand: string;
  logo: string;
  bannerBg: string;
  title: string;
  highlight: string;
  cashbackPercent: number;
  tag: string;
  merchantQr?: MerchantQr;
}
