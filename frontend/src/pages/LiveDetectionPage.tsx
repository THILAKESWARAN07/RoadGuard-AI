import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CameraView } from '../components/live/CameraView';
import { CameraControls } from '../components/live/CameraControls';
import { PermissionDialog } from '../components/live/PermissionDialog';
import { CameraStatusType } from '../components/live/CameraStatus';

// Real-Time Detection Components
import { DetectionScheduler } from '../components/live/DetectionScheduler';
import { FPSCounter } from '../components/live/FPSCounter';
import { InferenceStatus } from '../components/live/InferenceStatus';
import { LiveDetectionOverlay } from '../components/live/LiveDetectionOverlay';
import { config } from '../config';

// Driver Alert System Components
import { DriverAlert } from '../components/live/DriverAlert';
import { WarningBanner } from '../components/live/WarningBanner';
import { AlertHistory } from '../components/live/AlertHistory';
import {
  Alert,
  getAlertPriority,
  estimateDistance,
  isDuplicateAlert,
  playAlertSound,
} from '../components/live/AlertManager';

// Voice Assistant Components
import { VoiceAssistant } from '../components/live/VoiceAssistant';
import { SpeechQueue, VoiceSettingsData } from '../components/live/SpeechQueue';

// Auto Capture & GPS Logging Components
import { AutoCapture } from '../components/live/AutoCapture';
import { LocationService, LocationData, GPSStatusType } from '../components/live/LocationService';
import { CaptureSettingsData } from '../components/live/CaptureSettings';
import { historyService } from '../services/historyService';

// Live Analytics Components
import { LiveAnalytics } from '../components/live/LiveAnalytics';
import { SessionMetricsData } from '../components/live/AnalyticsCards';
import { SessionEvent } from '../components/live/PerformancePanel';

interface TrackInfo {
  label: string;
  width: number;
  height: number;
  frameRate: number;
  facingMode: string;
}

interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  severity: string;
  bbox: {
    x1: number;
    y1: number;
    x2: number;
    y2: number;
    width: number;
    height: number;
  };
  area: number;
}

interface Sample {
  timestamp: number;
  fps: number;
  latency: number;
  detections: number;
  hasCapture: boolean;
}

// Rolling FPS calculator utility
class FPSHelper {
  private frameTimes: number[] = [];
  private totalFrames = 0;
  private startTime = 0;

  public reset() {
    this.frameTimes = [];
    this.totalFrames = 0;
    this.startTime = performance.now();
  }

  public tick() {
    const now = performance.now();
    if (this.totalFrames === 0) {
      this.startTime = now;
    }
    this.totalFrames++;
    this.frameTimes.push(now);

    if (this.frameTimes.length > 10) {
      this.frameTimes.shift();
    }
  }

  public getCurrentFPS(): number {
    if (this.frameTimes.length < 2) return 0;
    const oldest = this.frameTimes[0];
    const newest = this.frameTimes[this.frameTimes.length - 1];
    const durationSec = (newest - oldest) / 1000;
    return durationSec > 0 ? (this.frameTimes.length - 1) / durationSec : 0;
  }

  public getAverageFPS(): number {
    if (this.totalFrames < 2) return 0;
    const durationSec = (performance.now() - this.startTime) / 1000;
    return durationSec > 0 ? (this.totalFrames - 1) / durationSec : 0;
  }
}

// Default config values for voice settings
const DEFAULT_VOICE_SETTINGS: VoiceSettingsData = {
  enabled: false,
  rate: 1.0,
  volume: 1.0,
  voiceURI: '',
  lang: 'en-US',
};

const loadVoiceSettings = (): VoiceSettingsData => {
  try {
    const cached = localStorage.getItem('roadguard_voice_settings');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Error loading voice settings:', err);
  }
  return DEFAULT_VOICE_SETTINGS;
};

// Default config values for capture settings
const DEFAULT_CAPTURE_SETTINGS: CaptureSettingsData = {
  autoCapture: false,
  gpsLogging: false,
  cooldownSeconds: 10,
  minConfidence: 0.60,
};

const loadCaptureSettings = (): CaptureSettingsData => {
  try {
    const cached = localStorage.getItem('roadguard_capture_settings');
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Error loading capture settings:', err);
  }
  return DEFAULT_CAPTURE_SETTINGS;
};

const DEFAULT_METRICS: SessionMetricsData = {
  startTime: 0,
  framesProcessed: 0,
  successfulRequests: 0,
  failedRequests: 0,
  totalLatency: 0,
  totalInferenceTime: 0,
  totalDetections: 0,
  highSeverityCount: 0,
  mediumSeverityCount: 0,
  lowSeverityCount: 0,
  potholesCount: 0,
  manholesCount: 0,
  autoCaptures: 0,
  manualCaptures: 0,
  voiceAnnouncements: 0,
  driverAlerts: 0,
  gpsCapturesCount: 0,
  averageConfidenceSum: 0,
  maxConfidence: 0,
  minConfidence: 1.0,
};

// Formulates the exact warning phrase based on class and severity rules
const getSpeechText = (class_name: string, severity: string): string => {
  const isPothole = class_name.toLowerCase() === 'pothole';
  const isManhole = class_name.toLowerCase() === 'manhole';

  if (isPothole) {
    switch (severity.toLowerCase()) {
      case 'high':
        return 'Warning. High severity pothole ahead. Reduce speed.';
      case 'medium':
        return 'Road damage ahead. Drive carefully.';
      default:
        return 'Minor road damage detected.';
    }
  }
  if (isManhole) {
    return 'Manhole ahead.';
  }
  return '';
};

