import { apiRequest } from './apiClient';
export const createBooking = (payload) => apiRequest('/bookings', { method: 'POST', body: JSON.stringify(payload) });
export const getMyBookings = () => apiRequest('/bookings/my');
export const cancelBooking = (id) => apiRequest(`/bookings/${id}/cancel`, { method: 'PATCH' });
export const getAdminBookings = () => apiRequest('/bookings/admin/all');
export const updateAdminBooking = (id, payload) => apiRequest(`/bookings/${id}/admin`, { method: 'PATCH', body: JSON.stringify(payload) });
export const getPlumberBookings = () => apiRequest('/bookings/plumber');
export const updatePlumberBooking = (id, status) => apiRequest(`/bookings/${id}/plumber`, { method: 'PATCH', body: JSON.stringify({ status }) });
