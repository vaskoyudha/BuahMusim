import type { Metadata } from 'next';
import Link from 'next/link';
import { HomeMapSection } from '@/components/home/HomeMapSection';
import { InSeasonSection } from '@/components/home/InSeasonSection';
import { CITIES, getFruitById, getCityById, formatPrice } from '@buahmusim/shared';
import type { MapCityData } from '@buahmusim/shared';
import { getPricesForFruit, getPricesForCity, getPrices } from '@/lib/db';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'BuahMusim — Prediksi Harga Buah Indonesia',
  description: 'Pantau dan prediksi harga buah musiman di 10 kota besar Indonesia. Beli sekarang atau tunggu?',
};

// ── Types ──────────────────────────────────────────────────────────────────────

interface MapApiResponse {
  cities: MapCityData[];
  min: number;
  max: number;
  fruit: string;
  fruitNameId: string;
  updatedAt: string;
}

interface FruitLatestPrice {
  fruitId: string;
  price: number;
  date: string;
  trend: {
    direction: 'up' | 'down' | 'stable';
    percentage: number;
  };
}

// ── Helper ─────────────────────────────────────────────────────────────────────

function computeTrend(
  fruitId: string,
  cityId: string
): { direction: 'up' | 'down' | 'stable'; percentage: number } {
  const prices = getPrices(fruitId, cityId, 8);
  if (prices.length < 2) {
    return { direction: 'stable', percentage: 0 };
  }
  const current = prices[0].price;
  const previous = prices[prices.length - 1].price;
  if (previous === 0) return { direction: 'stable', percentage: 0 };
  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;
  if (Math.abs(rounded) < 1) return { direction: 'stable', percentage: 0 };
  return { direction: rounded > 0 ? 'up' : 'down', percentage: rounded };
}

// ── Data fetching ──────────────────────────────────────────────────────────────

async function fetchInitialMapData(): Promise<MapApiResponse | null> {
  try {
    const fruitId = 'mangga';
    const fruit = getFruitById(fruitId);
    if (!fruit) return null;

    const latestPrices = getPricesForFruit(fruitId);
    const cityDataRaw: { id: string; name: string; lat: number; lng: number; price: number; trend: number }[] = [];

    for (const cityInfo of CITIES) {
      const entry = latestPrices.find((p) => p.cityId === cityInfo.id);
      if (!entry) continue;

      const prices = getPrices(fruitId, cityInfo.id, 8);
      let trend = 0;
      if (prices.length >= 2) {
        const current = prices[0].price;
        const previous = prices[prices.length - 1].price;
        if (previous > 0) {
          trend = Math.round(((current - previous) / previous) * 1000) / 10;
        }
      }

      cityDataRaw.push({
        id: cityInfo.id,
        name: cityInfo.name,
        lat: cityInfo.lat,
        lng: cityInfo.lng,
        price: entry.price,
        trend,
      });
    }

    if (cityDataRaw.length === 0) return null;

    cityDataRaw.sort((a, b) => a.price - b.price);
    const min = cityDataRaw[0].price;
    const max = cityDataRaw[cityDataRaw.length - 1].price;

    const cities: MapCityData[] = cityDataRaw.map((c, idx) => ({
      id: c.id,
      name: c.name,
      lat: c.lat,
      lng: c.lng,
      price: c.price,
      trend: c.trend,
      rank: idx + 1,
    }));

    return {
      cities,
      min,
      max,
      fruit: fruitId,
      fruitNameId: fruit.nameId,
      updatedAt: new Date().toISOString(),
    };
  } catch {
    return null;
  }
}

async function fetchLatestPrices(): Promise<Map<string, FruitLatestPrice>> {
  try {
    const cityId = 'jakarta';
    const latestPrices = getPricesForCity(cityId);
    const map = new Map<string, FruitLatestPrice>();

    for (const entry of latestPrices) {
      if (entry.price <= 0) continue;
      const trend = computeTrend(entry.fruitId, cityId);
      map.set(entry.fruitId, {
        fruitId: entry.fruitId,
        price: entry.price,
        date: entry.date,
        trend,
      });
    }

    return map;
  } catch {
    return new Map();
  }
}

async function fetchCheapestCities(
  fruitIds: string[]
): Promise<{ fruitId: string; cityName: string; price: number }[]> {
  const results: { fruitId: string; cityName: string; price: number }[] = [];

  for (const fruitId of fruitIds) {
    try {
      const latestPrices = getPricesForFruit(fruitId);
      if (latestPrices.length === 0) continue;

      // Sort ascending by price to find cheapest
      const sorted = [...latestPrices].sort((a, b) => a.price - b.price);
      const cheapest = sorted[0];
      const cityName = getCityById(cheapest.cityId)?.name;
      if (cityName) {
        results.push({ fruitId, cityName, price: cheapest.price });
      }
    } catch {
      // skip on error
    }
  }

  return results;
}

// ── Popular fruits config ──────────────────────────────────────────────────────

const POPULAR_FRUIT_IDS = [
  'mangga', 'pisang', 'jeruk', 'durian',
  'semangka', 'pepaya', 'alpukat', 'rambutan',
  'salak', 'manggis', 'buah_naga', 'nanas',
];

const CHEAPEST_FRUIT_IDS = ['mangga', 'durian', 'jeruk', 'pisang', 'semangka'];

// ── Home Page ──────────────────────────────────────────────────────────────────

