'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FRUITS } from '@buahmusim/shared';
import type { MapCityData } from '@buahmusim/shared';

const IndonesiaMap = dynamic(() => import('@/components/map/IndonesiaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full rounded-xl animate-shimmer flex items-center justify-center text-gray-400">
      Memuat peta...
    </div>
  ),
});

interface MapApiResponse {
  cities: MapCityData[];
  min: number;
  max: number;
  fruit: string;
  fruitNameId: string;
  updatedAt: string;
}

export default function PetaPage() {
  const [selectedFruit, setSelectedFruit] = useState('mangga');
  const [mapData, setMapData] = useState<MapApiResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    async function fetchMapData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/prices/map?fruit=${selectedFruit}`);
        if (!res.ok) throw new Error('Failed to fetch map data');
        const data: MapApiResponse = await res.json();
        setMapData(data);
      } catch (err) {
        console.error('[PetaPage] fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMapData();
  }, [selectedFruit]);

  const selectedFruitData = FRUITS.find((f) => f.id === selectedFruit);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">

      {/* ── Header ── */}
      <div className="border-b border-gray-100 pb-5">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-primary-700 bg-primary-50 border border-primary-200 rounded-full px-3 py-1 mb-3">
          🗺️ Peta Harga
        </span>
        <h1 className="text-3xl font-bold text-gray-900 leading-tight">
          Peta Harga Buah
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Perbandingan harga visual di 10 kota pasar utama Indonesia
        </p>
      </div>

      {/* ── Fruit selector ── */}
      <div className="animate-fadeInUp stagger-1 space-y-3">
        <div className="flex items-center gap-2.5">
          <div className="w-1 h-6 rounded-full bg-primary-500 shrink-0" />
          <h2 className="text-lg font-bold text-gray-800">Pilih Buah</h2>
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FRUITS.map((fruit) => (
            <button
              key={fruit.id}
              onClick={() => setSelectedFruit(fruit.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                selectedFruit === fruit.id
                  ? 'bg-gradient-to-r from-primary-600 to-emerald-600 text-white shadow-md scale-[1.02]'
                  : 'bg-white border border-gray-200 text-gray-700 hover:border-primary-300 hover:text-primary-700 hover:bg-primary-50/40 shadow-sm'
              }`}
            >
              {fruit.emoji} {fruit.nameId}
            </button>
          ))}
        </div>
      </div>

      {/* ── Map container ── */}
      <div className="animate-fadeInUp stagger-2 relative h-[400px] md:h-[500px] w-full rounded-2xl overflow-hidden border border-primary-100/60 ring-1 ring-primary-200/30 shadow-md">
        {/* Gradient depth strip at top */}
        <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-white/30 to-transparent z-10 pointer-events-none" />
        <IndonesiaMap
          citiesData={mapData?.cities ?? []}
          fruitNameId={selectedFruitData?.nameId ?? selectedFruit}
          isLoading={isLoading}
        />
      </div>

      {/* ── Timestamp ── */}
      {mapData?.updatedAt && (
        <div className="card-premium px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center shrink-0 text-sm">
              🕐
            </div>
            <span className="text-xs text-gray-400 font-medium">Terakhir diperbarui</span>
          </div>
          <span className="text-xs text-gray-600 font-semibold">
            {new Date(mapData.updatedAt).toLocaleString('id-ID', {
              day: 'numeric',
              month: 'long',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>
      )}

      {/* ── Price summary ── */}
      {mapData && mapData.cities.length > 0 && (
        <div className="grid grid-cols-2 gap-3">

          {/* Termurah */}
          <div className="card-premium overflow-hidden relative border-l-4 border-emerald-400">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-50 to-green-50 opacity-60 pointer-events-none" />
            <div className="relative p-3">
              <div className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-1">
                ✅ Termurah
              </div>
              {(() => {
                const cheapest = mapData.cities.find((c) => c.rank === 1);
                return cheapest ? (
                  <>
                    <div className="font-bold text-gray-900 text-base">{cheapest.name}</div>
                    <div className="text-gradient-green font-bold text-lg">
                      {cheapest.price.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                      /kg
                    </div>
                  </>
                ) : null;
              })()}
            </div>
          </div>

          {/* Termahal */}
          <div className="card-premium overflow-hidden relative border-l-4 border-red-400">
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 to-rose-50 opacity-60 pointer-events-none" />
            <div className="relative p-3">
              <div className="text-xs font-bold text-red-700 uppercase tracking-wider mb-1">
                💸 Termahal
              </div>
              {(() => {
                const mostExpensive = mapData.cities.reduce((a, b) =>
                  a.rank > b.rank ? a : b
                );
                return (
                  <>
                    <div className="font-bold text-gray-900 text-base">{mostExpensive.name}</div>
                    <div className="text-red-600 font-bold text-lg">
                      {mostExpensive.price.toLocaleString('id-ID', {
                        style: 'currency',
                        currency: 'IDR',
                        minimumFractionDigits: 0,
                      })}
                      /kg
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}
