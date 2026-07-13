import { type FormEvent, useEffect, useRef, useState } from 'react';

import { config } from './config';
import { API_ENDPOINTS } from './constants';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { AIDetectionPage } from './pages/AIDetectionPage';
import { GovernmentMap } from './components/government/GovernmentMap';
import { HistoryPage } from './components/history/HistoryPage';
import { LiveDetectionPage } from './pages/LiveDetectionPage';
import { GovernmentDashboard } from './components/government/GovernmentDashboard';
import { InlineDetectionPanel } from './components/ai/InlineDetectionPanel';
import { compressImage } from './services/historyService';
import type { AlertItem, Detection, Report, Role, RouteRecommendation, Summary } from './types';

const roleLabels: Record<Role, string> = {
  driver: 'Driver',
  government: 'Government',
  admin: 'Admin',
};

const roleDescriptions: Record<Role, string> = {
  driver: 'Hazards, alerts, safer routes, and citizen reporting.',
  government: 'Priority ranking, repair workflows, and live road status.',
  admin: 'System oversight, user management, and verification controls.',
};



const defaultReportForm = {
  latitude: config.defaultLatitude.toString(),
  longitude: config.defaultLongitude.toString(),
  description: '',
  imageUrl: '',
};

function Dashboard() {
  const { user, accessToken, logout, isAuthenticated } = useAuth();
  const [activeRole, setActiveRole] = useState<Role>('driver');
  const [healthStatus, setHealthStatus] = useState('Checking...');
  const [summary, setSummary] = useState<Summary | null>(null);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [routes, setRoutes] = useState<RouteRecommendation[]>([]);
  const [isSubmittingDetection, setIsSubmittingDetection] = useState(false);
  const [isSubmittingReport, setIsSubmittingReport] = useState(false);
  const [repairId, setRepairId] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [reportForm, setReportForm] = useState(defaultReportForm);
  const [selectedDetectionId, setSelectedDetectionId] = useState<number | null>(null);
  const spokenAlertKeys = useRef(new Set<string>());

  const getAuthHeaders = () => {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  };

  const refreshData = async () => {
    try {
      const [healthResponse, summaryResponse, detectionsResponse, reportsResponse, routesResponse, alertsResponse] = await Promise.all([
        fetch(`${config.apiBaseUrl}${API_ENDPOINTS.HEALTH}`),
        fetch(`${config.apiBaseUrl}${API_ENDPOINTS.DASHBOARD_SUMMARY}`, { headers: getAuthHeaders() }),
        fetch(`${config.apiBaseUrl}${API_ENDPOINTS.DETECTIONS}`, { headers: getAuthHeaders() }),
        fetch(`${config.apiBaseUrl}${API_ENDPOINTS.REPORTS}`, { headers: getAuthHeaders() }),
        fetch(`${config.apiBaseUrl}${API_ENDPOINTS.ROUTE_RECOMMENDATIONS}`, { headers: getAuthHeaders() }),
        fetch(`${config.apiBaseUrl}${API_ENDPOINTS.ACTIVE_ALERTS}`, { headers: getAuthHeaders() }),
      ]);

      const healthData = await healthResponse.json();
      const summaryData = await summaryResponse.json();
      const detectionData = await detectionsResponse.json();
      const reportsData = await reportsResponse.json();
      const routesData = await routesResponse.json();
      const alertsData = await alertsResponse.json();

      setHealthStatus(healthData.status ?? 'unknown');
      setSummary(summaryData);
      setDetections(Array.isArray(detectionData) ? detectionData : []);
      setReports(Array.isArray(reportsData) ? reportsData : []);
      setRoutes(Array.isArray(routesData) ? routesData : []);
      setAlerts(Array.isArray(alertsData) ? alertsData : []);
    } catch {
      setHealthStatus('offline');
      setSummary(null);
      setDetections([]);
      setReports([]);
      setAlerts([]);
      setRoutes([]);
    }
  };

  useEffect(() => {
    void refreshData();
  }, []);

  useEffect(() => {
    if (detections.length === 0) {
      setSelectedDetectionId(null);
      return;
    }

    if (!selectedDetectionId || !detections.some((detection) => detection.id === selectedDetectionId)) {
      setSelectedDetectionId(detections[0].id);
    }
  }, [detections, selectedDetectionId]);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      void refreshData();
    }, 20000);

    return () => window.clearInterval(intervalId);
  }, []);

  useEffect(() => {
    const speakAlert = (alert: AlertItem) => {
      const alertKey = `${alert.id}:${alert.created_at}`;
      if (spokenAlertKeys.current.has(alertKey)) {
        return;
      }

      spokenAlertKeys.current.add(alertKey);

      try {
        const AudioContextClass = window.AudioContext || (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          const context = new AudioContextClass();
          const oscillator = context.createOscillator();
          const gainNode = context.createGain();

          oscillator.type = 'sine';
          oscillator.frequency.value = alert.severity === 'critical' ? 920 : 660;
          gainNode.gain.value = 0.04;

          oscillator.connect(gainNode);
          gainNode.connect(context.destination);
          oscillator.start();
          oscillator.stop(context.currentTime + 0.25);
        }
      } catch {
        // Ignore browsers that block audio until a user gesture occurs.
      }
    };

    alerts.forEach(speakAlert);
  }, [alerts]);

  const submitSampleDetection = async () => {
    setIsSubmittingDetection(true);
    setStatusMessage('Submitting sample detection...');
    try {
      await fetch(`${config.apiBaseUrl}${API_ENDPOINTS.DETECTIONS}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          hazard_type: 'pothole',
          latitude: config.defaultLatitude,
          longitude: config.defaultLongitude,
          confidence: 0.94,
          image_url: 'sample-road-image.jpg',
        }),
      });

      setStatusMessage('Detection stored and checked for duplicates.');
      await refreshData();
    } finally {
      setIsSubmittingDetection(false);
    }
  };

  const submitCitizenReport = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmittingReport(true);
    setStatusMessage('Submitting citizen report...');
    try {
      await fetch(`${config.apiBaseUrl}${API_ENDPOINTS.REPORTS}`, {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify({
          latitude: Number.parseFloat(reportForm.latitude),
          longitude: Number.parseFloat(reportForm.longitude),
          description: reportForm.description || null,
          image_url: reportForm.imageUrl || null,
          confidence: 0.82,
        }),
      });
      setReportForm(defaultReportForm);
      setStatusMessage('Citizen report saved and merged if it matched an existing pothole.');
      await refreshData();
    } finally {
      setIsSubmittingReport(false);
    }
  };

  const markAsRepaired = async () => {
    if (!repairId) {
      setStatusMessage('Enter a pothole ID to verify repair.');
      return;
    }

    setStatusMessage(`Marking pothole ${repairId} as repaired...`);
    await fetch(`${config.apiBaseUrl}${API_ENDPOINTS.REPAIR_DETECTION(Number(repairId))}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: 'repaired' }),
    });
    setRepairId('');
    setStatusMessage('Repair verified and live map updated.');
    await refreshData();
  };

  const hazardStats = [
    { label: 'Live detections', value: summary?.total_detections ?? detections.length },
    { label: 'Open hazards', value: summary?.open_detections ?? detections.filter((item) => item.status !== 'repaired').length },
    { label: 'Critical roads', value: summary?.critical_roads ?? detections.filter((item) => item.risk_score >= 80).length },
    { label: 'Safety score', value: summary?.safety_score ?? 'N/A' },
  ];

  const recentDetections = summary?.recent_detections ?? detections.slice(-4).reverse();
  const recentReports = reports.slice(-5).reverse();
  const activeAlerts = alerts.slice().reverse();
  const criticalRoads = detections.filter((item) => item.risk_score >= 80);
  const repairedRoads = detections.filter((item) => item.status === 'repaired');
  const selectedDetection = detections.find((item) => item.id === selectedDetectionId) ?? detections[0] ?? null;

  const mapDetections = detections.length > 0 ? detections : recentDetections;
  const latitudes = mapDetections.map((item) => item.latitude);
  const longitudes = mapDetections.map((item) => item.longitude);
  const minLatitude = Math.min(...latitudes);
  const maxLatitude = Math.max(...latitudes);
  const minLongitude = Math.min(...longitudes);
  const maxLongitude = Math.max(...longitudes);

  const mapMarkers = mapDetections.map((item, index) => {
    const latitudeRange = maxLatitude - minLatitude || 0.01;
    const longitudeRange = maxLongitude - minLongitude || 0.01;
    const top = 12 + ((maxLatitude - item.latitude) / latitudeRange) * 72;
    const left = 12 + ((item.longitude - minLongitude) / longitudeRange) * 72;

    return {
      detection: item,
      top,
      left,
      label: index + 1,
    };
  });

  return (
    <main className="app-shell">
      <div className="dashboard-page-header" style={{ marginBottom: '2rem' }}>
        <h1>Safety Dashboard</h1>
        <p style={{ color: '#b8c7da', margin: '0.5rem 0 0 0' }}>Real-time road status, hazards, repairs, and route recommendations.</p>
      </div>
      <section className="hero">
        <div className="hero-copy">
          <p className="eyebrow">RoadGuard AI</p>
          <h1>AI road intelligence for safer driving, smarter repairs, and live hazard reporting.</h1>
          <p className="hero-text">
            Detect potholes, pedestrians, and animals in real time. Verify reports, remove duplicates,
            score road risk, and recommend safer routes for drivers, officials, and admins.
          </p>
          <div className="role-tabs">
            {(Object.keys(roleLabels) as Role[]).map((role) => (
              <button
                key={role}
                className={role === activeRole ? 'role-tab active' : 'role-tab secondary'}
                onClick={() => setActiveRole(role)}
              >
                {roleLabels[role]}
              </button>
            ))}
          </div>
          <p className="role-description">{roleDescriptions[activeRole]}</p>
          <div className="hero-actions">
            <button onClick={submitSampleDetection} disabled={isSubmittingDetection}>
              {isSubmittingDetection ? 'Submitting...' : 'Submit Sample Detection'}
            </button>
            <button className="secondary" onClick={refreshData}>
              Refresh Live Data
            </button>
          </div>
        </div>

        <div className="hero-panel">
          <div className="panel-header">
            <span>Live safety snapshot</span>
            <span className="status-pill">{healthStatus}</span>
          </div>
          <div className="stats-grid">
            {hazardStats.map((stat) => (
              <article key={stat.label}>
                <span>{stat.label}</span>
                <strong>{stat.value}</strong>
              </article>
            ))}
          </div>
          <div className="panel-footer">
            <span>{summary?.repaired_roads ?? repairedRoads.length} repaired roads</span>
            <span>{activeAlerts.length} active alerts</span>
          </div>
        </div>
      </section>

      <section className="dashboard-grid">
        <article className="card map-card">
          <div className="section-heading">
            <h2>Live Road Map</h2>
            <span>{detections.length} markers</span>
          </div>
          <div className="map-shell">
            <div className="map-board">
              {mapDetections.length === 0 ? (
              <p>No road hazards stored yet.</p>
              ) : (
                <>
                  <div className="map-grid" />
                  {mapMarkers.map(({ detection, top, left, label }) => (
                    <button
                      key={detection.id}
                      type="button"
                      className={`map-marker marker-${detection.status === 'repaired' ? 'repaired' : detection.severity}`}
                      style={{ top: `${top}%`, left: `${left}%` }}
                      onClick={() => setSelectedDetectionId(detection.id)}
                    >
                      <span className="marker-label">{label}</span>
                      <strong>{detection.severity[0].toUpperCase()}</strong>
                    </button>
                  ))}
                </>
              )}
            </div>
            <div className="map-detail">
              {selectedDetection ? (
                <>
                  <p className="eyebrow">Selected marker</p>
                  <h3>{selectedDetection.severity} {selectedDetection.hazard_type}</h3>
                  <p>
                    Risk {selectedDetection.risk_score} · Count {selectedDetection.detection_count} · {selectedDetection.status}
                  </p>
                  <p>
                    {selectedDetection.latitude.toFixed(4)}, {selectedDetection.longitude.toFixed(4)}
                  </p>
                  <p>
                    Detected {new Date(selectedDetection.detected_at).toLocaleString()}
                  </p>
                  <button className="secondary map-detail-button" type="button" onClick={() => setRepairId(String(selectedDetection.id))}>
                    Queue repair #{selectedDetection.id}
                  </button>
                </>
              ) : (
                <p>Select a marker to inspect the hazard.</p>
              )}
            </div>
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <h2>Driver dashboard</h2>
            <span>Safety {summary?.safety_score ?? 0}/100</span>
          </div>
          <div className="route-list">
            {routes.length === 0 ? (
              <p>Route recommendations will appear here.</p>
            ) : (
              routes.map((route) => (
                <div key={route.name} className="route-item">
                  <div>
                    <strong>{route.name}</strong>
                    <p>{route.distance_km} km · {route.estimated_time_min} min · {route.pothole_count} potholes</p>
                  </div>
                  <div className="route-meta">
                    <span>Score {route.road_score}</span>
                    <small>{route.recommendation}</small>
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card alert-card">
          <div className="section-heading">
            <h2>Real-time alerts</h2>
            <span>{activeAlerts.length} live</span>
          </div>
          <div className="mini-list">
            {activeAlerts.length === 0 ? (
              <p>No active alerts right now.</p>
            ) : (
              activeAlerts.map((alert) => (
                <div key={`${alert.id}-${alert.created_at}`} className={`mini-item alert-${alert.severity}`}>
                  <strong>{alert.title}</strong>
                  <p>{alert.message}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <h2>Citizen reporting</h2>
            <span>AI verified</span>
          </div>
          <form className="form-grid" onSubmit={submitCitizenReport}>
            <label className="field">
              <span>Latitude</span>
              <input
                className="input"
                value={reportForm.latitude}
                onChange={(event) => setReportForm({ ...reportForm, latitude: event.target.value })}
              />
            </label>
            <label className="field">
              <span>Longitude</span>
              <input
                className="input"
                value={reportForm.longitude}
                onChange={(event) => setReportForm({ ...reportForm, longitude: event.target.value })}
              />
            </label>
            <label className="field field-wide">
              <span>Description</span>
              <textarea
                className="input"
                rows={3}
                value={reportForm.description}
                onChange={(event) => setReportForm({ ...reportForm, description: event.target.value })}
              />
            </label>
            <label className="field field-wide">
              <span>Image URL</span>
              <input
                className="input"
                value={reportForm.imageUrl}
                onChange={(event) => setReportForm({ ...reportForm, imageUrl: event.target.value })}
              />
            </label>
            {/* Citizen: optional AI analysis before submit */}
            <div className="field field-wide citizen-ai-panel">
              <InlineDetectionPanel
                title="📷 Upload & Analyze Image"
                detectLabel="Analyze for Road Damage"
                defaultCollapsed={true}
                onFileSelected={async (file) => {
                  if (file) {
                    try {
                      const compressed = await compressImage(file);
                      setReportForm((prev) => ({ ...prev, imageUrl: compressed }));
                    } catch (err) {
                      console.error('Failed to compress image:', err);
                    }
                  } else {
                    setReportForm((prev) => ({ ...prev, imageUrl: '' }));
                  }
                }}
              />
            </div>
            <button type="submit" disabled={isSubmittingReport}>
              {isSubmittingReport ? 'Saving...' : 'Submit Citizen Report'}
            </button>
          </form>
          <div className="mini-list">
            {recentReports.length === 0 ? (
              <p>No reports yet.</p>
            ) : (
              recentReports.map((report) => (
                <div key={report.id} className="mini-item">
                  <strong>{report.severity} road hazard #{report.id}</strong>
                  <p>{report.description ?? 'No description provided'}</p>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="card accent">
          <div className="section-heading">
            <h2>Government workflow</h2>
            <span>Priority queue</span>
          </div>
          <div className="mini-list">
            {criticalRoads.length === 0 ? (
              <p>No critical roads at the moment.</p>
            ) : (
              criticalRoads.map((road) => (
                <div key={road.id} className="mini-item">
                  <strong>Road #{road.id} • Risk {road.risk_score}</strong>
                  <p>{road.detection_count} detections · {road.status}</p>
                </div>
              ))
            )}
          </div>
          <div className="repair-row">
            <input
              className="input"
              placeholder="Repair verification ID"
              value={repairId}
              onChange={(event) => setRepairId(event.target.value)}
            />
            <button onClick={markAsRepaired}>Mark Repaired</button>
          </div>
        </article>

        <article className="card">
          <div className="section-heading">
            <h2>Admin overview</h2>
            <span>System logs</span>
          </div>
          <ul className="admin-list">
            <li>Total detections: {summary?.total_detections ?? detections.length}</li>
            <li>Open hazards: {summary?.open_detections ?? detections.filter((item) => item.status !== 'repaired').length}</li>
            <li>Verified repairs: {summary?.repaired_roads ?? repairedRoads.length}</li>
            <li>Backend: {healthStatus}</li>
          </ul>
        </article>

        {/* Driver AI Image Analysis Card */}
        <article className="card">
          <InlineDetectionPanel
            title="🔍 Analyze Road Image"
            detectLabel="Detect Road Damage"
            defaultCollapsed={true}
          />
        </article>
      </section>

      <section className="content-grid secondary-grid">
        <article className="card">
          <h2>Repair workflow</h2>
          <ol>
            <li>Citizen or vehicle reports a pothole</li>
            <li>AI verifies and deduplicates the image and GPS location</li>
            <li>Risk score updates the government queue</li>
            <li>Repair is assigned and verified after completion</li>
            <li>Road status updates to repaired on the live map</li>
          </ol>
        </article>

        <article className="card">
          <h2>Road intelligence signals</h2>
          <div className="signal-stack">
            <div>
              <strong>Pedestrian detection</strong>
              <p>COCO-based hazard alerting for driver protection.</p>
            </div>
            <div>
              <strong>Animal detection</strong>
              <p>Detect cows, dogs, goats, horses, sheep, and elephants.</p>
            </div>
            <div>
              <strong>Alert throttling</strong>
              <p>Prevents repeated notifications and alert fatigue.</p>
            </div>
          </div>
        </article>

        <article className="card accent">
          <h2>Status</h2>
          <p>{statusMessage || 'Ready for live hazard reporting and repair verification.'}</p>
        </article>
      </section>
    </main>
  );
}

function App() {
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'main'>('login');
  const [activeTab, setActiveTab] = useState<'dashboard' | 'detect' | 'history' | 'live' | 'government' | 'map'>('dashboard');
  const { isAuthenticated, isLoading, user, logout } = useAuth();

  useEffect(() => {
    if (isAuthenticated) {
      setCurrentView('main');
    } else if (!isLoading) {
      setCurrentView('login');
    }
  }, [isAuthenticated, isLoading]);

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  if (currentView === 'login') {
    return <LoginPage onRegisterClick={() => setCurrentView('register')} />;
  }

  if (currentView === 'register') {
    return <RegisterPage onLoginClick={() => setCurrentView('login')} />;
  }

  // Main authenticated layout
  return (
    <div className="authenticated-layout-shell">
      <header className="app-header">
        <div className="header-content">
          <div className="header-brand-nav-group">
            <div className="brand-label-container">
              <span className="eyebrow brand-eyebrow">RoadGuard AI</span>
              <span className="brand-subtext">Intelligence Platform</span>
            </div>
            <nav className="main-nav">
              <button
                className={`nav-link ${activeTab === 'dashboard' ? 'active' : ''}`}
                onClick={() => setActiveTab('dashboard')}
                type="button"
              >
                Dashboard
              </button>
              <button
                className={`nav-link ${activeTab === 'detect' ? 'active' : ''}`}
                onClick={() => setActiveTab('detect')}
                type="button"
              >
                AI Detection
              </button>
              <button
                className={`nav-link ${activeTab === 'live' ? 'active' : ''}`}
                onClick={() => setActiveTab('live')}
                type="button"
              >
                Live Camera
              </button>
              <button
                className={`nav-link ${activeTab === 'history' ? 'active' : ''}`}
                onClick={() => setActiveTab('history')}
                type="button"
              >
                History & Reports
              </button>
              {(user?.role === 'government' || user?.role === 'admin') && (
                <button
                  className={`nav-link ${activeTab === 'government' ? 'active' : ''}`}
                  onClick={() => setActiveTab('government')}
                  type="button"
                >
                  🏛 Gov Portal
                </button>
              )}
              {(user?.role === 'government' || user?.role === 'admin') && (
                <button
                  className={`nav-link ${activeTab === 'map' ? 'active' : ''}`}
                  onClick={() => setActiveTab('map')}
                  type="button"
                >
                  🗺 Map
                </button>
              )}
            </nav>
          </div>
          <div className="user-info">
            {user && (
              <>
                <span className="user-email-text">{user.email}</span>
                <span className="role-badge">{user.role}</span>
                <button onClick={logout} className="logout-button" type="button">
                  Logout
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="app-content-view">
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'detect' && <AIDetectionPage />}
        {activeTab === 'live' && <LiveDetectionPage />}
        {activeTab === 'history' && <HistoryPage />}
        {activeTab === 'government' && <GovernmentDashboard />}
        {activeTab === 'map' && <GovernmentMap />}
      </div>
    </div>
  );
}

export default App;
