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
export const getPublicStats = () => apiRequest('/plumbers/stats');
export const getPublicPlumberProfile = id => apiRequest(`/plumbers/${id}`);
export const uploadPlumberPhoto = (file) => {
  const form = new FormData();
  form.append('photo', file);
  return apiRequest('/plumbers/me/photo', { method: 'POST', body: form });
};
