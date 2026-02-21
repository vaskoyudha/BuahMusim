'use client';

import { useEffect, useState, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import {
  CITIES,
  getFruitById,
  getSeasonStatus,
  type FruitData,
  type CityData,
  type Prediction,
} from '@buahmusim/shared';
import { PriceChart } from '@/components/charts/PriceChart';
import { PriceStats } from '@/components/charts/PriceStats';

// ── Season badge ──────────────────────────────────────────────────────────────

function SeasonBadge({ fruitId }: { fruitId: string }) {
  const month = new Date().getMonth() + 1;
  const status = getSeasonStatus(fruitId, month);

  const config = {
    peak:       { label: '🟢 Musim Panen',  cls: 'bg-green-100 text-green-800' },
    transition: { label: '🟡 Transisi',      cls: 'bg-yellow-100 text-yellow-800' },
    normal:     { label: '🟡 Sedang',        cls: 'bg-yellow-100 text-yellow-800' },
    off:        { label: '🔴 Tidak Musim',   cls: 'bg-red-100 text-red-800' },
  }[status];

  return (
    <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${config.cls}`}>
      {config.label}
    </span>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

function PageSkeleton() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6 animate-pulse">
      {/* Header */}
      <div className="space-y-2">
        <div className="h-10 w-48 bg-gray-200 rounded-lg" />
        <div className="h-5 w-32 bg-gray-200 rounded-lg" />
        <div className="h-6 w-24 bg-gray-200 rounded-full" />
      </div>
      {/* City tabs */}
      <div className="flex gap-2 overflow-hidden">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-9 w-20 bg-gray-200 rounded-full shrink-0" />
        ))}
      </div>
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-24 bg-gray-200 rounded-xl" />
        ))}
      </div>
      {/* Chart */}
      <div className="h-80 bg-gray-200 rounded-2xl" />
    </div>
  );
}

// ── Types for API responses ───────────────────────────────────────────────────

interface PricePoint {
  date: string;
  price: number;
}

interface PriceApiResponse {
  data: PricePoint[];
  fruit: string;
  city: string;
}

interface PredictionsApiResponse {
  predictions: Prediction[];
  model: string;
}

// ── Computed stats helpers ────────────────────────────────────────────────────

function computeStats(history: PricePoint[], predictions: Prediction[]) {
  const sorted = [...history].sort((a, b) => b.date.localeCompare(a.date));

  const currentPrice = sorted[0]?.price ?? null;

  // 7-day change
  let weekChange: number | null = null;
  if (sorted.length >= 2) {
    const latest = sorted[0].price;
    // Find a price roughly 7 days ago
    const cutoff = new Date(sorted[0].date);
    cutoff.setDate(cutoff.getDate() - 7);
    const cutoffStr = cutoff.toISOString().split('T')[0];
    const weekAgoPoint = sorted.find((p) => p.date <= cutoffStr);
    if (weekAgoPoint && weekAgoPoint.price > 0) {
      weekChange = ((latest - weekAgoPoint.price) / weekAgoPoint.price) * 100;
    }
  }

  // 30-day range
  let monthRange: { low: number; high: number } | null = null;
  if (sorted.length > 0) {
    const cutoff30 = new Date(sorted[0].date);
    cutoff30.setDate(cutoff30.getDate() - 30);
    const cutoff30Str = cutoff30.toISOString().split('T')[0];
    const last30 = sorted.filter((p) => p.date >= cutoff30Str).map((p) => p.price);
    if (last30.length > 0) {
      monthRange = { low: Math.min(...last30), high: Math.max(...last30) };
    }
  }

  // Prediction in 28 days
  let predictedIn28Days: number | null = null;
  let predictionDirection: 'naik' | 'turun' | 'stabil' | null = null;
  if (predictions.length > 0 && currentPrice !== null) {
    const sorted28 = [...predictions].sort((a, b) => a.date.localeCompare(b.date));
    const lastPred = sorted28[sorted28.length - 1];
    predictedIn28Days = lastPred.price;
    const diff = ((lastPred.price - currentPrice) / currentPrice) * 100;
    if (diff > 1) predictionDirection = 'naik';
    else if (diff < -1) predictionDirection = 'turun';
    else predictionDirection = 'stabil';
  }

  return { currentPrice, weekChange, monthRange, predictedIn28Days, predictionDirection };
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function FruitDetailPage() {
  const params = useParams<{ fruitId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();

  const fruitId = params.fruitId;
  const cityId = searchParams.get('kota') ?? 'jakarta';

  const [fruit, setFruit] = useState<FruitData | null>(null);
  const [city, setCity] = useState<CityData>(CITIES[0]);
  const [history, setHistory] = useState<PricePoint[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Resolve fruit on mount / fruitId change
  useEffect(() => {
    const found = getFruitById(fruitId);
    if (!found) {
      setNotFound(true);
      setIsLoading(false);
    } else {
      setFruit(found);
    }
  }, [fruitId]);

  // Resolve city on cityId change
  useEffect(() => {
    const found = CITIES.find((c) => c.id === cityId);
    setCity(found ?? CITIES[0]);
  }, [cityId]);

  // Fetch prices + predictions
  const fetchData = useCallback(async () => {
    if (!fruit) return;
    setIsLoading(true);
    setError(null);
    try {
      const [pricesRes, predsRes] = await Promise.all([
        fetch(`/api/prices?fruit=${fruitId}&city=${cityId}&days=60`),
        fetch(`/api/predictions?fruit=${fruitId}&city=${cityId}`),
      ]);

      const pricesJson: PriceApiResponse = await pricesRes.json();
      const predsJson: PredictionsApiResponse = await predsRes.json();

      setHistory(pricesJson.data ?? []);
      setPredictions(predsJson.predictions ?? []);
    } catch (e) {
      console.error(e);
      setError('Gagal memuat data. Coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [fruit, fruitId, cityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // ── 404 state ──
  if (notFound) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-6xl mb-4">🍂</p>
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Buah tidak ditemukan</h1>
        <p className="text-gray-500 mb-6">ID &ldquo;{fruitId}&rdquo; tidak ada dalam database kami.</p>
        <button
          onClick={() => router.back()}
          className="px-4 py-2 bg-primary-600 text-white rounded-xl text-sm font-medium hover:bg-primary-700 transition-colors"
        >
          ← Kembali
        </button>
      </div>
    );
  }

  // ── Loading skeleton (first load before fruit resolved) ──
  if (!fruit) {
    return <PageSkeleton />;
  }

  const stats = computeStats(history, predictions);
  const month = new Date().getMonth() + 1;
  const seasonStatus = getSeasonStatus(fruitId, month);

  const seasonDescriptions: Record<string, string> = {
    peak: 'Sekarang adalah musim panen. Harga cenderung lebih rendah dan ketersediaan melimpah.',
    off: 'Bukan musim buah ini sekarang. Harga cenderung lebih tinggi dan ketersediaan terbatas.',
    transition: 'Masa transisi musim. Harga dan ketersediaan bervariasi.',
    normal: 'Ketersediaan normal dengan harga stabil.',
  };

  function handleCityClick(newCityId: string) {
    router.push(`/buah/${fruitId}?kota=${newCityId}`, { scroll: false });
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      {/* ── Fruit header ── */}
      <div className="flex items-start gap-4">
        <span className="text-5xl leading-none">{fruit.emoji}</span>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-bold text-gray-900">{fruit.nameId}</h1>
          <p className="text-sm text-gray-500 italic mt-0.5">{fruit.nameEn}</p>
          <div className="mt-2">
            <SeasonBadge fruitId={fruitId} />
          </div>
        </div>
      </div>

      {/* ── City tabs ── */}
      <div className="overflow-x-auto -mx-4 px-4">
        <div className="flex gap-2 w-max">
          {CITIES.map((c) => (
            <button
              key={c.id}
              onClick={() => handleCityClick(c.id)}
              className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                c.id === cityId
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
              }`}
            >
              {c.name}
            </button>
          ))}
        </div>
      </div>

      {/* ── Error banner ── */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-sm text-red-700 flex items-center gap-2">
          <span>⚠️</span>
          <span>{error}</span>
          <button
            onClick={fetchData}
            className="ml-auto text-red-600 font-semibold underline underline-offset-2"
          >
            Coba lagi
          </button>
        </div>
      )}

      {/* ── Stats ── */}
      <PriceStats
        currentPrice={stats.currentPrice}
        weekChange={stats.weekChange}
        monthRange={stats.monthRange}
        predictedIn28Days={stats.predictedIn28Days}
        predictionDirection={stats.predictionDirection}
      />

      {/* ── Chart ── */}
      <div className="bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Grafik Harga — {city.name}</h2>
          <span className="text-xs text-gray-400">{city.market}</span>
        </div>
        <PriceChart
          history={history}
          predictions={predictions}
          fruitNameId={fruit.nameId}
          isLoading={isLoading}
        />
      </div>

      {/* ── Season info card ── */}
      <div className="bg-white rounded-2xl p-5 border border-gray-100 shadow-sm space-y-3">
        <h2 className="text-base font-semibold text-gray-800">Info Musim &amp; Produksi</h2>

        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none mt-0.5">🌿</div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-0.5">Daerah Penghasil</p>
            <p className="text-sm text-gray-600">{fruit.growingRegions.join(', ')}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none mt-0.5">
            {seasonStatus === 'peak' ? '🌸' : seasonStatus === 'off' ? '🍂' : '🌤️'}
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-0.5">Kondisi Musim Sekarang</p>
            <p className="text-sm text-gray-600">{seasonDescriptions[seasonStatus]}</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="text-2xl leading-none mt-0.5">📝</div>
          <div>
            <p className="text-sm text-gray-600">{fruit.description}</p>
          </div>
        </div>

        {fruit.ramadanImpact !== 'none' && (
          <div className="bg-warm-50 rounded-xl px-4 py-3">
            <p className="text-xs font-semibold text-warm-700 mb-0.5">Dampak Ramadan</p>
            <p className="text-xs text-warm-600 capitalize">
              Pengaruh harga saat Ramadan:{' '}
              <span className="font-semibold">
                {fruit.ramadanImpact === 'high'
                  ? 'Tinggi — harga bisa naik signifikan'
                  : fruit.ramadanImpact === 'medium'
                  ? 'Sedang — harga cenderung naik'
                  : 'Rendah — sedikit pengaruh'}
              </span>
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
