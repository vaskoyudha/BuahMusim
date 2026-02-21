import { getPrices, getPredictions, insertPredictions } from './db';
import type { Prediction } from '@buahmusim/shared';

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8000';
const CACHE_HOURS = 24;

async function fetchWithRetry(url: string, options: RequestInit, maxRetries = 3): Promise<Response> {
  let lastError: Error | null = null;
  const delays = [1000, 2000, 4000];

  for (let i = 0; i < maxRetries; i++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      const response = await fetch(url, { ...options, signal: controller.signal });
      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      lastError = error as Error;
      if (i < maxRetries - 1) {
        await new Promise(resolve => setTimeout(resolve, delays[i]));
      }
    }
  }
  throw lastError!;
}

export async function predictPrices(fruitId: string, cityId: string): Promise<Prediction[]> {
  // Check cache first
  const cached = getPredictions(fruitId, cityId);
  if (cached && new Date(cached.expiresAt) > new Date()) {
    return cached.predictions;
  }

  // Fetch 90 days of history
  const history = getPrices(fruitId, cityId, 90);
  if (history.length < 14) {
    console.warn(`[ML] Insufficient history for ${fruitId}/${cityId}: ${history.length} points`);
    return [];
  }

  const historyPayload = history
    .sort((a, b) => a.date.localeCompare(b.date))
    .map(r => ({ ds: r.date, y: r.price }));

  try {
    const response = await fetchWithRetry(
      `${ML_SERVICE_URL}/predict`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fruit_id: fruitId, city_id: cityId, history: historyPayload }),
      }
    );

    if (!response.ok) {
      throw new Error(`ML service returned ${response.status}`);
    }

    const data = await response.json() as { predictions: Prediction[]; model: string };

    // Cache the result
    insertPredictions(fruitId, cityId, data.predictions, data.model);

    return data.predictions;
  } catch (error) {
    console.error(`[ML] Prediction failed for ${fruitId}/${cityId}:`, error);
    return [];
  }
}
