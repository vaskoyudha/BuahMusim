'use client';

import { useEffect, useState, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  FRUITS,
  CITIES,
  getCityById,
  getSeasonStatus,
  type FruitData,
  type CityData,
} from '@buahmusim/shared';

// ── Types ─────────────────────────────────────────────────────────────────────

interface FruitLatestPrice {
  fruitId: string;
  price: number;
  date: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

interface LatestApiResponse {
  type: string;
  cityId: string;
  fruits: FruitLatestPrice[];
}

type SortMode = 'price_asc' | 'change_desc' | 'alpha';

// ── Season badge ──────────────────────────────────────────────────────────────

function SeasonBadge({ fruitId }: { fruitId: string }) {
  const month = new Date().getMonth() + 1;
  const status = getSeasonStatus(fruitId, month);
  const config = {
    peak:       { label: '🟢 Panen',    cls: 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-sm' },
    transition: { label: '🟡 Transisi', cls: 'bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-sm' },
    normal:     { label: '🟡 Sedang',   cls: 'bg-gray-100 text-gray-600 border border-gray-200' },
    off:        { label: '🔴 Off',      cls: 'bg-gradient-to-r from-red-400 to-rose-500 text-white shadow-sm' },
  }[status];
  return (
    <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${config.cls}`}>
      {config.label}
    </span>
  );
}

// ── Season emoji bg (for fruit icon circle) ────────────────────────────────────

function getSeasonEmojiGradient(fruitId: string): string {
  const month = new Date().getMonth() + 1;
  const status = getSeasonStatus(fruitId, month);
  const map: Record<string, string> = {
    peak:       'from-green-400 to-emerald-500',
    transition: 'from-amber-400 to-yellow-500',
    normal:     'from-blue-400 to-indigo-500',
    off:        'from-gray-400 to-slate-500',
  };
  return map[status] ?? 'from-primary-400 to-emerald-500';
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="card-premium p-5 space-y-3">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl animate-shimmer shrink-0" />
          <div className="flex-1 space-y-2 pt-1">
            <div className="h-8 w-48 animate-shimmer rounded-lg" />
            <div className="h-4 w-32 animate-shimmer rounded-lg" />
            <div className="h-5 w-24 animate-shimmer rounded-full" />
          </div>
        </div>
      </div>
      {/* Sort pills */}
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 animate-shimmer rounded-full shrink-0" />
        ))}
      </div>
      {/* Fruit grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="h-28 animate-shimmer rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

// ── Fruit card ────────────────────────────────────────────────────────────────

function FruitCard({
  fruit,
  priceData,
  cityId,
}: {
  fruit: FruitData;
  priceData: FruitLatestPrice | undefined;
  cityId: string;
}) {
  const price = priceData?.price;
  const trend = priceData?.trend;

  let trendIcon = '→';
  let trendBg = 'bg-gray-100 text-gray-500';
  let trendText = '0.0%';

  if (trend) {
    if (trend.direction === 'up') {
      trendIcon = '↑';
      trendBg = 'bg-red-100 text-red-700';
      trendText = `+${trend.percentage.toFixed(1)}%`;
    } else if (trend.direction === 'down') {
      trendIcon = '↓';
      trendBg = 'bg-emerald-100 text-emerald-700';
      trendText = `−${trend.percentage.toFixed(1)}%`;
    }
  }

  const emojiGradient = getSeasonEmojiGradient(fruit.id);

  return (
    <Link
      href={`/buah/${fruit.id}?kota=${cityId}`}
      className="card-premium group relative flex flex-col gap-2 p-3 overflow-hidden"
    >
      <div className="flex items-start justify-between mb-1">
        {/* Emoji in gradient circle */}
        <div
          className={`w-10 h-10 rounded-xl bg-gradient-to-br ${emojiGradient} flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform duration-200 shrink-0`}
        >
          <span className="text-xl leading-none">{fruit.emoji}</span>
        </div>
        <SeasonBadge fruitId={fruit.id} />
      </div>

      <p className="text-sm font-semibold text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
        {fruit.nameId}
      </p>

      {price !== undefined ? (
        <>
          <p className="text-base font-bold text-gradient-green leading-none">
            Rp {price.toLocaleString('id-ID')}
          </p>
          <span className={`self-start text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${trendBg}`}>
            {trendIcon} {trendText}
          </span>
        </>
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}

      {/* Hover arrow */}
      <span className="text-xs text-gray-300 group-hover:text-primary-400 transition-all duration-200 group-hover:translate-x-0.5 absolute bottom-2.5 right-3 select-none">
        →
      </span>
    </Link>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function CityDetailPage() {
  const params = useParams<{ cityId: string }>();
  const router = useRouter();

  const cityId = params.cityId;

  const [city, setCity] = useState<CityData | null>(null);
  const [priceMap, setPriceMap] = useState<Map<string, FruitLatestPrice>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sortMode, setSortMode] = useState<SortMode>('alpha');

  // Resolve city
  useEffect(() => {
    const found = getCityById(cityId);
    if (!found) {
      setNotFound(true);
      setIsLoading(false);
    } else {
      setCity(found);
    }
  }, [cityId]);

  // Fetch latest prices
  useEffect(() => {
    if (!city) return;

    async function fetchPrices() {
      setIsLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/prices/latest?city=${cityId}`);
        const json: LatestApiResponse = await res.json();
        const map = new Map<string, FruitLatestPrice>();
        (json.fruits ?? []).forEach((f) => map.set(f.fruitId, f));
        setPriceMap(map);
      } catch (e) {
        console.error(e);
        setError('Gagal memuat harga. Coba lagi.');
      } finally {
        setIsLoading(false);
      }
    }

