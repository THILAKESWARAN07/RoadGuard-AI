import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import type { HistoryItem } from '../../services/historyService';

interface DetectionMarkerProps {
  item: HistoryItem;
  onViewDetails: (item: HistoryItem) => void;
}

export const DetectionMarker: React.FC<DetectionMarkerProps> = ({ item, onViewDetails }) => {
  if (!item.gps || typeof item.gps !== 'object' || typeof (item.gps as any).latitude !== 'number') {
    return null;
  }
  const position: [number, number] = [(item.gps as any).latitude, (item.gps as any).longitude];
  return (
    <Marker position={position}> 
      <Popup>
        <div>
        <strong>{item.imageName ?? 'Detection'}</strong>
          <p>Severity: {item.summary.highest_severity}</p>
          <button onClick={() => onViewDetails(item)} type="button">View Details</button>
        </div>
      </Popup>
    </Marker>
  );
};
