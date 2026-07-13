import React from 'react';
import type { GovStatus } from './StatusBadge';

export interface GovFilters {
  damageType: 'all' | 'pothole' | 'manhole';
  severity: 'all' | 'high' | 'medium' | 'low';
  status: 'all' | GovStatus;
  timeRange: 'all' | 'today' | 'week' | 'month';
  source: 'All' | 'AI' | 'Citizen';
}

export const DEFAULT_GOV_FILTERS: GovFilters = {
  damageType: 'all',
  severity: 'all',
  status: 'all',
  timeRange: 'all',
  source: 'All',
};

interface DashboardFiltersProps {
  filters: GovFilters;
  onChange: (f: GovFilters) => void;
}

function FilterSelect<T extends string>({
  label, value, options, onChange,
}: {
  label: string;
  value: T;
  options: { value: T; label: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div className="gov-filter-group">
      <label className="gov-filter-label">{label}</label>
      <select
        className="gov-filter-select"
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        aria-label={label}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>{o.label}</option>
        ))}
      </select>
    </div>
  );
}

export const DashboardFilters: React.FC<DashboardFiltersProps> = ({ filters, onChange }) => {
  const set = <K extends keyof GovFilters>(key: K, val: GovFilters[K]) =>
    onChange({ ...filters, [key]: val });

  return (
    <div className="gov-filters-bar" role="group" aria-label="Dashboard filters">
      <FilterSelect
        label="Damage Type"
        value={filters.damageType}
        options={[
          { value: 'all', label: 'All Types' },
          { value: 'pothole', label: 'Pothole' },
          { value: 'manhole', label: 'Manhole' },
        ]}
        onChange={(v) => set('damageType', v)}
      />
      <FilterSelect
        label="Severity"
        value={filters.severity}
        options={[
          { value: 'all', label: 'All Severities' },
          { value: 'high', label: 'High' },
          { value: 'medium', label: 'Medium' },
          { value: 'low', label: 'Low' },
        ]}
        onChange={(v) => set('severity', v)}
      />
      <FilterSelect
        label="Repair Status"
        value={filters.status}
        options={[
          { value: 'all', label: 'All Statuses' },
          { value: 'pending', label: 'Pending' },
          { value: 'in_progress', label: 'In Progress' },
          { value: 'completed', label: 'Completed' },
        ]}
        onChange={(v) => set('status', v)}
      />
      <FilterSelect
        label="Date Range"
        value={filters.timeRange}
        options={[
          { value: 'all', label: 'All Time' },
          { value: 'today', label: 'Today' },
          { value: 'week', label: 'This Week' },
          { value: 'month', label: 'This Month' },
        ]}
        onChange={(v) => set('timeRange', v)}
      />
      <FilterSelect
        label="Source"
        value={filters.source}
        options={[
          { value: 'All', label: 'All Sources' },
          { value: 'AI', label: 'AI' },
          { value: 'Citizen', label: 'Citizen' },
        ]}
        onChange={(v) => set('source', v)}
      />

      {(filters.damageType !== 'all' || filters.severity !== 'all' || filters.status !== 'all' || filters.timeRange !== 'all' || filters.source !== 'All') && (
        <button
          type="button"
          className="gov-filter-reset-btn"
          onClick={() => onChange(DEFAULT_GOV_FILTERS)}
          aria-label="Reset all filters"
        >
          Reset Filters
        </button>
      )}
    </div>
  );
};

export default DashboardFilters;
