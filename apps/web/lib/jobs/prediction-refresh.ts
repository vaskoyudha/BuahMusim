import { predictPrices } from '../ml-client';

const TOP_10_COMBOS = [
  { fruitId: 'durian', cityId: 'jakarta' },
  { fruitId: 'mangga', cityId: 'surabaya' },
  { fruitId: 'jeruk', cityId: 'jakarta' },
  { fruitId: 'pisang', cityId: 'jakarta' },
  { fruitId: 'rambutan', cityId: 'medan' },
  { fruitId: 'semangka', cityId: 'bandung' },
  { fruitId: 'alpukat', cityId: 'malang' },
  { fruitId: 'pepaya', cityId: 'jakarta' },
  { fruitId: 'salak', cityId: 'yogyakarta' },
  { fruitId: 'manggis', cityId: 'jakarta' },
] as const;

export async function predictionRefreshJob(): Promise<void> {
  try {
    console.log('[prediction-refresh] Starting refresh for top 10 combos...');

    for (const combo of TOP_10_COMBOS) {
      try {
        const predictions = await predictPrices(combo.fruitId, combo.cityId);
        console.log(
          `[prediction-refresh] ${combo.fruitId}/${combo.cityId}: ${predictions.length} predictions`
        );
      } catch (error) {
        console.error(
          `[prediction-refresh] Failed for ${combo.fruitId}/${combo.cityId}:`,
          error
        );
      }
    }

    console.log('[prediction-refresh] Refresh complete.');
  } catch (error) {
    console.error('[prediction-refresh] Job failed:', error);
  }
}
