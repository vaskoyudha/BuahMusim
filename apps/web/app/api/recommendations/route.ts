import { NextRequest, NextResponse } from 'next/server';
import { getRecommendation, upsertRecommendation, getPrices, getPredictions } from '@/lib/db';
import { generateRecommendation } from '@/lib/groq-client';
import { getFruitById, getCityById, getSeasonStatus } from '@buahmusim/shared';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fruitId = searchParams.get('fruit');
  const cityId = searchParams.get('city');

  if (!fruitId || !cityId) {
    return NextResponse.json(
      { error: 'Parameter fruit dan city wajib diisi', code: 400 },
      { status: 400 }
    );
  }

  // Check cache
  const cached = getRecommendation(fruitId, cityId);
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return NextResponse.json({ ...cached, source: 'cache' });
  }

  // Build context
  const fruit = getFruitById(fruitId);
  const city = getCityById(cityId);
  if (!fruit || !city) {
    return NextResponse.json({ error: 'Buah atau kota tidak valid', code: 400 }, { status: 400 });
  }

  // Get last 14 days prices
  const history = getPrices(fruitId, cityId, 14);
  if (history.length === 0) {
    return NextResponse.json({ error: 'Data harga tidak tersedia', code: 404 }, { status: 404 });
  }

  // Current price (getPrices returns DESC, so index 0 is latest)
  const currentPrice = history[0].price;

  // Week change
  const sortedHistory = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const sevenDaysAgo = sortedHistory.find((h) => {
    const diff = Math.floor(
      (new Date().getTime() - new Date(h.date).getTime()) / 86400000
    );
    return diff >= 6 && diff <= 8;
  });
  const weekChangePercent = sevenDaysAgo
    ? ((currentPrice - sevenDaysAgo.price) / sevenDaysAgo.price) * 100
    : 0;

  // Get predictions
  const predCache = getPredictions(fruitId, cityId);
  const predictions28 = predCache?.predictions ?? [];

  // Get cheapest city — use current city as baseline
  const cheapestCity = city.name;
  const cheapestCityPrice = currentPrice;

  const month = new Date().getMonth() + 1;
  const seasonStatus = getSeasonStatus(fruitId, month);

  const context = {
    fruitNameId: fruit.nameId,
    cityName: city.name,
    currentPrice,
    weekChangePercent,
    last14Days: sortedHistory.map((h) => ({ date: h.date, price: h.price })),
    predictions28: predictions28.slice(0, 28),
    seasonStatus,
    growingRegions: fruit.growingRegions,
    cheapestCity,
    cheapestCityPrice,
  };

  try {
    const result = await generateRecommendation(fruitId, cityId, context);

    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const generatedAt = new Date().toISOString();

    // Cache it
    upsertRecommendation({
      fruitId,
      cityId,
      action: result.action,
      explanation: result.explanation,
      source: result.source,
      generatedAt,
      expiresAt,
    });

    return NextResponse.json({
      action: result.action,
      explanation: result.explanation,
      source: result.source,
      generatedAt,
      expiresAt,
    });
  } catch (error) {
    console.error('[Recommendations] Error:', error);
    return NextResponse.json(
      { error: 'Rekomendasi tidak tersedia saat ini', code: 500 },
      { status: 500 }
    );
  }
}
