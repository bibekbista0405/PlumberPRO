import { apiRequest } from './apiClient';
export const submitFeedback = (rating, comment) => apiRequest('/feedback', { method: 'POST', body: JSON.stringify({ rating, comment }) });
export const getMyFeedback = () => apiRequest('/feedback/mine');
export const getPublicFeedback = () => apiRequest('/feedback/public');
export const getAllFeedback = () => apiRequest('/feedback');
export const updateFeedbackStatus = (id, status) => apiRequest(`/feedback/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) });
