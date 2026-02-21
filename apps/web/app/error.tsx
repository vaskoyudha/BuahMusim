'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center">
      <p className="text-5xl mb-4">😕</p>
      <h2 className="text-xl font-bold text-gray-900 mb-2">Terjadi kesalahan</h2>
      <p className="text-gray-500 text-sm mb-6">
        Maaf, ada masalah yang tidak terduga. Silakan coba lagi.
      </p>
      <button
        onClick={reset}
        className="px-5 py-2.5 bg-primary-600 text-white rounded-xl font-semibold text-sm hover:bg-primary-700 transition-colors"
      >
        Coba Lagi
      </button>
    </div>
  );
}
