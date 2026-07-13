export interface Alert {
  id: string;
  timestamp: number; // performance.now()
  timeLabel: string; // HH:MM:SS
  class_name: string;
  severity: string;
  confidence: number;
  distance: number;
  x_center: number; // 0.0 to 1.0
  y_center: number; // 0.0 to 1.0
}

let audioCtx: AudioContext | null = null;

// Synthesize alert tones natively via Web Audio API
const playTone = (frequency: number, duration: number, type: OscillatorType = 'sine', gainVal = 0.1) => {
  try {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    gainNode.gain.setValueAtTime(gainVal, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);

    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + duration);
  } catch (e) {
    console.warn('Web Audio Playback blocked or failed:', e);
  }
};

export const playAlertSound = (severity: string, isMuted: boolean) => {
  if (isMuted) return;

  const sev = severity.toLowerCase();
  if (sev === 'high') {
    // Double beep: 880Hz, 100ms on, 50ms break, 100ms on
    playTone(880, 0.1, 'sine', 0.15);
    setTimeout(() => {
      playTone(880, 0.1, 'sine', 0.15);
    }, 150);
  } else if (sev === 'medium') {
    // Single beep: 587Hz, 150ms
    playTone(587, 0.15, 'sine', 0.12);
  } else {
    // Soft chime: 440Hz, decaying over 250ms
    playTone(440, 0.25, 'triangle', 0.08);
  }
};

// Map threat level values for sorting
export const getAlertPriority = (class_name: string, severity: string): number => {
  const isPothole = class_name.toLowerCase() === 'pothole';
  const isManhole = class_name.toLowerCase() === 'manhole';

  if (isPothole) {
    switch (severity.toLowerCase()) {
      case 'high': return 4;
      case 'medium': return 3;
      case 'low': return 2;
      default: return 2;
    }
  }
  if (isManhole) return 1;
  return 0;
};

// Distance Estimation based on bounding box square-root area fractions
export const estimateDistance = (
  bbox: { width: number; height: number },
  videoWidth: number,
  videoHeight: number
): number => {
  if (!videoWidth || !videoHeight) return 10;
  const bboxArea = bbox.width * bbox.height;
  const videoArea = videoWidth * videoHeight;
  const areaFraction = bboxArea / videoArea;

  const dist = 1.5 / Math.sqrt(areaFraction || 0.001);
  return Math.max(2, Math.min(25, Math.round(dist)));
};

// Evaluate duplicate warnings within a 5-second spatial radius
export const isDuplicateAlert = (
  recentAlerts: Alert[],
  candidate: { class_name: string; severity: string; x_center: number }
): boolean => {
  const now = performance.now();
  const match = recentAlerts.find((alert) => {
    const timeDiff = now - alert.timestamp;
    if (timeDiff > 5000) return false; // 5-second cooldown

    const isSameType = alert.class_name.toLowerCase() === candidate.class_name.toLowerCase() &&
                        alert.severity.toLowerCase() === candidate.severity.toLowerCase();
    if (!isSameType) return false;

    // Horizontal spatial overlap (checks if coordinates are close, delta < 15%)
    const xDiff = Math.abs(alert.x_center - candidate.x_center);
    return xDiff < 0.15;
  });

  return !!match;
};
