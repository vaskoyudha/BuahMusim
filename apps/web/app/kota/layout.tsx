import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kota Pasar Utama',
  description:
    'Harga buah terkini dari 10 pasar tradisional terbesar Indonesia — Jakarta, Surabaya, Bandung, Medan, dan lebih banyak lagi.',
};

export default function KotaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
