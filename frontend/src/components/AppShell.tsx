'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { AppTab } from './BottomNav';

interface AppShellProps {
  children: React.ReactNode;
  activeTab?: AppTab;
  onTabChange?: (tab: AppTab) => void;
  onOpenRaiseModal?: () => void;
  title?: string;
  subtitle?: string;
}

export function AppShell({
  children,
  activeTab,
  onTabChange,
  onOpenRaiseModal,
  title,
  subtitle,
}: AppShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Load collapse preference from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('raise_sidebar_collapsed');
      if (saved === 'true') {
        setIsCollapsed(true);
      }
    }
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      if (typeof window !== 'undefined') {
        localStorage.setItem('raise_sidebar_collapsed', String(next));
      }
      return next;
    });
  };

  const handleToggleSidebar = () => {
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setIsMobileOpen((prev) => !prev);
    } else {
      toggleCollapse();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col text-gray-900 antialiased">
      {/* Persistent Left Sidebar */}
      <Suspense fallback={null}>
        <AppSidebar
          isCollapsed={isCollapsed}
          onToggleCollapse={toggleCollapse}
          isMobileOpen={isMobileOpen}
          onCloseMobile={() => setIsMobileOpen(false)}
        />
      </Suspense>

      {/* Main Column offset by sidebar width on desktop */}
      <div
        className={`flex-1 flex flex-col transition-all duration-300 ease-in-out ${
          isCollapsed ? 'md:pl-16' : 'md:pl-64'
        }`}
      >
        {/* Top Contextual Header */}
        <Header
          activeTab={activeTab}
          onTabChange={onTabChange}
          onToggleSidebar={handleToggleSidebar}
          isSidebarCollapsed={isCollapsed}
          onOpenRaiseModal={onOpenRaiseModal}
          title={title}
          subtitle={subtitle}
        />

        {/* Page Content */}
        <div className="flex-1 w-full flex flex-col">
          {children}
        </div>
      </div>
    </div>
  );
}
