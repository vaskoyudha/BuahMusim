'use client';

import Link from 'next/link';
import { FRUITS, getSeasonStatus, formatPrice } from '@buahmusim/shared';

export function InSeasonSection() {
  const currentMonth1 = new Date().getMonth() + 1;

  const peakFruits = FRUITS.filter(
    (f) => getSeasonStatus(f.id, currentMonth1) === 'peak'
  );

  if (peakFruits.length === 0) {
    return (
      <section className="py-6 px-4">
        <h2 className="text-lg font-bold text-gray-900 mb-3">🌿 Lagi Musim Sekarang</h2>
        <div className="bg-primary-50 rounded-2xl border border-primary-100 p-6 text-center">
          <p className="text-2xl mb-2">🌿</p>
          <p className="text-sm text-primary-800 font-medium">
            Transisi musim — harga sedang berubah
          </p>
          <p className="text-xs text-primary-600 mt-1">
            Pantau kalender untuk melihat buah yang akan segera masuk musim panen.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="py-6">
      <div className="px-4 flex items-center justify-between mb-3">
        <h2 className="text-lg font-bold text-gray-900">🔥 Lagi Musim Sekarang</h2>
        <Link
          href="/kalender"
          className="text-xs text-primary-600 font-semibold hover:underline"
        >
          Lihat Kalender →
        </Link>
      </div>

      {/* Horizontal scroll row */}
      <div className="overflow-x-auto -mx-0 px-4">
        <div className="flex gap-3 w-max pb-2">
          {peakFruits.map((fruit) => (
            <Link
              key={fruit.id}
              href={`/buah/${fruit.id}`}
              className="group w-36 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-3 flex flex-col gap-1.5 shrink-0"
            >
              <span className="text-4xl leading-none">{fruit.emoji}</span>
              <p className="font-semibold text-sm text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                {fruit.nameId}
              </p>
              <span className="self-start text-xs font-medium text-green-700 bg-green-100 border border-green-200 rounded-full px-2 py-0.5">
                🟢 Musim Panen
              </span>
              <p className="text-xs text-gray-500 mt-auto">
                {formatPrice(fruit.priceRange.low)} – {formatPrice(fruit.priceRange.high)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
