import { apiRequest } from './apiClient';
export const getPublicReviews = () => apiRequest('/reviews');
export const createReview = (payload) => apiRequest('/reviews', { method: 'POST', body: JSON.stringify(payload) });
