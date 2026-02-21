'use client';

import Link from 'next/link';
import { CITIES, getFruitById } from '@buahmusim/shared';

// ── City Card ──────────────────────────────────────────────────────────────────

function CityCard({ city }: { city: typeof CITIES[number] }) {
  const specialties = city.fruitSpecialties
    .slice(0, 3)
    .map((id) => getFruitById(id))
    .filter(Boolean);

  const populationLabel =
    city.population >= 1
      ? `${city.population.toFixed(1)}jt penduduk`
      : `${(city.population * 1000).toFixed(0)}rb penduduk`;

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-5 flex flex-col gap-3">
      {/* City header */}
      <div>
        <h2 className="font-bold text-gray-900 text-base group-hover:text-primary-700 transition-colors">
          {city.name}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{city.province}</p>
      </div>

      {/* Market */}
      <div className="flex items-center gap-2">
        <span className="text-base">🏪</span>
        <p className="text-xs text-gray-600">{city.market}</p>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
            Unggulan
          </p>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((fruit) => (
              <span
                key={fruit!.id}
                className="inline-flex items-center gap-1 text-xs bg-primary-50 text-primary-800 border border-primary-100 rounded-full px-2 py-0.5"
              >
                {fruit!.emoji} {fruit!.nameId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Population */}
      <p className="text-xs text-gray-400 flex items-center gap-1.5">
        <span>👥</span>
        {populationLabel}
      </p>

      {/* CTA */}
      <Link
        href={`/kota/${city.id}`}
        className="mt-auto block text-center px-4 py-2 bg-primary-600 text-white text-xs font-semibold rounded-xl hover:bg-primary-700 transition-colors"
      >
        Lihat Harga →
      </Link>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function KotaListPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          10 Kota Pasar Utama
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Harga buah terkini dari 10 pasar tradisional terbesar Indonesia
        </p>
      </div>

      {/* Stats bar */}
      <div className="flex flex-wrap gap-3">
        <div className="bg-primary-50 border border-primary-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-xl">🏙️</span>
          <div>
            <p className="text-xs text-primary-600 font-medium">Kota Terpantau</p>
            <p className="text-lg font-bold text-primary-800">{CITIES.length}</p>
          </div>
        </div>
        <div className="bg-warm-50 border border-warm-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-xl">🍎</span>
          <div>
            <p className="text-xs text-warm-600 font-medium">Jenis Buah</p>
            <p className="text-lg font-bold text-warm-800">30</p>
          </div>
        </div>
        <div className="bg-earth-50 border border-earth-100 rounded-xl px-4 py-2.5 flex items-center gap-2">
          <span className="text-xl">📊</span>
          <div>
            <p className="text-xs text-earth-600 font-medium">Update Harga</p>
            <p className="text-lg font-bold text-earth-800">Harian</p>
          </div>
        </div>
      </div>

      {/* City grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {CITIES.map((city) => (
          <CityCard key={city.id} city={city} />
        ))}
      </div>

      {/* Tip */}
      <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
        <p className="text-xs text-primary-800 font-semibold mb-1">
          💡 Tips Memilih Kota
        </p>
        <p className="text-xs text-primary-700">
          Kota-kota di Sumatera (Medan, Palembang) cenderung lebih murah untuk
          buah tropis seperti Durian dan Rambutan. Kota Jawa lebih murah untuk
          Mangga dan Pisang saat musim panen.
        </p>
      </div>
    </div>
  );
}
