import { apiRequest } from './apiClient';

export const REPORT_REASONS = [
  { value: 'scam_or_fraud', label: 'Scam or fraud' },
  { value: 'unprofessional_behavior', label: 'Unprofessional behavior' },
  { value: 'no_show', label: "Didn't show up" },
  { value: 'overcharged', label: 'Overcharged' },
  { value: 'safety_concern', label: 'Safety concern' },
  { value: 'other', label: 'Other' },
];

export const submitReport = (payload) => apiRequest('/reports', { method: 'POST', body: JSON.stringify(payload) });
export const getReports = () => apiRequest('/reports');
export const updateReport = (id, status, resolutionNote) => apiRequest(`/reports/${id}`, { method: 'PATCH', body: JSON.stringify({ status, resolution_note: resolutionNote }) });
