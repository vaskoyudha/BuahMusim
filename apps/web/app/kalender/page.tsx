'use client';

import { useState } from 'react';
import { SeasonalCalendar } from '@/components/calendar/SeasonalCalendar';

export default function KalenderPage() {
  const [filterSeasonal, setFilterSeasonal] = useState(false);
  const [sortMode, setSortMode] = useState<'az' | 'nextSeason'>('az');

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">

      {/* ── Page header ── */}
      <div className="border-b border-gray-100 pb-5 animate-fadeInUp">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-3 py-1 mb-3">
          🗓️ Kalender Musim
        </span>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Kalender Musim Buah Indonesia
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Temukan kapan buah favoritmu paling murah dan segar sepanjang tahun
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center animate-fadeInUp stagger-1">
        {/* Filter toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
          <button
            type="button"
            onClick={() => setFilterSeasonal(false)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              !filterSeasonal
                ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            Semua Buah
          </button>
          <button
            type="button"
            onClick={() => setFilterSeasonal(true)}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              filterSeasonal
                ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            🔥 Hanya Musim Sekarang
          </button>
        </div>

        {/* Sort toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-1.5 flex gap-1">
          <button
            type="button"
            onClick={() => setSortMode('az')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              sortMode === 'az'
                ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            Urut A–Z
          </button>
          <button
            type="button"
            onClick={() => setSortMode('nextSeason')}
            className={`px-3 py-1.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              sortMode === 'nextSeason'
                ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md'
                : 'text-gray-600 hover:bg-primary-50 hover:text-primary-700'
            }`}
          >
            Mulai Musim Tercepat
          </button>
        </div>
      </div>

      {/* ── Section heading ── */}
      <div className="flex items-center gap-2.5 animate-fadeInUp stagger-2">
        <div className="w-1 h-6 rounded-full bg-primary-500 shrink-0" />
        <h2 className="text-lg font-bold text-gray-800">Kalender Panen Tahunan</h2>
      </div>

      {/* ── Calendar ── */}
      <div className="animate-fadeInUp stagger-3">
        <SeasonalCalendar
          filterOnlySeasonal={filterSeasonal}
          sortMode={sortMode}
        />
      </div>

      {/* ── Tips ── */}
      <div className="card-premium border-l-4 border-primary-400 p-5 animate-fadeInUp stagger-4">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center text-xl shrink-0">
            💡
          </div>
          <div>
            <p className="text-sm font-semibold text-gray-800 mb-1">Tips Belanja Cerdas</p>
            <p className="text-sm text-gray-600">
              Klik sel mana saja untuk melihat detail buah dan kisaran harga per bulan.
              Beli saat kolom hijau tua <span className="font-semibold text-primary-700">(Panen Raya)</span> untuk harga terbaik.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
