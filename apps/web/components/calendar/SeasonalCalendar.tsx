'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import {
  FRUITS,
  getSeasonStatus,
  formatPrice,
  type FruitData,
  type SeasonStatus,
} from '@buahmusim/shared';
import { SeasonCell } from './SeasonCell';

// ── Constants ──────────────────────────────────────────────────────────────────

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
const MONTH_LABELS_FULL = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface SeasonalCalendarProps {
  /** Show only fruits that have at least one peak month */
  filterOnlySeasonal?: boolean;
  /** Sort mode */
  sortMode?: 'az' | 'nextSeason';
  /** Initial fruit list override (for filtered views) */
  fruits?: FruitData[];
}

interface SelectedCell {
  fruitId: string;
  monthIndex: number;
}

// ── Status helpers ─────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<SeasonStatus, string> = {
  peak:       '🟢 Panen Raya — Harga paling murah',
  transition: '🟡 Transisi — Harga sedang berubah',
  normal:     '⚪ Normal',
  off:        '🔴 Tidak Musim — Harga lebih mahal',
};

// How many months until next peak, for sorting
function monthsUntilNextPeak(fruit: FruitData, currentMonth: number): number {
  if (fruit.peakMonths.length === 0) return 999;
  const current1 = currentMonth; // already 1-indexed
  let min = 12;
  for (const pm of fruit.peakMonths) {
    let diff = pm - current1;
    if (diff < 0) diff += 12;
    if (diff === 0) return 0; // already in peak
    if (diff < min) min = diff;
  }
  return min;
}

// ── Detail Panel ──────────────────────────────────────────────────────────────

interface DetailPanelProps {
  fruit: FruitData;
  monthIndex: number;
  onClose: () => void;
}

