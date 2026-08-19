import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'LAKSHYA — MD Office Management Operating System',
  description: 'Automation-first Management Operating System for Stavya Spine Hospital MD Office',
  icons: {
    icon: '/brand/stavya-logo.png',
    shortcut: '/brand/stavya-logo.png',
    apple: '/brand/stavya-logo.png',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
