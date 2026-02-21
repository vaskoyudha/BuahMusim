import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalender Musim Buah',
  description:
    'Kalender musim panen 30 jenis buah Indonesia. Temukan kapan buah favoritmu paling murah dan segar sepanjang tahun.',
};

export default function KalenderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
