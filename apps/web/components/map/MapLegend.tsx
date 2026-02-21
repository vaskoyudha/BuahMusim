'use client';
import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import { formatPrice } from '@buahmusim/shared';

interface MapLegendProps {
  fruitNameId: string;
  min: number;
  max: number;
}

export function MapLegend({ fruitNameId, min, max }: MapLegendProps) {
  const map = useMap();

  useEffect(() => {
    const legend = new L.Control({ position: 'bottomright' });
    legend.onAdd = () => {
      const div = L.DomUtil.create('div', '');
      div.innerHTML = `
        <div style="background:white;padding:8px 12px;border-radius:8px;box-shadow:0 1px 4px rgba(0,0,0,0.2);font-size:11px;font-family:sans-serif">
          <div style="font-weight:600;margin-bottom:4px">${fruitNameId}</div>
          <div style="display:flex;align-items:center;gap:6px;margin-bottom:2px">
            <div style="width:80px;height:10px;border-radius:4px;background:linear-gradient(to right,#22c55e,#eab308,#ef4444)"></div>
          </div>
          <div style="display:flex;justify-content:space-between;width:80px">
            <span style="color:#16a34a">Murah</span>
            <span style="color:#ef4444">Mahal</span>
          </div>
          <div style="display:flex;justify-content:space-between;width:80px;margin-top:2px;font-size:10px;color:#6b7280">
            <span>${formatPrice(min)}</span>
            <span>${formatPrice(max)}</span>
          </div>
        </div>
      `;
      return div;
    };
    legend.addTo(map);
    return () => {
      legend.remove();
    };
  }, [map, fruitNameId, min, max]);

  return null;
}
