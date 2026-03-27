import type { Metadata, Viewport } from 'next';
import { Geist } from 'next/font/google';
import './globals.css';

const geist = Geist({ variable: '--font-geist-sans', subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'strHong',
  description: 'Track your daily water intake.',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'strHong',
    startupImage: '/api/icon?size=512',
  },
  icons: {
    apple: '/api/icon?size=192',
    icon: '/api/icon?size=192',
  },
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={geist.variable}>
      <body>{children}</body>
    </html>
  );
}
