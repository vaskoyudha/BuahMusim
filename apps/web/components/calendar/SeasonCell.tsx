'use client';

import { getSeasonStatus, type SeasonStatus } from '@buahmusim/shared';

export interface SeasonCellProps {
  fruitId: string;
  monthIndex: number; // 0-indexed (0 = January)
  isSelected: boolean;
  isCurrentMonth: boolean;
  onClick: (fruitId: string, monthIndex: number) => void;
}

export const SEASON_COLORS: Record<SeasonStatus, string> = {
  peak:       '#16a34a',
  transition: '#86efac',
  normal:     '#dcfce7',
  off:        '#e5e7eb',
};

export const SEASON_TEXT_COLORS: Record<SeasonStatus, string> = {
  peak:       '#ffffff',
  transition: '#14532d',
  normal:     '#14532d',
  off:        '#6b7280',
};

export function SeasonCell({ fruitId, monthIndex, isSelected, isCurrentMonth, onClick }: SeasonCellProps) {
  // getSeasonStatus uses 1-indexed months
  const status = getSeasonStatus(fruitId, monthIndex + 1);
  const bg = SEASON_COLORS[status];
  const textColor = SEASON_TEXT_COLORS[status];

  return (
    <button
      type="button"
      onClick={() => onClick(fruitId, monthIndex)}
      aria-label={`${fruitId} bulan ${monthIndex + 1}`}
      aria-pressed={isSelected}
      style={{ backgroundColor: bg, color: textColor }}
      className={[
        'w-full h-8 min-w-[32px] rounded-sm transition-all duration-150 cursor-pointer',
        'hover:opacity-80 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-1',
        isSelected ? 'ring-2 ring-blue-500 ring-offset-1 z-10 relative' : '',
        isCurrentMonth ? 'ring-1 ring-yellow-400' : '',
      ].filter(Boolean).join(' ')}
    />
  );
}
