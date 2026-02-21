import { generateDailyPrices } from '../data-generator';

export async function dailyPricesJob(): Promise<void> {
  try {
    const today = new Date().toISOString().slice(0, 10);
    const count = generateDailyPrices(today);
    console.log(`[daily-prices] Generated ${count} price records for ${today}`);
  } catch (error) {
    console.error('[daily-prices] Job failed:', error);
  }
}
