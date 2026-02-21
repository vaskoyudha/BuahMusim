'use client';

import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
  Legend,
} from 'recharts';
import type { Prediction } from '@buahmusim/shared';

interface PriceChartProps {
  history: { date: string; price: number }[];
  predictions: Prediction[];
  fruitNameId: string;
  isLoading?: boolean;
}

interface ChartDataPoint {
  date: string;
  historicalPrice?: number;
  predictedPrice?: number;
  lower?: number;
  upper?: number;
}

const INDONESIAN_MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
  'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des',
];

function formatTickDate(dateStr: string): string {
  const d = new Date(dateStr);
  const day = d.getUTCDate();
  const month = INDONESIAN_MONTHS_SHORT[d.getUTCMonth()];
  return `${day} ${month}`;
}

export function PriceChart({ history, predictions, fruitNameId: _fruitNameId, isLoading }: PriceChartProps) {
  if (isLoading) {
    return (
      <div className="w-full h-80 bg-gray-100 rounded-2xl animate-pulse flex items-center justify-center">
        <div className="text-gray-400 text-sm">Memuat grafik…</div>
      </div>
    );
  }

  const todayStr = new Date().toISOString().split('T')[0];

  const chartData: ChartDataPoint[] = [
    ...history.map((h) => ({
      date: h.date,
      historicalPrice: h.price,
      predictedPrice: undefined,
      lower: undefined,
      upper: undefined,
    })),
    ...predictions.map((p) => ({
      date: p.date,
      historicalPrice: undefined,
      predictedPrice: p.price,
      lower: p.lower,
      upper: p.upper,
    })),
  ].sort((a, b) => a.date.localeCompare(b.date));

  // Build tick indices — show every 7th tick to avoid crowding
  const allDates = chartData.map((d) => d.date);
  const ticks: string[] = allDates.filter((_, i) => i % 7 === 0);

  return (
    <div className="w-full">
      <ResponsiveContainer width="100%" height={320}>
        <ComposedChart data={chartData} margin={{ top: 8, right: 16, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />

          <XAxis
            dataKey="date"
            ticks={ticks}
            tickFormatter={formatTickDate}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />

          <YAxis
            tickFormatter={(v: number) => `Rp ${(v / 1000).toFixed(0)}k`}
            width={65}
            tick={{ fontSize: 11, fill: '#6b7280' }}
            axisLine={false}
            tickLine={false}
          />

          <Tooltip
            formatter={(value: number | undefined, name: string | undefined) => [
              `Rp ${((value as number) ?? 0).toLocaleString('id-ID')}`,
              name === 'historicalPrice'
                ? 'Harga Aktual'
                : name === 'predictedPrice'
                ? 'Prediksi'
                : (name ?? ''),
            ]}
            labelFormatter={(label: unknown) => {
              const d = new Date(String(label));
              return d.toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              });
            }}
            contentStyle={{
              borderRadius: '12px',
              border: '1px solid #e5e7eb',
              boxShadow: '0 4px 16px rgba(0,0,0,0.08)',
              fontSize: 13,
            }}
          />

          <Legend
            verticalAlign="bottom"
            height={36}
            formatter={(value: string) => {
              if (value === 'historicalPrice') return 'Harga Aktual';
              if (value === 'predictedPrice') return 'Prediksi';
              return value;
            }}
            wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
          />

          {/* Confidence band — two Areas that fill the region between lower and upper */}
          <Area
            type="monotone"
            dataKey="lower"
            fill="#a855f7"
            fillOpacity={0.06}
            stroke="none"
            legendType="none"
            name="lower"
            connectNulls
          />
          <Area
            type="monotone"
            dataKey="upper"
            fill="#a855f7"
            fillOpacity={0.12}
            stroke="none"
            legendType="none"
            name="upper"
            connectNulls
          />

          {/* Historical line */}
          <Line
            type="monotone"
            dataKey="historicalPrice"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={false}
            connectNulls
            name="historicalPrice"
          />

          {/* Prediction line */}
          <Line
            type="monotone"
            dataKey="predictedPrice"
            stroke="#a855f7"
            strokeWidth={2}
            strokeDasharray="5 5"
            dot={false}
            connectNulls
            name="predictedPrice"
          />

          {/* Today reference line */}
          <ReferenceLine
            x={todayStr}
            stroke="#6b7280"
            strokeDasharray="3 3"
            label={{
              value: 'Hari ini',
              position: 'top',
              fontSize: 11,
              fill: '#6b7280',
            }}
          />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}
