import React from 'react';
import type { HistoryItem } from '../../services/historyService';
import { toGovStatus, fromGovStatus, GovStatus, GOV_STATUS_LABELS } from './StatusBadge';
import { historyService } from '../../services/historyService';

interface StatusSelectorProps {
  item: HistoryItem;
  onUpdated: (updated: HistoryItem) => void;
  disabled?: boolean;
}

export const StatusSelector: React.FC<StatusSelectorProps> = ({ item, onUpdated, disabled }) => {
  const currentGov = toGovStatus(item.status);
  const [saving, setSaving] = React.useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newGov = e.target.value as GovStatus;
    const newInternalStatus = fromGovStatus(newGov);
    setSaving(true);
    try {
      const updated = await historyService.updateDetection(item.id, { status: newInternalStatus });
      onUpdated(updated);
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <select
      className="gov-status-select"
      value={currentGov}
      onChange={handleChange}
      disabled={disabled || saving}
      aria-label="Update repair status"
    >
      {(Object.entries(GOV_STATUS_LABELS) as [GovStatus, string][]).map(([val, label]) => (
        <option key={val} value={val}>{label}</option>
      ))}
    </select>
  );
};

export default StatusSelector;
