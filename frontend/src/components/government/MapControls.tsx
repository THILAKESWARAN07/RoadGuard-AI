import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import type { HistoryItem } from '../../services/historyService';
import L from 'leaflet';

interface MapControlsProps {
  markers: HistoryItem[];
}

export const MapControls: React.FC<MapControlsProps> = ({ markers }) => {
  const map = useMap();

  // Fit map bounds to all marker positions when markers change
  useEffect(() => {
    const positions = markers
      .filter((m) => m.gps && typeof (m.gps as any).latitude === 'number')
      .map((m) => [(m.gps as any).latitude, (m.gps as any).longitude] as [number, number]);
    if (positions.length === 0) return;
    const bounds = L.latLngBounds(positions as any);
    map.fitBounds(bounds, { padding: [50, 50] });
  }, [markers, map]);

  return null; // No UI, just map effects
};
