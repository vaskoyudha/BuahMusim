'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FRUITS } from '@buahmusim/shared';
import type { MapCityData } from '@buahmusim/shared';

const IndonesiaMap = dynamic(() => import('@/components/map/IndonesiaMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400">
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
    <div className="max-w-4xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Peta Harga Buah</h1>
        <p className="text-sm text-gray-500 mt-1">
          Perbandingan harga di 10 kota pasar utama Indonesia
        </p>
      </div>

      {/* Fruit selector */}
      <div className="mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {FRUITS.map((fruit) => (
            <button
              key={fruit.id}
              onClick={() => setSelectedFruit(fruit.id)}
              className={`rounded-full px-3 py-1.5 text-sm font-medium whitespace-nowrap transition-colors ${
                selectedFruit === fruit.id
                  ? 'bg-primary-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {fruit.emoji} {fruit.nameId}
            </button>
          ))}
        </div>
      </div>

      {/* Map container */}
      <div className="h-[400px] md:h-[500px] w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm relative">
        <IndonesiaMap
          citiesData={mapData?.cities ?? []}
          fruitNameId={selectedFruitData?.nameId ?? selectedFruit}
          isLoading={isLoading}
        />
      </div>

      {/* Timestamp */}
      {mapData?.updatedAt && (
        <p className="text-xs text-gray-400 mt-2 text-right">
          Terakhir diperbarui:{' '}
          {new Date(mapData.updatedAt).toLocaleString('id-ID', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}

      {/* Price summary below map */}
      {mapData && mapData.cities.length > 0 && (
        <div className="mt-4 grid grid-cols-2 gap-3">
          {/* Cheapest city */}
          <div className="bg-green-50 border border-green-200 rounded-xl p-3">
            <div className="text-xs text-green-700 font-medium mb-1">✅ Termurah</div>
            {(() => {
              const cheapest = mapData.cities.find((c) => c.rank === 1);
              return cheapest ? (
                <>
                  <div className="font-bold text-gray-900">{cheapest.name}</div>
                  <div className="text-sm text-green-700 font-semibold">
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
          {/* Most expensive city */}
          <div className="bg-red-50 border border-red-200 rounded-xl p-3">
            <div className="text-xs text-red-700 font-medium mb-1">💸 Termahal</div>
            {(() => {
              const mostExpensive = mapData.cities.reduce((a, b) =>
                a.rank > b.rank ? a : b
              );
              return (
                <>
                  <div className="font-bold text-gray-900">{mostExpensive.name}</div>
                  <div className="text-sm text-red-700 font-semibold">
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
      )}
    </div>
  );
}