    fetchPrices();
  }, [city, cityId]);

  // Update document title when city is loaded
  useEffect(() => {
    if (city) {
      document.title = `${city.name} | BuahMusim`;
    }
  }, [city]);

  // Sort fruits
  const sortedFruits = useMemo(() => {
    const base = [...FRUITS];
    if (sortMode === 'alpha') {
      return base.sort((a, b) => a.nameId.localeCompare(b.nameId, 'id'));
    }
    if (sortMode === 'price_asc') {
      return base.sort((a, b) => {
        const pa = priceMap.get(a.id)?.price ?? Infinity;
        const pb = priceMap.get(b.id)?.price ?? Infinity;
        return pa - pb;
      });
    }
    if (sortMode === 'change_desc') {
      return base.sort((a, b) => {
        const ta = priceMap.get(a.id)?.trend;
        const tb = priceMap.get(b.id)?.trend;
        // biggest drops first
        const va = ta?.direction === 'down' ? -ta.percentage : ta?.direction === 'up' ? ta.percentage : 0;
        const vb = tb?.direction === 'down' ? -tb.percentage : tb?.direction === 'up' ? tb.percentage : 0;
        return va - vb;
      });
    }
    return base;
  }, [sortMode, priceMap]);

  // ── 404 ──
  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 flex justify-center">
        <div className="card-premium p-10 text-center max-w-sm w-full">
          <div className="w-20 h-20 rounded-full bg-gray-100 flex items-center justify-center text-4xl mx-auto mb-5">
            🏙️
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Kota tidak ditemukan</h1>
          <p className="text-gray-500 mb-6 text-sm">ID &ldquo;{cityId}&rdquo; tidak ada dalam daftar kota kami.</p>
          <button
            onClick={() => router.back()}
            className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-primary-700 hover:to-emerald-700 transition-all shadow-sm"
          >
            ← Kembali
          </button>
        </div>
      </div>
    );
  }

  if (!city) {
    return <PageSkeleton />;
  }

  const sortOptions: { mode: SortMode; label: string }[] = [
    { mode: 'alpha', label: 'A–Z' },
    { mode: 'price_asc', label: 'Harga Terendah' },
    { mode: 'change_desc', label: 'Penurunan Terbesar' },
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      {/* ── City header ── */}
      <div
        className="card-premium p-5"
        style={{ background: 'linear-gradient(135deg, rgba(240,253,244,0.9) 0%, #ffffff 60%)' }}
      >
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-emerald-700 flex items-center justify-center text-3xl shadow-lg animate-float shrink-0">
            🏙️
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold text-gray-900 leading-tight">{city.name}</h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {city.province} · {city.market}
            </p>
            <p className="text-xs text-gray-400 mt-1">
              Populasi {city.population}jt jiwa
            </p>
          </div>
        </div>
      </div>

      {/* ── Sort controls ── */}
      <div className="flex gap-2 flex-wrap items-center">
        <span className="text-sm text-gray-500 font-medium mr-1">Urutkan:</span>
        {sortOptions.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
              sortMode === mode
                ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md scale-[1.02]'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/50 shadow-sm'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="card-premium border-l-4 border-red-400 p-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-red-100 flex items-center justify-center text-red-600 text-lg shrink-0">
              ⚠️
            </div>
            <span className="text-sm text-red-700 font-medium">{error}</span>
          </div>
        </div>
      )}

      {/* ── Fruit grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-28 animate-shimmer rounded-2xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {sortedFruits.map((fruit) => (
            <FruitCard
              key={fruit.id}
              fruit={fruit}
              priceData={priceMap.get(fruit.id)}
              cityId={cityId}
            />
          ))}
        </div>
      )}

      {/* ── Fruit specialties note ── */}
      {city.fruitSpecialties.length > 0 && (
        <div className="card-premium border-l-4 border-primary-400 p-5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary-100 to-emerald-100 flex items-center justify-center text-xl shrink-0">
              🌟
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900 mb-1">
                Komoditas Unggulan {city.name}
              </p>
              <p className="text-sm text-gray-600">
                {city.fruitSpecialties
                  .map((id) => FRUITS.find((f) => f.id === id)?.nameId ?? id)
                  .join(', ')}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
