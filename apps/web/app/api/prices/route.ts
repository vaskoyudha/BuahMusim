import { NextRequest, NextResponse } from 'next/server';
import { getPrices } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const fruit = searchParams.get('fruit');
    const city = searchParams.get('city');
    const daysParam = searchParams.get('days');
    const days = Math.min(
      Math.max(parseInt(daysParam ?? '30', 10) || 30, 1),
      90
    );

    if (!fruit || !city) {
      return NextResponse.json(
        { error: 'Parameter fruit dan city wajib diisi', code: 400 },
        { status: 400 }
      );
    }

    const data = getPrices(fruit, city, days);

    return NextResponse.json(
      { data, fruit, city },
      {
        headers: {
          'Cache-Control': 's-maxage=3600, stale-while-revalidate=86400',
        },
      }
    );
  } catch (error) {
    console.error('[API /prices] Error:', error);
    return NextResponse.json(
      { error: 'Terjadi kesalahan pada server', code: 500 },
      { status: 500 }
    );
  }
}
