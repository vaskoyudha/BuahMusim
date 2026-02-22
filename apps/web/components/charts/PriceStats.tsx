'use client';

interface PriceStatsProps {
  currentPrice: number | null;
  weekChange: number | null;       // percentage change from 7 days ago
  monthRange: { low: number; high: number } | null;
  predictedIn28Days: number | null;
  predictionDirection: 'naik' | 'turun' | 'stabil' | null;
}

function formatRp(value: number): string {
  return `Rp ${value.toLocaleString('id-ID')}`;
}

export function PriceStats({
  currentPrice,
  weekChange,
  monthRange,
  predictedIn28Days,
  predictionDirection,
}: PriceStatsProps) {
  // --- Stat 1: Current Price ---
  const currentDisplay = currentPrice !== null ? formatRp(currentPrice) : '—';

  // --- Stat 2: 7-day change ---
  let changeArrow = '→';
  let changeColor = 'text-gray-400';
  let changeDisplay = '0.0%';

  if (weekChange !== null) {
    if (weekChange > 0.5) {
      changeArrow = '↑';
      changeColor = 'text-red-500';
      changeDisplay = `${weekChange.toFixed(1)}%`;
    } else if (weekChange < -0.5) {
      changeArrow = '↓';
      changeColor = 'text-emerald-600';
      changeDisplay = `${Math.abs(weekChange).toFixed(1)}%`;
    } else {
      changeArrow = '→';
      changeColor = 'text-gray-400';
      changeDisplay = '0.0%';
    }
  }

  // --- Stat 4: Prediction card styles + badge ---
  let predCardCls = 'card-premium';
  let predBadge: React.ReactNode = null;

  if (predictionDirection === 'naik') {
    predCardCls = 'rounded-2xl border p-4 bg-gradient-to-br from-red-50 to-rose-50 border-red-200';
    predBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-red-400 to-rose-500 text-white mt-1.5">
        📈 Naik
      </span>
    );
  } else if (predictionDirection === 'turun') {
    predCardCls = 'rounded-2xl border p-4 bg-gradient-to-br from-emerald-50 to-green-50 border-emerald-200';
    predBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gradient-to-r from-emerald-400 to-green-500 text-white mt-1.5">
        📉 Turun
      </span>
    );
  } else if (predictionDirection === 'stabil') {
    predCardCls = 'card-premium p-4';
    predBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-gray-100 text-gray-600 mt-1.5">
        ➡ Stabil
      </span>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Stat 1 — Current Price (inverted dark green) */}
      <div className="rounded-2xl p-4 bg-gradient-to-br from-primary-600 to-emerald-700 text-white shadow-md">
        <p className="text-white/70 text-xs font-medium mb-1">Harga Sekarang</p>
        <p className="text-3xl font-bold text-white leading-tight">{currentDisplay}</p>
        <p className="text-white/60 text-xs mt-1">Hari ini</p>
      </div>

      {/* Stat 2 — 7-day change */}
      <div className="card-premium p-4">
        <p className="text-xs text-gray-500 font-medium mb-1">Perubahan 7 Hari</p>
        {weekChange !== null ? (
          <p className={`text-3xl font-bold leading-tight ${changeColor}`}>
            {changeArrow} {changeDisplay}
          </p>
        ) : (
          <p className="text-3xl font-bold text-gray-400 leading-tight">—</p>
        )}
        <p className="text-xs text-gray-400 mt-1">vs 7 hari lalu</p>
      </div>

      {/* Stat 3 — 30-day range */}
      <div className="card-premium p-4">
        <p className="text-xs text-gray-500 font-medium mb-1">Rentang 30 Hari</p>
        {monthRange !== null ? (
          <div className="mt-1 space-y-1">
            <p className="text-base font-bold text-emerald-600">{formatRp(monthRange.low)}</p>
            <div className="h-1.5 w-full rounded-full bg-gradient-to-r from-emerald-400 to-red-400" />
            <p className="text-base font-bold text-red-500">{formatRp(monthRange.high)}</p>
          </div>
        ) : (
          <p className="text-3xl font-bold text-gray-400 leading-tight mt-1">—</p>
        )}
      </div>

      {/* Stat 4 — Prediction 28 days */}
      <div className={predictionDirection ? predCardCls : 'card-premium p-4'}>
        <p className="text-xs text-gray-500 font-medium mb-1">Prediksi 4 Minggu</p>
        {predictedIn28Days !== null ? (
          <>
            <p className="text-2xl font-bold text-gray-900 leading-tight">
              {formatRp(predictedIn28Days)}
            </p>
            {predBadge}
          </>
        ) : (
          <p className="text-2xl font-bold text-gray-400 leading-tight mt-1">—</p>
        )}
      </div>
    </div>
  );
}
