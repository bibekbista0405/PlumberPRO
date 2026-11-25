import { apiRequest } from './apiClient';
export const sendContactMessage = (payload) => apiRequest('/contact', { method: 'POST', body: JSON.stringify(payload) });
