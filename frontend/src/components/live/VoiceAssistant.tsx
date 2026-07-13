import React from 'react';
import { VoiceSettings } from './VoiceSettings';
import { VoiceStatus } from './VoiceStatus';
import { VoiceSettingsData } from './SpeechQueue';

interface VoiceAssistantProps {
  settings: VoiceSettingsData;
  onSettingsChange: (settings: VoiceSettingsData) => void;
  onTestVoice: () => void;
  speechStatus: 'muted' | 'idle' | 'speaking';
  currentText: string;
}

export const VoiceAssistant: React.FC<VoiceAssistantProps> = ({
  settings,
  onSettingsChange,
  onTestVoice,
  speechStatus,
  currentText,
}) => {
  return (
    <div className="voice-assistant-sidebar-panel sidebar-card">
      <h3 className="sidebar-card-title">AI Voice Assistant</h3>
      <p className="sidebar-desc" style={{ marginBottom: '1rem' }}>
        Enable real-time spoken guidance for road damage.
      </p>

      {/* Voice Status HUD */}
      <VoiceStatus
        status={speechStatus}
        currentText={currentText}
        currentVoiceURI={settings.enabled ? settings.voiceURI : ''}
      />

      <div className="tooltip-divider" style={{ margin: '1rem 0' }} />

      {/* Voice Settings Panel */}
      <VoiceSettings
        settings={settings}
        onSettingsChange={onSettingsChange}
        onTestVoice={onTestVoice}
      />
    </div>
  );
};
export default VoiceAssistant;
