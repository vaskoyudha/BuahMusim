import { NextRequest, NextResponse } from 'next/server';
import {
  CITIES,
  getFruitById,
  getCityById,
} from '@buahmusim/shared';
import type { MapCityData } from '@buahmusim/shared';
import { getPricesForFruit, getPrices } from '@/lib/db';

export const dynamic = 'force-dynamic';

export interface MapResponse {
  cities: MapCityData[];
  min: number;
  max: number;
  fruit: string;
  fruitNameId: string;
  updatedAt: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fruitParam = searchParams.get('fruit');

    if (!fruitParam) {
      return NextResponse.json(
        { error: 'Parameter fruit wajib diisi', code: 400 },
        { status: 400 }
      );
    }

    const fruit = getFruitById(fruitParam);
    if (!fruit) {
      return NextResponse.json(
        { error: `Buah tidak ditemukan: ${fruitParam}`, code: 404 },
        { status: 404 }
      );
    }

    const latestPrices = getPricesForFruit(fruitParam);

    // Build city data with trends
    const cityDataRaw: { id: string; name: string; lat: number; lng: number; price: number; trend: number }[] = [];

    for (const cityInfo of CITIES) {
      const entry = latestPrices.find((p) => p.cityId === cityInfo.id);
      if (!entry) continue;

      // Compute 7-day trend
      const prices = getPrices(fruitParam, cityInfo.id, 8);
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

    if (cityDataRaw.length === 0) {
      return NextResponse.json(
        { error: 'Tidak ada data harga untuk buah ini', code: 404 },
        { status: 404 }
      );
    }

    // Sort by price ascending for ranking (1 = cheapest)
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

    const response: MapResponse = {
      cities,
      min,
      max,
      fruit: fruitParam,
      fruitNameId: fruit.nameId,
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json(response, {
      headers: {
        'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
      },
    });
  } catch (error) {
    console.error('[API /prices/map] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', code: 500 },
      { status: 500 }
    );
  }
}
