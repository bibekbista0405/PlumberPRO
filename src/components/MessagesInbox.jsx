import React, { useEffect, useMemo, useState } from 'react';
import Icon from './Icon';
import BookingChat from './BookingChat';
import { getConversations } from '../api/messageApi';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import '../styles/MessagesInbox.css';

function timeAgo(dateStr) {
  if (!dateStr) return '';
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  if (diff < 604800) return `${Math.floor(diff / 86400)}d ago`;
  return new Date(dateStr).toLocaleDateString();
}

// A proper full-screen messaging inbox: every booking that has an assigned
// plumber shows up here as one conversation, with the latest message and an
// unread badge — laid out and sized like a real chat app fills its own
// screen, not a small bordered widget sitting inside a page. On narrow
// screens it behaves like a phone's messaging app: the conversation list is
// the default view, and opening a thread swaps in the full-width chat view
// with a back button, rather than squeezing both into a tiny stacked box.
function MessagesInbox({ title = 'Messages', emptyHint = 'Conversations open once a plumber is assigned to a booking.' }) {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeId, setActiveId] = useState(null);
  const [query, setQuery] = useState('');

  const load = (opts = {}) => {
    if (!opts.silent) setLoading(true);
    getConversations()
      .then(d => setConversations(d.conversations || []))
      .catch(e => { if (!opts.silent) setError(e.message); })
      .finally(() => { if (!opts.silent) setLoading(false); });
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useAutoRefresh(() => load({ silent: true }), 15000);

  const filtered = useMemo(
    () => conversations.filter(c => `${c.other_user_name || ''} ${c.service_name || ''}`.toLowerCase().includes(query.toLowerCase())),
    [conversations, query]
  );
  const active = conversations.find(c => c.booking_id === activeId) || null;
  const totalUnread = conversations.reduce((sum, c) => sum + Number(c.unread_count || 0), 0);

  // Clear the badge locally the moment a thread is opened — BookingChat marks
  // it read on the server; the next silent refresh will confirm the count.
  const openConversation = (id) => {
    setActiveId(id);
    setConversations(list => list.map(c => (c.booking_id === id ? { ...c, unread_count: 0 } : c)));
  };

  return (
    <div className={`messages-inbox ${active ? 'has-active' : ''}`}>
      <aside className="inbox-list-pane">
        <div className="inbox-list-head">
          <h2>{title}{totalUnread > 0 && <em>{totalUnread > 9 ? '9+' : totalUnread}</em>}</h2>
          <div className="inbox-search">
            <Icon name="search" size={14} />
            <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search conversations…" />
          </div>
        </div>
        {error && <div className="form-error">{error}</div>}
        <div className="inbox-list">
          {loading && <div className="empty-state">Loading conversations…</div>}
          {!loading && filtered.length === 0 && (
            <div className="empty-state inbox-empty">
              <Icon name="message" size={22} />
              <p>{conversations.length === 0 ? emptyHint : 'No conversations match your search.'}</p>
            </div>
          )}
          {!loading && filtered.map(c => (
            <button
              key={c.booking_id}
              className={`inbox-row ${c.booking_id === activeId ? 'active' : ''}`}
              onClick={() => openConversation(c.booking_id)}
            >
              <span className="inbox-avatar">{(c.other_user_name || '?').charAt(0).toUpperCase()}</span>
              <span className="inbox-row-main">
                <span className="inbox-row-top">
                  <strong>{c.other_user_name || 'Unknown'}</strong>
                  <small>{timeAgo(c.last_message_at)}</small>
                </span>
                <span className="inbox-row-bottom">
                  <span className="inbox-preview">{c.last_message ? c.last_message : `Booking #${c.booking_id} · ${c.service_name || 'Service'}`}</span>
                  {Number(c.unread_count) > 0 && <em>{c.unread_count > 9 ? '9+' : c.unread_count}</em>}
                </span>
                <span className={`status status-${c.booking_status}`}>{String(c.booking_status).replace('_', ' ')}</span>
              </span>
            </button>
          ))}
        </div>
      </aside>
      <section className="inbox-chat-pane">
        {active ? (
          <>
            <div className="inbox-chat-head">
              <button type="button" className="inbox-back-btn" onClick={() => setActiveId(null)} aria-label="Back to conversations">
                <Icon name="chevronRight" size={17} className="flip" />
              </button>
              <span className="inbox-avatar">{(active.other_user_name || '?').charAt(0).toUpperCase()}</span>
              <div>
                <strong>{active.other_user_name || 'Unknown'}</strong>
                <small>Booking #{active.booking_id} · {active.service_name || 'Service'}</small>
              </div>
              <span className={`status status-${active.booking_status}`}>{String(active.booking_status).replace('_', ' ')}</span>
            </div>
            <BookingChat bookingId={active.booking_id} plumberAssigned tall />
          </>
        ) : (
          <div className="inbox-chat-placeholder">
            <Icon name="message" size={28} />
            <p>Select a conversation to view messages.</p>
          </div>
        )}
      </section>
    </div>
  );
}

export default MessagesInbox;
