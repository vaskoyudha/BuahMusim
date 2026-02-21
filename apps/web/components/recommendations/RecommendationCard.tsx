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
      <div className="rounded-xl border border-gray-100 overflow-hidden animate-pulse">
        <div className="h-14 bg-gray-200" />
        <div className="p-4 space-y-2">
          <div className="h-4 bg-gray-100 rounded w-full" />
          <div className="h-4 bg-gray-100 rounded w-3/4" />
        </div>
      </div>
    );
  }

  // Error state
  if (error || !data) {
    return (
      <div className="p-4 text-sm text-gray-400 text-center rounded-xl border border-gray-100">
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

  const formattedDate = new Date(data.generatedAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div
      className={`rounded-xl border overflow-hidden ${
        isBeli ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-200'
      }`}
    >
      {/* Action banner */}
      <div
        className={`text-white font-bold text-xl py-3 px-4 text-center ${
          isBeli ? 'bg-green-600' : 'bg-amber-500'
        }`}
      >
        {isBeli ? '✅ BELI SEKARANG' : '⏳ TUNGGU DULU'}
      </div>

      {/* Explanation */}
      <div className="p-4 text-gray-700 leading-relaxed">{data.explanation}</div>

      {/* Metadata row */}
      <div className="px-4 pb-4 text-xs text-gray-400 flex justify-between">
        <span>{sourceLabel}</span>
        <span>Diperbarui: {formattedDate}</span>
      </div>
    </div>
  );
}
