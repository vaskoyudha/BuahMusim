'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FRUITS,
  getSeasonStatus,
  type FruitData,
  type SeasonStatus,
} from '@buahmusim/shared';

// ── Season badge config ────────────────────────────────────────────────────────

const SEASON_BADGE: Record<SeasonStatus, { label: string; cls: string }> = {
  peak:       { label: '● Musim Panen',  cls: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white' },
  transition: { label: '● Transisi',     cls: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white' },
  normal:     { label: '● Normal',       cls: 'bg-gray-100 text-gray-500 border border-gray-200' },
  off:        { label: '● Tidak Musim',  cls: 'bg-gradient-to-r from-red-400 to-rose-500 text-white' },
};

const SEASON_CARD_BG: Record<SeasonStatus, string> = {
  peak:       'linear-gradient(150deg, rgba(240,253,244,0.9) 0%, #ffffff 55%)',
  transition: 'linear-gradient(150deg, rgba(254,252,232,0.9) 0%, #ffffff 55%)',
  normal:     'linear-gradient(150deg, rgba(248,250,252,0.9) 0%, #ffffff 55%)',
  off:        'linear-gradient(150deg, rgba(255,249,245,0.9) 0%, #ffffff 55%)',
};

const SEASON_EMOJI_BG: Record<SeasonStatus, string> = {
  peak:       'bg-gradient-to-br from-green-100 to-emerald-50',
  transition: 'bg-gradient-to-br from-yellow-100 to-amber-50',
  normal:     'bg-gradient-to-br from-gray-100 to-slate-50',
  off:        'bg-gradient-to-br from-orange-100 to-red-50',
};

type FilterMode = 'all' | 'inSeason' | 'offSeason';
type SortMode = 'az' | 'priceLow' | 'priceHigh';

// ── Fruit Card ────────────────────────────────────────────────────────────────

interface FruitCardProps {
  fruit: FruitData;
  currentMonth1: number;
}

function FruitCard({ fruit, currentMonth1 }: FruitCardProps) {
  const status = getSeasonStatus(fruit.id, currentMonth1);
  const badge = SEASON_BADGE[status];

  return (
    <Link
      href={`/buah/${fruit.id}`}
      className="card-premium group relative flex flex-col gap-3 p-4 overflow-hidden"
      style={{ background: SEASON_CARD_BG[status] }}
    >
      {/* Emoji container */}
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 ${SEASON_EMOJI_BG[status]}`}
      >
        <span className="text-3xl leading-none">{fruit.emoji}</span>
      </div>

      {/* Names */}
      <div>
        <p className="font-bold text-sm text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
          {fruit.nameId}
        </p>
        <p className="text-[11px] text-gray-400 italic mt-0.5">{fruit.nameEn}</p>
      </div>

      {/* Season badge */}
      <span
        className={`self-start inline-flex items-center text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${badge.cls}`}
      >
        {badge.label}
      </span>

      {/* Price range */}
      <p className="text-xs font-semibold text-gray-500 mt-auto">
        <span className="text-primary-700">
          Rp {fruit.priceRange.low.toLocaleString('id-ID')}
        </span>
        {' – '}
        <span className="text-primary-700">
          Rp {fruit.priceRange.high.toLocaleString('id-ID')}
        </span>
        <span className="text-gray-400 font-normal"> / kg</span>
      </p>

      {/* Hover arrow */}
      <span className="text-xs text-gray-300 group-hover:text-primary-400 transition-colors absolute bottom-3 right-3 select-none">
        →
      </span>
    </Link>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function BuahListPage() {
  const currentMonth1 = new Date().getMonth() + 1;

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterMode>('all');
  const [sort, setSort] = useState<SortMode>('az');

  const displayFruits = useMemo(() => {
    let list = [...FRUITS];

    // Search filter
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(
        (f) =>
          f.nameId.toLowerCase().includes(q) ||
          f.nameEn.toLowerCase().includes(q)
      );
    }

    // Season filter
    if (filter === 'inSeason') {
      list = list.filter((f) => {
        const s = getSeasonStatus(f.id, currentMonth1);
        return s === 'peak' || s === 'transition';
      });
    } else if (filter === 'offSeason') {
      list = list.filter((f) => getSeasonStatus(f.id, currentMonth1) === 'off');
    }

    // Sort
    if (sort === 'az') {
      list.sort((a, b) => a.nameId.localeCompare(b.nameId, 'id'));
    } else if (sort === 'priceLow') {
      list.sort((a, b) => a.priceRange.low - b.priceRange.low);
    } else {
      list.sort((a, b) => b.priceRange.high - a.priceRange.high);
    }

    return list;
  }, [search, filter, sort, currentMonth1]);

  const filterOptions: { value: FilterMode; label: string }[] = [
    { value: 'all',       label: 'Semua' },
    { value: 'inSeason',  label: '🔥 Musim Sekarang' },
    { value: 'offSeason', label: '😴 Tidak Musim' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="border-b border-gray-100 pb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-3 py-1 mb-3">
          🌿 Katalog Buah Indonesia
        </span>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Semua Buah
          <span className="text-primary-600 ml-2 text-2xl font-semibold">({FRUITS.length})</span>
        </h1>
        <p className="text-sm text-gray-500 mt-1.5">
          Temukan harga terkini, data musim, dan prediksi untuk 30 buah Indonesia
        </p>
      </div>

      {/* ── Search ── */}
      <div className="relative bg-white/90 backdrop-blur-sm rounded-2xl overflow-hidden shadow-sm border border-gray-200 focus-within:border-primary-400 focus-within:ring-2 focus-within:ring-primary-100 transition-all duration-200">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 text-sm pointer-events-none select-none">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.35-4.35" />
          </svg>
        </span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari buah..."
          className="bg-transparent border-none outline-none ring-0 focus:outline-none focus:ring-0 w-full pl-10 pr-4 py-3 text-sm text-gray-800 placeholder-gray-400"
        />
      </div>

      {/* ── Filter pills + Sort ── */}
      <div className="flex flex-wrap gap-2 items-center justify-between">
        {/* Filter pills */}
        <div className="flex flex-wrap gap-1.5">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                filter === opt.value
                  ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white border-transparent shadow-sm scale-[1.02]'
                  : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/50 shadow-sm'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort select */}
        <div className="relative">
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortMode)}
            className="pl-4 pr-9 py-2 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm appearance-none cursor-pointer font-medium"
          >
            <option value="az">A–Z</option>
            <option value="priceLow">Harga Terendah</option>
            <option value="priceHigh">Harga Tertinggi</option>
          </select>
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-xs select-none">
            ▾
          </span>
        </div>
      </div>

      {/* ── Results count ── */}
      {(search || filter !== 'all') && (
        <div>
          <span className="bg-primary-50 text-primary-700 text-xs font-semibold px-3 py-1 rounded-full border border-primary-100">
            Menampilkan {displayFruits.length} dari {FRUITS.length} buah
          </span>
        </div>
      )}

      {/* ── Grid ── */}
      {displayFruits.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayFruits.map((fruit) => (
            <FruitCard key={fruit.id} fruit={fruit} currentMonth1={currentMonth1} />
          ))}
        </div>
      ) : (
        <div className="card-premium py-16 text-center">
          <div className="w-16 h-16 rounded-full bg-primary-50 flex items-center justify-center mx-auto text-3xl mb-4">
            🔎
          </div>
          <p className="text-gray-600 font-semibold mb-1">Tidak ada hasil</p>
          <p className="text-gray-400 text-sm mb-4">Tidak ada buah yang cocok dengan pencarian.</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setFilter('all'); }}
            className="bg-primary-600 text-white px-5 py-2 rounded-full text-sm font-medium hover:bg-primary-700 transition-colors"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}
