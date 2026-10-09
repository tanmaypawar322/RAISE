'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, CheckCheck, ExternalLink, Settings, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export interface NotificationItem {
  _id: string;
  type: string;
  title: string;
  body: string;
  data?: {
    issueId?: string;
    officeId?: string;
    linkUrl?: string;
    [key: string]: any;
  };
  read: boolean;
  channelDelivered?: string[];
  createdAt: string;
}

interface NotificationBellProps {
  onOpenPreferences?: () => void;
}

export function NotificationBell({ onOpenPreferences }: NotificationBellProps) {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/notifications?limit=15`, {
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        if (data.success) {
          setNotifications(data.notifications || []);
          setUnreadCount(data.unreadCount || 0);
        }
      }
    } catch {
      // Background poll failure tolerated
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    // Check periodically for updates
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [user, token]);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      fetchNotifications();
    }
  };

  const handleMarkAllRead = async () => {
    if (!user || unreadCount === 0) return;
    try {
      setLoading(true);
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/notifications/read-all`, {
        method: 'POST',
        headers,
        credentials: 'include',
      });

      if (res.ok) {
        setUnreadCount(0);
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      }
    } catch {
      // Ignored
    } finally {
      setLoading(false);
    }
  };

  const handleNotificationClick = async (notif: NotificationItem) => {
    // 1. Mark as read if not already read
    if (!notif.read) {
      try {
        const headers: Record<string, string> = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;

        fetch(`${apiUrl}/notifications/${notif._id}/read`, {
          method: 'POST',
          headers,
          credentials: 'include',
        });

        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, read: true } : n))
        );
        setUnreadCount((c) => Math.max(0, c - 1));
      } catch {
        // Continue navigation
      }
    }

    setIsOpen(false);

    // 2. Navigate to destination
    if (notif.data?.issueId) {
      router.push(`/issues/${notif.data.issueId}`);
    } else if (notif.data?.linkUrl) {
      if (notif.data.linkUrl.startsWith('http')) {
        try {
          const url = new URL(notif.data.linkUrl);
          router.push(url.pathname + url.search);
        } catch {
          window.location.href = notif.data.linkUrl;
        }
      } else {
        router.push(notif.data.linkUrl);
      }
    }
  };

  if (!user) return null;

  const formatTimestamp = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays < 7) return `${diffDays}d ago`;
      return date.toLocaleDateString();
    } catch {
      return '';
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        onClick={handleToggle}
        aria-label="Open notifications"
        className="relative p-2 rounded-xl text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition cursor-pointer"
      >
        <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 flex items-center justify-center min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[10px] font-extrabold leading-none shadow-xs animate-pulse">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Notifications Dropdown Drawer */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 sm:w-96 max-h-[80vh] flex flex-col bg-white rounded-2xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {/* Header */}
          <div className="p-3.5 border-b border-gray-100 flex items-center justify-between bg-gray-50/70">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-gray-900">{t('notificationsTitle')}</span>
              {unreadCount > 0 && (
                <span className="text-[10px] font-bold bg-orange-100 text-orange-800 px-2 py-0.5 rounded-full">
                  {unreadCount} {t('unreadNotifications')}
                </span>
              )}
            </div>

            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                disabled={loading}
                className="flex items-center gap-1 text-[11px] font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer disabled:opacity-50"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span>{t('markAllReadBtn')}</span>
              </button>
            )}
          </div>

          {/* List Feed */}
          <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <Bell className="w-8 h-8 text-gray-300 mx-auto mb-2 stroke-[1.5]" />
                <p className="text-xs text-gray-500 font-medium">{t('noNotificationsMsg')}</p>
              </div>
            ) : (
              notifications.map((n) => (
                <div
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3.5 transition cursor-pointer hover:bg-gray-50 text-left flex gap-3 ${
                    !n.read ? 'bg-orange-50/40' : 'bg-white'
                  }`}
                >
                  {/* Unread indicator */}
                  <div className="pt-1 shrink-0">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        !n.read ? 'bg-orange-600' : 'bg-transparent'
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p
                        className={`text-xs leading-snug truncate ${
                          !n.read ? 'font-bold text-gray-900' : 'font-medium text-gray-700'
                        }`}
                      >
                        {n.title}
                      </p>
                      <span className="text-[10px] text-gray-400 shrink-0 font-medium flex items-center gap-0.5">
                        <Clock className="w-2.5 h-2.5" />
                        {formatTimestamp(n.createdAt)}
                      </span>
                    </div>

                    <p className="text-[11px] text-gray-600 leading-relaxed line-clamp-2">
                      {n.body}
                    </p>

                    {/* Delivery channels badges */}
                    {n.channelDelivered && n.channelDelivered.length > 0 && (
                      <div className="mt-1.5 flex items-center gap-1">
                        {n.channelDelivered.map((ch) => (
                          <span
                            key={ch}
                            className="text-[9px] uppercase font-bold text-gray-400 bg-gray-100 px-1 py-0.2 rounded"
                          >
                            {ch.replace('_', ' ')}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer with Preferences link */}
          {onOpenPreferences && (
            <div className="p-2.5 bg-gray-50 border-t border-gray-100 text-center">
              <button
                onClick={() => {
                  setIsOpen(false);
                  onOpenPreferences();
                }}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-600 hover:text-orange-600 transition cursor-pointer"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>{t('notificationPreferencesTitle')}</span>
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
