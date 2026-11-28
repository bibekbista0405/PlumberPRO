import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import ChatThread from './ChatThread';
import { useAuth } from '../context/AuthContext';
import { getConversations } from '../api/messageApi';
import '../styles/MessagesInbox.css';

function shortTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const now = new Date();
  if (d.toDateString() === now.toDateString()) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const diffDays = Math.floor((now - d) / 86400000);
  if (diffDays < 7) return d.toLocaleDateString([], { weekday: 'short' });
  return d.toLocaleDateString([], { day: 'numeric', month: 'short' });
}
const hue = (id) => (Number(id) * 47) % 360;
const stage = (s) => String(s || '').replace(/_/g, ' ');

// Messenger-style inbox: conversation list on the left, thread on the right.
// On phones it behaves like a messaging app: list first, tap to open a thread,
// back arrow to return.
function MessagesInbox({ initialId = null, title = 'Messages', emptyHint = 'Conversations open once a plumber is assigned to a booking.' }) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(initialId);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const load = useCallback((silent) => {
    if (!silent) setLoading(true);
    getConversations()
      .then((d) => { setConversations(d.conversations || []); setError(''); })
      .catch((e) => { if (!silent) setError(e.message); })
      .finally(() => { if (!silent) setLoading(false); });
  }, []);

  useEffect(() => { load(false); }, [load]);
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load(true); };
    const id = setInterval(tick, 6000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  const totalUnread = conversations.reduce((n, c) => n + Number(c.unread_count || 0), 0);
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return conversations.filter((c) => (filter === 'all' || Number(c.unread_count) > 0)
      && `${c.other_user_name || ''} ${c.service_name || ''} ${c.last_message || ''} ${c.booking_id}`.toLowerCase().includes(q));
  }, [conversations, query, filter]);
  const active = conversations.find((c) => c.booking_id === activeId) || null;

  const open = (id) => {
    setActiveId(id);
    setConversations((list) => list.map((c) => (c.booking_id === id ? { ...c, unread_count: 0 } : c)));
  };

  const Avatar = ({ c, size = 44 }) => (
    <span className="ib-avatar" style={{ '--h': hue(c.other_user_id || c.booking_id), width: size, height: size }}>
      {(c.other_user_name || '?').charAt(0).toUpperCase()}
    </span>
  );

  return (
    <div className={`messages-inbox ${active ? 'has-active' : ''}`}>
      <aside className="ib-list">
        <div className="ib-list-head">
          <h2>{title}{totalUnread > 0 && <em>{totalUnread > 99 ? '99+' : totalUnread}</em>}</h2>
          <div className="ib-search"><Icon name="search" size={15} /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search people, services, messages" aria-label="Search conversations" /></div>
          <div className="ib-filters" role="group" aria-label="Filter conversations">
            <button type="button" className={filter === 'all' ? 'on' : ''} onClick={() => setFilter('all')}>All</button>
            <button type="button" className={filter === 'unread' ? 'on' : ''} onClick={() => setFilter('unread')}>Unread{totalUnread > 0 ? ` (${totalUnread})` : ''}</button>
          </div>
        </div>
        {error && <div className="form-error ib-error">{error}</div>}
        <div className="ib-rows">
          {loading && [0, 1, 2, 3].map((i) => <div className="ib-skel" key={i}><i /><span><b /><b /></span></div>)}
          {!loading && filtered.length === 0 && (
            <div className="ib-empty"><span><Icon name="message" size={22} /></span><p>{conversations.length === 0 ? emptyHint : filter === 'unread' && !query ? 'You are all caught up.' : 'No conversations match your search.'}</p></div>
          )}
          {!loading && filtered.map((c) => {
            const unread = Number(c.unread_count) > 0;
            const mine = c.last_sender_id === user?.id;
            return (
              <button key={c.booking_id} type="button" className={`ib-row ${c.booking_id === activeId ? 'on' : ''} ${unread ? 'unread' : ''}`} onClick={() => open(c.booking_id)}>
                <Avatar c={c} />
                <span className="ib-row-main">
                  <span className="ib-row-top"><strong>{c.other_user_name || 'Unknown'}</strong><small>{shortTime(c.last_message_at)}</small></span>
                  <span className="ib-row-ctx">{c.service_name || 'Service'} · #{c.booking_id}</span>
                  <span className="ib-row-bottom">
                    <span className="ib-preview">{c.last_message ? `${mine ? 'You: ' : ''}${c.last_message}` : 'No messages yet. Say hello.'}</span>
                    {unread && <em>{c.unread_count > 9 ? '9+' : c.unread_count}</em>}
                  </span>
                </span>
              </button>
            );
          })}
        </div>
      </aside>

      <section className="ib-thread">
        {active ? (
          <>
            <header className="ib-thread-head">
              <button type="button" className="ib-back" onClick={() => setActiveId(null)} aria-label="Back to conversations"><Icon name="chevronRight" size={18} className="flip" /></button>
              <Avatar c={active} size={40} />
              <div className="ib-thread-who"><strong>{active.other_user_name || 'Unknown'}</strong><small>{active.service_name || 'Service'} · Booking #{active.booking_id}</small></div>
              <span className={`status status-${active.booking_status}`}>{stage(active.booking_status)}</span>
            </header>
            <ChatThread key={active.booking_id} bookingId={active.booking_id} plumberAssigned tall />
          </>
        ) : (
          <div className="ib-placeholder">
            <span><Icon name="message" size={30} /></span>
            <strong>Your conversations</strong>
            <p>Pick a conversation from the list to read it and reply.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default MessagesInbox;
