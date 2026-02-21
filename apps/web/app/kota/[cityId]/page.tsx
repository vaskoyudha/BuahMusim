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
    peak:       { label: '🟢 Panen',    cls: 'bg-green-100 text-green-800' },
    transition: { label: '🟡 Transisi', cls: 'bg-yellow-100 text-yellow-800' },
    normal:     { label: '🟡 Sedang',   cls: 'bg-yellow-100 text-yellow-800' },
    off:        { label: '🔴 Off',      cls: 'bg-red-100 text-red-800' },
  }[status];
  return (
    <span className={`text-xs font-medium px-1.5 py-0.5 rounded-full ${config.cls}`}>
      {config.label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      <div className="h-10 w-48 bg-gray-200 rounded-lg" />
      <div className="h-5 w-64 bg-gray-200 rounded-lg" />
      <div className="flex gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-9 w-28 bg-gray-200 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
        {Array.from({ length: 30 }).map((_, i) => (
          <div key={i} className="h-28 bg-gray-200 rounded-xl" />
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
  let trendColor = 'text-gray-500';
  let trendText = '0.0%';

  if (trend) {
    if (trend.direction === 'up') {
      trendIcon = '↑';
      trendColor = 'text-red-600';
      trendText = `${trend.percentage.toFixed(1)}%`;
    } else if (trend.direction === 'down') {
      trendIcon = '↓';
      trendColor = 'text-green-600';
      trendText = `${trend.percentage.toFixed(1)}%`;
    }
  }

  return (
    <Link
      href={`/buah/${fruit.id}?kota=${cityId}`}
      className="group block bg-white rounded-xl p-3 border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-150"
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-2xl leading-none">{fruit.emoji}</span>
        <SeasonBadge fruitId={fruit.id} />
      </div>

      <p className="text-sm font-semibold text-gray-900 mb-1 group-hover:text-primary-700 transition-colors">
        {fruit.nameId}
      </p>

      {price !== undefined ? (
        <>
          <p className="text-base font-bold text-gray-800">
            Rp {price.toLocaleString('id-ID')}
          </p>
          <p className={`text-xs font-medium mt-0.5 ${trendColor}`}>
            {trendIcon} {trendText}
          </p>
        </>
      ) : (
        <p className="text-sm text-gray-400">—</p>
      )}
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
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🏙️</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Kota tidak ditemukan</h1>
        <p className="text-gray-500 mb-6">ID &ldquo;{cityId}&rdquo; tidak ada dalam daftar kota kami.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          ← Kembali
        </button>
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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{city.name}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {city.province} · {city.market}
        </p>
        <p className="text-xs text-gray-400 mt-1">
          Populasi {city.population}jt jiwa
        </p>
      </div>

      {/* ── Sort controls ── */}
      <div className="flex gap-2 flex-wrap">
        <span className="text-sm text-gray-500 self-center mr-1">Urutkan:</span>
        {sortOptions.map(({ mode, label }) => (
          <button
            key={mode}
            onClick={() => setSortMode(mode)}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              sortMode === mode
                ? 'bg-primary-600 text-white shadow-sm'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700">
          ⚠️ {error}
        </div>
      )}

      {/* ── Fruit grid ── */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 animate-pulse">
          {Array.from({ length: 30 }).map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl" />
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
        <div className="bg-primary-50 border border-primary-100 rounded-xl p-4">
          <p className="text-sm font-semibold text-primary-800 mb-1">
            🌟 Komoditas Unggulan {city.name}
          </p>
          <p className="text-sm text-primary-700">
            {city.fruitSpecialties
              .map((id) => FRUITS.find((f) => f.id === id)?.nameId ?? id)
              .join(', ')}
          </p>
        </div>
      )}
    </div>
  );
}
