import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Providers } from './Providers';
import GoogleTranslate from '../components/GoogleTranslate';
import SmoothScroll from '@/components/SmoothScroll';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Revlo - The Ultimate ERP & Business Management Solution',
  description: 'Revlo is a powerful, all-in-one ERP and POS system designed to streamline business operations globally. From inventory management to financial reporting, Revlo empowers businesses of all sizes with cutting-edge technology. Founded by Hamse Moalin Amiin. | Revlo waa nidaamka maamulka ganacsiga ee ugu casrisan, kaas oo isugu keenaya maamulka kaydka, xisaabaadka, iyo iibka hal meel. Ku habboon ganacsi kasta, meel kasta.',
  keywords: [
    'ERP System', 'Business Management Software', 'POS System', 'Accounting Software', 'Inventory Management',
    'Hamse Moalin Amiin', 'Revlo', 'Cloud ERP', 'Ganacsi Maamul', 'Nidaamka Xisaabaadka', 'Software', 'Technology'
  ],
  authors: [{ name: 'Hamse Moalin Amiin', url: 'https://revlo.me' }],
  creator: 'Hamse Moalin Amiin',
  publisher: 'Revlo Inc.',
  metadataBase: new URL('https://revlo.me'), // Replace with actual domain when live
  openGraph: {
    title: 'Revlo - Transform Your Business with Smart Management',
    description: 'Empowering businesses with seamless ERP & POS solutions. Built for efficiency, designed for growth. Founded by Hamse Moalin Amiin.',
    url: 'https://revlo.me',
    siteName: 'Revlo',
    images: [
      {
        url: '/about-hero.png', // Ensure this image is high quality and representative
        width: 1200,
        height: 630,
        alt: 'Revlo Dashboard Preview',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Revlo - Global ERP & Business Solution',
    description: 'The future of business management is here. Discover Revlo, founded by Hamse Moalin Amiin. Contact: hamsemoalin@gmail.com | +251 929 475 332',
    images: ['/about-hero.png'],
  },
  icons: {
    icon: '/revlo-logo.png',
    shortcut: '/revlo-logo.png',
    apple: '/revlo-logo.png',
  },
  manifest: '/manifest.json',
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    languages: {
      'en-US': '/en',
      'so-SO': '/so',
    },
  },
  verification: {
    google: 'google-site-verification-code', // Add verification code if available later
  },
  other: {
    "contact:email": "hamsemoalin@gmail.com",
    "contact:phone_number": "+251 929 475 332",
    "founder": "Hamse Moalin Amiin"
  }
};

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  "name": "Revlo ERP",
  "applicationCategory": "BusinessApplication",
  "operatingSystem": "Web, Windows, macOS, Linux, Android, iOS",
  "offers": {
    "@type": "Offer",
    "price": "0",
    "priceCurrency": "USD",
    "description": "Free Starter Plan available"
  },
  "description": "The ultimate AI-powered ERP and POS system for global business management. Features include inventory tracking, financial accounting, manufacturing, and project management.",
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.9",
    "ratingCount": "1250"
  },
  "author": {
    "@type": "Person",
    "name": "Hamse Moalin Amiin",
    "url": "https://revlo.io",
    "jobTitle": "Founder & CEO"
  },
  "publisher": {
    "@type": "Organization",
    "name": "Revlo Inc.",
    "logo": "https://revlo.io/revlo-logo.png"
  },
  "sameAs": [
    "https://twitter.com/revlo_erp",
    "https://facebook.com/revlo_erp",
    "https://linkedin.com/company/revlo"
  ]
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <SmoothScroll />
        <GoogleTranslate />
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}