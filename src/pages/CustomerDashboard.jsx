import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/CustomerDashboard.css';
import '../styles/BookingChat.css';
import '../styles/MessagesInbox.css';
import { useAuth } from '../context/AuthContext';
import { cancelBooking, getBookingDetails, getMyBookings, uploadBookingPhoto } from '../api/bookingApi';
import { createReview } from '../api/reviewApi';
import { getUnreadMessageCount } from '../api/messageApi';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import Icon from '../components/Icon';
import NewAccountWelcome from '../components/NewAccountWelcome';
import DashboardPromo from '../components/DashboardPromo';
import ReportPlumberModal from '../components/ReportPlumberModal';
import BookingChat from '../components/BookingChat';
import MessagesInbox from '../components/MessagesInbox';
import DashboardTopbar from '../components/DashboardTopbar';
import FeedbackPrompt from '../components/FeedbackPrompt';
import DashboardWatermark from '../components/DashboardWatermark';
import { PortalHero, StatTile, SectionTitle, EmptyCard, Pills, WorkCard } from '../components/PortalParts';
import { useConfirm } from '../context/ConfirmContext';

const tabs = [['overview', 'Overview', 'dashboard'], ['bookings', 'My bookings', 'bookings'], ['messages', 'Messages', 'message']];
const bookingFilters = [['all', 'All'], ['active', 'Active'], ['pending', 'Pending'], ['completed', 'Completed'], ['closed', 'Closed']];
const ACTIVE_BOOKING_STATUSES = ['pending', 'assigned', 'confirmed', 'on_the_way', 'arrived', 'in_progress'];
const TERMINAL_BOOKING_STATUSES = ['cancelled', 'rejected', 'expired'];
const formatBookingDate = value => { const raw = value instanceof Date && !Number.isNaN(value.getTime()) ? `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, '0')}-${String(value.getUTCDate()).padStart(2, '0')}` : String(value || '').slice(0, 10); const parts = raw.split('-').map(Number); return parts.length === 3 && parts.every(Number.isFinite) ? new Date(parts[0], parts[1] - 1, parts[2]).toLocaleDateString() : 'Date unavailable'; };

