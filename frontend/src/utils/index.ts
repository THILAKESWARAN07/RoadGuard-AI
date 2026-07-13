export const formatDate = (dateString: string): string => {
  return new Date(dateString).toLocaleString();
};

export const formatCoordinates = (lat: number, lon: number): string => {
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
};

export const getSeverityColor = (severity: string): string => {
  const colors: Record<string, string> = {
    small: 'var(--severity-small)',
    medium: 'var(--severity-medium)',
    large: 'var(--severity-large)',
    repaired: 'var(--severity-repaired)',
  };
  return colors[severity] || colors.medium;
};

export const getAlertSeverity = (riskScore: number): string => {
  if (riskScore >= 90) return 'critical';
  if (riskScore >= 70) return 'large';
  if (riskScore >= 50) return 'medium';
  return 'small';
};
