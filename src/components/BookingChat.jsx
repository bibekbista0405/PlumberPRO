import React, { useEffect, useRef, useState } from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { getBookingMessages, sendBookingMessage } from '../api/messageApi';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import '../styles/BookingChat.css';

function BookingChat({ bookingId, plumberAssigned, tall }) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const bottomRef = useRef(null);

  const load = (opts = {}) => {
    getBookingMessages(bookingId)
      .then(d => setMessages(d.messages || []))
      .catch(e => { if (!opts.silent) setError(e.message); })
      .finally(() => setLoaded(true));
  };

  useEffect(() => { load(); }, [bookingId]); // eslint-disable-line react-hooks/exhaustive-deps
  useAutoRefresh(() => load({ silent: true }), 15000);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length]);

  const submit = async (e) => {
    e.preventDefault();
    const value = text.trim();
    if (!value) return;
    setBusy(true);
    setError('');
    try {
      const data = await sendBookingMessage(bookingId, value);
      setMessages(m => [...m, data.message]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  if (!plumberAssigned) {
    return <div className="chat-locked"><Icon name="message" size={16} /> Messaging opens once a plumber is assigned to this booking.</div>;
  }

  return (
    <div className={`booking-chat ${tall ? 'booking-chat-tall' : ''}`}>
      <div className="chat-messages">
        {loaded && messages.length === 0 && <p className="chat-empty">No messages yet — say hello.</p>}
        {messages.map((m) => (
          <div key={m.id} className={`chat-bubble ${m.sender_id === user.id ? 'mine' : ''}`}>
            <span className="chat-sender">{m.sender_id === user.id ? 'You' : m.sender_name}</span>
            <p>{m.message}</p>
            <small>{new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</small>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
      {error && <div className="form-error">{error}</div>}
      <form className="chat-input-row" onSubmit={submit}>
        <input value={text} onChange={e => setText(e.target.value)} placeholder="Type a message…" maxLength={1000} />
        <button type="submit" disabled={busy || !text.trim()} aria-label="Send"><Icon name="send" size={16} /></button>
      </form>
    </div>
  );
}
export default BookingChat;
