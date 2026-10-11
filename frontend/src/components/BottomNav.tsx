'use client';

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import {
  Flame,
  FileText,
  Plus,
  Building2,
  User,
  Briefcase,
  ShieldAlert,
} from 'lucide-react';

export type AppTab = 'home' | 'my_issues' | 'offices' | 'office_portal' | 'admin' | 'profile';

interface BottomNavProps {
  activeTab: AppTab;
  onTabChange: (tab: AppTab) => void;
  onOpenRaiseModal: () => void;
}

export function BottomNav({ activeTab, onTabChange, onOpenRaiseModal }: BottomNavProps) {
  const { user, openAuthModal, openAuthModalWithAction } = useAuth();
  const { t } = useLanguage();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-gray-200 sm:hidden">
      <div className="grid grid-flow-col auto-cols-fr items-center h-16 px-1 max-w-lg mx-auto">
        {/* 1. Home / Feed */}
        <button
          onClick={() => onTabChange('home')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'home' ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Flame className={`w-5 h-5 ${activeTab === 'home' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">{t('navFeed')}</span>
        </button>

        {/* 2. My Issues */}
        <button
          onClick={() => {
            if (!user) {
              openAuthModalWithAction({ type: 'view_dashboard' });
            } else {
              onTabChange('my_issues');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'my_issues' ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <FileText className={`w-5 h-5 ${activeTab === 'my_issues' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">{t('navMyIssues')}</span>
        </button>

        {/* 3. Central Raise Button */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              if (!user) {
                openAuthModalWithAction({ type: 'raise_issue' });
              } else {
                onOpenRaiseModal();
              }
            }}
            className="w-12 h-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-lg -mt-5 border-4 border-white transition active:scale-95 cursor-pointer"
            title={t('raiseIssueBtn')}
          >
            <Plus className="w-6 h-6 stroke-[3]" />
          </button>
        </div>

        {/* 4. Public Offices */}
        <button
          onClick={() => onTabChange('offices')}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'offices' ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <Building2 className={`w-5 h-5 ${activeTab === 'offices' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">{t('navOffices')}</span>
        </button>

        {/* 5. Role-Specific Tab if Official or Admin */}
        {user?.role === 'official' && (
          <button
            onClick={() => onTabChange('office_portal')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeTab === 'office_portal' ? 'text-blue-600 font-bold' : 'text-gray-500 hover:text-blue-900'
            }`}
          >
            <Briefcase className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navPortal')}</span>
          </button>
        )}

        {user?.role === 'admin' && (
          <button
            onClick={() => onTabChange('admin')}
            className={`flex flex-col items-center justify-center py-1 transition ${
              activeTab === 'admin' ? 'text-purple-600 font-bold' : 'text-gray-500 hover:text-purple-900'
            }`}
          >
            <ShieldAlert className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{t('navAdmin')}</span>
          </button>
        )}

        {/* 6. Profile */}
        <button
          onClick={() => {
            if (!user) {
              window.location.href = '/sign-in';
            } else {
              onTabChange('profile');
            }
          }}
          className={`flex flex-col items-center justify-center py-1 transition ${
            activeTab === 'profile' ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-900'
          }`}
        >
          <User className={`w-5 h-5 ${activeTab === 'profile' ? 'stroke-[2.5]' : ''}`} />
          <span className="text-[10px] mt-0.5">{user ? t('navProfile') : t('signIn')}</span>
        </button>
      </div>
    </nav>
  );
}