function CustomerDashboard() {
  const { user } = useAuth();
  const confirm = useConfirm();
  const [tab, setTab] = useState('overview');
  const [bookingFilter, setBookingFilter] = useState('all');
  const [detailHistory, setDetailHistory] = useState([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookings, setBookings] = useState([]), [loading, setLoading] = useState(true), [error, setError] = useState(''), [message, setMessage] = useState(''), [selected, setSelected] = useState(null), [review, setReview] = useState({ rating: 5, comment: '' }), [reviewing, setReviewing] = useState(null), [reviewBusy, setReviewBusy] = useState(false), [reporting, setReporting] = useState(null), [photoBusy, setPhotoBusy] = useState(false), [unreadMessages, setUnreadMessages] = useState(0);

  const load = useCallback((opts = {}) => { if (!opts.silent) setLoading(true); getMyBookings().then(d => { setBookings(d.bookings || []); setSelected(prev => prev ? (d.bookings || []).find(b => b.id === prev.id) || prev : prev) }).catch(e => { if (!opts.silent) setError(e.message) }).finally(() => { if (!opts.silent) setLoading(false) }) }, []);
  const loadUnread = useCallback(() => getUnreadMessageCount().then(d => setUnreadMessages(d.unread || 0)).catch(() => {}), []);
  useEffect(() => { load(); loadUnread(); }, [load, loadUnread]);
  useAutoRefresh(() => { load({ silent: true }); loadUnread(); });

  const openBooking = async booking => { setSelected(booking); setDetailHistory([]); setDetailLoading(true); try { const detail = await getBookingDetails(booking.id); setSelected(detail.booking || booking); setDetailHistory(Array.isArray(detail.history) ? detail.history : []); } catch (e) { setError(e.message); } finally { setDetailLoading(false); } };
  const visibleBookings = bookings.filter(b => bookingFilter === 'all' || (bookingFilter === 'active' && ACTIVE_BOOKING_STATUSES.includes(b.status)) || (bookingFilter === 'pending' && ['pending', 'assigned'].includes(b.status)) || (bookingFilter === 'completed' && ['completed', 'reviewed'].includes(b.status)) || (bookingFilter === 'closed' && TERMINAL_BOOKING_STATUSES.includes(b.status)));
  const cancel = async id => { if (!(await confirm({ title: 'Cancel this booking?', message: "The plumber will be notified and this can't be undone from here.", confirmLabel: 'Cancel booking' }))) return; try { await cancelBooking(id); load() } catch (e) { setError(e.message) } };
  const submitReview = async e => { e.preventDefault(); setReviewBusy(true); setError(''); try { await createReview({ booking_id: reviewing.id, rating: Number(review.rating), comment: review.comment }); setMessage('Thank you. Your review was submitted.'); setReviewing(null); setReview({ rating: 5, comment: '' }); load() } catch (e) { setError(e.message) } finally { setReviewBusy(false) } };
  const addPhoto = async (id, file) => { if (!file) return; setPhotoBusy(true); setError(''); try { const result = await uploadBookingPhoto(id, file); setSelected(prev => prev?.id === id ? { ...prev, photo_url: result.photo_url } : prev); load() } catch (e) { setError(e.message) } finally { setPhotoBusy(false) } };

  const pending = bookings.filter(b => ['pending', 'assigned', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(b.status)).length;
  const completed = bookings.filter(b => ['completed', 'reviewed'].includes(b.status)).length;
  const recent = bookings.slice(0, 5);
  const [chatId, setChatId] = useState(null);
  const openMessages = () => { setChatId(null); setTab('messages'); loadUnread(); };
  const openChat = id => { setSelected(null); setChatId(id); setTab('messages'); loadUnread(); };
  const nextBooking = bookings.find(b => ACTIVE_BOOKING_STATUSES.includes(b.status));
  const bookingActions = b => (<>{b.plumber_id && <button type="button" className="pt-btn ghost" onClick={() => openChat(b.id)}>Message</button>}{['completed', 'reviewed'].includes(b.status) && b.plumber_id && !b.review_id && <button type="button" className="pt-btn solid" onClick={() => setReviewing(b)}>Rate plumber</button>}{!['in_progress', 'completed', 'reviewed', 'cancelled', 'rejected', 'expired'].includes(b.status) && <button type="button" className="pt-btn danger" onClick={() => cancel(b.id)}>Cancel</button>}</>);
  const bookingCard = (b, spotlight) => <WorkCard key={b.id} spotlight={spotlight} title={b.service_name} subtitle={`Booking #${b.id}`} status={b.status} date={b.booking_date} time={b.booking_time} address={b.address} meta={{ icon: 'users', label: 'Plumber', value: b.plumber_name || 'Awaiting assignment' }} onOpen={() => openBooking(b)}>{bookingActions(b)}</WorkCard>;

  return (
    <div className="dashboard-app">
      <DashboardTopbar roleLabel="Customer Portal" tabs={tabs} activeTab={tab} onTabChange={key => { setTab(key); if (key === 'messages') { setChatId(null); loadUnread(); } }} unreadMessages={unreadMessages} />
      <div className={`customer-dashboard dashboard-shell ${tab === 'messages' ? 'dash-shell-full' : ''}`}>
        {tab === 'overview' && <NewAccountWelcome role="customer" />}
        {tab === 'overview' && (
          <PortalHero
            eyebrow="CUSTOMER PORTAL"
            title={`Welcome back, ${user?.name?.split(' ')[0] || 'there'}`}
            subtitle={nextBooking ? `Your ${nextBooking.service_name} booking is ${nextBooking.status.replace(/_/g, ' ')}.` : 'Book a verified plumber, follow the job live and message them in one place.'}
            actions={<><Link to="/book-plumber" className="pt-btn light"><Icon name="plus" size={14} /> Book a plumber</Link>{unreadMessages > 0 && <button type="button" className="pt-btn glass" onClick={openMessages}><Icon name="message" size={14} /> {unreadMessages} unread {unreadMessages === 1 ? 'message' : 'messages'}</button>}</>}
          />
        )}
        {tab === 'overview' && (
          <div className="pt-stats">
            <StatTile icon="bookings" label="Total bookings" value={bookings.length} onClick={() => setTab('bookings')} />
            <StatTile icon="bolt" tone="copper" label="Active services" value={pending} onClick={() => { setBookingFilter('active'); setTab('bookings'); }} />
            <StatTile icon="check" tone="green" label="Completed" value={completed} onClick={() => { setBookingFilter('completed'); setTab('bookings'); }} />
            <StatTile icon="message" tone="blue" label="Unread messages" value={unreadMessages} onClick={openMessages} />
          </div>
        )}
        {error && <div className="form-error">{error}</div>}
        {message && <div className="form-success">{message}</div>}

        {tab === 'overview' && (
          <div className="dash-section-page">
            <DashboardPromo />
            <FeedbackPrompt role="customer" hasCompletedWork={completed > 0} />
            <div className="pt-two">
              <div>
                <SectionTitle title={nextBooking ? 'Happening now' : 'Recent bookings'} text={nextBooking ? 'Follow your active booking step by step.' : 'Your latest service requests.'} action={<button type="button" className="pt-btn ghost" onClick={() => setTab('bookings')}>View all</button>} />
                {loading ? <div className="empty-state">Loading bookings…</div> : bookings.length === 0 ? <EmptyCard title="No bookings yet" text="Describe the problem and a verified plumber near you will take it from there." action={<Link to="/book-plumber" className="pt-btn solid">Create your first request</Link>} /> : <div className="pt-grid one">{(nextBooking ? [nextBooking, ...recent.filter(b => b.id !== nextBooking.id).slice(0, 2)] : recent.slice(0, 3)).map((b, i) => bookingCard(b, nextBooking && i === 0))}</div>}
              </div>
              <aside className="pt-panel">
                <SectionTitle title="Quick actions" />
                <div className="pt-quick">
                  <Link to="/book-plumber"><span className="i"><Icon name="plus" size={16} /></span><span>Book a plumber<small>Pick a service and a time</small></span></Link>
                  <button type="button" onClick={openMessages}><span className="i"><Icon name="message" size={16} /></span><span>Open messages<small>Chat with your plumber</small></span>{unreadMessages > 0 && <em>{unreadMessages}</em>}</button>
                  <button type="button" onClick={() => setTab('bookings')}><span className="i"><Icon name="bookings" size={16} /></span><span>All bookings<small>History, ratings and cancellations</small></span></button>
                </div>
              </aside>
            </div>
            <DashboardWatermark />
          </div>
        )}

        {tab === 'bookings' && (
          <div id="bookings" className="dash-section-page">
            <SectionTitle title="My bookings" text="Track every request, appointment and completed service." action={<button type="button" className="pt-btn ghost" onClick={() => load()}><Icon name="refresh" size={13} /> Refresh</button>} />
            <Pills label="Filter bookings" value={bookingFilter} onChange={setBookingFilter} items={bookingFilters.map(([key, label]) => [key, label, key === 'all' ? bookings.length : key === 'active' ? bookings.filter(b => ACTIVE_BOOKING_STATUSES.includes(b.status)).length : undefined])} />
            {loading ? <div className="empty-state">Loading bookings…</div> : bookings.length === 0 ? <EmptyCard title="No bookings yet" text="Your requests will appear here once you make one." action={<Link to="/book-plumber" className="pt-btn solid">Create your first request</Link>} /> : visibleBookings.length === 0 ? <EmptyCard icon="search" title={`No ${bookingFilter} bookings`} text="Try another filter." /> : <div className="pt-grid">{visibleBookings.map(b => bookingCard(b))}</div>}
            <DashboardWatermark />
          </div>
        )}

        {tab === 'messages' && (
          <div className="dash-section-page dash-section-fill">
            <MessagesInbox initialId={chatId} title="Messages" emptyHint="Once a plumber is assigned to one of your bookings, you can message them here." />
            <DashboardWatermark thin />
          </div>
        )}

        {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal-card modal-wide" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><h2>Booking #{selected.id}</h2><p><b>Service:</b> {selected.service_name}</p><p><b>Status:</b> {selected.status}</p><p><b>Date:</b> {formatBookingDate(selected.booking_date)} at {String(selected.booking_time).slice(0, 5)}</p><p><b>Address:</b> {selected.address}</p><p><b>Description:</b> {selected.description || 'No additional description.'}</p><p><b>Plumber:</b> {selected.plumber_name ? <Link to={`/plumbers/${selected.plumber_id}`}>{selected.plumber_name}</Link> : 'Awaiting assignment'}</p>
          <section className="booking-timeline" aria-label="Booking status history"><h3>Booking timeline</h3>{detailLoading ? <p className="timeline-muted">Loading status history…</p> : detailHistory.length ? <ol>{detailHistory.map((entry, index) => <li key={`${entry.status}-${entry.created_at || index}`} className={index === detailHistory.length - 1 ? 'current' : ''}><span className="timeline-dot"/><div><strong>{String(entry.status || '').replaceAll('_', ' ')}</strong>{entry.note && <p>{entry.note}</p>}<small>{entry.created_at ? new Date(entry.created_at).toLocaleString() : 'Recorded status'}</small></div></li>)}</ol> : <p className="timeline-muted">Status history is not available for this booking yet.</p>}</section>
          <div className="booking-photo-row">
            {selected.photo_url && <div className="booking-photo-block"><span>Problem photo</span><img src={selected.photo_url} alt="Reported problem" /></div>}
            {!selected.photo_url && ['pending', 'assigned', 'confirmed'].includes(selected.status) && <label className="photo-upload-btn booking-photo-add">{photoBusy ? 'Uploading…' : 'Add a photo of the problem'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={photoBusy} onChange={e => { const file = e.target.files?.[0]; addPhoto(selected.id, file); e.target.value = ''; }} /></label>}
            {selected.completion_photo_url && <div className="booking-photo-block"><span>Completion photo</span><img src={selected.completion_photo_url} alt="Completed work" /></div>}
          </div>
          {selected.plumber_id && <div className="booking-chat-wrap"><h3>Messages</h3><BookingChat bookingId={selected.id} plumberAssigned={Boolean(selected.plumber_id)} /><p className="chat-inbox-hint">Prefer a full inbox view? Head to the <button type="button" className="link-btn" onClick={() => { setSelected(null); openMessages() }}>Messages tab</button>.</p></div>}
          {selected.plumber_id && <button type="button" className="booking-report-btn" onClick={() => { setReporting(selected); setSelected(null) }}><Icon name="close" size={13} /> Report this plumber</button>}
        </div></div>}
        {reviewing && <div className="modal-backdrop" onClick={() => setReviewing(null)}><div className="modal-card" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setReviewing(null)}>×</button><span className="eyebrow">COMPLETED BOOKING</span><h2>Rate {reviewing.plumber_name}</h2><p className="booking-intro">Your rating helps customers understand the real service experience.</p><form onSubmit={submitReview} className="review-form"><label>Rating<select value={review.rating} onChange={e => setReview({ ...review, rating: e.target.value })}><option value="5">5 — Excellent</option><option value="4">4 — Good</option><option value="3">3 — Average</option><option value="2">2 — Needs improvement</option><option value="1">1 — Poor</option></select></label><label>Comment<textarea rows="4" value={review.comment} onChange={e => setReview({ ...review, comment: e.target.value })} placeholder="Share a short, honest review." /></label><button className="dashboard-action" disabled={reviewBusy}>{reviewBusy ? 'Submitting…' : 'Submit review'}</button></form></div></div>}
        {reporting && <ReportPlumberModal plumberId={reporting.plumber_id} bookingId={reporting.id} onClose={() => setReporting(null)} />}
      </div>
    </div>
  );
}
export default CustomerDashboard;
