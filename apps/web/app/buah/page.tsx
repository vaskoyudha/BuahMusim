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
  peak:       { label: '🟢 Musim Panen',  cls: 'bg-green-100 text-green-800 border-green-200' },
  transition: { label: '🟡 Transisi',      cls: 'bg-yellow-100 text-yellow-800 border-yellow-200' },
  normal:     { label: '⚪ Normal',         cls: 'bg-gray-100 text-gray-600 border-gray-200' },
  off:        { label: '🔴 Tidak Musim',   cls: 'bg-red-50 text-red-700 border-red-200' },
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
      className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-4 flex flex-col gap-2"
    >
      {/* Emoji */}
      <span className="text-4xl leading-none">{fruit.emoji}</span>

      {/* Names */}
      <div>
        <p className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
          {fruit.nameId}
        </p>
        <p className="text-xs text-gray-400 italic">{fruit.nameEn}</p>
      </div>

      {/* Season badge */}
      <span className={`self-start inline-flex items-center text-xs font-medium px-2 py-0.5 rounded-full border ${badge.cls}`}>
        {badge.label}
      </span>

      {/* Price range */}
      <p className="text-xs text-gray-500 mt-auto">
        Rp {fruit.priceRange.low.toLocaleString('id-ID')} –{' '}
        Rp {fruit.priceRange.high.toLocaleString('id-ID')}
        <span className="text-gray-400"> / kg</span>
      </p>
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
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-5">
      {/* ── Header ── */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Semua Buah ({FRUITS.length})</h1>
        <p className="text-sm text-gray-500 mt-1">Data musim dan kisaran harga untuk 30 buah Indonesia</p>
      </div>

      {/* ── Search ── */}
      <div className="relative">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-base">🔍</span>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Cari buah..."
          className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-400 focus:border-transparent shadow-sm"
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
              className={`px-3 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                filter === opt.value
                  ? 'bg-primary-600 text-white border-primary-600 shadow-sm'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Sort select */}
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortMode)}
          className="px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-primary-400 shadow-sm"
        >
          <option value="az">A–Z</option>
          <option value="priceLow">Harga Terendah</option>
          <option value="priceHigh">Harga Tertinggi</option>
        </select>
      </div>

      {/* ── Results count ── */}
      {(search || filter !== 'all') && (
        <p className="text-xs text-gray-500">
          Menampilkan {displayFruits.length} dari {FRUITS.length} buah
        </p>
      )}

      {/* ── Grid ── */}
      {displayFruits.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {displayFruits.map((fruit) => (
            <FruitCard key={fruit.id} fruit={fruit} currentMonth1={currentMonth1} />
          ))}
        </div>
      ) : (
        <div className="py-16 text-center">
          <p className="text-4xl mb-3">🔎</p>
          <p className="text-gray-500 text-sm">Tidak ada buah yang cocok dengan pencarian.</p>
          <button
            type="button"
            onClick={() => { setSearch(''); setFilter('all'); }}
            className="mt-3 text-primary-600 text-sm font-medium underline underline-offset-2"
          >
            Reset filter
          </button>
        </div>
      )}
    </div>
  );
}
