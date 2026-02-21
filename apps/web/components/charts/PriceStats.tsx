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
  let changeColor = 'text-gray-500';
  let changeDisplay = '0.0%';

  if (weekChange !== null) {
    if (weekChange > 0.5) {
      changeArrow = '↑';
      changeColor = 'text-red-600';
      changeDisplay = `${weekChange.toFixed(1)}%`;
    } else if (weekChange < -0.5) {
      changeArrow = '↓';
      changeColor = 'text-green-600';
      changeDisplay = `${Math.abs(weekChange).toFixed(1)}%`;
    } else {
      changeArrow = '→';
      changeColor = 'text-gray-500';
      changeDisplay = '0.0%';
    }
  }

  // --- Stat 4: Prediction badge ---
  let predBadge: React.ReactNode = null;
  if (predictionDirection === 'naik') {
    predBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700 mt-1">
        📈 Naik
      </span>
    );
  } else if (predictionDirection === 'turun') {
    predBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-700 mt-1">
        📉 Turun
      </span>
    );
  } else if (predictionDirection === 'stabil') {
    predBadge = (
      <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-600 mt-1">
        ➡ Stabil
      </span>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {/* Stat 1 — Current Price */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-medium mb-1">Harga Sekarang</p>
        <p className="text-2xl font-bold text-gray-900 leading-tight">{currentDisplay}</p>
        <p className="text-xs text-gray-400 mt-1">Hari ini</p>
      </div>

      {/* Stat 2 — 7-day change */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-medium mb-1">Perubahan 7 Hari</p>
        {weekChange !== null ? (
          <p className={`text-2xl font-bold leading-tight ${changeColor}`}>
            {changeArrow} {changeDisplay}
          </p>
        ) : (
          <p className="text-2xl font-bold text-gray-400 leading-tight">—</p>
        )}
        <p className="text-xs text-gray-400 mt-1">vs 7 hari lalu</p>
      </div>

      {/* Stat 3 — 30-day range */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
        <p className="text-xs text-gray-500 font-medium mb-1">Rentang 30 Hari</p>
        {monthRange !== null ? (
          <div className="mt-1">
            <p className="text-sm font-bold text-green-700">{formatRp(monthRange.low)}</p>
            <p className="text-xs text-gray-400">hingga</p>
            <p className="text-sm font-bold text-red-700">{formatRp(monthRange.high)}</p>
          </div>
        ) : (
          <p className="text-2xl font-bold text-gray-400 leading-tight mt-1">—</p>
        )}
      </div>

      {/* Stat 4 — Prediction 28 days */}
      <div className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm">
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
