'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AuthProvider, useAuth } from '../../lib/auth/AuthContext';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { StavyaOneLogo } from '../brand/StavyaOneLogo';

export const AppShellContent: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const [isMobileNavigationOpen, setIsMobileNavigationOpen] = useState(false);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex h-[100dvh] w-full items-center justify-center bg-[#f8fafc]">
        <div className="flex flex-col items-center gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-md animate-in fade-in">
          <StavyaOneLogo size="lg" variant="full" />
          <div className="text-xs font-bold text-slate-500 flex items-center gap-2">
            <div className="w-3.5 h-3.5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            <span>Restoring Secure Session...</span>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-[100dvh] min-h-0 w-full overflow-hidden bg-workspace-bg text-text-primary">
      <a
        href="#stavya-one-main-content"
        className="sr-only focus:not-sr-only fixed left-3 top-3 z-[70] rounded-lg bg-slate-900 px-4 py-3 text-sm font-bold text-white shadow-xl"
      >
        Skip to main content
      </a>
      <Sidebar
        isMobileOpen={isMobileNavigationOpen}
        onCloseMobile={() => setIsMobileNavigationOpen(false)}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header onOpenNavigation={() => setIsMobileNavigationOpen(true)} />
        <main
          id="stavya-one-main-content"
          className="app-content flex-1 min-w-0 overflow-y-auto overscroll-y-contain scroll-smooth p-4 pb-[calc(1rem+env(safe-area-inset-bottom))] sm:p-5 sm:pb-[calc(1.25rem+env(safe-area-inset-bottom))] md:p-8 md:pb-8 space-y-5 md:space-y-6"
        >
          {children}
        </main>
      </div>
    </div>
  );
};

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return <AppShellContent>{children}</AppShellContent>;
};
