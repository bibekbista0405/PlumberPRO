import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import Icon from './Icon';
import { useAuth } from '../context/AuthContext';
import { getBookingMessages, sendBookingMessage } from '../api/messageApi';
import '../styles/BookingChat.css';

const MAX_LEN = 1000;
const GROUP_GAP_MS = 5 * 60 * 1000;
const POLL_MS = 4000;

const QUICK = {
  customer: ['Thanks!', 'What time can you arrive?', 'Could you call me?', 'Sounds good'],
  plumber: ["I'm on my way", 'Can you send a photo of the problem?', 'I will be there shortly', 'Job finished, thank you!'],
};

const dayLabel = (iso) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const start = (x) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((start(new Date()) - start(d)) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: diff > 300 ? 'numeric' : undefined });
};
const clock = (iso) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// A conversation for one booking: grouped bubbles with day separators, an
// optimistic send (the bubble appears instantly, with retry if it fails),
// Enter-to-send, read receipts from the server's is_read flag, and smart
// scrolling that never yanks you down while you are reading older messages.
function ChatThread({ bookingId, plumberAssigned = true, compact = false, tall = false }) {
  const { user } = useAuth();
  const role = user?.role === 'plumber' ? 'plumber' : 'customer';
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [loaded, setLoaded] = useState(false);
  const [unseenBelow, setUnseenBelow] = useState(0);
  const scrollRef = useRef(null);
  const inputRef = useRef(null);
  const nearBottom = useRef(true);
  const lastCount = useRef(0);
  const tmpId = useRef(0);

  const load = useCallback((silent) => {
    getBookingMessages(bookingId)
      .then((d) => {
        const server = d.messages || [];
        // Keep optimistic bubbles that the server has not echoed back yet.
        setMessages((cur) => {
          const pending = cur.filter((m) => m.local);
          return [...server, ...pending];
        });
      })
      .catch((e) => { if (!silent) setError(e.message); })
      .finally(() => setLoaded(true));
  }, [bookingId]);

  useEffect(() => { setMessages([]); setLoaded(false); setError(''); lastCount.current = 0; nearBottom.current = true; load(false); }, [load]);
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') load(true); };
    const id = setInterval(tick, POLL_MS);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [load]);

  const scrollToEnd = useCallback((smooth) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: smooth ? 'smooth' : 'auto' });
    setUnseenBelow(0);
  }, []);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    nearBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 90;
    if (nearBottom.current) setUnseenBelow(0);
  };

  useLayoutEffect(() => {
    const n = messages.length;
    const added = n - lastCount.current;
    const first = lastCount.current === 0;
    lastCount.current = n;
    if (added <= 0) return;
    const newest = messages[n - 1];
    const mine = newest && newest.sender_id === user?.id;
    if (first || nearBottom.current || mine) scrollToEnd(!first);
    else setUnseenBelow((c) => c + added);
  }, [messages, user?.id, scrollToEnd]);

  useEffect(() => {
    const el = inputRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 130)}px`;
  }, [text]);

  const deliver = async (value, localId) => {
    try {
      const data = await sendBookingMessage(bookingId, value);
      setMessages((cur) => (cur.some((m) => m.id === data.message.id)
        ? cur.filter((m) => m.id !== localId)
        : cur.map((m) => (m.id === localId ? { ...data.message, local: false } : m))));
    } catch (err) {
      setMessages((cur) => cur.map((m) => (m.id === localId ? { ...m, failed: true, pending: false } : m)));
      setError(err.message || 'Message could not be sent.');
    }
  };

  const send = (raw) => {
    const value = (raw ?? text).trim();
    if (!value || value.length > MAX_LEN) return;
    setError('');
    const localId = `local-${++tmpId.current}`;
    setMessages((cur) => [...cur, { id: localId, local: true, pending: true, sender_id: user.id, sender_name: user.name, message: value, created_at: new Date().toISOString() }]);
    if (raw === undefined) setText('');
    deliver(value, localId);
  };

  const retry = (m) => {
    setMessages((cur) => cur.map((x) => (x.id === m.id ? { ...x, failed: false, pending: true } : x)));
    setError('');
    deliver(m.message, m.id);
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); send(); }
  };

  // Group consecutive messages and insert day dividers.
  const rows = useMemo(() => {
    const out = [];
    let prev = null;
    let lastMineSeenId = null;
    messages.forEach((m) => { if (m.sender_id === user?.id && m.is_read && !m.local) lastMineSeenId = m.id; });
    messages.forEach((m, i) => {
      const day = dayLabel(m.created_at);
      if (!prev || dayLabel(prev.created_at) !== day) out.push({ type: 'day', key: `d-${m.id}`, label: day });
      const sameGroup = prev && prev.sender_id === m.sender_id && dayLabel(prev.created_at) === day
        && new Date(m.created_at) - new Date(prev.created_at) < GROUP_GAP_MS;
      const next = messages[i + 1];
      const endsGroup = !next || next.sender_id !== m.sender_id || dayLabel(next.created_at) !== day
        || new Date(next.created_at) - new Date(m.created_at) >= GROUP_GAP_MS;
      out.push({ type: 'msg', key: m.id, m, first: !sameGroup, last: endsGroup, seen: m.id === lastMineSeenId });
      prev = m;
    });
    return out;
  }, [messages, user?.id]);

  if (!plumberAssigned) {
    return <div className="chat-locked"><Icon name="message" size={16} /> Messaging opens once a plumber is assigned to this booking.</div>;
  }

  const lastMsg = messages[messages.length - 1];
  const showQuick = loaded && (!lastMsg || lastMsg.sender_id !== user?.id) && !text;
  const over = text.length > MAX_LEN - 120;

  return (
    <div className={`chat ${compact ? 'chat-compact' : ''} ${tall ? 'chat-tall' : ''}`}>
      <div className="chat-scroll" ref={scrollRef} onScroll={onScroll} role="log" aria-live="polite" aria-label="Conversation">
        {!loaded && <div className="chat-skeleton" aria-hidden="true"><i /><i className="r" /><i /></div>}
        {loaded && messages.length === 0 && (
          <div className="chat-empty">
            <span><Icon name="message" size={22} /></span>
            <strong>Start the conversation</strong>
            <p>Share details, confirm timing or ask a question. Messages are delivered instantly.</p>
          </div>
        )}
        {rows.map((r) => r.type === 'day' ? (
          <div className="chat-day" key={r.key}><span>{r.label}</span></div>
        ) : (
          <div key={r.key} className={`msg ${r.m.sender_id === user?.id ? 'mine' : 'theirs'} ${r.first ? 'first' : ''} ${r.last ? 'last' : ''} ${r.m.pending ? 'pending' : ''} ${r.m.failed ? 'failed' : ''}`}>
            {r.first && r.m.sender_id !== user?.id && <span className="msg-name">{r.m.sender_name}</span>}
            <div className="msg-bubble">
              <p>{r.m.message}</p>
            </div>
            {r.last && (
              <span className="msg-meta">
                {r.m.failed ? <button type="button" className="msg-retry" onClick={() => retry(r.m)}>Not sent. Tap to retry</button> : (
                  <>
                    {clock(r.m.created_at)}
                    {r.m.sender_id === user?.id && !r.m.pending && <span className={`msg-tick ${r.seen ? 'seen' : ''}`} title={r.seen ? 'Seen' : 'Sent'}><Icon name="check" size={11} />{r.seen && <Icon name="check" size={11} />}</span>}
                    {r.seen && <b>Seen</b>}
                    {r.m.pending && <b>Sending…</b>}
                  </>
                )}
              </span>
            )}
          </div>
        ))}
      </div>

      {unseenBelow > 0 && (
        <button type="button" className="chat-jump" onClick={() => scrollToEnd(true)}>
          {unseenBelow} new {unseenBelow === 1 ? 'message' : 'messages'} <Icon name="chevronRight" size={13} className="down" />
        </button>
      )}

      {error && <div className="chat-error" role="alert">{error}<button type="button" onClick={() => setError('')} aria-label="Dismiss">×</button></div>}

      {showQuick && (
        <div className="chat-quick" aria-label="Quick replies">
          {QUICK[role].map((q) => <button type="button" key={q} onClick={() => send(q)}>{q}</button>)}
        </div>
      )}

      <form className="chat-composer" onSubmit={(e) => { e.preventDefault(); send(); }}>
        <textarea
          ref={inputRef}
          rows={1}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Write a message…"
          maxLength={MAX_LEN}
          aria-label="Message"
        />
        {over && <small className="chat-count">{MAX_LEN - text.length}</small>}
        <button type="submit" className="chat-send" disabled={!text.trim()} aria-label="Send message"><Icon name="send" size={17} /></button>
      </form>
      <p className="chat-hint">Enter to send · Shift+Enter for a new line</p>
    </div>
  );
}

export default ChatThread;