function DetailPanel({ fruit, monthIndex, onClose }: DetailPanelProps) {
  const status = getSeasonStatus(fruit.id, monthIndex + 1);

  const statusBg: Record<SeasonStatus, string> = {
    peak:       'bg-green-50 border-green-200',
    transition: 'bg-yellow-50 border-yellow-200',
    normal:     'bg-gray-50 border-gray-200',
    off:        'bg-red-50 border-red-200',
  };

  return (
    <div className={`mt-4 rounded-2xl border p-5 shadow-sm ${statusBg[status]}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="text-3xl leading-none">{fruit.emoji}</span>
          <div>
            <h3 className="text-base font-semibold text-gray-900">{fruit.nameId}</h3>
            <p className="text-xs text-gray-500 italic">{fruit.nameEn}</p>
          </div>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Tutup panel"
          className="text-gray-400 hover:text-gray-600 text-xl leading-none p-1 -mt-1 -mr-1 rounded-lg hover:bg-white/60 transition-colors"
        >
          ×
        </button>
      </div>

      <div className="mt-3 space-y-2.5">
        {/* Month + status */}
        <div>
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
            {MONTH_LABELS_FULL[monthIndex]}
          </span>
          <p className="text-sm font-medium text-gray-800 mt-0.5">{STATUS_LABELS[status]}</p>
        </div>

        {/* Regions */}
        <div>
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Daerah Penghasil</p>
          <div className="flex flex-wrap gap-1.5">
            {fruit.growingRegions.map((r) => (
              <span key={r} className="px-2 py-0.5 rounded-full bg-white/70 text-xs text-gray-700 border border-gray-200">
                {r}
              </span>
            ))}
          </div>
        </div>

        {/* Price range */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-200/60">
          <div>
            <p className="text-xs text-gray-500">Kisaran harga</p>
            <p className="text-sm font-semibold text-gray-800">
              {formatPrice(fruit.priceRange.low)} – {formatPrice(fruit.priceRange.high)}
              <span className="font-normal text-gray-500"> / kg</span>
            </p>
          </div>
          <Link
            href={`/buah/${fruit.id}`}
            className="shrink-0 px-3 py-1.5 bg-primary-600 text-white text-xs font-semibold rounded-lg hover:bg-primary-700 transition-colors"
          >
            Lihat Detail →
          </Link>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export function SeasonalCalendar({ filterOnlySeasonal = false, sortMode = 'az', fruits }: SeasonalCalendarProps) {
  const currentMonth0 = new Date().getMonth(); // 0-indexed
  const currentMonth1 = currentMonth0 + 1;     // 1-indexed for getSeasonStatus

  const [selectedCell, setSelectedCell] = useState<SelectedCell | null>(null);

  // Resolve fruit list
  const sourceFruits = fruits ?? FRUITS;

  const displayFruits = useMemo(() => {
    let list = [...sourceFruits];

    if (filterOnlySeasonal) {
      list = list.filter((f) => getSeasonStatus(f.id, currentMonth1) !== 'off');
    }

    if (sortMode === 'az') {
      list.sort((a, b) => a.nameId.localeCompare(b.nameId, 'id'));
    } else {
      // nextSeason: sort by how soon the next peak is
      list.sort((a, b) => monthsUntilNextPeak(a, currentMonth1) - monthsUntilNextPeak(b, currentMonth1));
    }

    return list;
  }, [sourceFruits, filterOnlySeasonal, sortMode, currentMonth1]);

  const handleCellClick = (fruitId: string, monthIndex: number) => {
    setSelectedCell((prev) =>
      prev?.fruitId === fruitId && prev?.monthIndex === monthIndex ? null : { fruitId, monthIndex }
    );
  };

  const selectedFruit = selectedCell ? FRUITS.find((f) => f.id === selectedCell.fruitId) ?? null : null;

  return (
    <div>
      {/* Current month label above grid */}
      <div className="relative mb-1">
        {/* The "Bulan Ini" tag — positioned over the current month column */}
        {/* We offset: sticky name col is ~160px, each cell col is 1fr of remaining */}
        <div
          className="absolute text-xs font-semibold text-yellow-600 bg-yellow-50 border border-yellow-300 rounded-full px-2 py-0.5 whitespace-nowrap"
          style={{
            left: `calc(160px + (${currentMonth0} + 0.5) * ((100% - 160px) / 12) )`,
            transform: 'translateX(-50%)',
            top: 0,
          }}
        >
          Bulan Ini
        </div>
        <div className="h-6" />
      </div>

      {/* Scrollable grid wrapper */}
      <div className="overflow-x-auto rounded-xl border border-gray-200 shadow-sm bg-white">
        <div
          className="grid"
          style={{
            gridTemplateColumns: '160px repeat(12, minmax(32px, 1fr))',
            minWidth: '560px',
          }}
        >
          {/* ── Header row ── */}
          {/* Sticky corner */}
          <div className="sticky left-0 z-20 bg-white border-b border-r border-gray-200 px-2 py-2 flex items-center">
            <span className="text-xs font-semibold text-gray-500">Buah</span>
          </div>

          {/* Month headers */}
          {MONTH_LABELS.map((label, i) => (
            <div
              key={label}
              className={[
                'border-b border-gray-200 text-center py-2 px-1',
                i === currentMonth0
                  ? 'bg-yellow-50 ring-2 ring-yellow-400 ring-inset'
                  : 'bg-gray-50',
              ].join(' ')}
            >
              <span className={`text-xs font-semibold ${i === currentMonth0 ? 'text-yellow-700' : 'text-gray-500'}`}>
                {label}
              </span>
            </div>
          ))}

          {/* ── Fruit rows ── */}
          {displayFruits.map((fruit) => {
            const isInPeakNow = getSeasonStatus(fruit.id, currentMonth1) === 'peak';

            return [
              /* Sticky fruit name cell */
              <div
                key={`name-${fruit.id}`}
                className="sticky left-0 z-10 bg-white border-b border-r border-gray-100 px-2 py-1 flex items-center gap-1.5 min-h-[34px]"
              >
                <span className="text-base leading-none">{fruit.emoji}</span>
                <span className="text-xs font-medium text-gray-800 truncate flex-1">{fruit.nameId}</span>
                {isInPeakNow && <span className="text-xs leading-none shrink-0" title="Musim panen sekarang">🔥</span>}
              </div>,

              /* 12 season cells */
              ...MONTH_LABELS.map((_, monthIndex) => (
                <div
                  key={`${fruit.id}-${monthIndex}`}
                  className="border-b border-gray-100 p-0.5"
                >
                  <SeasonCell
                    fruitId={fruit.id}
                    monthIndex={monthIndex}
                    isSelected={selectedCell?.fruitId === fruit.id && selectedCell?.monthIndex === monthIndex}
                    isCurrentMonth={monthIndex === currentMonth0}
                    onClick={handleCellClick}
                  />
                </div>
              )),
            ];
          })}
        </div>
      </div>

      {/* Detail Panel */}
      {selectedCell && selectedFruit && (
        <DetailPanel
          fruit={selectedFruit}
          monthIndex={selectedCell.monthIndex}
          onClose={() => setSelectedCell(null)}
        />
      )}

      {/* Legend */}
      <div className="mt-4 flex flex-wrap gap-3 items-center text-xs text-gray-600">
        <span className="font-semibold text-gray-700">Keterangan:</span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: '#16a34a' }} />
          Panen Raya
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: '#86efac' }} />
          Transisi
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block" style={{ backgroundColor: '#dcfce7' }} />
          Normal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-4 h-4 rounded-sm inline-block bg-gray-200" />
          Tidak Musim
        </span>
        <span className="flex items-center gap-1.5">
          <span>🔥</span>
          Musim panen sekarang
        </span>
      </div>
    </div>
  );
}
