import { apiRequest } from './apiClient';
export const searchPlumbers = ({ q = '', lat, lng, radius = 25, service = '' } = {}) => {
  const params = new URLSearchParams();
  if (q) params.set('q', q);
  if (service) params.set('service', service);
  if (Number.isFinite(lat) && Number.isFinite(lng)) { params.set('lat', lat); params.set('lng', lng); params.set('radius', radius); }
  return apiRequest(`/plumbers/search?${params.toString()}`);
};
export const getMyPlumberProfile = () => apiRequest('/plumbers/me');
export const updateMyPlumberProfile = payload => apiRequest('/plumbers/me', { method: 'PATCH', body: JSON.stringify(payload) });
