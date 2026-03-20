import type { Metadata, Viewport } from 'next';
import { Amiri, Cormorant_Garamond, Lora } from 'next/font/google';
import './globals.css';
import Navigation from '@/components/Navigation';
import ServiceWorkerRegistration from '@/components/ServiceWorkerRegistration';
import ReaderPrefsInit from '@/components/ReaderPrefsInit';

const amiri = Amiri({
  subsets: ['arabic', 'latin'],
  weight: ['400', '700'],
  variable: '--font-amiri',
  display: 'swap',
});

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const lora = Lora({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-lora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'IQRA Digital — Hadith Library',
    template: '%s | IQRA Digital',
  },
  description:
    'A serious Islamic learning platform. Browse, read, and search authentic hadith from the canonical collections.',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'IQRA Digital',
  },
  keywords: ['hadith', 'quran', 'islam', 'islamic', 'learning', 'sunnah'],
};

export const viewport: Viewport = {
  themeColor: '#0d1117',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${amiri.variable} ${cormorant.variable} ${lora.variable}`}>
      <body>
        {/* Client islands — registered after hydration, render nothing */}
        <ServiceWorkerRegistration />
        <ReaderPrefsInit />

        <Navigation />
        <main style={{ paddingTop: 'var(--nav-height)' }} className="min-h-screen">
          {children}
        </main>
      </body>
    </html>
  );
}
