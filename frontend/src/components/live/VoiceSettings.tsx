import React, { useEffect, useState } from 'react';
import { VoiceSettingsData } from './SpeechQueue';

interface VoiceSettingsProps {
  settings: VoiceSettingsData;
  onSettingsChange: (settings: VoiceSettingsData) => void;
  onTestVoice: () => void;
}

export const VoiceSettings: React.FC<VoiceSettingsProps> = ({
  settings,
  onSettingsChange,
  onTestVoice,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        setVoices(window.speechSynthesis.getVoices());
      }
    };
    
    loadVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
    
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.onvoiceschanged = null;
      }
    };
  }, []);

  const handleVoiceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedURI = e.target.value;
    const selectedVoice = voices.find((v) => v.voiceURI === selectedURI);
    
    if (selectedVoice) {
      onSettingsChange({
        ...settings,
        voiceURI: selectedVoice.voiceURI,
        lang: selectedVoice.lang,
      });
    }
  };

  return (
    <div className="voice-settings-controls-group">
      {/* Enable Toggle */}
      <div className="setting-control-item toggle-item" style={{ padding: 0, marginBottom: '1rem' }}>
        <span className="setting-label">Voice Guidance</span>
        <label className="switch-control-toggle">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => onSettingsChange({ ...settings, enabled: e.target.checked })}
            className="switch-input-element"
            aria-label="Toggle voice guidance assistant warnings"
          />
          <span className="switch-slider-track" />
        </label>
      </div>

      {settings.enabled && (
        <div className="voice-settings-expanded-fields animate-fadeIn">
          {/* Voice Dropdown */}
          <div className="setting-control-item" style={{ marginBottom: '0.85rem' }}>
            <label className="setting-label" htmlFor="voice-profile-select">Voice Profile</label>
            <select
              id="voice-profile-select"
              value={settings.voiceURI}
              onChange={handleVoiceChange}
              className="setting-select"
              style={{ width: '100%' }}
            >
              {voices.length === 0 ? (
                <option value="">Browser Default Voice</option>
              ) : (
                voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>
                    {v.name} ({v.lang})
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Volume Slider */}
          <div className="setting-control-item" style={{ marginBottom: '0.85rem' }}>
            <div className="slider-label-header">
              <label className="setting-label" htmlFor="voice-volume-slider">Volume</label>
              <span className="slider-value-badge">{Math.round(settings.volume * 100)}%</span>
            </div>
            <input
              id="voice-volume-slider"
              type="range"
              min="0.0"
              max="1.0"
              step="0.1"
              value={settings.volume}
              onChange={(e) => onSettingsChange({ ...settings, volume: parseFloat(e.target.value) })}
              className="settings-slider-element"
              aria-label="Speech volume"
            />
          </div>

          {/* Rate Slider */}
          <div className="setting-control-item" style={{ marginBottom: '1.25rem' }}>
            <div className="slider-label-header">
              <label className="setting-label" htmlFor="voice-rate-slider">Speech Speed</label>
              <span className="slider-value-badge">{settings.rate.toFixed(1)}x</span>
            </div>
            <input
              id="voice-rate-slider"
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.rate}
              onChange={(e) => onSettingsChange({ ...settings, rate: parseFloat(e.target.value) })}
              className="settings-slider-element"
              aria-label="Speech speed rate"
            />
          </div>

          {/* Test Voice Button */}
          <button
            type="button"
            onClick={onTestVoice}
            className="manual-test-voice-btn"
            aria-label="Play test speech utterance"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
              <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
            </svg>
            <span>Test Voice</span>
          </button>
        </div>
      )}
    </div>
  );
};
export default VoiceSettings;
