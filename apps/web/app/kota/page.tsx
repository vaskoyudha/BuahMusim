'use client';

import Link from 'next/link';
import { CITIES, getFruitById } from '@buahmusim/shared';

// ── City Card ──────────────────────────────────────────────────────────────────

// Subtle diagonal tint colors per city index to give each card personality
const CARD_TINTS = [
  'from-green-50 to-emerald-50',
  'from-teal-50 to-cyan-50',
  'from-blue-50 to-indigo-50',
  'from-amber-50 to-yellow-50',
  'from-orange-50 to-red-50',
  'from-rose-50 to-pink-50',
  'from-purple-50 to-violet-50',
  'from-lime-50 to-green-50',
  'from-sky-50 to-blue-50',
  'from-emerald-50 to-teal-50',
];

function CityCard({ city, index }: { city: typeof CITIES[number]; index: number }) {
  const specialties = city.fruitSpecialties
    .slice(0, 3)
    .map((id) => getFruitById(id))
    .filter(Boolean);

  const populationLabel =
    city.population >= 1
      ? `${city.population.toFixed(1)}jt penduduk`
      : `${(city.population * 1000).toFixed(0)}rb penduduk`;

  const tint = CARD_TINTS[index % CARD_TINTS.length];

  return (
    <div className="card-premium group relative flex flex-col gap-3 p-5 overflow-hidden">
      {/* Diagonal color tint at top */}
      <div className={`absolute top-0 left-0 right-0 h-16 bg-gradient-to-br ${tint} opacity-60 pointer-events-none`} />

      {/* City header */}
      <div className="relative">
        <h2 className="font-bold text-gray-900 text-base leading-tight group-hover:text-primary-700 transition-colors">
          {city.name}
        </h2>
        <p className="text-xs text-gray-500 mt-0.5">{city.province}</p>
      </div>

      {/* Market with icon circle */}
      <div className="relative flex items-center gap-2">
        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center text-white text-sm shadow-sm shrink-0">
          🏪
        </div>
        <p className="text-xs text-gray-600 leading-tight">{city.market}</p>
      </div>

      {/* Specialties */}
      {specialties.length > 0 && (
        <div className="relative">
          <p className="text-[10px] font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">
            Unggulan
          </p>
          <div className="flex flex-wrap gap-1.5">
            {specialties.map((fruit, i) => (
              <span
                key={fruit!.id}
                className={`inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  i === 0
                    ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-sm'
                    : 'bg-primary-50 border border-primary-100 text-primary-800'
                }`}
              >
                {fruit!.emoji} {fruit!.nameId}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Population */}
      <p className="relative text-[11px] text-gray-400 flex items-center gap-1.5 mt-auto">
        <span className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center text-xs shrink-0">👥</span>
        {populationLabel}
      </p>

      {/* CTA */}
      <Link
        href={`/kota/${city.id}`}
        className="relative block text-center px-4 py-2 bg-gradient-to-r from-primary-600 to-emerald-600 text-white text-xs font-semibold rounded-xl hover:shadow-lg hover:scale-[1.02] transition-all duration-200"
      >
        Lihat Harga →
      </Link>
    </div>
  );
}

// ── Main Page ──────────────────────────────────────────────────────────────────

export default function KotaListPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="border-b border-gray-100 pb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-3 py-1 mb-3">
          🏙️ Kota Pasar Indonesia
        </span>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          10 Kota Pasar Utama
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Harga buah terkini dari 10 pasar tradisional terbesar Indonesia
        </p>
      </div>

      {/* ── Stats bar ── */}
      <div className="flex flex-wrap gap-3">
        <div className="card-premium flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-emerald-600 flex items-center justify-center text-white text-xl shadow-lg shrink-0">
            🏙️
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Kota Terpantau</p>
            <p className="text-xl font-bold text-gray-900">{CITIES.length}</p>
          </div>
        </div>

        <div className="card-premium flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-warm-400 to-orange-500 flex items-center justify-center text-white text-xl shadow-lg shrink-0">
            🍎
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Jenis Buah</p>
            <p className="text-xl font-bold text-gray-900">30</p>
          </div>
        </div>

        <div className="card-premium flex items-center gap-3 px-4 py-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-earth-400 to-earth-600 flex items-center justify-center text-white text-xl shadow-lg shrink-0">
            📊
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium">Update Harga</p>
            <p className="text-xl font-bold text-gray-900">Harian</p>
          </div>
        </div>
      </div>

      {/* ── Section header ── */}
      <div className="flex items-center gap-2.5">
        <div className="w-1 h-6 rounded-full bg-primary-500 shrink-0" />
        <h2 className="text-2xl font-bold text-gray-900">Semua Kota</h2>
        <span className="text-sm text-gray-400 ml-1">({CITIES.length} kota)</span>
      </div>

      {/* ── City grid ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
        {CITIES.map((city, index) => (
          <CityCard key={city.id} city={city} index={index} />
        ))}
      </div>

      {/* ── Tip box ── */}
      <div className="card-premium border-l-4 border-primary-400 p-5">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-900 mb-1">
              Tips Memilih Kota
            </p>
            <p className="text-xs text-gray-600 leading-relaxed">
              Kota-kota di Sumatera (Medan, Palembang) cenderung lebih murah untuk
              buah tropis seperti Durian dan Rambutan. Kota Jawa lebih murah untuk
              Mangga dan Pisang saat musim panen.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
