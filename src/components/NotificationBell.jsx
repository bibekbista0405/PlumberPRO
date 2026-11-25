import React, { useEffect, useRef, useState } from 'react';
import '../styles/NotificationBell.css';
import Icon from './Icon';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { getMyNotifications, markAllNotificationsRead, markNotificationRead } from '../api/notificationApi';

function timeAgo(dateStr) {
  const diff = (Date.now() - new Date(dateStr).getTime()) / 1000;
  if (diff < 60) return 'Just now';
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const boxRef = useRef(null);
  const push = usePushNotifications();

  const load = () => {
    getMyNotifications().then(d => { setItems(d.notifications || []); setUnread(d.unread || 0); }).catch(() => {});
  };

  useEffect(() => {
    load();
  }, []);
  useAutoRefresh(load, 30000);

  useEffect(() => {
    const onClick = e => { if (boxRef.current && !boxRef.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const openItem = async (item) => {
    if (!item.is_read) { try { await markNotificationRead(item.id); } catch {} }
    load();
  };
  const clearAll = async () => { try { await markAllNotificationsRead(); load(); } catch {} };

  return (
    <div className="notif-bell" ref={boxRef}>
      <button className="notif-toggle" onClick={() => setOpen(v => !v)} aria-label="Notifications">
        <Icon name="bell" size={18} />{unread > 0 && <em>{unread > 9 ? '9+' : unread}</em>}
      </button>
      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <strong>Notifications</strong>
            {unread > 0 && <button onClick={clearAll}>Mark all read</button>}
          </div>
          <div className="notif-list">
            {items.length === 0 && <div className="notif-empty">You're all caught up.</div>}
            {items.map(item => (
              <button key={item.id} className={`notif-item ${item.is_read ? '' : 'unread'}`} onClick={() => openItem(item)}>
                <span className="notif-dot" />
                <span className="notif-body">
                  <strong>{item.title}</strong>
                  <span>{item.message}</span>
                  <small>{timeAgo(item.created_at)}</small>
                </span>
              </button>
            ))}
          </div>
          {push.supported && push.serverEnabled && push.permission !== 'denied' && (
            <div className="notif-push-row">
              {push.subscribed ? (
                <span className="notif-push-status"><Icon name="check" size={12} /> Push notifications on</span>
              ) : (
                <button className="notif-push-toggle" onClick={push.enable} disabled={push.busy}>
                  <Icon name="bell" size={12} /> {push.busy ? 'Enabling…' : 'Get notified even when the tab is closed'}
                </button>
              )}
              {push.error && <small className="notif-push-error">{push.error}</small>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
export default NotificationBell;
