import { FRUITS, CITIES } from '@buahmusim/shared';
import type { PriceRecord } from '@buahmusim/shared';
import { getPriceCount, insertPriceBatch } from './db';
import { generatePrice } from './data-generator';

export async function seedHistoricalData(): Promise<void> {
  const count = getPriceCount();
  if (count > 0) {
    console.log(`[Seeder] Database already has ${count} records. Skipping seed.`);
    return;
  }

  console.log('[Seeder] Starting 90-day historical seed...');
  const today = new Date();
  const batchSize = 500;
  let batch: PriceRecord[] = [];

  // Track previous prices for continuity
  const prevPrices = new Map<string, number>();

  // Go from 90 days ago to yesterday (not today — today comes from daily job)
  for (let daysAgo = 90; daysAgo >= 1; daysAgo--) {
    const date = new Date(today);
    date.setDate(date.getDate() - daysAgo);
    const dateStr = date.toISOString().split('T')[0];

    for (const fruit of FRUITS) {
      for (const city of CITIES) {
        const key = `${fruit.id}-${city.id}`;
        const prev = prevPrices.get(key);
        const price = generatePrice(fruit.id, city.id, dateStr, prev);
        prevPrices.set(key, price);

        batch.push({
          fruitId: fruit.id,
          cityId: city.id,
          date: dateStr,
          price,
          source: 'synthetic',
        });

        if (batch.length >= batchSize) {
          insertPriceBatch(batch);
          batch = [];
        }
      }
    }
  }

  if (batch.length > 0) {
    insertPriceBatch(batch);
  }

  const finalCount = getPriceCount();
  console.log(`[Seeder] Seed complete. Inserted ${finalCount} records.`);
}

export async function checkAndSeed(): Promise<void> {
  await seedHistoricalData();
}