export const LiveDetectionPage: React.FC = () => {
  // Page Tab Controller
  const [activeTab, setActiveTab] = useState<'camera' | 'analytics'>('camera');

  // Camera States
  const [status, setStatus] = useState<CameraStatusType>('off');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [activeDeviceId, setActiveDeviceId] = useState<string>('');

  // Settings States
  const [resolution, setResolution] = useState<string>('1280x720');
  const [frameRate, setFrameRate] = useState<number>(30);
  const [isMirrored, setIsMirrored] = useState<boolean>(false);

  // Metadata Display State
  const [activeTrackInfo, setActiveTrackInfo] = useState<TrackInfo | null>(null);

  // Error Modals State
  const [isErrorDialogOpen, setIsErrorDialogOpen] = useState<boolean>(false);

  // Real-Time Inference States
  const [detections, setDetections] = useState<Detection[]>([]);
  const [inferenceStatus, setInferenceStatus] = useState<'idle' | 'detecting' | 'error' | 'waiting'>('waiting');
  const [consecutiveFailures, setConsecutiveFailures] = useState<number>(0);
  const [currentFps, setCurrentFps] = useState<number>(0);
  const [averageFps, setAverageFps] = useState<number>(0);
  const [inferenceTime, setInferenceTime] = useState<number>(0);
  const [latency, setLatency] = useState<number>(0);
  const [lastUpdateTime, setLastUpdateTime] = useState<number>(0);

  // Driver Alert States
  const [alertThreshold, setAlertThreshold] = useState<number>(0.60);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [activeAlert, setActiveAlert] = useState<Alert | null>(null);
  const [isWarningVisible, setIsWarningVisible] = useState<boolean>(false);
  const [alertHistory, setAlertHistory] = useState<Alert[]>([]);

  // Voice Assistant States
  const [voiceSettings, setVoiceSettings] = useState<VoiceSettingsData>(loadVoiceSettings());
  const [speechStatus, setSpeechStatus] = useState<'muted' | 'idle' | 'speaking'>('muted');
  const [currentSpokenText, setCurrentSpokenText] = useState<string>('');

  // Auto Capture & GPS Logging States
  const [captureSettings, setCaptureSettings] = useState<CaptureSettingsData>(loadCaptureSettings());
  const [gpsStatus, setGpsStatus] = useState<GPSStatusType>('off');
  const [gpsLocation, setGpsLocation] = useState<LocationData | null>(null);
  const [sessionCaptureCount, setSessionCaptureCount] = useState<number>(0);
  const [sessionId, setSessionId] = useState<string>('');
  const [showCaptureToast, setShowCaptureToast] = useState<boolean>(false);
  const [capturedToastReason, setCapturedToastReason] = useState<string>('');

  // Session Analytics States
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetricsData>(DEFAULT_METRICS);
  const [sessionEvents, setSessionEvents] = useState<SessionEvent[]>([]);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [sessionDuration, setSessionDuration] = useState<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const retryCountRef = useRef<number>(0);
  const reconnectTimerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Scheduler & FPS Refs
  const schedulerRef = useRef<DetectionScheduler | null>(null);
  const fpsHelperRef = useRef<FPSHelper>(new FPSHelper());

  // Driver Alert Refs
  const activeAlertRef = useRef<Alert | null>(null);
  const isWarningVisibleRef = useRef<boolean>(false);
  const isMutedRef = useRef<boolean>(false);
  const recentAlertsRef = useRef<Alert[]>([]);
  const hideTimeoutRef = useRef<number | null>(null);

  // Voice Assistant Refs
  const speechQueueRef = useRef<SpeechQueue | null>(null);

  // Auto Capture Refs
  const locationServiceRef = useRef<LocationService>(new LocationService());
  const recentCapturesRef = useRef<Array<{ timestamp: number; class_name: string; severity: string; x_center: number }>>([]);
  const toastTimeoutRef = useRef<number | null>(null);

  // Duration timer ticker effect
  useEffect(() => {
    let intervalId: number | null = null;
    if (status === 'streaming') {
      intervalId = window.setInterval(() => {
        setSessionDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setSessionDuration(0);
    }
    return () => {
      if (intervalId) {
        window.clearInterval(intervalId);
      }
    };
  }, [status]);

  // Sync mute state to ref
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Initialize Speech Queue once on mount
  useEffect(() => {
    const queue = new SpeechQueue(voiceSettings, (status, text) => {
      setSpeechStatus(status);
      setCurrentSpokenText(text || '');
    });
    speechQueueRef.current = queue;

    return () => {
      queue.clear();
      speechQueueRef.current = null;
      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  // Update Speech Queue constraints whenever settings state updates
  useEffect(() => {
    if (speechQueueRef.current) {
      speechQueueRef.current.updateSettings(voiceSettings);
    }
    try {
      localStorage.setItem('roadguard_voice_settings', JSON.stringify(voiceSettings));
    } catch (err) {
      console.error('Error writing voice settings to cache:', err);
    }
  }, [voiceSettings]);

  // Sync Auto Capture settings to LocalStorage
  useEffect(() => {
    try {
      localStorage.setItem('roadguard_capture_settings', JSON.stringify(captureSettings));
    } catch (err) {
      console.error('Error writing capture settings to cache:', err);
    }
  }, [captureSettings]);

  // Sync Geolocation watch status with active stream and logging toggles
  useEffect(() => {
    if (status === 'streaming' && captureSettings.gpsLogging) {
      console.log('GPS Geotagging enabled. Watching satellite coordinates...');
      locationServiceRef.current.startTracking((newGpsStatus, loc) => {
        const prevStatus = gpsStatus;
        setGpsStatus(newGpsStatus);
        setGpsLocation(loc);

        // Geolocation locked event
        if (newGpsStatus === 'found' && prevStatus !== 'found' && loc) {
          const nowStr = new Date().toTimeString().split(' ')[0];
          const lockEvent: SessionEvent = {
            timestamp: nowStr,
            type: 'gps_lock',
            message: `📡 GPS satellite lock acquired (Precision: ±${loc.accuracy.toFixed(1)}m).`,
          };
          setSessionEvents((prev) => [lockEvent, ...prev]);
        }
      });
    } else {
      locationServiceRef.current.stopTracking();
      setGpsStatus('off');
      setGpsLocation(null);
    }

    return () => {
      locationServiceRef.current.stopTracking();
    };
  }, [status, captureSettings.gpsLogging]);

  // Fetch input webcam devices list
  const enumerateDevices = useCallback(async () => {
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      setStatus('unsupported');
      return;
    }
    try {
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((device) => device.kind === 'videoinput');
      setDevices(videoDevices);

      if (videoDevices.length > 0 && !activeDeviceId) {
        setActiveDeviceId(videoDevices[0].deviceId);
      }
    } catch (err) {
      console.error('Error enumerating input devices:', err);
    }
  }, [activeDeviceId]);

  useEffect(() => {
    void enumerateDevices();
    return () => {
      cleanupStream();
    };
  }, [enumerateDevices]);

  // Clean stream active tracks
  const cleanupStream = () => {
    if (reconnectTimerRef.current) {
      window.clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }

    if (hideTimeoutRef.current) {
      window.clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }

    const currentStream = streamRef.current;
    if (currentStream) {
      currentStream.getTracks().forEach((track) => {
        track.onended = null;
        track.stop();
      });
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    streamRef.current = null;
    setStream(null);
    setActiveTrackInfo(null);
  };

  const getFacingLabel = (facingMode?: string, label?: string) => {
    if (facingMode) {
      return facingMode === 'user' ? 'Front Camera' : 'Rear Camera';
    }
    if (label) {
      const lower = label.toLowerCase();
      if (lower.includes('front') || lower.includes('user') || lower.includes('face')) {
        return 'Front Camera';
      }
      if (lower.includes('back') || lower.includes('rear') || lower.includes('environment')) {
        return 'Rear / Environment Camera';
      }
    }
    return 'Default Webcam';
  };

  // Re-initialization stream connection
  const initializeStream = async () => {
    setStatus('connecting');
    cleanupStream();

    const [reqWidth, reqHeight] = resolution.split('x').map(Number);
    const constraints: MediaStreamConstraints = {
      video: {
        deviceId: activeDeviceId ? { exact: activeDeviceId } : undefined,
        width: { ideal: reqWidth },
        height: { ideal: reqHeight },
        frameRate: { ideal: frameRate },
      },
      audio: false,
    };

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      streamRef.current = mediaStream;

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        setActiveTrackInfo({
          label: track.label || 'Unknown Camera',
          width: settings.width || reqWidth,
          height: settings.height || reqHeight,
          frameRate: settings.frameRate || frameRate,
          facingMode: getFacingLabel(settings.facingMode, track.label),
        });

        track.onended = () => {
          console.warn('Media track ended unexpectedly. Retrying reconnect...');
          handleReconnect();
        };
      }

      setStatus('streaming');
      retryCountRef.current = 0;
      void enumerateDevices();
    } catch (err) {
      handleStreamError(err);
    }
  };

  const handleStreamError = (error: any) => {
    cleanupStream();
    console.error('Camera initialization failed:', error);

    let errStatus: CameraStatusType = 'error';
    const errName = error.name || '';

    if (errName === 'NotAllowedError' || errName === 'PermissionDeniedError') {
      errStatus = 'permission-denied';
    } else if (errName === 'NotFoundError' || errName === 'DevicesNotFoundError') {
      errStatus = 'device-not-found';
    } else if (errName === 'NotReadableError' || errName === 'TrackStartError') {
      errStatus = 'device-busy';
    } else if (errName === 'OverconstrainedError') {
      console.warn('Overconstrained resolution/fps request, falling back to default constraints...');
      void retryFallbackStream();
      return;
    }

    setStatus(errStatus);
    setIsErrorDialogOpen(true);
  };

  const retryFallbackStream = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      const track = mediaStream.getVideoTracks()[0];
      if (track) {
        const settings = track.getSettings();
        setActiveTrackInfo({
          label: track.label || 'Fallback Webcam',
          width: settings.width || 640,
          height: settings.height || 480,
          frameRate: settings.frameRate || 30,
          facingMode: getFacingLabel(settings.facingMode, track.label),
        });
        track.onended = () => handleReconnect();
      }
      setStatus('streaming');
      retryCountRef.current = 0;
    } catch (fallbackErr) {
      handleStreamError(fallbackErr);
    }
  };

  const handleReconnect = () => {
    cleanupStream();
    if (retryCountRef.current < 2) {
      retryCountRef.current += 1;
      console.log(`Auto-reconnect attempt ${retryCountRef.current}/2...`);
      setStatus('connecting');

      reconnectTimerRef.current = window.setTimeout(() => {
        void initializeStream();
      }, 2000);
    } else {
      console.error('Reconnect failed after 2 attempts.');
      setStatus('error');
      setIsErrorDialogOpen(true);
    }
  };

  const handleStartCamera = () => {
    retryCountRef.current = 0;

    // Generate unique Session ID for municipal data filters
    const dateStr = new Date().toISOString().split('T')[0];
    const uniqueSessionStr = `sess_${dateStr.replace(/-/g, '')}_${Date.now().toString().slice(-4)}`;
    setSessionId(uniqueSessionStr);
    setSessionCaptureCount(0);
    recentCapturesRef.current = [];

    // Reset metrics
    setSessionMetrics({
      ...DEFAULT_METRICS,
      startTime: Date.now(),
    });
    setSamples([]);

    // Session Start Timeline Event Log
    const nowStr = new Date().toTimeString().split(' ')[0];
    const startEvent: SessionEvent = {
      timestamp: nowStr,
      type: 'session_start',
      message: `🏁 Live inspection session started using camera "${activeTrackInfo?.label || 'Default Camera'}".`,
    };
    setSessionEvents([startEvent]);

    void initializeStream();
  };

  const handleStopCamera = () => {
    cleanupStream();
    setStatus('off');
    locationServiceRef.current.stopTracking();
    setGpsStatus('off');
    setGpsLocation(null);
    setSessionCaptureCount(0);
    setSessionId('');
    recentCapturesRef.current = [];
    if (speechQueueRef.current) {
      speechQueueRef.current.clear();
    }
    window.speechSynthesis.cancel();
    setSpeechStatus('muted');
    setCurrentSpokenText('');
  };

  useEffect(() => {
    if (status === 'streaming' || status === 'connecting') {
      void initializeStream();
    }
  }, [activeDeviceId, resolution, frameRate]);

  // Frame Capture and Request Upload
  const handleFrameUpload = useCallback(async (blob: Blob): Promise<any> => {
    const uploadFrame = async (retry = false): Promise<any> => {
      const formData = new FormData();
      formData.append('image', blob, 'live_frame.jpg');

      const response = await fetch(`${config.apiBaseUrl}/api/detect`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`Inference request failed with status: ${response.status}`);
      }
      return await response.json();
    };

    try {
      return await uploadFrame(false);
    } catch (err) {
      console.warn('First frame request failed, retrying once...');
      return await uploadFrame(true);
    }
  }, []);

  // Capture canvas data on the fly from current video frames
  const captureFrameData = useCallback((
    video: HTMLVideoElement,
    width: number,
    height: number
  ): { original: string; thumbnail: string } | null => {
    try {
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Draw raw camera feed frame (without overlays)
      ctx.drawImage(video, 0, 0, width, height);

      // Original base64 representation
      const original = canvas.toDataURL('image/jpeg', 0.85);

      // Downscale to 800px max dimensions for historyViewer displays
      const thumbCanvas = document.createElement('canvas');
      const maxDim = 800;
      let thumbW = width;
      let thumbH = height;
      if (thumbW > thumbH) {
        if (thumbW > maxDim) {
          thumbH = Math.round((thumbH * maxDim) / thumbW);
          thumbW = maxDim;
        }
      } else {
        if (thumbH > maxDim) {
          thumbW = Math.round((thumbW * maxDim) / thumbH);
          thumbH = maxDim;
        }
      }

      thumbCanvas.width = thumbW;
      thumbCanvas.height = thumbH;
      const thumbCtx = thumbCanvas.getContext('2d');
      if (thumbCtx) {
        thumbCtx.drawImage(canvas, 0, 0, thumbW, thumbH);
      }
      const thumbnail = thumbCanvas.toDataURL('image/jpeg', 0.70);

      return { original, thumbnail };
    } catch (err) {
      console.error('Failed to capture frame snapshot:', err);
      return null;
    }
  }, []);

  // Unified save capture method
  const executeEvidenceCapture = useCallback(async (
    focalTarget: any,
    allDetections: Detection[],
    reason: string
  ) => {
    if (!videoRef.current) return;
    const width = activeTrackInfo?.width || 640;
    const height = activeTrackInfo?.height || 480;

    const capturedImages = captureFrameData(videoRef.current, width, height);
    if (!capturedImages) return;

    // GPS location payload
    const gpsData: 'GPS Unavailable' | { latitude: number; longitude: number; accuracy: number; timestamp: number } | null =
      captureSettings.gpsLogging && gpsStatus === 'found' && gpsLocation
        ? {
            latitude: gpsLocation.latitude,
            longitude: gpsLocation.longitude,
            accuracy: gpsLocation.accuracy,
            timestamp: gpsLocation.timestamp,
          }
        : 'GPS Unavailable';

    // Summary calculations
    const summary = {
      total_detections: allDetections.length,
      pothole_count: allDetections.filter((d: any) => d.class_name.toLowerCase() === 'pothole').length,
      manhole_count: allDetections.filter((d: any) => d.class_name.toLowerCase() === 'manhole').length,
      highest_severity: allDetections.reduce((max: string, d: any) => {
        const severityOrder: Record<string, number> = { low: 1, medium: 2, high: 3 };
        return (severityOrder[d.severity.toLowerCase()] || 0) > (severityOrder[max.toLowerCase()] || 0) ? d.severity : max;
      }, 'Low'),
      average_confidence: allDetections.length > 0
        ? allDetections.reduce((sum: number, d: any) => sum + d.confidence, 0) / allDetections.length
        : 0,
      processing_time_ms: inferenceTime,
    };

    const distance = focalTarget
      ? estimateDistance(focalTarget.bbox, width, height)
      : undefined;

    const payload = {
      imageName: `live_capture_${Date.now()}.jpg`,
      thumbnail: capturedImages.thumbnail,
      summary,
      detections: allDetections,
      gps: gpsData,
      estimatedDistance: distance,
      modelName: 'YOLOv8s Pavement Analyzer',
      inferenceTime,
      sessionId,
      captureReason: reason,
      deviceName: activeTrackInfo?.label || 'Default Camera',
    };

    try {
      await historyService.saveDetection(payload);
      setSessionCaptureCount((prev) => prev + 1);

      // Increment metrics counters
      setSessionMetrics((prev) => ({
        ...prev,
        autoCaptures: reason !== 'manual_capture' ? prev.autoCaptures + 1 : prev.autoCaptures,
        manualCaptures: reason === 'manual_capture' ? prev.manualCaptures + 1 : prev.manualCaptures,
        gpsCapturesCount: gpsData !== 'GPS Unavailable' ? prev.gpsCapturesCount + 1 : prev.gpsCapturesCount,
      }));

      // Push timeline event log
      const nowTimeStr = new Date().toTimeString().split(' ')[0];
      const capEvent: SessionEvent = {
        timestamp: nowTimeStr,
        type: 'capture',
        message: reason === 'manual_capture'
          ? `📸 Manual snapshot saved to municipal database reports.`
          : `📸 Auto-captured evidence: Pothole detected (Severity: ${focalTarget.severity.toUpperCase()}).`,
      };
      setSessionEvents((prev) => [capEvent, ...prev]);

      // Set hasCapture = true for the latest trend line point
      setSamples((prev) => {
        if (prev.length === 0) return prev;
        const updated = [...prev];
        updated[updated.length - 1].hasCapture = true;
        return updated;
      });

      // Register duplicate suppression block
      if (focalTarget && reason !== 'manual_capture') {
        const cap_x_center = (focalTarget.bbox.x1 + focalTarget.bbox.x2) / 2 / width;
        recentCapturesRef.current.push({
          timestamp: performance.now(),
          class_name: focalTarget.class_name,
          severity: focalTarget.severity,
          x_center: cap_x_center,
        });
      }

      // Display visual toast notice
      setCapturedToastReason(reason);
      setShowCaptureToast(true);

      if (toastTimeoutRef.current) {
        window.clearTimeout(toastTimeoutRef.current);
      }
      toastTimeoutRef.current = window.setTimeout(() => {
        setShowCaptureToast(false);
      }, 2500);

      console.log('Evidence snapshot logged to history database successfully:', payload);
    } catch (err) {
      console.error('Failed to log evidence capture:', err);
    }
  }, [captureFrameData, captureSettings, gpsStatus, gpsLocation, activeTrackInfo, inferenceTime, sessionId]);

  // Scheduler Result Callback
  const handleSchedulerResult = useCallback((result: any, stats: { latency: number; inferenceTime: number }) => {
    const currentDetections = result.detections || [];
    setDetections(currentDetections);
    setLatency(stats.latency);
    setInferenceTime(stats.inferenceTime);
    setConsecutiveFailures(0);
    setLastUpdateTime(performance.now());

    fpsHelperRef.current.tick();
    const activeFpsVal = fpsHelperRef.current.getCurrentFPS();
    const sessionFpsVal = fpsHelperRef.current.getAverageFPS();
    setCurrentFps(activeFpsVal);
    setAverageFps(sessionFpsVal);

    // --- Dynamic Metrics Summation ---
    setSessionMetrics((prev) => {
      let potholes = 0;
      let manholes = 0;
      let highSev = 0;
      let medSev = 0;
      let lowSev = 0;
      let maxConf = prev.maxConfidence;
      let minConf = prev.minConfidence;

      currentDetections.forEach((det: any) => {
        if (det.class_name.toLowerCase() === 'pothole') {
          potholes++;
        } else if (det.class_name.toLowerCase() === 'manhole') {
          manholes++;
        }

        const sev = det.severity.toLowerCase();
        if (sev === 'high') highSev++;
        else if (sev === 'medium') medSev++;
        else if (sev === 'low') lowSev++;

        if (det.confidence > maxConf) maxConf = det.confidence;
        if (det.confidence < minConf) minConf = det.confidence;
      });

      const avgConfidence = currentDetections.length > 0
        ? currentDetections.reduce((s: number, d: any) => s + d.confidence, 0) / currentDetections.length
        : 0;

      return {
        ...prev,
        framesProcessed: prev.framesProcessed + 1,
        successfulRequests: prev.successfulRequests + 1,
        totalLatency: prev.totalLatency + stats.latency,
        totalInferenceTime: prev.totalInferenceTime + stats.inferenceTime,
        totalDetections: prev.totalDetections + currentDetections.length,
        potholesCount: prev.potholesCount + potholes,
        manholesCount: prev.manholesCount + manholes,
        highSeverityCount: prev.highSeverityCount + highSev,
        mediumSeverityCount: prev.mediumSeverityCount + medSev,
        lowSeverityCount: prev.lowSeverityCount + lowSev,
        maxConfidence: maxConf,
        minConfidence: minConf,
        averageConfidenceSum: prev.averageConfidenceSum + avgConfidence,
      };
    });

    // Add time-series sample to charts queue
    const timeOffsetSec = Math.floor((performance.now() - sessionMetrics.startTime) / 1000);
    const newSample: Sample = {
      timestamp: timeOffsetSec,
      fps: activeFpsVal,
      latency: stats.latency,
      detections: currentDetections.length,
      hasCapture: false,
    };
    setSamples((prev) => [...prev, newSample].slice(-50));

    // --- Driver Alert System Evaluation ---
    if (currentDetections.length === 0) return;

    const candidates = currentDetections.filter((det: any) => det.confidence >= alertThreshold);
    if (candidates.length === 0) return;

    let bestCandidate: any = null;
    let maxPriority = 0;
    candidates.forEach((det: any) => {
      const priority = getAlertPriority(det.class_name, det.severity);
      if (priority > maxPriority) {
        maxPriority = priority;
        bestCandidate = det;
      } else if (priority === maxPriority && bestCandidate) {
        if (det.confidence > bestCandidate.confidence) {
          bestCandidate = det;
        }
      }
    });

    if (!bestCandidate) return;

    const width = activeTrackInfo?.width || 640;
    const height = activeTrackInfo?.height || 480;
    const x_center = (bestCandidate.bbox.x1 + bestCandidate.bbox.x2) / 2 / width;
    const y_center = (bestCandidate.bbox.y1 + bestCandidate.bbox.y2) / 2 / height;

    const candidateData = {
      class_name: bestCandidate.class_name,
      severity: bestCandidate.severity,
      x_center,
    };

    const currentPriority = activeAlertRef.current
      ? getAlertPriority(activeAlertRef.current.class_name, activeAlertRef.current.severity)
      : 0;
    const candidatePriority = getAlertPriority(bestCandidate.class_name, bestCandidate.severity);

    const isPriorityOverride = isWarningVisibleRef.current && candidatePriority > currentPriority;
    const isDuplicate = isDuplicateAlert(recentAlertsRef.current, candidateData);

    if (isPriorityOverride || !isDuplicate) {
      const nowTime = new Date();
      const timeLabel = nowTime.toTimeString().split(' ')[0];
      const dist = estimateDistance(bestCandidate.bbox, width, height);

      const newAlert: Alert = {
        id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: performance.now(),
        timeLabel,
        class_name: bestCandidate.class_name,
        severity: bestCandidate.severity,
        confidence: bestCandidate.confidence,
        distance: dist,
        x_center,
        y_center,
      };

      // Play beep warning sound (Web Audio synthesis)
      playAlertSound(newAlert.severity, isMutedRef.current);

      // Increment alert stats
      setSessionMetrics((prev) => ({
        ...prev,
        driverAlerts: prev.driverAlerts + 1,
      }));

      // Add alert event to timeline log
      const alertEvent: SessionEvent = {
        timestamp: timeLabel,
        type: 'alert',
        message: `🔴 Hazard Alert: ${newAlert.class_name.toUpperCase()} detected ≈ ${newAlert.distance}m ahead.`,
      };
      setSessionEvents((prev) => [alertEvent, ...prev]);

      // --- Voice Assistant Announcement Trigger ---
      const speechText = getSpeechText(newAlert.class_name, newAlert.severity);
      
      const isLivePage = true; // Component only mounted when activeTab is 'live'
      const isCameraStreaming = status === 'streaming';
      const isSchedulerRunning = schedulerRef.current !== null && inferenceStatus !== 'error';
      const hasDetections = currentDetections.length > 0;
      const hasValidPothole = newAlert.class_name.toLowerCase() === 'pothole' || newAlert.class_name.toLowerCase() === 'manhole';

      if (
        isLivePage &&
        isCameraStreaming &&
        isSchedulerRunning &&
        hasDetections &&
        hasValidPothole &&
        speechText &&
        speechQueueRef.current
      ) {
        speechQueueRef.current.speakAlert(speechText, newAlert.severity);

        // Increment speech stats
        setSessionMetrics((prev) => ({
          ...prev,
          voiceAnnouncements: prev.voiceAnnouncements + 1,
        }));

        // Add speech event to timeline log
        const speechEvent: SessionEvent = {
          timestamp: timeLabel,
          type: 'speech',
          message: `🔊 Spoken Warning: "${speechText}" announced.`,
        };
        setSessionEvents((prev) => [speechEvent, ...prev]);
      }

      console.log('Driver Warning Alert triggered:', newAlert);

      activeAlertRef.current = newAlert;
      isWarningVisibleRef.current = true;
      recentAlertsRef.current = [newAlert, ...recentAlertsRef.current].slice(0, 20);

      setActiveAlert(newAlert);
      setIsWarningVisible(true);
      setAlertHistory((prev) => [newAlert, ...prev].slice(0, 20));

      if (hideTimeoutRef.current) {
        window.clearTimeout(hideTimeoutRef.current);
      }
      hideTimeoutRef.current = window.setTimeout(() => {
        setIsWarningVisible(false);
        isWarningVisibleRef.current = false;
        activeAlertRef.current = null;
      }, 4000);
    }

    // --- Auto Evidence Capture Evaluation ---
    if (captureSettings.autoCapture && videoRef.current) {
      const captureCandidates = currentDetections.filter(
        (det: any) => det.confidence >= captureSettings.minConfidence
      );

      let captureCandidate: any = null;
      let capPriority = 0;
      captureCandidates.forEach((det: any) => {
        if (det.class_name.toLowerCase() !== 'pothole') return;
        const priority = getAlertPriority(det.class_name, det.severity);
        if (priority > capPriority) {
          capPriority = priority;
          captureCandidate = det;
        }
      });

      if (captureCandidate) {
        const severity = captureCandidate.severity.toLowerCase();

        const isHigh = severity === 'high';
        const isMedHighConf = severity === 'medium' && captureCandidate.confidence >= 0.80;

        if (isHigh || isMedHighConf) {
          const cap_x_center = (captureCandidate.bbox.x1 + captureCandidate.bbox.x2) / 2 / width;

          const now = performance.now();
          const isDuplicateCapture = recentCapturesRef.current.some((cap) => {
            const timeDiff = now - cap.timestamp;
            const cooldownMs = captureSettings.cooldownSeconds * 1000;
            if (timeDiff > cooldownMs) return false;

            const isSameType = cap.class_name.toLowerCase() === captureCandidate.class_name.toLowerCase() &&
                                cap.severity.toLowerCase() === captureCandidate.severity.toLowerCase();
            if (!isSameType) return false;

            const xDiff = Math.abs(cap.x_center - cap_x_center);
            return xDiff < 0.15;
          });

          if (!isDuplicateCapture) {
            const reason = isHigh ? 'high_pothole' : 'medium_pothole_high_confidence';
            void executeEvidenceCapture(captureCandidate, currentDetections, reason);
          }
        }
      }
    }
  }, [alertThreshold, activeTrackInfo, captureSettings, executeEvidenceCapture, sessionMetrics.startTime]);

  // Scheduler Error Callback
  const handleSchedulerError = useCallback((error: any) => {
    console.error('Scheduler frame error:', error);
    
    // Increment failed requests
    setSessionMetrics((prev) => ({
      ...prev,
      framesProcessed: prev.framesProcessed + 1,
      failedRequests: prev.failedRequests + 1,
    }));

    // Add failure timeline event
    const nowTimeLabel = new Date().toTimeString().split(' ')[0];
    const errEvent: SessionEvent = {
      timestamp: nowTimeLabel,
      type: 'alert',
      message: `⚠️ Inference API request failed (Network timeout/server drop).`,
    };
    setSessionEvents((prev) => [errEvent, ...prev]);

    setConsecutiveFailures((prev) => {
      const nextFailures = prev + 1;
      if (nextFailures >= 3) {
        console.error('AI Server Unavailable. Circuit breaker triggered.');
        schedulerRef.current?.stop();
        setInferenceStatus('error');
      }
      return nextFailures;
    });
  }, []);

  // Scheduler Status Callback
  const handleSchedulerStatusChange = useCallback((newStatus: 'detecting' | 'idle' | 'error') => {
    if (newStatus === 'error') {
      setInferenceStatus('error');
    } else {
      setInferenceStatus(newStatus);
    }
  }, []);

  // Sync scheduler lifecycle with streaming status
  useEffect(() => {
    if (status === 'streaming' && videoRef.current) {
      if (schedulerRef.current) {
        schedulerRef.current.stop();
      }

      fpsHelperRef.current.reset();
      const schedulerInstance = new DetectionScheduler({
        video: videoRef.current,
        interval: 500,
        onFrame: handleFrameUpload,
        onResult: handleSchedulerResult,
        onError: handleSchedulerError,
        onStatusChange: handleSchedulerStatusChange,
      });

      schedulerRef.current = schedulerInstance;
      schedulerInstance.start();
      setInferenceStatus('idle');
    } else {
      if (schedulerRef.current) {
        schedulerRef.current.stop();
        schedulerRef.current = null;
      }
      setInferenceStatus('waiting');

      if (status === 'off') {
        setDetections([]);
        setCurrentFps(0);
        setAverageFps(0);
        setLatency(0);
        setInferenceTime(0);
        setLastUpdateTime(0);
        setConsecutiveFailures(0);

        // Reset alerts
        setActiveAlert(null);
        setIsWarningVisible(false);
        setAlertHistory([]);
        activeAlertRef.current = null;
        isWarningVisibleRef.current = false;
        recentAlertsRef.current = [];
        if (hideTimeoutRef.current) {
          window.clearTimeout(hideTimeoutRef.current);
          hideTimeoutRef.current = null;
        }

        // Reset speech queue
        speechQueueRef.current?.clear();
      }
    }
  }, [status, handleFrameUpload, handleSchedulerResult, handleSchedulerError, handleSchedulerStatusChange]);

  // Tab visibility changes listener (Auto-Pause)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.log('Tab hidden. Pausing scheduler and speech queues...');
        schedulerRef.current?.stop();
        if (speechQueueRef.current) {
          speechQueueRef.current.clear();
        }
        window.speechSynthesis.cancel();
      } else {
        if (status === 'streaming') {
          console.log('Tab visible. Resuming scheduler loops...');
          fpsHelperRef.current.reset();
          schedulerRef.current?.start();
        }
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [status]);

  // Circuit breaker retry trigger
  const handleRetryConnection = useCallback(() => {
    setConsecutiveFailures(0);
    setInferenceStatus('waiting');
    fpsHelperRef.current.reset();
    if (schedulerRef.current) {
      schedulerRef.current.start();
    }
  }, []);

  // Manual test voice speech
  const handleTestVoice = useCallback(() => {
    if (speechQueueRef.current) {
      speechQueueRef.current.speakAlert(
        'RoadGuard AI voice assistant is ready.',
        'low'
      );
    }
  }, []);

  // Handle manual capture event
  const handleManualCapture = useCallback(() => {
    if (status !== 'streaming' || !videoRef.current) return;

    let focalTarget: any = null;
    let maxPriority = 0;

    detections.forEach((det) => {
      const priority = getAlertPriority(det.class_name, det.severity);
      if (priority > maxPriority) {
        maxPriority = priority;
        focalTarget = det;
      }
    });

    void executeEvidenceCapture(focalTarget, detections, 'manual_capture');
  }, [detections, status, executeEvidenceCapture]);

  // Skipped frame estimation helper: target is 500ms intervals
  const expectedFrames = Math.floor((sessionDuration * 1000) / 500);
  const skippedFrames = Math.max(0, expectedFrames - sessionMetrics.framesProcessed);

  return (
    <div className="live-detection-page">
      <div className="page-header" style={{ marginBottom: '1.25rem' }}>
        <h1>Live AI Road Damage Inspection</h1>
        <p>Inspect pavement condition in real time using your connected camera device.</p>
      </div>

      {/* Tabs Selector Navigation Header */}
      <div className="live-page-tabs-container" style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'camera' ? 'active' : ''}`}
          onClick={() => setActiveTab('camera')}
        >
          📹 Live Camera View
        </button>
        <button
          type="button"
          className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
          onClick={() => setActiveTab('analytics')}
        >
          📊 Live Session Analytics
        </button>
      </div>

      {/* Camera tab uses display block/none to prevent unmounting video */}
      <div className="live-camera-layout-wrapper" style={{ display: activeTab === 'camera' ? 'block' : 'none' }}>
        <div className="live-camera-layout-grid">
          {/* Main Camera Feed Viewport */}
          <div className="camera-feed-section">
            <CameraView
              status={status}
              videoRef={videoRef}
              isMirrored={isMirrored}
            >
              {/* Live Detection Bounding Boxes Overlay */}
              <LiveDetectionOverlay
                detections={detections}
                videoWidth={activeTrackInfo?.width || 0}
                videoHeight={activeTrackInfo?.height || 0}
                isMirrored={isMirrored}
              />

              {/* Warning Banner absolute overlay */}
              <WarningBanner
                class_name={activeAlert?.class_name || ''}
                severity={activeAlert?.severity || ''}
                distance={activeAlert?.distance || 0}
                isVisible={isWarningVisible}
                confidence={activeAlert?.confidence || 0}
              />

              {/* Evidence Captured Toast Overlay */}
              {showCaptureToast && (
                <div className="evidence-capture-toast-alert animate-slideDown">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                    <circle cx="12" cy="13" r="4" />
                  </svg>
                  <span>
                    {capturedToastReason === 'manual_capture'
                      ? '📸 Snapshot Saved to History!'
                      : '📸 Auto-Captured Damage Evidence!'}
                  </span>
                </div>
              )}
            </CameraView>

            <CameraControls
              status={status}
              onStart={handleStartCamera}
              onStop={handleStopCamera}
              devices={devices}
              activeDeviceId={activeDeviceId}
              onDeviceChange={setActiveDeviceId}
              resolution={resolution}
              onResolutionChange={setResolution}
              frameRate={frameRate}
              onFrameRateChange={setFrameRate}
              isMirrored={isMirrored}
              onMirrorToggle={() => setIsMirrored(!isMirrored)}
            />
          </div>

          {/* Sidebar Telemetry & Details Panel */}
          <div className="camera-details-sidebar-section">
            {/* Geotagged Auto Evidence Capture Panel */}
            <AutoCapture
              settings={captureSettings}
              onSettingsChange={setCaptureSettings}
              gpsStatus={gpsStatus}
              gpsLocation={gpsLocation}
              sessionCaptureCount={sessionCaptureCount}
              onManualCapture={handleManualCapture}
              cameraActive={status === 'streaming'}
            />

            {/* AI Voice Assistant configuration card */}
            <VoiceAssistant
              settings={voiceSettings}
              onSettingsChange={setVoiceSettings}
              onTestVoice={handleTestVoice}
              speechStatus={speechStatus}
              currentText={currentSpokenText}
            />

            {/* Driver Alerts configuration & HUD meter */}
            <DriverAlert
              alertThreshold={alertThreshold}
              onThresholdChange={setAlertThreshold}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(!isMuted)}
              activeAlert={activeAlert}
              isWarningVisible={isWarningVisible}
            />

            {/* In-Memory Warning Logs history list */}
            {status === 'streaming' && (
              <AlertHistory history={alertHistory} />
            )}

            {/* Rich Status and model Telemetry Badge */}
            <InferenceStatus
              inferenceStatus={inferenceStatus}
              consecutiveFailures={consecutiveFailures}
              latency={latency}
              detectionCount={detections.length}
              lastUpdateTime={lastUpdateTime}
              onRetryConnection={handleRetryConnection}
            />

            {/* Telemetry Counter Dashboard */}
            {status === 'streaming' && consecutiveFailures < 3 && (
              <FPSCounter
                currentFps={currentFps}
                averageFps={averageFps}
                inferenceTime={inferenceTime}
                latency={latency}
                detectionCount={detections.length}
              />
            )}

            <div className="sidebar-card">
              <h3 className="sidebar-card-title">Live Device Information</h3>

              {activeTrackInfo && status === 'streaming' ? (
                <div className="sidebar-metadata-list">
                  <div className="info-row">
                    <span className="info-label">Connected Device</span>
                    <span className="info-value truncate-val" title={activeTrackInfo.label}>
                      {activeTrackInfo.label}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Active Resolution</span>
                    <span className="info-value font-semibold">
                      {activeTrackInfo.width} × {activeTrackInfo.height}
                    </span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Frame Rate</span>
                    <span className="info-value">{activeTrackInfo.frameRate} FPS</span>
                  </div>
                  <div className="info-row">
                    <span className="info-label">Facing Orientation</span>
                    <span className="info-value">{activeTrackInfo.facingMode}</span>
                  </div>
                </div>
              ) : (
                <div className="sidebar-no-metadata-message">
                  <p>Start the camera to view live device resolution, frame rates, and hardware configurations.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Analytics tab renders grid dashboard */}
      {activeTab === 'analytics' && (
        <LiveAnalytics
          metrics={sessionMetrics}
          samples={samples}
          events={sessionEvents}
          durationSec={sessionDuration}
          averageFps={averageFps}
          skippedFrames={skippedFrames}
          gpsStatus={gpsStatus}
          gpsLoggingEnabled={captureSettings.gpsLogging}
          cameraName={activeTrackInfo?.label || 'Default Camera'}
          cameraResolution={activeTrackInfo ? `${activeTrackInfo.width}x${activeTrackInfo.height}` : ''}
          cameraFps={activeTrackInfo?.frameRate || 30}
          isMirrored={isMirrored}
          sessionId={sessionId}
        />
      )}

      {/* Permission & Capture Dialog Modal */}
      <PermissionDialog
        status={status}
        onClose={() => setIsErrorDialogOpen(false)}
      />
    </div>
  );
};
