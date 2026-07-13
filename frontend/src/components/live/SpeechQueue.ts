import { getAlertPriority } from './AlertManager';

export interface QueueItem {
  id: string;
  text: string;
  priority: number;
}

export interface VoiceSettingsData {
  enabled: boolean;
  rate: number;
  volume: number;
  voiceURI: string;
  lang: string;
}

export class SpeechQueue {
  private queue: QueueItem[] = [];
  private isSpeaking = false;
  private settings: VoiceSettingsData;
  private watchdogTimer: number | null = null;
  private cooldownTimer: number | null = null;
  private lastSpeechEndTime = 0;
  private currentSpokenText = '';

  // Callback listeners
  private onStatusChange: (status: 'muted' | 'idle' | 'speaking', text?: string) => void;
  public onSpeechComplete?: () => void;

  constructor(
    settings: VoiceSettingsData,
    onStatusChange: (status: 'muted' | 'idle' | 'speaking', text?: string) => void
  ) {
    this.settings = settings;
    this.onStatusChange = onStatusChange;
  }

  public updateSettings(newSettings: VoiceSettingsData) {
    const wasEnabled = this.settings.enabled;
    this.settings = newSettings;

    if (!newSettings.enabled) {
      this.clear();
      this.onStatusChange('muted');
    } else if (!wasEnabled && newSettings.enabled) {
      this.onStatusChange('idle');
    }
  }

  public speakAlert(text: string, severity: string) {
    if (!this.settings.enabled) return;

    const priority = getAlertPriority('pothole', severity); // use pothole as helper class mapping
    const now = performance.now();

    // 1. Priority Interruption: High severity alerts (priority 4) immediately cancel active speech
    if (priority === 4 && this.isSpeaking) {
      const currentPriority = this.queue.length > 0 ? this.queue[0].priority : 0;
      
      if (currentPriority < 4) {
        console.log('High priority alert preempting current announcement...');
        window.speechSynthesis.cancel();
        this.clearTimers();
        
        // Clear queue of lower priority alerts
        this.queue = [];
        this.isSpeaking = false;
        
        // Speak High alert immediately
        const highItem: QueueItem = {
          id: `speech_${Date.now()}`,
          text,
          priority,
        };
        this.queue.push(highItem);
        this.processQueue();
        return;
      }
    }

    // 2. Queue uniqueness: Avoid duplicate sentences in the active queue
    const isDuplicateInQueue = this.queue.some(
      (item) => item.text.toLowerCase() === text.toLowerCase()
    );
    if (isDuplicateInQueue) return;

    // Enqueue
    const newItem: QueueItem = {
      id: `speech_${Date.now()}`,
      text,
      priority,
    };
    this.queue.push(newItem);

    // 3. Sort queue by priority descending
    this.queue.sort((a, b) => b.priority - a.priority);

    if (!this.isSpeaking) {
      this.processQueue();
    }
  }

  private processQueue() {
    if (!this.settings.enabled) return;
    if (this.queue.length === 0) {
      this.isSpeaking = false;
      this.currentSpokenText = '';
      this.onStatusChange('idle');
      return;
    }

    // 4. Speech Pacing Gate: enforce a minimum 2-second spacing cooldown
    const now = performance.now();
    const timeSinceLastEnd = now - this.lastSpeechEndTime;
    if (timeSinceLastEnd < 2000) {
      const waitDelay = 2000 - timeSinceLastEnd;
      if (this.cooldownTimer) {
        window.clearTimeout(this.cooldownTimer);
      }
      this.cooldownTimer = window.setTimeout(() => {
        this.processQueue();
      }, waitDelay);
      return;
    }

    this.isSpeaking = true;
    const nextItem = this.queue.shift();
    if (!nextItem) return;

    this.currentSpokenText = nextItem.text;
    const utterance = new SpeechSynthesisUtterance(nextItem.text);

    // Apply voice settings
    utterance.volume = this.settings.volume;
    utterance.rate = this.settings.rate;

    // 5. Language Fallback Engine
    const selectedVoice = this.resolveVoice();
    if (selectedVoice) {
      utterance.voice = selectedVoice;
      utterance.lang = selectedVoice.lang;
    } else {
      utterance.lang = this.settings.lang || 'en-US';
    }

    // 6. Speaking Timeout Watchdog (10 seconds)
    this.watchdogTimer = window.setTimeout(() => {
      console.warn('Watchdog timeout: SpeechSynthesis failed to terminate. Rescuing...');
      window.speechSynthesis.cancel();
      this.handleSpeechEnd();
    }, 10000);

    utterance.onstart = () => {
      this.onStatusChange('speaking', nextItem.text);
    };

    utterance.onend = () => {
      this.handleSpeechEnd();
    };

    utterance.onerror = (e) => {
      console.warn('SpeechSynthesis error event fired:', e);
      this.handleSpeechEnd();
    };

    window.speechSynthesis.speak(utterance);
  }

  private handleSpeechEnd() {
    this.clearTimers();
    this.lastSpeechEndTime = performance.now();
    this.isSpeaking = false;
    this.currentSpokenText = '';

    // Invoke complete callback hook for Module 6.5
    this.onSpeechComplete?.();

    this.processQueue();
  }

  // Fallback voice resolver helper
  private resolveVoice(): SpeechSynthesisVoice | null {
    if (!window.speechSynthesis) return null;
    const voices = window.speechSynthesis.getVoices();
    if (voices.length === 0) return null;

    // Match exact voiceURI first
    let voice = voices.find((v) => v.voiceURI === this.settings.voiceURI);
    if (voice) return voice;

    // Fallback 1: match exact language code (e.g. en-IN, en-US)
    voice = voices.find((v) => v.lang.toLowerCase() === this.settings.lang.toLowerCase());
    if (voice) return voice;

    // Fallback 2: match base language (first 2 chars, e.g. 'en')
    const baseLang = this.settings.lang.split('-')[0].toLowerCase();
    voice = voices.find((v) => v.lang.toLowerCase().startsWith(baseLang));
    if (voice) return voice;

    return null;
  }

  private clearTimers() {
    if (this.watchdogTimer) {
      window.clearTimeout(this.watchdogTimer);
      this.watchdogTimer = null;
    }
    if (this.cooldownTimer) {
      window.clearTimeout(this.cooldownTimer);
      this.cooldownTimer = null;
    }
  }

  public clear() {
    this.clearTimers();
    window.speechSynthesis.cancel();
    this.queue = [];
    this.isSpeaking = false;
    this.currentSpokenText = '';
  }
}
