import { NextResponse } from 'next/server';
import Database from 'better-sqlite3';
import path from 'path';

export const dynamic = 'force-dynamic';

export async function GET(): Promise<NextResponse> {
  const dbPath =
    process.env.DATABASE_PATH ||
    path.join(process.cwd(), 'data', 'buahmusim.db');

  // Check 1: Database health
  let dbStatus: 'ok' | 'error' = 'ok';
  let priceCount = 0;
  let lastPriceUpdate: string | null = null;

  try {
    const db = new Database(dbPath, { readonly: true });
    db.pragma('journal_mode = WAL');

    try {
      const countRow = db.prepare('SELECT COUNT(*) as count FROM prices').get() as {
        count: number;
      };
      priceCount = countRow.count;

      const latestRow = db
        .prepare('SELECT MAX(date) as latest FROM prices')
        .get() as { latest: string | null };
      lastPriceUpdate = latestRow.latest;
    } finally {
      db.close();
    }
  } catch {
    dbStatus = 'error';
  }

  // Check 2: ML service health
  let mlStatus: 'ok' | 'degraded' | 'error' = 'error';
  let mlVersion: string | null = null;

  try {
    const mlUrl = process.env.ML_SERVICE_URL ?? 'http://localhost:8000';
    const res = await fetch(`${mlUrl}/health`, {
      signal: AbortSignal.timeout(3000),
    });

    if (res.ok) {
      mlStatus = 'ok';
      try {
        const data = (await res.json()) as { version?: string };
        mlVersion = data.version ?? null;
      } catch {
        // Response wasn't JSON — still consider ML ok if status was 2xx
      }
    } else {
      mlStatus = 'degraded';
    }
  } catch {
    mlStatus = 'error';
  }

  // Determine overall status
  const overallStatus =
    dbStatus === 'ok' && mlStatus === 'ok' ? 'ok' : 'degraded';
  const httpStatus = overallStatus === 'ok' ? 200 : 207;

  return NextResponse.json(
    {
      status: overallStatus,
      db: { status: dbStatus, priceCount },
      ml: { status: mlStatus, version: mlVersion },
      lastPriceUpdate,
      timestamp: new Date().toISOString(),
    },
    { status: httpStatus }
  );
}
