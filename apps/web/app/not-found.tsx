import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
      <p className="text-6xl mb-4">🍑</p>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Halaman Tidak Ditemukan</h1>
      <p className="text-gray-500 text-sm mb-8 max-w-xs">
        Halaman yang kamu cari tidak ada. Mungkin buah ini sedang tidak musim?
      </p>
      <Link
        href="/"
        className="px-6 py-3 bg-primary-600 text-white rounded-2xl font-semibold text-sm hover:bg-primary-700 transition-colors shadow-sm"
      >
        Kembali ke Beranda
      </Link>
    </div>
  );
}