export default async function Home() {
  const [initialData, priceMap, cheapestCities] = await Promise.all([
    fetchInitialMapData(),
    fetchLatestPrices(),
    fetchCheapestCities(CHEAPEST_FRUIT_IDS),
  ]);

  const popularFruits = POPULAR_FRUIT_IDS.map((id) => getFruitById(id)).filter(Boolean);

  return (
    <main>
      {/* ── 1. Hero Section ─────────────────────────────────────────────── */}
      <section className="relative bg-gradient-to-br from-primary-600 to-primary-800 overflow-hidden">
        {/* Decorative background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-16 -right-16 w-64 h-64 rounded-full bg-primary-500 opacity-30" />
          <div className="absolute -bottom-8 -left-8 w-48 h-48 rounded-full bg-primary-700 opacity-40" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full bg-primary-500 opacity-10" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 py-14 text-center">
          {/* Fruit emojis */}
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="text-5xl drop-shadow-lg">🍎</span>
            <span className="text-6xl drop-shadow-lg">🥭</span>
            <span className="text-5xl drop-shadow-lg">🍊</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-white tracking-tight mb-3">
            BuahMusim
          </h1>
          <p className="text-base sm:text-lg text-white/80 max-w-sm mx-auto mb-8 leading-relaxed">
            Prediksi Harga Buah Indonesia —{' '}
            <span className="text-white font-semibold">Beli sekarang atau tunggu?</span>
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              href="/buah"
              className="px-6 py-3 bg-white text-primary-700 font-semibold rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary-50 transition-all duration-200 text-sm w-full sm:w-auto"
            >
              Lihat Semua Buah →
            </Link>
            <Link
              href="/peta"
              className="px-6 py-3 bg-primary-900/40 text-white font-semibold rounded-2xl border border-white/30 hover:bg-primary-900/60 transition-all duration-200 text-sm w-full sm:w-auto backdrop-blur-sm"
            >
              Peta Harga →
            </Link>
          </div>
        </div>

        {/* Gradient fade-out to page background */}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-b from-transparent to-gray-50" />
      </section>

      <div className="max-w-4xl mx-auto space-y-10 py-6">
        {/* ── 2. Sedang Musim Panen ────────────────────────────────────────── */}
        <InSeasonSection />

        {/* ── 3. Peta Harga Hari Ini ───────────────────────────────────────── */}
        <section className="px-4">
          <HomeMapSection initialData={initialData} />
        </section>

        {/* ── 4. Buah Populer ──────────────────────────────────────────────── */}
        <section className="px-4">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🍎 Buah Populer</h2>
            <Link href="/buah" className="text-xs text-primary-600 font-semibold hover:underline">
              Lihat Semua →
            </Link>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
            {popularFruits.map((fruit) => {
              if (!fruit) return null;
              const priceData = priceMap.get(fruit.id);
              const price = priceData?.price;
              const trend = priceData?.trend;

              let trendIcon = '';
              let trendColorClass = '';
              if (trend?.direction === 'up') {
                trendIcon = '↑';
                trendColorClass = 'text-red-600 bg-red-50';
              } else if (trend?.direction === 'down') {
                trendIcon = '↓';
                trendColorClass = 'text-green-600 bg-green-50';
              }

              const displayPrice = price
                ? formatPrice(price)
                : `${formatPrice(fruit.priceRange.low)}+`;

              return (
                <Link
                  key={fruit.id}
                  href={`/buah/${fruit.id}`}
                  className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary-200 transition-all duration-200 p-3 flex flex-col items-center gap-1.5 text-center"
                >
                  <span className="text-3xl leading-none">{fruit.emoji}</span>
                  <p className="font-semibold text-xs text-gray-900 group-hover:text-primary-700 transition-colors leading-tight">
                    {fruit.nameId}
                  </p>
                  <p className="text-xs text-primary-600 font-medium">{displayPrice}</p>
                  {trendIcon && (
                    <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${trendColorClass}`}>
                      {trendIcon} {trend?.percentage.toFixed(1)}%
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 5. Kota Termurah Hari Ini ────────────────────────────────────── */}
        <section className="px-4 pb-4">
          <div className="flex items-baseline justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">🏆 Kota Termurah Hari Ini</h2>
            <Link href="/kota" className="text-xs text-primary-600 font-semibold hover:underline">
              Semua Kota →
            </Link>
          </div>

          {cheapestCities.length > 0 ? (
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-primary-50 border-b border-primary-100">
                    <th className="text-left px-4 py-3 text-xs font-semibold text-primary-800 uppercase tracking-wide">
                      Buah
                    </th>
                    <th className="text-left px-4 py-3 text-xs font-semibold text-primary-800 uppercase tracking-wide">
                      Kota Termurah
                    </th>
                    <th className="text-right px-4 py-3 text-xs font-semibold text-primary-800 uppercase tracking-wide">
                      Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {cheapestCities.map(({ fruitId, cityName, price }) => {
                    const fruit = getFruitById(fruitId);
                    if (!fruit) return null;
                    return (
                      <tr
                        key={fruitId}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <Link
                            href={`/buah/${fruitId}`}
                            className="flex items-center gap-2 hover:text-primary-700 transition-colors"
                          >
                            <span className="text-xl">{fruit.emoji}</span>
                            <span className="font-medium text-gray-900">{fruit.nameId}</span>
                          </Link>
                        </td>
                        <td className="px-4 py-3 text-gray-600">{cityName}</td>
                        <td className="px-4 py-3 text-right font-semibold text-primary-700">
                          {formatPrice(price)}<span className="text-xs text-gray-400 font-normal">/kg</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="bg-gray-50 rounded-2xl border border-gray-100 p-6 text-center">
              <p className="text-2xl mb-2">📊</p>
              <p className="text-sm text-gray-500">Data harga sedang dimuat</p>
              <p className="text-xs text-gray-400 mt-1">Coba refresh halaman ini</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
