'use client';
import { useState, useEffect } from 'react';

interface RecommendationCardProps {
  fruitId: string;
  cityId: string;
}

interface RecommendationData {
  action: 'beli' | 'tunggu';
  explanation: string;
  source: 'llm' | 'template' | 'cache';
  generatedAt: string;
}

export default function RecommendationCard({ fruitId, cityId }: RecommendationCardProps) {
  const [data, setData] = useState<RecommendationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function fetchRecommendation() {
      setLoading(true);
      setError(false);

      try {
        const res = await fetch(
          `/api/recommendations?fruit=${encodeURIComponent(fruitId)}&city=${encodeURIComponent(cityId)}`
        );
        if (!res.ok) throw new Error('Failed to fetch recommendation');

        const json: RecommendationData = await res.json();
        if (!cancelled) {
          setData(json);
        }
      } catch {
        if (!cancelled) {
          setError(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    fetchRecommendation();

    return () => {
      cancelled = true;
    };
  }, [fruitId, cityId]);

  // Loading skeleton
  if (loading) {
    return (
      <div className="card-premium overflow-hidden">
        <div className="h-20 animate-shimmer" />
        <div className="p-5 space-y-2">
          <div className="h-4 animate-shimmer rounded-md w-full" />
          <div className="h-4 animate-shimmer rounded-md w-4/5" />
          <div className="h-4 animate-shimmer rounded-md w-3/5" />
        </div>
        <div className="h-10 animate-shimmer border-t border-gray-100" />
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="card-premium p-5 text-sm text-gray-400 text-center">
        Rekomendasi tidak tersedia saat ini.
      </div>
    );
  }

  const isBeli = data.action === 'beli';

  const sourceLabel =
    data.source === 'llm'
      ? 'Analisis AI'
      : data.source === 'template'
        ? 'Analisis Otomatis'
        : 'Dari Cache';

  const sourceCls =
    data.source === 'llm'
      ? 'bg-secondary-100 text-secondary-700'
      : data.source === 'template'
        ? 'bg-primary-100 text-primary-700'
        : 'bg-gray-100 text-gray-600';

  const formattedDate = new Date(data.generatedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  // Dot-grid pattern overlay
  const dotPattern = {
    backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px)',
    backgroundSize: '20px 20px',
  };

  return (
    <div
      className={`card-premium overflow-hidden ${
        isBeli ? 'border-emerald-200/60' : 'border-amber-200/60'
      }`}
    >
      {/* ── Action banner ── */}
      <div
        className={`relative px-5 py-5 ${
          isBeli
            ? 'bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500'
            : 'bg-gradient-to-r from-amber-500 via-orange-500 to-yellow-500'
        }`}
        style={dotPattern}
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-white/20 flex items-center justify-center text-2xl shrink-0">
            {isBeli ? '✅' : '⏳'}
          </div>
          <div>
            <p className="text-white font-bold text-xl leading-tight">
              {isBeli ? 'BELI SEKARANG' : 'TUNGGU DULU'}
            </p>
            <p className="text-white/80 text-sm mt-0.5">
              {isBeli
                ? 'Waktu yang tepat untuk membeli!'
                : 'Harga diprediksi akan turun'}
            </p>
          </div>
        </div>
      </div>

      {/* ── Explanation ── */}
      <div className="p-5 bg-white">
        <div className="border-l-4 border-primary-200 pl-4">
          <p className="text-gray-700 text-sm leading-relaxed">{data.explanation}</p>
        </div>
      </div>

      {/* ── Metadata footer ── */}
      <div className="bg-gray-50 border-t border-gray-100 px-5 py-3 flex items-center justify-between">
        <span className={`inline-flex items-center text-xs font-semibold px-2.5 py-0.5 rounded-full ${sourceCls}`}>
          {sourceLabel}
        </span>
        <span className="text-xs text-gray-400">Diperbarui: {formattedDate}</span>
      </div>
    </div>
  );
}
