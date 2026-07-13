import React from 'react';

export const NoMapData: React.FC = () => (
  <div className="gov-no-data" style={{ textAlign: 'center', padding: '2rem' }}>
    <p>No detection reports with GPS data are available for the selected filters.</p>
    <p>Adjust the filters or ensure detections have GPS coordinates.</p>
  </div>
);
