import { apiRequest } from './apiClient';
export const getPushStatus = () => apiRequest('/push/status');
export const subscribeToPush = (subscription) => apiRequest('/push/subscribe', { method: 'POST', body: JSON.stringify(subscription) });
export const unsubscribeFromPush = (endpoint) => apiRequest('/push/unsubscribe', { method: 'POST', body: JSON.stringify({ endpoint }) });
