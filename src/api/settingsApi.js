import { apiRequest } from './apiClient';
export const getPublicSettings = () => apiRequest('/settings/public');
export const updateSettings = patch => apiRequest('/settings', { method: 'PATCH', body: JSON.stringify(patch) });
