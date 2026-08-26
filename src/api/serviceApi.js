import { apiRequest } from './apiClient';
export const getServices = () => apiRequest('/services');
export const getAllServices = () => apiRequest('/services/admin/all');
export const createService = (payload) => apiRequest('/services', { method: 'POST', body: JSON.stringify(payload) });
export const updateService = (id, payload) => apiRequest(`/services/${id}`, { method: 'PATCH', body: JSON.stringify(payload) });
export const deleteService = (id) => apiRequest(`/services/${id}`, { method: 'DELETE' });
