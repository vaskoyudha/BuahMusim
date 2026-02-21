import { NextRequest, NextResponse } from 'next/server';
import { predictPrices } from '@/lib/ml-client';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const fruit = searchParams.get('fruit');
  const city = searchParams.get('city');

  if (!fruit || !city) {
    return NextResponse.json({ error: 'Parameter fruit dan city wajib diisi', code: 400 }, { status: 400 });
  }

  try {
    const predictions = await predictPrices(fruit, city);
    return NextResponse.json({
      predictions,
      model: predictions.length > 0 ? 'prophet' : 'unavailable',
      fruitId: fruit,
      cityId: city,
    });
  } catch (error) {
    return NextResponse.json(
      { predictions: [], model: 'unavailable', error: 'Layanan prediksi sedang tidak tersedia', code: 503 },
      { status: 200 }  // Return 200 with empty predictions instead of 500
    );
  }
}
