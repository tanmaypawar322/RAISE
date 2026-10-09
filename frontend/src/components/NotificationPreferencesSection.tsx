'use client';

import React, { useState, useEffect } from 'react';
import {
  Bell,
  Smartphone,
  Mail,
  MessageSquare,
  Moon,
  Globe,
  Check,
  AlertCircle,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export function NotificationPreferencesSection() {
  const { user, token } = useAuth();
  const { t } = useLanguage();
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

  const [inApp, setInApp] = useState(true);
  const [sms, setSms] = useState(true);
  const [email, setEmail] = useState(true);
  const [whatsapp, setWhatsapp] = useState(false);
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(true);
  const [preferredLanguage, setPreferredLanguage] = useState<'en' | 'mr' | 'hi'>('en');

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchPreferences = async () => {
      try {
        setLoading(true);
        const headers: Record<string, string> = {};
        if (token) headers['Authorization'] = `Bearer ${token}`;

        const res = await fetch(`${apiUrl}/notifications/preferences`, {
          headers,
          credentials: 'include',
        });

        if (res.ok) {
          const data = await res.json();
          if (data.success && data.preferences) {
            const p = data.preferences;
            setInApp(p.channels?.inApp !== false);
            setSms(p.channels?.sms !== false);
            setEmail(p.channels?.email !== false);
            setWhatsapp(p.channels?.whatsapp === true);
            setQuietHoursEnabled(p.quietHoursEnabled !== false);
            setPreferredLanguage(p.preferredLanguage || 'en');
          }
        }
      } catch (err: any) {
        console.error('Failed to load notification preferences:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchPreferences();
  }, [user, token]);

  const handleSave = async () => {
    if (!user) return;
    try {
      setSaving(true);
      setMessage(null);

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`${apiUrl}/notifications/preferences`, {
        method: 'PATCH',
        headers,
        credentials: 'include',
        body: JSON.stringify({
          channels: {
            inApp,
            sms,
            email,
            whatsapp,
          },
          quietHoursEnabled,
          preferredLanguage,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setMessage({ type: 'success', text: t('preferencesSavedToast') });
      } else {
        setMessage({ type: 'error', text: data.message || 'Failed to update preferences.' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Network error. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  if (loading) {
    return (
      <div className="py-6 text-center text-xs text-gray-400">
        Loading preferences...
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-4 border-t border-gray-100">
      <div>
        <h3 className="text-sm font-bold text-gray-900 flex items-center gap-1.5 mb-1">
          <Bell className="w-4 h-4 text-orange-600" />
          <span>{t('notificationPreferencesTitle')}</span>
        </h3>
        <p className="text-xs text-gray-500">
          Configure how and when you receive grievance updates, statutory SLA milestones, and community alerts.
        </p>
      </div>

      {message && (
        <div
          className={`p-3 rounded-xl text-xs font-semibold flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border border-green-200'
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}
        >
          {message.type === 'success' ? (
            <Check className="w-4 h-4 text-green-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{message.text}</span>
        </div>
      )}

      {/* Delivery Channels */}
      <div className="space-y-3">
        <span className="text-xs font-bold text-gray-700 block">Notification Channels</span>

        {/* In-App */}
        <label className="flex items-start justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-start gap-2.5">
            <Bell className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-gray-900 block">
                {t('channelInAppLabel')}
              </span>
              <span className="text-[11px] text-gray-500">
                Live alerts in your notification drawer.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={inApp}
            onChange={(e) => setInApp(e.target.checked)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer mt-0.5"
          />
        </label>

        {/* SMS */}
        <label className="flex items-start justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-start gap-2.5">
            <Smartphone className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-gray-900 block">
                {t('channelSmsLabel')}
              </span>
              <span className="text-[11px] text-gray-500">
                {t('channelSmsNote')}
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={sms}
            onChange={(e) => setSms(e.target.checked)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer mt-0.5"
          />
        </label>

        {/* Email */}
        <label className="flex items-start justify-between p-3 rounded-xl border border-gray-200 bg-gray-50/50 hover:bg-gray-50 transition cursor-pointer">
          <div className="flex items-start gap-2.5">
            <Mail className="w-4 h-4 text-gray-700 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-gray-900 block">
                {t('channelEmailLabel')}
              </span>
              <span className="text-[11px] text-gray-500">
                {t('channelEmailNote')}
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={email}
            onChange={(e) => setEmail(e.target.checked)}
            className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500 border-gray-300 cursor-pointer mt-0.5"
          />
        </label>

        {/* WhatsApp */}
        <div className="flex items-start justify-between p-3 rounded-xl border border-dashed border-gray-200 bg-gray-50/30 opacity-60">
          <div className="flex items-start gap-2.5">
            <MessageSquare className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-gray-700">{t('channelWhatsappLabel')}</span>
                <span className="text-[9px] font-extrabold bg-gray-200 text-gray-600 px-1.5 py-0.2 rounded">
                  {t('comingSoonBadge')}
                </span>
              </div>
              <span className="text-[11px] text-gray-400">
                Direct WhatsApp template messages for urgent citizen alerts.
              </span>
            </div>
          </div>
          <input
            type="checkbox"
            checked={false}
            disabled
            className="w-4 h-4 rounded text-gray-400 border-gray-300 cursor-not-allowed mt-0.5"
          />
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="p-3.5 rounded-xl border border-blue-100 bg-blue-50/50 space-y-2">
        <label className="flex items-start justify-between cursor-pointer">
          <div className="flex items-start gap-2.5">
            <Moon className="w-4 h-4 text-blue-700 mt-0.5 shrink-0" />
            <div>
              <span className="text-xs font-bold text-blue-950 block">
                {t('quietHoursLabel')}
              </span>
              <p className="text-[11px] text-blue-900 leading-relaxed mt-0.5">
                {t('quietHoursDesc')}
              </p>
            </div>
          </div>
          <input
            type="checkbox"
            checked={quietHoursEnabled}
            onChange={(e) => setQuietHoursEnabled(e.target.checked)}
            className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 border-blue-300 cursor-pointer mt-0.5"
          />
        </label>
      </div>

      {/* Language Preference */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-gray-700 flex items-center gap-1.5">
          <Globe className="w-3.5 h-3.5 text-gray-500" />
          <span>{t('preferredLanguageLabel')}</span>
        </label>
        <div className="grid grid-cols-3 gap-2">
          {[
            { code: 'mr', label: 'मराठी' },
            { code: 'hi', label: 'हिंदी' },
            { code: 'en', label: 'English' },
          ].map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setPreferredLanguage(l.code as any)}
              className={`py-2 px-3 rounded-xl text-xs font-bold border transition cursor-pointer text-center ${
                preferredLanguage === l.code
                  ? 'border-orange-600 bg-orange-50 text-orange-700 shadow-xs'
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Essential Notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100 text-[11px] text-gray-500">
        <ShieldCheck className="w-4 h-4 text-gray-400 shrink-0 mt-0.2" />
        <span>{t('essentialEventsNote')}</span>
      </div>

      {/* Save Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="w-full py-2.5 px-4 bg-orange-600 hover:bg-orange-700 text-white rounded-xl text-xs font-bold shadow-xs transition cursor-pointer disabled:opacity-50"
        >
          {saving ? 'Saving...' : t('savePreferencesBtn')}
        </button>
      </div>
    </div>
  );
}
