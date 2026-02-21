'use client';
import { useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { MapCityData } from '@buahmusim/shared';
import { formatPrice } from '@buahmusim/shared';
import { CITIES } from '@buahmusim/shared';
import { MapLegend } from './MapLegend';

interface IndonesiaMapProps {
  citiesData: MapCityData[];
  fruitNameId: string;
  isLoading?: boolean;
}

// Population-based radius lookup
const CITY_RADIUS: Record<string, number> = {
  jakarta: 18,
  surabaya: 15,
  bandung: 14,
  medan: 14,
};

function getRadius(cityId: string): number {
  return CITY_RADIUS[cityId] ?? 12;
}

function getPriceColor(price: number, min: number, max: number): string {
  if (max === min) return '#22c55e'; // green if all same
  const ratio = (price - min) / (max - min); // 0 = cheapest (green), 1 = most expensive (red)
  // Interpolate: green (#22c55e) → yellow (#eab308) → red (#ef4444)
  if (ratio < 0.5) {
    // green to yellow
    const t = ratio * 2;
    const r = Math.round(34 + (234 - 34) * t);
    const g = Math.round(197 + (179 - 197) * t);
    const b = Math.round(94 + (8 - 94) * t);
    return `rgb(${r},${g},${b})`;
  } else {
    // yellow to red
    const t = (ratio - 0.5) * 2;
    const r = Math.round(234 + (239 - 234) * t);
    const g = Math.round(179 + (68 - 179) * t);
    const b = Math.round(8 + (68 - 8) * t);
    return `rgb(${r},${g},${b})`;
  }
}

export default function IndonesiaMap({ citiesData, fruitNameId, isLoading }: IndonesiaMapProps) {
  useEffect(() => {
    // Fix Leaflet default icon URLs broken by webpack
    delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
  }, []);

  const prices = citiesData.map((c) => c.price);
  const min = prices.length > 0 ? Math.min(...prices) : 0;
  const max = prices.length > 0 ? Math.max(...prices) : 0;

  return (
    <div className="relative w-full h-full">
      <MapContainer
        center={[-2.5, 118]}
        zoom={5}
        minZoom={4}
        maxZoom={8}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />

        {citiesData.map((city) => {
          const cityInfo = CITIES.find((c) => c.id === city.id);
          return (
            <CircleMarker
              key={city.id}
              center={[city.lat, city.lng]}
              radius={getRadius(city.id)}
              fillColor={getPriceColor(city.price, min, max)}
              fillOpacity={0.85}
              weight={2}
              color="white"
            >
              <Tooltip>
                {city.name} — {formatPrice(city.price)}/kg
              </Tooltip>
              <Popup>
                <div className="min-w-[180px] text-sm font-sans">
                  <div className="font-bold text-base mb-1">{city.name}</div>
                  <div className="text-gray-500 text-xs mb-2">{cityInfo?.market ?? ''}</div>
                  <div className="text-lg font-bold text-gray-900">
                    {formatPrice(city.price)}
                    <span className="text-sm font-normal text-gray-500">/kg</span>
                  </div>
                  <div
                    className={`text-xs mt-1 ${
                      city.trend > 0
                        ? 'text-red-600'
                        : city.trend < 0
                          ? 'text-green-600'
                          : 'text-gray-500'
                    }`}
                  >
                    {city.trend > 0 ? '↑' : city.trend < 0 ? '↓' : '→'}{' '}
                    {Math.abs(city.trend).toFixed(1)}% (7 hari)
                  </div>
                  {city.rank === 1 && (
                    <div className="mt-2 text-xs bg-green-100 text-green-700 px-2 py-1 rounded font-medium">
                      ✅ Termurah!
                    </div>
                  )}
                  <a
                    href={`/kota/${city.id}`}
                    className="mt-2 block text-xs text-blue-600 underline"
                  >
                    Lihat detail →
                  </a>
                </div>
              </Popup>
            </CircleMarker>
          );
        })}

        {citiesData.length > 0 && (
          <MapLegend fruitNameId={fruitNameId} min={min} max={max} />
        )}
      </MapContainer>

      {/* Loading overlay */}
      {isLoading && (
        <div className="absolute inset-0 bg-white/60 flex items-center justify-center z-[1000] rounded-xl">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm text-gray-600">Memuat data...</span>
          </div>
        </div>
      )}
    </div>
  );
}
