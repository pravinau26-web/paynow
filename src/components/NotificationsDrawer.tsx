import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Check,
  ChevronRight,
  ExternalLink,
  Receipt,
  Sparkles,
  Tag,
  Trash2,
  X,
} from 'lucide-react';
import { sounds } from '../services/audio';
import { NotificationItem } from '../types';

interface NotificationsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllAsRead: () => void;
  onMarkAsRead?: (id: string) => void;
  onDismissNotification?: (id: string) => void;
  onClearAllNotifications?: () => void;
  onViewTransactionReceipt?: (txId: string) => void;
}

export const NotificationsDrawer: React.FC<NotificationsDrawerProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onMarkAsRead,
  onDismissNotification,
  onClearAllNotifications,
  onViewTransactionReceipt,
}) => {
  const [selectedNotif, setSelectedNotif] = useState<NotificationItem | null>(null);

  if (!isOpen) return null;

  const handleItemClick = (item: NotificationItem) => {
    sounds.playKeypadClick();
    setSelectedNotif(item);
    if (!item.read && onMarkAsRead) {
      onMarkAsRead(item.id);
    }
  };

  const handleCloseDetail = () => {
    sounds.playKeypadClick();
    setSelectedNotif(null);
  };

  const handleViewReceipt = (txId?: string) => {
    if (txId && onViewTransactionReceipt) {
      sounds.playKeypadClick();
      setSelectedNotif(null);
      onClose();
      onViewTransactionReceipt(txId);
    }
  };

  const handleDeleteItem = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    sounds.playKeypadClick();
    if (selectedNotif?.id === id) {
      setSelectedNotif(null);
    }
    if (onDismissNotification) {
      onDismissNotification(id);
    }
  };

  return (
    <div className="fixed sm:absolute inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-[22rem] h-full bg-white dark:bg-[#1A1A20] shadow-2xl flex flex-col p-4 sm:p-5 overflow-hidden animate-in slide-in-from-right duration-250">
        {/* Drawer Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
              Notifications
            </h3>
            <p className="text-[11px] text-slate-400">
              Tap any alert to view details
            </p>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <>
                <button
                  type="button"
                  onClick={onMarkAllAsRead}
                  className="text-[11px] font-semibold text-[#5B3DF5] hover:underline"
                >
                  Mark all read
                </button>
                {onClearAllNotifications && (
                  <button
                    type="button"
                    onClick={onClearAllNotifications}
                    className="text-[11px] font-semibold text-slate-400 hover:text-red-500"
                    title="Clear all notifications"
                  >
                    Clear
                  </button>
                )}
              </>
            )}
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto py-3 space-y-2.5">
          {notifications.length === 0 ? (
            <div className="py-20 text-center text-slate-400 text-xs flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-2">
                <Check className="w-6 h-6 text-slate-400" />
              </div>
              <p className="font-bold text-slate-700 dark:text-slate-300">All caught up!</p>
              <p className="text-[11px] text-slate-400 mt-1">No pending notifications</p>
            </div>
          ) : (
            notifications.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleItemClick(item)}
                className={`w-full p-3.5 rounded-2xl border text-left transition-all active:scale-[0.99] group ${
                  item.read
                    ? 'bg-slate-50/70 dark:bg-[#121217] border-slate-100 dark:border-slate-800/80 text-slate-600 dark:text-slate-400 hover:border-slate-300'
                    : 'bg-[#5B3DF5]/5 dark:bg-[#5B3DF5]/10 border-[#5B3DF5]/20 text-slate-900 dark:text-white hover:border-[#5B3DF5]/40 shadow-xs'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 ${
                      item.type === 'cashback'
                        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
                        : item.type === 'payment'
                        ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400'
                        : 'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                    }`}
                  >
                    {item.type === 'cashback' ? (
                      <Sparkles className="w-4 h-4" />
                    ) : item.type === 'payment' ? (
                      <ArrowDownLeft className="w-4 h-4" />
                    ) : (
                      <Tag className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 text-xs">
                    <div className="flex items-center justify-between">
                      <p className="font-bold group-hover:text-[#5B3DF5] transition-colors line-clamp-1">
                        {item.title}
                      </p>
                      <span className="text-[10px] text-slate-400 font-mono shrink-0 ml-1">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                      {item.message}
                    </p>

                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-slate-100 dark:border-slate-800/60">
                      <span className="text-[10px] font-semibold text-[#5B3DF5] flex items-center gap-0.5">
                        View Details <ChevronRight className="w-3 h-3" />
                      </span>
                      {onDismissNotification && (
                        <span
                          role="button"
                          tabIndex={0}
                          onClick={(e) => handleDeleteItem(e, item.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleDeleteItem(e as unknown as React.MouseEvent, item.id);
                          }}
                          className="text-[10px] text-slate-400 hover:text-red-500 p-1"
                          title="Dismiss"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>

        {/* Bottom Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition-colors mt-2"
        >
          Close Drawer
        </button>
      </div>

      {/* Individual Notification Detailed Modal */}
      {selectedNotif && (
        <div className="fixed sm:absolute inset-0 z-60 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 animate-in fade-in">
          <div className="w-full max-w-[20rem] bg-white dark:bg-[#1A1A20] rounded-3xl p-5 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-800 shadow-2xl animate-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div
                  className={`w-7 h-7 rounded-lg flex items-center justify-center ${
                    selectedNotif.type === 'cashback'
                      ? 'bg-emerald-500/10 text-emerald-600'
                      : 'bg-[#5B3DF5]/10 text-[#5B3DF5]'
                  }`}
                >
                  {selectedNotif.type === 'cashback' ? (
                    <Sparkles className="w-4 h-4" />
                  ) : (
                    <Receipt className="w-4 h-4" />
                  )}
                </div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Notification Info
                </h4>
              </div>
              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-7 h-7 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="my-4 space-y-2">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                {selectedNotif.title}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed bg-slate-50 dark:bg-[#121217] p-3 rounded-2xl border border-slate-100 dark:border-slate-800">
                {selectedNotif.message}
              </p>

              {selectedNotif.amount !== undefined && (
                <div className="flex justify-between items-center px-1 pt-1 text-xs">
                  <span className="text-slate-400">Amount</span>
                  <span className="font-bold font-mono text-[#5B3DF5] text-sm">
                    ₹{selectedNotif.amount.toLocaleString('en-IN')}
                  </span>
                </div>
              )}

              <div className="flex justify-between items-center px-1 text-[11px] text-slate-400 font-mono">
                <span>Received</span>
                <span>{selectedNotif.timestamp}</span>
              </div>
            </div>

            {/* Actions */}
            <div className="space-y-2 pt-2">
              {selectedNotif.txId && onViewTransactionReceipt && (
                <button
                  type="button"
                  onClick={() => handleViewReceipt(selectedNotif.txId)}
                  className="w-full py-2.5 rounded-full bg-gradient-to-r from-[#6C4CFA] to-[#A16CFF] text-white text-xs font-bold shadow-md shadow-[#5B3DF5]/30 hover:opacity-95 flex items-center justify-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>View Full Transaction Receipt</span>
                </button>
              )}

              {onDismissNotification && (
                <button
                  type="button"
                  onClick={(e) => handleDeleteItem(e, selectedNotif.id)}
                  className="w-full py-2 rounded-full border border-red-500/20 text-red-500 hover:bg-red-500/10 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Dismiss Notification</span>
                </button>
              )}

              <button
                type="button"
                onClick={handleCloseDetail}
                className="w-full py-2 rounded-full bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

