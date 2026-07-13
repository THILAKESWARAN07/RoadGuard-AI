import React from 'react';
import type { HistoryItem } from '../../services/historyService';

export type GovStatus = 'pending' | 'in_progress' | 'completed';

/** Map internal historyService status → government label */
export function toGovStatus(status: HistoryItem['status']): GovStatus {
  if (status === 'repaired') return 'completed';
  if (status === 'ignored') return 'in_progress';
  return 'pending';
}

/** Map government label → internal historyService status */
export function fromGovStatus(gov: GovStatus): HistoryItem['status'] {
  if (gov === 'completed') return 'repaired';
  if (gov === 'in_progress') return 'ignored';
  return 'active';
}

export const GOV_STATUS_LABELS: Record<GovStatus, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
};

interface StatusBadgeProps {
  status: HistoryItem['status'];
  size?: 'sm' | 'md';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const gov = toGovStatus(status);
  return (
    <span
      className={`gov-status-badge gov-status-${gov} ${size === 'sm' ? 'gov-status-badge--sm' : ''}`}
      aria-label={`Status: ${GOV_STATUS_LABELS[gov]}`}
    >
      {GOV_STATUS_LABELS[gov]}
    </span>
  );
};

export default StatusBadge;
