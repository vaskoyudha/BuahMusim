import { NextRequest, NextResponse } from 'next/server';
import {
  FRUITS,
  CITIES,
  getFruitById,
  getCityById,
} from '@buahmusim/shared';
import { getPricesForCity, getPricesForFruit, getPrices } from '@/lib/db';

export const dynamic = 'force-dynamic';

function computeTrend(
  fruitId: string,
  cityId: string
): { direction: 'up' | 'down' | 'stable'; percentage: number } {
  // Fetch last 8 days of data to compare current vs ~7 days ago
  const prices = getPrices(fruitId, cityId, 8);
  if (prices.length < 2) {
    return { direction: 'stable', percentage: 0 };
  }

  // prices are DESC by date — index 0 = latest, last index = oldest
  const current = prices[0].price;
  const previous = prices[prices.length - 1].price;

  if (previous === 0) return { direction: 'stable', percentage: 0 };

  const change = ((current - previous) / previous) * 100;
  const rounded = Math.round(change * 10) / 10;

  if (Math.abs(rounded) < 1) return { direction: 'stable', percentage: 0 };
  return {
    direction: rounded > 0 ? 'up' : 'down',
    percentage: rounded,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const cityParam = searchParams.get('city');
    const fruitParam = searchParams.get('fruit');

    if (!cityParam && !fruitParam) {
      return NextResponse.json(
        { error: 'Parameter city atau fruit wajib diisi', code: 400 },
        { status: 400 }
      );
    }

    if (cityParam) {
      const city = getCityById(cityParam);
      if (!city) {
        return NextResponse.json(
          { error: `Kota tidak ditemukan: ${cityParam}`, code: 404 },
          { status: 404 }
        );
      }

      const latestPrices = getPricesForCity(cityParam);
      const fruits = FRUITS.map((f) => {
        const entry = latestPrices.find((p) => p.fruitId === f.id);
        const trend = computeTrend(f.id, cityParam);
        return {
          fruitId: f.id,
          price: entry?.price ?? 0,
          date: entry?.date ?? '',
          trend,
        };
      }).filter((f) => f.price > 0);

      return NextResponse.json(
        { type: 'by_city', cityId: cityParam, fruits },
        {
          headers: {
            'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
          },
        }
      );
    }

    // fruitParam is guaranteed non-null here
    const fruit = getFruitById(fruitParam!);
    if (!fruit) {
      return NextResponse.json(
        { error: `Buah tidak ditemukan: ${fruitParam}`, code: 404 },
        { status: 404 }
      );
    }

    const latestPrices = getPricesForFruit(fruitParam!);
    const cities = CITIES.map((c) => {
      const entry = latestPrices.find((p) => p.cityId === c.id);
      const trend = computeTrend(fruitParam!, c.id);
      return {
        cityId: c.id,
        price: entry?.price ?? 0,
        date: entry?.date ?? '',
        trend,
      };
    }).filter((c) => c.price > 0);

    return NextResponse.json(
      { type: 'by_fruit', fruitId: fruitParam, cities },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[API /prices/latest] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', code: 500 },
      { status: 500 }
    );
  }
}
