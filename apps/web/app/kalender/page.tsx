'use client';

import { useState } from 'react';
import { SeasonalCalendar } from '@/components/calendar/SeasonalCalendar';

export default function KalenderPage() {
  const [filterSeasonal, setFilterSeasonal] = useState(false);
  const [sortMode, setSortMode] = useState<'az' | 'nextSeason'>('az');

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      {/* ── Page header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Kalender Musim Buah Indonesia
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Temukan kapan buah favoritmu paling murah dan segar
        </p>
      </div>

      {/* ── Filters ── */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Filter toggle */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setFilterSeasonal(false)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              !filterSeasonal
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Semua Buah
          </button>
          <button
            type="button"
            onClick={() => setFilterSeasonal(true)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              filterSeasonal
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            🔥 Hanya Musim Sekarang
          </button>
        </div>

        {/* Sort toggle */}
        <div className="flex items-center gap-1 bg-white rounded-xl border border-gray-200 p-1 shadow-sm">
          <button
            type="button"
            onClick={() => setSortMode('az')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortMode === 'az'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Urut A–Z
          </button>
          <button
            type="button"
            onClick={() => setSortMode('nextSeason')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
              sortMode === 'nextSeason'
                ? 'bg-primary-600 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            Mulai Musim Tercepat
          </button>
        </div>
      </div>

      {/* ── Calendar ── */}
      <SeasonalCalendar
        filterOnlySeasonal={filterSeasonal}
        sortMode={sortMode}
      />

      {/* ── Tips ── */}
      <div className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
        <p className="text-xs text-primary-800 font-semibold mb-1">💡 Tips Belanja Cerdas</p>
        <p className="text-xs text-primary-700">
          Klik sel mana saja untuk melihat detail buah dan kisaran harga per bulan.
          Beli saat kolom hijau tua (Panen Raya) untuk harga terbaik.
        </p>
      </div>
    </div>
  );
}
