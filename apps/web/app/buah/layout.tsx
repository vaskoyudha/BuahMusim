import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Semua Buah',
  description:
    '30 jenis buah musiman Indonesia — pantau musim panen, harga terkini, dan prediksi tren harga buah di seluruh Indonesia.',
};

export default function BuahLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
