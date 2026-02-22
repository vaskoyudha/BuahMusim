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
        <h2 className="text-xl font-bold text-gray-900 mb-3">🌿 Lagi Musim Sekarang</h2>
        <div className="card-premium p-6 text-center" style={{ background: 'linear-gradient(145deg, rgba(240,253,244,0.8) 0%, #ffffff 50%)' }}>
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
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse inline-block" />
          <h2 className="text-xl font-bold text-gray-900">🔥 Lagi Musim Sekarang</h2>
        </div>
        <Link
          href="/kalender"
          className="text-xs text-primary-600 font-semibold hover:underline"
        >
          Lihat Kalender →
        </Link>
      </div>

      {/* Horizontal scroll row */}
      <div className="overflow-x-auto -mx-0 px-4 scrollbar-hide">
        <div className="flex gap-3 w-max pb-2">
          {peakFruits.map((fruit) => (
            <Link
              key={fruit.id}
              href={`/buah/${fruit.id}`}
              className="group card-premium w-36 shrink-0 p-3 flex flex-col gap-1.5"
              style={{ background: 'linear-gradient(145deg, rgba(240,253,244,0.8) 0%, #ffffff 50%)' }}
            >
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary-100 to-primary-50 flex items-center justify-center shadow-sm">
                <span className="text-3xl leading-none group-hover:scale-110 transition-transform duration-200 inline-block">
                  {fruit.emoji}
                </span>
              </div>
              <p className="font-bold text-sm text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                {fruit.nameId}
              </p>
              <span className="self-start bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[10px] font-semibold px-2.5 py-0.5 rounded-full shadow-sm">
                ● Musim Panen
              </span>
              <p className="text-gradient-green text-xs font-semibold mt-auto">
                {formatPrice(fruit.priceRange.low)} – {formatPrice(fruit.priceRange.high)}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
