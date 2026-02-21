import { FRUITS, type FruitData } from './fruits';

export type SeasonStatus = 'peak' | 'transition' | 'normal' | 'off';

export function isFruitInSeason(fruitId: string, month: number): boolean {
  const fruit = FRUITS.find((f) => f.id === fruitId);
  if (!fruit) return false;
  return fruit.peakMonths.includes(month);
}

export function getSeasonStatus(fruitId: string, month: number): SeasonStatus {
  const fruit = FRUITS.find((f) => f.id === fruitId);
  if (!fruit) return 'normal';

  if (fruit.peakMonths.includes(month)) return 'peak';
  if (fruit.offMonths.includes(month)) return 'off';

  const isNearPeak = fruit.peakMonths.some((pm) => {
    const diff = Math.abs(pm - month);
    const wrappedDiff = Math.min(diff, 12 - diff);
    return wrappedDiff === 1;
  });

  const isNearOff = fruit.offMonths.some((om) => {
    const diff = Math.abs(om - month);
    const wrappedDiff = Math.min(diff, 12 - diff);
    return wrappedDiff === 1;
  });

  if (isNearPeak || isNearOff) return 'transition';

  return 'normal';
}

export function getSeasonalMultiplier(fruitId: string, month: number): number {
  const status = getSeasonStatus(fruitId, month);

  switch (status) {
    case 'peak':
      return 0.7;
    case 'off':
      return 1.3;
    case 'transition': {
      const fruit = FRUITS.find((f) => f.id === fruitId);
      if (!fruit) return 1.0;

      const nearPeak = fruit.peakMonths.some((pm) => {
        const diff = Math.abs(pm - month);
        return Math.min(diff, 12 - diff) === 1;
      });

      return nearPeak ? 0.85 : 1.15;
    }
    case 'normal':
    default:
      return 1.0;
  }
}

export function getFruitsInSeason(month: number): FruitData[] {
  return FRUITS.filter((f) => f.peakMonths.includes(month));
}

export function getFruitsOffSeason(month: number): FruitData[] {
  return FRUITS.filter((f) => f.offMonths.includes(month));
}
