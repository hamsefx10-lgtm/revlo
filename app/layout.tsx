import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './Providers';
import GoogleTranslate from '../components/GoogleTranslate';
import SmoothScroll from '@/components/SmoothScroll';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Revlo - Project & Financial Management',
  description: 'Nidaamka maamulka mashaariicda iyo maaliyadda ee casriga ah.',
  icons: {
    icon: '/revlo-logo.png',
    shortcut: '/revlo-logo.png',
    apple: '/revlo-logo.png',
  },
  manifest: '/manifest.json',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <SmoothScroll />
        <GoogleTranslate />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}