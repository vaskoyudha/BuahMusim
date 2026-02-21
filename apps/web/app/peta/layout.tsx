import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Peta Harga Buah',
  description:
    'Peta interaktif perbandingan harga buah di 10 kota pasar utama Indonesia. Temukan kota termurah untuk membeli buah favoritmu.',
};

export default function PetaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
