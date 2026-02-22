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
      <section className="relative bg-gradient-to-br from-primary-700 via-primary-600 to-emerald-800 overflow-hidden">

        {/* Dot-grid pattern overlay */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.07) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* Diagonal light rays */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              'linear-gradient(115deg, transparent 30%, rgba(255,255,255,0.04) 50%, transparent 70%), ' +
              'linear-gradient(245deg, transparent 35%, rgba(255,255,255,0.03) 55%, transparent 75%)',
          }}
        />

        {/* Decorative layered circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Top-right large glow */}
          <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-emerald-500 opacity-20 blur-3xl" />
          {/* Bottom-left soft pool */}
          <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-primary-800 opacity-40 blur-2xl" />
          {/* Center faint bloom */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[32rem] h-[32rem] rounded-full bg-primary-500 opacity-[0.07]" />
          {/* Small accent circle top-left */}
          <div className="absolute top-8 left-8 w-24 h-24 rounded-full border border-white/10" />
          {/* Small accent circle bottom-right */}
          <div className="absolute bottom-12 right-12 w-16 h-16 rounded-full border border-white/10" />
          {/* Mid-left floating ring */}
          <div className="absolute top-1/3 -left-6 w-40 h-40 rounded-full border-2 border-white/5" />
        </div>

        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-16 text-center">

          {/* Fruit emojis — staggered float */}
          <div className="flex items-end justify-center gap-4 mb-5">
            <span className="animate-float stagger-1 text-5xl drop-shadow-lg inline-block" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>
              🍎
            </span>
            <span className="animate-float stagger-2 text-6xl drop-shadow-xl inline-block" style={{ filter: 'drop-shadow(0 6px 16px rgba(0,0,0,0.3))' }}>
              🥭
            </span>
            <span className="animate-float stagger-3 text-5xl drop-shadow-lg inline-block" style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>
              🍊
            </span>
          </div>

          {/* Title */}
          <h1
            className="text-5xl sm:text-6xl font-bold text-white tracking-tight mb-3 animate-fadeInUp"
            style={{ textShadow: '0 2px 24px rgba(0,0,0,0.18), 0 1px 4px rgba(0,0,0,0.12)' }}
          >
            BuahMusim
          </h1>

          {/* Tagline */}
          <p className="text-base sm:text-lg text-white/75 max-w-sm mx-auto mb-2 leading-relaxed animate-fadeInUp stagger-1">
            Prediksi Harga Buah Indonesia
          </p>
          <p className="text-sm sm:text-base text-white/90 max-w-xs mx-auto mb-8 font-semibold animate-fadeInUp stagger-2">
            Beli sekarang atau tunggu?
          </p>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8 animate-fadeInUp stagger-3">
            <Link
              href="/buah"
              className="px-7 py-3.5 bg-white text-primary-700 font-bold rounded-2xl shadow-lg hover:shadow-xl hover:bg-primary-50 hover:-translate-y-0.5 transition-all duration-200 text-sm w-full sm:w-auto"
            >
              Lihat Semua Buah →
            </Link>
            <Link
              href="/peta"
              className="px-7 py-3.5 bg-white/10 text-white font-semibold rounded-2xl border border-white/25 hover:bg-white/20 hover:-translate-y-0.5 transition-all duration-200 text-sm w-full sm:w-auto backdrop-blur-sm"
            >
              Peta Harga →
            </Link>
          </div>

          {/* Stats pills */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 animate-fadeInUp stagger-4">
            {[
              { icon: '🌿', label: '30 Buah' },
              { icon: '🏙️', label: '10 Kota' },
              { icon: '📈', label: '28-Hari Prediksi' },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold text-white/90 border border-white/20"
                style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)' }}
              >
                <span>{icon}</span>
                <span>{label}</span>
              </span>
            ))}
          </div>
        </div>

        {/* Gradient fade-out to page background */}
        <div className="absolute bottom-0 left-0 right-0 h-10 bg-gradient-to-b from-transparent to-gray-50" />
      </section>

      <div className="max-w-4xl mx-auto space-y-12 py-6 px-4 sm:px-6">

        {/* ── 2. Sedang Musim Panen ────────────────────────────────────────── */}
        <div className="animate-fadeInUp stagger-1">
          <InSeasonSection />
        </div>

        {/* ── 3. Peta Harga Hari Ini ───────────────────────────────────────── */}
        <section className="animate-fadeInUp stagger-2">
          <HomeMapSection initialData={initialData} />
        </section>

        {/* ── 4. Buah Populer ──────────────────────────────────────────────── */}
        <section className="animate-fadeInUp stagger-3">
          {/* Section header */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-1 h-6 rounded-full bg-primary-500" />
                <h2 className="text-2xl font-bold text-gray-900">Buah Populer</h2>
              </div>
              <p className="text-sm text-gray-500 pl-3.5">Harga terkini di Jakarta — update harian</p>
            </div>
            <Link href="/buah" className="text-xs text-primary-600 font-semibold hover:text-primary-800 hover:underline underline-offset-2 transition-colors">
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
                trendColorClass = 'text-emerald-700 bg-emerald-50';
              }

              const displayPrice = price
                ? formatPrice(price)
                : `${formatPrice(fruit.priceRange.low)}+`;

              return (
                <Link
                  key={fruit.id}
                  href={`/buah/${fruit.id}`}
                  className="card-premium group p-3 flex flex-col items-center gap-2 text-center"
                  style={{
                    background: 'linear-gradient(160deg, rgba(240,253,244,0.6) 0%, #ffffff 60%)',
                  }}
                >
                  {/* Emoji container */}
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center group-hover:scale-110 transition-transform duration-200 shadow-sm">
                    <span className="text-2xl leading-none">{fruit.emoji}</span>
                  </div>

                  {/* Name */}
                  <p className="font-semibold text-xs text-gray-800 group-hover:text-primary-700 transition-colors leading-tight">
                    {fruit.nameId}
                  </p>

                  {/* Price */}
                  <p className="text-xs font-bold text-gradient-green leading-none">
                    {displayPrice}
                  </p>

                  {/* Trend badge */}
                  {trendIcon && (
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${trendColorClass}`}>
                      {trendIcon} {trend?.percentage.toFixed(1)}%
                    </span>
                  )}
                </Link>
              );
            })}
          </div>
        </section>

        {/* ── 5. Kota Termurah Hari Ini ────────────────────────────────────── */}
        <section className="pb-4 animate-fadeInUp stagger-4">
          {/* Section header */}
          <div className="flex items-end justify-between mb-5">
            <div>
              <div className="flex items-center gap-2.5 mb-1">
                <div className="w-1 h-6 rounded-full bg-primary-500" />
                <h2 className="text-2xl font-bold text-gray-900">Kota Termurah Hari Ini</h2>
              </div>
              <p className="text-sm text-gray-500 pl-3.5">Temukan di mana harga paling terjangkau sekarang</p>
            </div>
            <Link href="/kota" className="text-xs text-primary-600 font-semibold hover:text-primary-800 hover:underline underline-offset-2 transition-colors">
              Semua Kota →
            </Link>
          </div>

          {cheapestCities.length > 0 ? (
            <div className="rounded-2xl overflow-hidden shadow-md border border-gray-100/80">
              <table className="w-full text-sm">
                <thead>
                  <tr
                    style={{
                      background: 'linear-gradient(90deg, #16a34a 0%, #059669 100%)',
                    }}
                  >
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-white uppercase tracking-wider">
                      #&nbsp;&nbsp;Buah
                    </th>
                    <th className="text-left px-4 py-3.5 text-xs font-bold text-white uppercase tracking-wider">
                      Kota Termurah
                    </th>
                    <th className="text-right px-4 py-3.5 text-xs font-bold text-white uppercase tracking-wider">
                      Harga
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50/80 bg-white">
                  {cheapestCities.map(({ fruitId, cityName, price }, index) => {
                    const fruit = getFruitById(fruitId);
                    if (!fruit) return null;
                    const isTop = index === 0;
                    return (
                      <tr
                        key={fruitId}
                        className="hover:bg-primary-50/60 transition-colors duration-150"
                        style={isTop ? { background: 'rgba(240,253,244,0.5)' } : undefined}
                      >
                        {/* Rank + fruit */}
                        <td className="px-4 py-3.5">
                          <Link
                            href={`/buah/${fruitId}`}
                            className="flex items-center gap-2.5 hover:text-primary-700 transition-colors group"
                          >
                            {/* Rank badge */}
                            <span
                              className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold shrink-0 ${
                                isTop
                                  ? 'bg-amber-100 text-amber-700'
                                  : 'bg-gray-100 text-gray-500'
                              }`}
                            >
                              {isTop ? '🏆' : `#${index + 1}`}
                            </span>
                            <span className="text-xl">{fruit.emoji}</span>
                            <span className="font-semibold text-gray-900 group-hover:text-primary-700 transition-colors">
                              {fruit.nameId}
                            </span>
                          </Link>
                        </td>

                        {/* City */}
                        <td className="px-4 py-3.5 text-gray-500 font-medium">
                          {cityName}
                        </td>

                        {/* Price */}
                        <td className="px-4 py-3.5 text-right">
                          <span className="font-bold text-gradient-green">
                            {formatPrice(price)}
                          </span>
                          <span className="text-xs text-gray-400 font-normal">/kg</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="card-premium p-8 text-center">
              <p className="text-3xl mb-3">📊</p>
              <p className="text-sm font-semibold text-gray-700">Data harga sedang dimuat</p>
              <p className="text-xs text-gray-400 mt-1">Coba refresh halaman ini</p>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
