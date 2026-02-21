'use client';
import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { FRUITS } from '@buahmusim/shared';
import type { MapCityData } from '@buahmusim/shared';

// Top 8 popular fruits for the home page selector
const HOME_FRUITS = ['mangga', 'durian', 'semangka', 'pisang', 'jeruk', 'alpukat', 'rambutan', 'pepaya'];

function MapSkeleton() {
  return (
    <div className="w-full h-full bg-gray-100 rounded-xl animate-pulse flex items-center justify-center text-gray-400 text-sm">
      Memuat peta...
    </div>
  );
}

const IndonesiaMap = dynamic(() => import('@/components/map/IndonesiaMap'), {
  ssr: false,
  loading: () => <MapSkeleton />,
});

interface MapApiResponse {
  cities: MapCityData[];
  min: number;
  max: number;
  fruit: string;
  fruitNameId: string;
  updatedAt: string;
}

interface HomeMapSectionProps {
  initialData: MapApiResponse | null;
}

export function HomeMapSection({ initialData }: HomeMapSectionProps) {
  const [selectedFruit, setSelectedFruit] = useState('mangga');
  const [mapData, setMapData] = useState<MapApiResponse | null>(initialData);
  const [isLoading, setIsLoading] = useState(false);

  const homeFruits = FRUITS.filter((f) => HOME_FRUITS.includes(f.id));

  useEffect(() => {
    // Skip initial fetch if we already have data for 'mangga'
    if (selectedFruit === 'mangga' && initialData) return;

    async function fetchMapData() {
      setIsLoading(true);
      try {
        const res = await fetch(`/api/prices/map?fruit=${selectedFruit}`);
        if (!res.ok) throw new Error('Failed to fetch map data');
        const data: MapApiResponse = await res.json();
        setMapData(data);
      } catch (err) {
        console.error('[HomeMapSection] fetch error:', err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchMapData();
  }, [selectedFruit, initialData]);

  const selectedFruitData = FRUITS.find((f) => f.id === selectedFruit);

  return (
    <section>
      <div className="flex items-baseline justify-between mb-1">
        <h2 className="text-xl font-bold text-gray-900">Peta Harga Hari Ini</h2>
        <a href="/peta" className="text-xs text-primary-600 hover:underline">
          Semua buah →
        </a>
      </div>
      <p className="text-sm text-gray-500 mb-3">
        Harga {selectedFruitData?.nameId ?? selectedFruit} di 10 kota — klik kota untuk detail
      </p>

      {/* Fruit pill selector */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-3 scrollbar-hide">
        {homeFruits.map((fruit) => (
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

      {/* Map */}
      <div className="h-[300px] md:h-[400px] rounded-xl overflow-hidden border border-gray-200 shadow-sm">
        <IndonesiaMap
          citiesData={mapData?.cities ?? []}
          fruitNameId={selectedFruitData?.nameId ?? selectedFruit}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}
