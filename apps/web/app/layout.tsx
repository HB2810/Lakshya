import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Stavya One — Hospital Management & Employee Companion Operating System',
  description: 'Privacy-first Management Operating System & Employee Work/Life Companion for Stavya Spine Hospital',
  icons: {
    icon: '/brand/stavya-logo.png',
    shortcut: '/brand/stavya-logo.png',
    apple: '/brand/stavya-logo.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#f8fafc',
};

import { AuthProvider } from '../lib/auth/AuthContext';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-slate-50 text-slate-900 selection:bg-brand-blue selection:text-white">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
