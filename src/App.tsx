/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useRef, useState } from 'react';
import { AndroidFrame } from './components/AndroidFrame';
import { BottomNav } from './components/BottomNav';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { OffersModal } from './components/OffersModal';
import { PaymentStatusOverlay } from './components/PaymentStatusOverlay';
import { ReceiveQrModal } from './components/ReceiveQrModal';
import { SplitBillModal } from './components/SplitBillModal';
import { TransactionDetailModal } from './components/TransactionDetailModal';
import { BillPayScreen } from './screens/BillPayScreen';
import { HistoryScreen } from './screens/HistoryScreen';
import { HomeScreen } from './screens/HomeScreen';
import { OnboardingScreen } from './screens/OnboardingScreen';
import { PinLoginScreen } from './screens/PinLoginScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { RechargeScreen } from './screens/RechargeScreen';
import { RewardsScreen } from './screens/RewardsScreen';
import { ScanPayScreen } from './screens/ScanPayScreen';
import { SendMoneyScreen } from './screens/SendMoneyScreen';
import { SuperCardScreen } from './screens/SuperCardScreen';
import { SuperFdScreen } from './screens/SuperFdScreen';
import { sounds } from './services/audio';
import { INITIAL_CONTACTS } from './services/mockData';
import { storage } from './services/storage';
import {
  AppScreen,
  BankAccount,
  BillItem,
  Contact,
  DealOffer,
  FixedDepositItem,
  MerchantQr,
  NotificationItem,
  PaymentStatus,
  RechargePlan,
  SuperCardInfo,
  Transaction,
  UserProfile,
} from './types';

