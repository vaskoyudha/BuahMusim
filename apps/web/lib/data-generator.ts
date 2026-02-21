import {
  FRUITS,
  CITIES,
  RAMADAN_DATES,
  getFruitById,
  getCityById,
} from '@buahmusim/shared';
import type { PriceRecord } from '@buahmusim/shared';
import { getLatestPrice, insertPrice } from './db';

// ---------------------------------------------------------------------------
// Seeded PRNG — mulberry32 (deterministic, fast, 32-bit state)
// ---------------------------------------------------------------------------

function hashString(str: string): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h >>> 0; // unsigned
}

function mulberry32(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function seededRandom(seed: string): () => number {
  return mulberry32(hashString(seed));
}

// Box-Muller transform for Gaussian noise using seeded PRNG
function gaussianNoise(rng: () => number): number {
  let u = 0;
  let v = 0;
  while (u === 0) u = rng();
  while (v === 0) v = rng();
  return Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
}

// ---------------------------------------------------------------------------
// Seasonal multiplier (with transition interpolation)
// ---------------------------------------------------------------------------

function getSeasonMultiplier(
  peakMonths: number[],
  offMonths: number[],
  month: number
): number {
  const PEAK_MULT = 0.75;
  const OFF_MULT = 1.35;
  const NORMAL_MULT = 1.0;

  if (peakMonths.includes(month)) return PEAK_MULT;
  if (offMonths.includes(month)) return OFF_MULT;

  // Check transition — within 1 month of peak or off boundary
  const isNearPeak = peakMonths.some((pm) => {
    const diff = Math.abs(pm - month);
    return Math.min(diff, 12 - diff) === 1;
  });

  const isNearOff = offMonths.some((om) => {
    const diff = Math.abs(om - month);
    return Math.min(diff, 12 - diff) === 1;
  });

  if (isNearPeak && isNearOff) {
    // Between peak and off — average the two transitions
    return (PEAK_MULT + OFF_MULT) / 2;
  }

  if (isNearPeak) {
    // Linear interpolation: halfway between normal and peak
    return (NORMAL_MULT + PEAK_MULT) / 2; // 0.875
  }

  if (isNearOff) {
    // Linear interpolation: halfway between normal and off
    return (NORMAL_MULT + OFF_MULT) / 2; // 1.175
  }

  return NORMAL_MULT;
}

// ---------------------------------------------------------------------------
// Ramadan check using date string (avoids timezone issues)
// ---------------------------------------------------------------------------

function isDateInRamadan(dateStr: string): boolean {
  return RAMADAN_DATES.some((r) => dateStr >= r.start && dateStr <= r.end);
}

// ---------------------------------------------------------------------------
// Weekend check
// ---------------------------------------------------------------------------

function isWeekend(dateStr: string): boolean {
  const [y, m, d] = dateStr.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  const day = date.getDay();
  return day === 0 || day === 6; // Sunday = 0, Saturday = 6
}

// ---------------------------------------------------------------------------
// generatePrice — deterministic synthetic price generator
// ---------------------------------------------------------------------------

export function generatePrice(
  fruitId: string,
  cityId: string,
  date: string, // YYYY-MM-DD
  previousPrice?: number
): number {
  const fruit = getFruitById(fruitId);
  const city = getCityById(cityId);

  if (!fruit || !city) {
    throw new Error(`Unknown fruit "${fruitId}" or city "${cityId}"`);
  }

  // Step 10: Base price
  const basePrice = (fruit.priceRange.low + fruit.priceRange.high) / 2;

  // Step 3: Get month from date
  const month = parseInt(date.split('-')[1], 10);

  // Step 4: Seasonal multiplier
  const seasonMult = getSeasonMultiplier(fruit.peakMonths, fruit.offMonths, month);

  // Step 5: City multiplier
  const cityMult = city.priceMultiplier;

  // Step 6: Ramadan impact
  let ramadanMult = 1.0;
  if (isDateInRamadan(date)) {
    if (fruit.ramadanImpact === 'high') ramadanMult = 1.20;
    else if (fruit.ramadanImpact === 'medium') ramadanMult = 1.10;
  }

  // Step 7: Weekend bump
  const weekendMult = isWeekend(date) ? 1.03 : 1.0;

  // Step 8: Gaussian noise +-8% seeded by fruitId-cityId-date
  const rng = seededRandom(`${fruitId}-${cityId}-${date}`);
  const noise = gaussianNoise(rng);
  // Clamp noise to [-3, 3] standard deviations then scale to +-8%
  const clampedNoise = Math.max(-3, Math.min(3, noise));
  const noiseMult = 1.0 + (clampedNoise / 3) * 0.08;

  // Combine all multipliers
  let price = basePrice * seasonMult * cityMult * ramadanMult * weekendMult * noiseMult;

  // Step 9: Continuity — clamp to +-12% of previousPrice
  if (previousPrice !== undefined && previousPrice > 0) {
    const maxPrice = previousPrice * 1.12;
    const minPrice = previousPrice * 0.88;
    price = Math.max(minPrice, Math.min(maxPrice, price));
  }

  // Step 11: Floor and ceiling
  const absoluteMin = fruit.priceRange.low * 0.75;
  const absoluteMax = fruit.priceRange.high * 1.25;
  price = Math.max(absoluteMin, Math.min(absoluteMax, price));

  // Round to nearest 500 IDR
  price = Math.round(price / 500) * 500;

  // Step 12: Return integer
  return price;
}

// ---------------------------------------------------------------------------
// generateDailyPrices — generates prices for all fruits × cities for a date
// ---------------------------------------------------------------------------

export function generateDailyPrices(dateStr: string): number {
  let count = 0;

  for (const fruit of FRUITS) {
    for (const city of CITIES) {
      // Get yesterday's price for continuity
      const latest = getLatestPrice(fruit.id, city.id);
      const previousPrice = latest?.price;

      const price = generatePrice(fruit.id, city.id, dateStr, previousPrice);

      insertPrice({
        fruitId: fruit.id,
        cityId: city.id,
        date: dateStr,
        price,
        source: 'synthetic',
      });

      count++;
    }
  }

  return count;
}
