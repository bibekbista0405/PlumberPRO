import React from 'react';
import ChatThread from './ChatThread';

// Compact thread used inside booking/job detail modals. The full inbox view
// lives in MessagesInbox; both render the same ChatThread.
function BookingChat({ bookingId, plumberAssigned, tall }) {
  return <ChatThread bookingId={bookingId} plumberAssigned={plumberAssigned} compact={!tall} tall={tall} />;
}
export default BookingChat;
