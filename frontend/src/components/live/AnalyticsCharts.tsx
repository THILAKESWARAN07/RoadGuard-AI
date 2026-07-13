import React from 'react';

interface Sample {
  timestamp: number;
  fps: number;
  latency: number;
  detections: number;
  hasCapture: boolean;
}

interface AnalyticsChartsProps {
  samples: Sample[];
  highCount: number;
  mediumCount: number;
  lowCount: number;
  potholes: number;
  manholes: number;
}

// Helper to render responsive SVG line chart
const SVGLineChart: React.FC<{
  samples: Sample[];
  dataKey: 'fps' | 'latency' | 'detections';
  label: string;
  color: string;
  gradientId: string;
  maxValDefault: number;
  unit: string;
}> = ({ samples, dataKey, label, color, gradientId, maxValDefault, unit }) => {
  const width = 450;
  const height = 150;
  const paddingLeft = 35;
  const paddingRight = 10;
  const paddingTop = 15;
  const paddingBottom = 20;

  const chartW = width - paddingLeft - paddingRight;
  const chartH = height - paddingTop - paddingBottom;

  if (samples.length < 2) {
    return (
      <div className="empty-chart-placeholder">
        <p>Awaiting rolling inference samples to plot live {label}...</p>
      </div>
    );
  }

  const values = samples.map((s) => s[dataKey]);
  const maxVal = Math.max(...values, maxValDefault);
  const minVal = 0;
  const valRange = maxVal - minVal || 1;

  const points = samples.map((sample, idx) => {
    const x = paddingLeft + (idx / (samples.length - 1)) * chartW;
    const y = paddingTop + (1 - (sample[dataKey] - minVal) / valRange) * chartH;
    return { x, y, hasCapture: sample.hasCapture };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return acc + `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`;
  }, '');

  const areaD =
    pathD +
    ` L ${points[points.length - 1].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)}` +
    ` L ${points[0].x.toFixed(1)} ${(paddingTop + chartH).toFixed(1)} Z`;

  return (
    <div className="svg-chart-container">
      <div className="chart-header">
        <span className="chart-title-lbl">{label}</span>
        <span className="chart-current-value font-mono" style={{ color }}>
          {values[values.length - 1].toFixed(0)} {unit}
        </span>
      </div>

      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="100%" className="svg-chart-element">
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.45" />
            <stop offset="100%" stopColor={color} stopOpacity="0.00" />
          </linearGradient>
        </defs>

        {/* Y Axis Grid Lines */}
        {[0, 0.5, 1].map((ratio, idx) => {
          const y = paddingTop + ratio * chartH;
          const gridVal = maxVal - ratio * valRange;
          return (
            <g key={idx} className="chart-grid-line-group">
              <line
                x1={paddingLeft}
                y1={y}
                x2={width - paddingRight}
                y2={y}
                stroke="rgba(255, 255, 255, 0.05)"
                strokeWidth="1"
              />
              <text
                x={paddingLeft - 6}
                y={y + 3}
                fill="rgba(234, 242, 255, 0.35)"
                fontSize="8"
                textAnchor="end"
                fontFamily="monospace"
              >
                {gridVal.toFixed(0)}
              </text>
            </g>
          );
        })}

        {/* Area Gradient */}
        <path d={areaD} fill={`url(#${gradientId})`} />

        {/* Trend Line */}
        <path d={pathD} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

        {/* Draw circles for captured nodes */}
        {points.map((p, idx) => {
          if (!p.hasCapture) return null;
          return (
            <g key={idx}>
              <title>Evidence Captured</title>
              <circle
                cx={p.x}
                cy={p.y}
                r="4.5"
                fill="#f3b63f"
                stroke="#09101a"
                strokeWidth="1.5"
              />
            </g>
          );
        })}
      </svg>
    </div>
  );
};

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  samples,
  highCount,
  mediumCount,
  lowCount,
  potholes,
  manholes,
}) => {
  const totalSeverities = highCount + mediumCount + lowCount;
  const totalClasses = potholes + manholes;

  return (
    <div className="analytics-charts-grid">
      {/* 1. FPS Rolling Trend */}
      <div className="chart-card">
        <SVGLineChart
          samples={samples}
          dataKey="fps"
          label="Inference Frame Rate"
          color="#73e19f"
          gradientId="fpsGrad"
          maxValDefault={30}
          unit="FPS"
        />
      </div>

      {/* 2. Network Latency Rolling Trend */}
      <div className="chart-card">
        <SVGLineChart
          samples={samples}
          dataKey="latency"
          label="Network Latency"
          color="#ff5252"
          gradientId="latGrad"
          maxValDefault={500}
          unit="ms"
        />
      </div>

      {/* 3. Detections count timeline */}
      <div className="chart-card">
        <SVGLineChart
          samples={samples}
          dataKey="detections"
          label="Hazards Per Frame"
          color="#00b2ff"
          gradientId="detGrad"
          maxValDefault={5}
          unit="items"
        />
      </div>

      {/* 4. Severity Distribution Rings/Bars */}
      <div className="chart-card flex-col-card">
        <h4 className="chart-card-heading">Severity Distribution</h4>
        {totalSeverities === 0 ? (
          <div className="empty-chart-placeholder">
            <p>No distresses logged in this session yet.</p>
          </div>
        ) : (
          <div className="bar-distribution-list">
            <div className="bar-item">
              <div className="bar-lbl-row">
                <span className="bar-lbl text-red">High Severity</span>
                <span className="bar-val font-semibold">{highCount} ({((highCount / totalSeverities) * 100).toFixed(0)}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-red" style={{ width: `${(highCount / totalSeverities) * 100}%` }} />
              </div>
            </div>

            <div className="bar-item">
              <div className="bar-lbl-row">
                <span className="bar-lbl text-orange">Medium Severity</span>
                <span className="bar-val font-semibold">{mediumCount} ({((mediumCount / totalSeverities) * 100).toFixed(0)}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-orange" style={{ width: `${(mediumCount / totalSeverities) * 100}%` }} />
              </div>
            </div>

            <div className="bar-item">
              <div className="bar-lbl-row">
                <span className="bar-lbl text-green">Low Severity</span>
                <span className="bar-val font-semibold">{lowCount} ({((lowCount / totalSeverities) * 100).toFixed(0)}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-green" style={{ width: `${(lowCount / totalSeverities) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 5. Pothole vs Manhole */}
      <div className="chart-card flex-col-card">
        <h4 className="chart-card-heading">Hazard Classification</h4>
        {totalClasses === 0 ? (
          <div className="empty-chart-placeholder">
            <p>Awaiting distress classifications...</p>
          </div>
        ) : (
          <div className="bar-distribution-list">
            <div className="bar-item">
              <div className="bar-lbl-row">
                <span className="bar-lbl text-red font-semibold">Potholes</span>
                <span className="bar-val">{potholes} ({((potholes / totalClasses) * 100).toFixed(0)}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-red" style={{ width: `${(potholes / totalClasses) * 100}%` }} />
              </div>
            </div>

            <div className="bar-item">
              <div className="bar-lbl-row">
                <span className="bar-lbl text-blue font-semibold">Manholes</span>
                <span className="bar-val">{manholes} ({((manholes / totalClasses) * 100).toFixed(0)}%)</span>
              </div>
              <div className="bar-track">
                <div className="bar-fill bg-blue" style={{ width: `${(manholes / totalClasses) * 100}%` }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
export default AnalyticsCharts;
