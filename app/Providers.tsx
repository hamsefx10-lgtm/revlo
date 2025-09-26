'use client';

import { SessionProvider } from 'next-auth/react';
import { UserProvider } from '@/components/providers/UserProvider';
import { NotificationProvider } from '@/contexts/NotificationContext';
import { LanguageProvider } from '@/contexts/LanguageContext';
import { CurrencyProvider } from '@/contexts/CurrencyContext';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <UserProvider>
        <LanguageProvider>
          <CurrencyProvider>
            <NotificationProvider>
              {children}
            </NotificationProvider>
          </CurrencyProvider>
        </LanguageProvider>
      </UserProvider>
    </SessionProvider>
  );
}