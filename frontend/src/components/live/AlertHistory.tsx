import React from 'react';
import { Alert } from './AlertManager';

interface AlertHistoryProps {
  history: Alert[];
}

export const AlertHistory: React.FC<AlertHistoryProps> = ({ history }) => {
  return (
    <div className="alert-history-log-panel">
      <h4 className="panel-card-title" style={{ marginBottom: '0.75rem' }}>Alert Log (In-Memory)</h4>

      {history.length === 0 ? (
        <div className="empty-history-log-message">
          <p>No alerts triggered yet during this session.</p>
        </div>
      ) : (
        <div className="history-log-table-container">
          <table className="history-log-table">
            <thead>
              <tr>
                <th scope="col">Time</th>
                <th scope="col">Class</th>
                <th scope="col">Severity</th>
                <th scope="col">Conf.</th>
                <th scope="col">Dist.</th>
              </tr>
            </thead>
            <tbody>
              {history.map((alert) => {
                const isPothole = alert.class_name.toLowerCase() === 'pothole';
                const classLabel = isPothole ? 'Pothole' : 'Manhole';
                const sevLabel = alert.severity.toUpperCase();

                let colorClass = '';
                if (isPothole) {
                  if (alert.severity.toLowerCase() === 'high') colorClass = 'text-red';
                  else if (alert.severity.toLowerCase() === 'medium') colorClass = 'text-orange';
                  else colorClass = 'text-green';
                } else {
                  colorClass = 'text-blue';
                }

                return (
                  <tr key={alert.id}>
                    <td className="log-time monospace">{alert.timeLabel}</td>
                    <td className="log-class font-medium">{classLabel}</td>
                    <td className={`log-severity ${colorClass} font-bold`}>{sevLabel}</td>
                    <td className="log-confidence">{(alert.confidence * 100).toFixed(0)}%</td>
                    <td className="log-distance">≈ {alert.distance}m</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
export default AlertHistory;
