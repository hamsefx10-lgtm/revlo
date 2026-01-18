'use client';

import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/components/providers/UserProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import OfflineSyncManager from '@/components/OfflineSyncManager';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <NotificationProvider>
              <OfflineSyncManager />
              {children}
            </NotificationProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </UserProvider>
    </SessionProvider>
  );
}