export default function App() {
  // Persistence state
  const [user, setUser] = useState<UserProfile>(() => storage.getUserProfile());
  const [banks, setBanks] = useState<BankAccount[]>(() => storage.getBanks());
  const [transactions, setTransactions] = useState<Transaction[]>(() => storage.getTransactions());
  const [notifications, setNotifications] = useState<NotificationItem[]>(() => storage.getNotifications());
  const [contacts, setContacts] = useState<Contact[]>(() => storage.getContacts());
  const [superCard, setSuperCard] = useState<SuperCardInfo>(() => storage.getSuperCard());
  const [superFds, setSuperFds] = useState<FixedDepositItem[]>(() => storage.getSuperFds());

  // App navigation state
  const [currentScreen, setCurrentScreen] = useState<AppScreen>(() => {
    const profile = storage.getUserProfile();
    if (!profile.isOnboarded) return 'onboarding';
    return profile.locked ? 'pin-login' : 'home';
  });

  // Modals & Overlays
  const [selectedTxForDetail, setSelectedTxForDetail] = useState<Transaction | null>(null);
  const [showNotificationsDrawer, setShowNotificationsDrawer] = useState(false);
  const [showMyQrModal, setShowMyQrModal] = useState(false);
  const [showSplitBillModal, setShowSplitBillModal] = useState(false);
  const [showOffersModal, setShowOffersModal] = useState(false);
  const [quickPayContact, setQuickPayContact] = useState<Contact | null>(null);
  const [preselectedMerchant, setPreselectedMerchant] = useState<MerchantQr | null>(null);

  // Payment Processing State Machine
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | null>(null);
  const [activePayment, setActivePayment] = useState<{
    amount: number;
    recipientName: string;
    upiId?: string;
    cashbackEarned: number;
    transaction: Transaction | null;
    failureReason?: string;
  } | null>(null);

  const paymentTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const activePayloadRef = useRef<{
    recipientName: string;
    upiId?: string;
    amount: number;
    note?: string;
    bankAccountId: string;
    category?: Transaction['category'];
  } | null>(null);

  // Sync sounds configuration
  useEffect(() => {
    sounds.enabled = user.soundEnabled;
  }, [user.soundEnabled]);

  // Persist state updates
  useEffect(() => {
    storage.saveUserProfile(user);
  }, [user]);

  useEffect(() => {
    storage.saveBanks(banks);
  }, [banks]);

  useEffect(() => {
    storage.saveTransactions(transactions);
  }, [transactions]);

  useEffect(() => {
    storage.saveNotifications(notifications);
  }, [notifications]);

  useEffect(() => {
    storage.saveSuperCard(superCard);
  }, [superCard]);

  useEffect(() => {
    storage.saveSuperFds(superFds);
  }, [superFds]);

  useEffect(() => {
    storage.saveContacts(contacts);
  }, [contacts]);

  // Synchronize user name & UPI ID across linked banks and SuperCard
  useEffect(() => {
    if (user?.upiId) {
      const handle = user.upiId.split('@')[0];
      const provider = user.upiId.split('@')[1] || 'upi';

      setBanks((prevBanks) => {
        const needsSync = prevBanks.some(
          (b) =>
            (b.isPrimary && b.upiId !== user.upiId) ||
            (!b.isPrimary && !b.upiId.startsWith(handle))
        );
        if (!needsSync) return prevBanks;

        const updated = prevBanks.map((b) => ({
          ...b,
          upiId: b.isPrimary ? user.upiId : `${handle}.${b.logo.toLowerCase()}@${provider}`,
        }));
        storage.saveBanks(updated);
        return updated;
      });
    }

    if (user?.name) {
      const upperName = user.name.toUpperCase();
      setSuperCard((prevCard) => {
        if (prevCard.cardHolder === upperName) return prevCard;
        const updated = { ...prevCard, cardHolder: upperName };
        storage.saveSuperCard(updated);
        return updated;
      });
    }
  }, [user.name, user.upiId]);

  const handleAddNewContact = (newContact: Contact) => {
    const updated = [
      newContact,
      ...contacts.filter((c) => c.phone !== newContact.phone && c.upiId !== newContact.upiId),
    ];
    setContacts(updated);
    storage.saveContacts(updated);
  };

  // Handlers
  const handleUnlockPin = () => {
    const updated = { ...user, locked: false };
    setUser(updated);
    storage.saveUserProfile(updated);
    setCurrentScreen('home');
  };

  const handleLockApp = () => {
    const updated = { ...user, locked: true };
    setUser(updated);
    storage.saveUserProfile(updated);
    setCurrentScreen('pin-login');
  };

  const handleForgotPin = () => {
    setCurrentScreen('onboarding');
  };

  const handleOnboardingComplete = (
    newUser: UserProfile,
    selectedBankId: string,
    customBanks?: BankAccount[]
  ) => {
    const baseBanks = customBanks || banks;
    const updatedBanks = baseBanks.map((b) => ({
      ...b,
      isPrimary: b.id === selectedBankId,
    }));
    setUser(newUser);
    setBanks(updatedBanks);
    storage.saveUserProfile(newUser);
    storage.saveBanks(updatedBanks);
    setCurrentScreen('home');
  };

  // Central Payment Orchestration & State Machine
  const handleInitiatePayment = (payload: {
    recipientName: string;
    upiId?: string;
    amount: number;
    note?: string;
    bankAccountId: string;
    category?: Transaction['category'];
  }) => {
    sounds.playKeypadClick();

    // Clear any previous running timer
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }

    activePayloadRef.current = payload;

    // Minute cashback rule: 0.30% to 0.40% (0.0030 to 0.0040) on merchant QR & recharges, 0.20% on bills, 0% on P2P
    let cashbackPct = 0;
    if (
      payload.category === 'shopping' ||
      payload.category === 'food' ||
      payload.category === 'travel' ||
      payload.category === 'recharge'
    ) {
      // Minute cashback between 0.30% and 0.40%
      const minPct = 0.0030;
      const maxPct = 0.0040;
      cashbackPct = minPct + Math.random() * (maxPct - minPct);
    } else if (payload.category === 'bills') {
      cashbackPct = 0.0020; // 0.20%
    }
    const cashbackAmount = Math.round(payload.amount * cashbackPct * 100) / 100;

    // Start State 1: PROCESSING with 5-second window
    sounds.playPaymentInitiate();
    setPaymentStatus('processing');
    setActivePayment({
      amount: payload.amount,
      recipientName: payload.recipientName,
      upiId: payload.upiId,
      cashbackEarned: cashbackAmount,
      transaction: null,
      failureReason: undefined,
    });

    // 5-second countdown timer: If user does not click "Fa" within 5 seconds, it auto-succeeds!
    paymentTimerRef.current = setTimeout(() => {
      executePaymentSuccess(payload, cashbackAmount);
    }, 5000);
  };

  // Called when user clicks "Fa" or when payment encounters an error to trigger failure
  const handleTriggerPaymentFailure = (customReason?: string) => {
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }

    const payload = activePayloadRef.current;
    if (!payload) return;

    const sourceBank = banks.find((b) => b.id === payload.bankAccountId) || banks[0];

    // NO money is debited from the bank account!
    const failedTx: Transaction = {
      id: `tx-${Date.now()}`,
      upiRefNumber: `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      type: 'debit',
      title: payload.recipientName,
      subtitle: `Failed · Bank server decline (${sourceBank.bankName})`,
      upiId: payload.upiId,
      amount: payload.amount,
      cashback: 0,
      timestamp: new Date().toISOString(),
      status: 'FAILED',
      category: payload.category || 'transfer',
      bankAccountId: sourceBank.id,
      note: payload.note,
    };

    setTransactions([failedTx, ...transactions]);

    const reason =
      customReason ||
      'Bank server declined transaction (Declined by issuing bank). No money was debited from your account.';

    const failNotif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `Payment Failed: ₹${payload.amount.toLocaleString('en-IN')}`,
      message: `Transaction to ${payload.recipientName} failed on NPCI rails. No money was debited from your account.`,
      timestamp: 'Just now',
      read: false,
      type: 'payment',
      amount: payload.amount,
      txId: failedTx.id,
    };
    setNotifications([failNotif, ...notifications]);

    setActivePayment((prev) =>
      prev
        ? {
            ...prev,
            transaction: failedTx,
            failureReason: reason,
          }
        : null
    );
    setPaymentStatus('failed');
  };

  // Auto-executed when 5s timer completes without clicking "Fa"
  const executePaymentSuccess = (
    payload: {
      recipientName: string;
      upiId?: string;
      amount: number;
      note?: string;
      bankAccountId: string;
      category?: Transaction['category'];
    },
    cashbackAmount: number
  ) => {
    try {
      const sourceBank = banks.find((b) => b.id === payload.bankAccountId) || banks[0];

      if (!sourceBank || sourceBank.balance < payload.amount) {
        handleTriggerPaymentFailure(
          !sourceBank
            ? 'Linked bank account not found.'
            : 'Insufficient bank balance to complete payment. No money was debited.'
        );
        return;
      }

      // Deduct balance and credit instant cashback direct to bank
      const newBalance = sourceBank.balance - payload.amount + cashbackAmount;
      const updatedBanks = banks.map((b) =>
        b.id === sourceBank.id ? { ...b, balance: newBalance } : b
      );
      setBanks(updatedBanks);

      // Create new Transaction item
      const newTx: Transaction = {
        id: `tx-${Date.now()}`,
        upiRefNumber: `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}`,
        type: 'debit',
        title: payload.recipientName,
        subtitle: `Paid via ${sourceBank.bankName} · ${sourceBank.accountNumberMasked}`,
        upiId: payload.upiId,
        amount: payload.amount,
        cashback: cashbackAmount,
        timestamp: new Date().toISOString(),
        status: 'SUCCESS',
        category: payload.category || 'transfer',
        bankAccountId: sourceBank.id,
        note: payload.note,
      };

      const updatedTxs = [newTx, ...transactions];
      setTransactions(updatedTxs);

      // Build Notifications
      const newNotifs: NotificationItem[] = [
        {
          id: `notif-${Date.now()}-1`,
          title: `Paid ₹${payload.amount.toLocaleString('en-IN')} to ${payload.recipientName}`,
          message: `Transaction successful via UPI Ref ${newTx.upiRefNumber}.`,
          timestamp: 'Just now',
          read: false,
          type: 'payment',
          amount: payload.amount,
          txId: newTx.id,
        },
      ];

      if (cashbackAmount > 0) {
        newNotifs.unshift({
          id: `notif-${Date.now()}-2`,
          title: `🎉 ₹${cashbackAmount.toFixed(2)} Instant Cashback Credited!`,
          message: `Real cash deposited directly into ${sourceBank.bankName} (${sourceBank.accountNumberMasked}).`,
          timestamp: 'Just now',
          read: false,
          type: 'cashback',
          amount: cashbackAmount,
          txId: newTx.id,
        });
      }

      setNotifications([...newNotifs, ...notifications]);

      // State 2a: SUCCESS
      setPaymentStatus('success');
      setActivePayment((prev) => (prev ? { ...prev, transaction: newTx } : null));
    } catch (err: any) {
      console.error('Payment execution error:', err);
      handleTriggerPaymentFailure('Technical error processing payment. No money was debited.');
    }
  };

  // Specific Action Handlers
  const handleSelectPlanToPay = (plan: RechargePlan, phone: string, operator: string) => {
    handleInitiatePayment({
      recipientName: `${operator} Prepaid (+91 ${phone})`,
      upiId: `${operator.toLowerCase()}recharge@billdesk`,
      amount: plan.price,
      note: `${plan.validity} · ${plan.data}`,
      bankAccountId: banks[0]?.id || 'bank-hdfc',
      category: 'recharge',
    });
  };

  const handlePayBill = (bill: BillItem) => {
    handleInitiatePayment({
      recipientName: bill.billerName,
      upiId: `bbps.${bill.billerType}@axisbank`,
      amount: bill.amount,
      note: `Consumer ${bill.consumerNumber}`,
      bankAccountId: banks[0]?.id || 'bank-hdfc',
      category: 'bills',
    });
  };

  const handleBookFd = (fdData: {
    principal: number;
    tenureMonths: number;
    interestRate: number;
    bankName: string;
    maturityAmount: number;
  }) => {
    // Process payment for FD booking
    handleInitiatePayment({
      recipientName: `Fixed Deposit (${fdData.bankName})`,
      upiId: 'fd.booking@shivalikbank',
      amount: fdData.principal,
      note: `${fdData.tenureMonths} Months @ ${fdData.interestRate}% p.a.`,
      bankAccountId: banks[0]?.id || 'bank-hdfc',
      category: 'superfd',
    });

    const newFd: FixedDepositItem = {
      id: `fd-${Date.now()}`,
      fdNumber: `FD/2026/${Math.floor(10000 + Math.random() * 90000)}`,
      bankName: fdData.bankName,
      principal: fdData.principal,
      interestRate: fdData.interestRate,
      tenureMonths: fdData.tenureMonths,
      maturityAmount: fdData.maturityAmount,
      maturityDate: new Date(Date.now() + fdData.tenureMonths * 30 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      }),
      status: 'Active',
      rbiInsured: true,
    };
    setSuperFds([newFd, ...superFds]);
  };

  const handlePayCardBill = (amount: number) => {
    handleInitiatePayment({
      recipientName: 'superCard RuPay Bill Payment',
      upiId: 'supercard.bill@rupay',
      amount,
      note: 'Total statement bill clearance',
      bankAccountId: banks[0]?.id || 'bank-hdfc',
      category: 'bills',
    });

    setSuperCard((prev) => ({
      ...prev,
      usedLimit: 0,
      availableLimit: prev.totalLimit,
    }));
  };

  const handleToggleFreezeCard = () => {
    setSuperCard((prev) => ({
      ...prev,
      isFrozen: !prev.isFrozen,
    }));
  };

  const handleSplitBillSent = (amountPerPerson: number, count: number, note: string) => {
    const notif: NotificationItem = {
      id: `notif-${Date.now()}`,
      title: `⚡ Payment Request Sent to ${count} Friends`,
      message: `Requested ₹${amountPerPerson} per person for "${note}". Link shared via UPI.`,
      timestamp: 'Just now',
      read: false,
      type: 'offer',
      amount: amountPerPerson * count,
    };
    setNotifications([notif, ...notifications]);
  };

  const handleSelectDeal = (deal: DealOffer) => {
    if (deal.merchantQr) {
      setPreselectedMerchant(deal.merchantQr);
    }
    setCurrentScreen('scan');
  };

  const handleClosePaymentOverlay = () => {
    if (paymentTimerRef.current) {
      clearTimeout(paymentTimerRef.current);
      paymentTimerRef.current = null;
    }
    setPaymentStatus(null);
    setActivePayment(null);
    setCurrentScreen('home');
  };

  const handleViewReceiptFromPayment = () => {
    if (activePayment?.transaction) {
      setSelectedTxForDetail(activePayment.transaction);
    }
    setPaymentStatus(null);
    setActivePayment(null);
  };

  const handleRetryPayment = () => {
    if (activePayment) {
      handleInitiatePayment({
        recipientName: activePayment.recipientName,
        upiId: activePayment.upiId,
        amount: activePayment.amount,
        note: 'Retry payment',
        bankAccountId: banks[0]?.id || 'bank-hdfc',
        category: 'shopping',
      });
    }
  };

  const handleRepeatPayment = (tx: Transaction) => {
    handleInitiatePayment({
      recipientName: tx.title,
      upiId: tx.upiId || 'payee@paynow',
      amount: tx.amount,
      note: tx.note || 'Repeat payment',
      bankAccountId: tx.bankAccountId || banks[0]?.id || 'bank-hdfc',
      category: tx.category === 'cashback' ? 'transfer' : tx.category,
    });
  };

  const handleAddMoney = (amountToAdd: number) => {
    sounds.playCoinSound();
    const primaryBank = banks.find((b) => b.isPrimary) || banks[0];
    const updatedBanks = banks.map((b) =>
      b.id === primaryBank.id ? { ...b, balance: b.balance + amountToAdd } : b
    );
    setBanks(updatedBanks);

    const creditTx: Transaction = {
      id: `tx-${Date.now()}`,
      upiRefNumber: `UPI/${Math.floor(100000000000 + Math.random() * 900000000000)}`,
      type: 'credit',
      title: 'Money Added via Net Banking',
      subtitle: `Credited to ${primaryBank.bankName} · ${primaryBank.accountNumberMasked}`,
      amount: amountToAdd,
      cashback: 0,
      timestamp: new Date().toISOString(),
      status: 'SUCCESS',
      category: 'transfer',
      bankAccountId: primaryBank.id,
      note: 'Simulated bank deposit',
    };
    setTransactions([creditTx, ...transactions]);

    setNotifications([
      {
        id: `notif-${Date.now()}`,
        title: `₹${amountToAdd.toLocaleString('en-IN')} Added to Bank`,
        message: `Your balance in ${primaryBank.bankName} has been updated.`,
        timestamp: 'Just now',
        read: false,
        type: 'payment',
        amount: amountToAdd,
        txId: creditTx.id,
      },
      ...notifications,
    ]);
  };

  const handleResetApp = () => {
    storage.resetAll();
    const freshUser: UserProfile = {
      name: 'RAHUL SHARMA',
      phone: '+91 98765 43210',
      email: 'rahul.sharma@example.com',
      upiId: 'rahul.sharma@superpay',
      pinHash: '1234',
      biometricEnabled: true,
      soundEnabled: true,
      hapticsEnabled: true,
      isOnboarded: false,
      locked: true,
    };
    setUser(freshUser);
    setTransactions(storage.getTransactions());
    setBanks(storage.getBanks());
    setNotifications(storage.getNotifications());
    setContacts(storage.getContacts());
    setSuperCard(storage.getSuperCard());
    setSuperFds(storage.getSuperFds());
    storage.saveUserProfile(freshUser);
    setCurrentScreen('onboarding');
  };

  const handleQuickPayContact = (contact: Contact) => {
    setQuickPayContact(contact);
    setCurrentScreen('send');
  };

  // Show bottom nav strictly on main navigation tabs (Home, History, Rewards, Profile).
  // Transaction and checkout screens (Send Money, Scan & Pay, Recharge, Bill Pay, SuperCard, SuperFD, Auth)
  // must never show the bottom nav bar so primary action buttons ("Pay", "Recharge", etc.) are 100% visible and unobstructed.
  const showBottomNav =
    currentScreen === 'home' ||
    currentScreen === 'history' ||
    currentScreen === 'rewards' ||
    currentScreen === 'profile';

  return (
    <AndroidFrame
      isLocked={currentScreen === 'pin-login'}
      onLockApp={currentScreen !== 'onboarding' && currentScreen !== 'pin-login' ? handleLockApp : undefined}
    >
      {/* SCREEN 1: ONBOARDING */}
      {currentScreen === 'onboarding' && (
        <OnboardingScreen
          onComplete={handleOnboardingComplete}
          availableBanks={banks}
        />
      )}

      {/* SCREEN 2: PIN LOGIN */}
      {currentScreen === 'pin-login' && (
        <PinLoginScreen
          user={user}
          onSuccessUnlock={handleUnlockPin}
          onForgotPin={handleForgotPin}
        />
      )}

      {/* SCREEN 3: HOME DASHBOARD */}
      {currentScreen === 'home' && (
        <HomeScreen
          user={user}
          banks={banks}
          transactions={transactions}
          contacts={contacts}
          notifications={notifications}
          onNavigate={(screen) => {
            if (screen === 'send') setQuickPayContact(null);
            setCurrentScreen(screen);
          }}
          onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
          onQuickPayContact={handleQuickPayContact}
          onOpenNotifications={() => setShowNotificationsDrawer(true)}
          onOpenMyQr={() => setShowMyQrModal(true)}
          onAddMoney={handleAddMoney}
          onOpenSplitBill={() => setShowSplitBillModal(true)}
          onOpenOffers={() => setShowOffersModal(true)}
          onSelectDeal={handleSelectDeal}
        />
      )}

      {/* SCREEN 4: SCAN & PAY (Camera Viewfinder & Merchant QRs) */}
      {currentScreen === 'scan' && (
        <ScanPayScreen
          onBack={() => {
            setPreselectedMerchant(null);
            setCurrentScreen('home');
          }}
          banks={banks}
          initialMerchant={preselectedMerchant}
          userPin={user.pinHash}
          onInitiatePayment={handleInitiatePayment}
        />
      )}

      {/* SCREEN 5: SEND MONEY */}
      {currentScreen === 'send' && (
        <SendMoneyScreen
          onBack={() => {
            setQuickPayContact(null);
            setCurrentScreen('home');
          }}
          contacts={contacts}
          banks={banks}
          initialContact={quickPayContact}
          userPin={user.pinHash}
          onInitiatePayment={handleInitiatePayment}
          onAddContact={handleAddNewContact}
        />
      )}

      {/* SCREEN 6: MOBILE RECHARGE */}
      {currentScreen === 'recharge' && (
        <RechargeScreen
          onBack={() => setCurrentScreen('home')}
          contacts={contacts}
          onSelectPlanToPay={handleSelectPlanToPay}
        />
      )}

      {/* SCREEN 7: BILL PAY */}
      {currentScreen === 'billpay' && (
        <BillPayScreen
          onBack={() => setCurrentScreen('home')}
          onPayBill={handlePayBill}
        />
      )}

      {/* SCREEN 8: SUPERCARD CREDIT ON UPI */}
      {currentScreen === 'supercard' && (
        <SuperCardScreen
          onBack={() => setCurrentScreen('home')}
          cardInfo={superCard}
          userName={user.name}
          onPayCardBill={handlePayCardBill}
          onToggleFreeze={handleToggleFreezeCard}
          onScanWithCard={() => setCurrentScreen('scan')}
        />
      )}

      {/* SCREEN 9: SUPERFD HIGH-YIELD SAVINGS */}
      {currentScreen === 'superfd' && (
        <SuperFdScreen
          onBack={() => setCurrentScreen('home')}
          activeFds={superFds}
          onBookFd={handleBookFd}
        />
      )}

      {/* SCREEN 10: TRANSACTION HISTORY */}
      {currentScreen === 'history' && (
        <HistoryScreen
          transactions={transactions}
          onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
        />
      )}

      {/* SCREEN 11: REWARDS & CASHBACK */}
      {currentScreen === 'rewards' && (
        <RewardsScreen
          transactions={transactions}
          onSelectTransaction={(tx) => setSelectedTxForDetail(tx)}
        />
      )}

      {/* SCREEN 12: PROFILE & SETTINGS */}
      {currentScreen === 'profile' && (
        <ProfileScreen
          user={user}
          banks={banks}
          onUpdateUser={(updated) => {
            const next = { ...user, ...updated };
            setUser(next);
            storage.saveUserProfile(next);

            if (updated.upiId) {
              const handle = updated.upiId.split('@')[0];
              const provider = updated.upiId.split('@')[1] || 'upi';
              const updatedBanks = banks.map((b) => ({
                ...b,
                upiId: b.isPrimary ? updated.upiId! : `${handle}.${b.logo.toLowerCase()}@${provider}`,
              }));
              setBanks(updatedBanks);
              storage.saveBanks(updatedBanks);
            }

            if (updated.name) {
              const updatedCard = {
                ...superCard,
                cardHolder: updated.name.toUpperCase(),
              };
              setSuperCard(updatedCard);
              storage.saveSuperCard(updatedCard);
            }
          }}
          onSetPrimaryBank={(bankId) => {
            const updated = banks.map((b) => ({ ...b, isPrimary: b.id === bankId }));
            setBanks(updated);
            storage.saveBanks(updated);
          }}
          onOpenMyQr={() => setShowMyQrModal(true)}
          onLockApp={handleLockApp}
          onResetApp={handleResetApp}
        />
      )}

      {/* FLOATING BOTTOM NAV BAR */}
      {showBottomNav && (
        <BottomNav
          currentScreen={currentScreen}
          onSelectScreen={(screen) => {
            if (screen === 'send') setQuickPayContact(null);
            if (screen === 'scan') setPreselectedMerchant(null);
            setCurrentScreen(screen);
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* PAYMENT STATE MACHINE PROCESSING / SUCCESS / FAILED OVERLAY               */}
      {/* ========================================================================= */}
      {paymentStatus && activePayment && (
        <PaymentStatusOverlay
          status={paymentStatus}
          amount={activePayment.amount}
          recipientName={activePayment.recipientName}
          upiId={activePayment.upiId}
          cashbackEarned={activePayment.cashbackEarned}
          failureReason={activePayment.failureReason}
          transaction={activePayment.transaction}
          onDone={handleClosePaymentOverlay}
          onViewReceipt={handleViewReceiptFromPayment}
          onRetry={handleRetryPayment}
          onSimulateFail={handleTriggerPaymentFailure}
        />
      )}

      {/* TRANSACTION RECEIPT FULL SCREEN */}
      <TransactionDetailModal
        transaction={selectedTxForDetail}
        onClose={() => setSelectedTxForDetail(null)}
        onRepeatPayment={handleRepeatPayment}
        userName={user.name}
        bankAccount={
          banks.find((b) => b.id === selectedTxForDetail?.bankAccountId) ||
          banks.find((b) => b.isPrimary) ||
          banks[0]
        }
      />

      {/* NOTIFICATIONS DRAWER */}
      <NotificationsDrawer
        isOpen={showNotificationsDrawer}
        onClose={() => setShowNotificationsDrawer(false)}
        notifications={notifications}
        onMarkAllAsRead={() => {
          setNotifications(notifications.map((n) => ({ ...n, read: true })));
        }}
        onMarkAsRead={(id) => {
          setNotifications(notifications.map((n) => (n.id === id ? { ...n, read: true } : n)));
        }}
        onDismissNotification={(id) => {
          setNotifications(notifications.filter((n) => n.id !== id));
        }}
        onClearAllNotifications={() => {
          setNotifications([]);
        }}
        onViewTransactionReceipt={(txId) => {
          const matchedTx = transactions.find((t) => t.id === txId) || transactions[0];
          if (matchedTx) {
            setSelectedTxForDetail(matchedTx);
          }
        }}
      />

      {/* USER'S PERSONAL RECEIVE QR CODE MODAL */}
      <ReceiveQrModal
        isOpen={showMyQrModal}
        onClose={() => setShowMyQrModal(false)}
        user={user}
      />

      {/* SPLIT BILL / REQUEST MONEY MODAL */}
      <SplitBillModal
        isOpen={showSplitBillModal}
        onClose={() => setShowSplitBillModal(false)}
        contacts={contacts}
        user={user}
        onRequestSent={handleSplitBillSent}
      />

      {/* BRAND CASHBACK DEALS MODAL */}
      <OffersModal
        isOpen={showOffersModal}
        onClose={() => setShowOffersModal(false)}
        onSelectDeal={handleSelectDeal}
      />
    </AndroidFrame>
  );
}
