import { apiRequest } from './apiClient';
export const getConversations = () => apiRequest('/messages');
export const getBookingMessages = (bookingId) => apiRequest(`/messages/${bookingId}`);
export const sendBookingMessage = (bookingId, message) => apiRequest(`/messages/${bookingId}`, { method: 'POST', body: JSON.stringify({ message }) });
export const getUnreadMessageCount = () => apiRequest('/messages/unread-count');
