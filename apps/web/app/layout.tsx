import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Header } from '@/components/layout/Header';
import { BottomNav } from '@/components/layout/BottomNav';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'BuahMusim — Prediksi Harga Buah Indonesia',
    template: '%s | BuahMusim',
  },
  description:
    'Pantau dan prediksi harga buah musiman di 10 kota besar Indonesia. Beli sekarang atau tunggu? BuahMusim memberikan jawabannya.',
  keywords: ['harga buah', 'buah musiman', 'prediksi harga', 'buah Indonesia', 'BuahMusim'],
  openGraph: {
    siteName: 'BuahMusim',
    locale: 'id_ID',
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#16a34a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className={inter.variable}>
      <body className="bg-gray-50 text-gray-900 min-h-screen">
        <Header />
        <main className="pb-20 md:pb-0">{children}</main>
        <BottomNav />
      </body>
    </html>
  );
}
