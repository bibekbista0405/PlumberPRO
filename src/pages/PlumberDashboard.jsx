import React, { useEffect, useState } from 'react';
import '../styles/CustomerDashboard.css';
import '../styles/BookingChat.css';
import '../styles/MessagesInbox.css';
import Icon from '../components/Icon';
import { useAuth } from '../context/AuthContext';
import { getPlumberBookings, updatePlumberBooking, uploadCompletionPhoto } from '../api/bookingApi';
import { getMyPlumberProfile, updateMyPlumberProfile, uploadPlumberPhoto } from '../api/plumberApi';
import { getUnreadMessageCount } from '../api/messageApi';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import NewAccountWelcome from '../components/NewAccountWelcome';
import VerificationChecklist from '../components/VerificationChecklist';
import BookingChat from '../components/BookingChat';
import MessagesInbox from '../components/MessagesInbox';
import DashboardTopbar from '../components/DashboardTopbar';
import FeedbackPrompt from '../components/FeedbackPrompt';
import DashboardWatermark from '../components/DashboardWatermark';

const tabs = [['overview', 'Overview', 'dashboard'], ['jobs', 'Jobs', 'briefcase'], ['messages', 'Messages', 'message'], ['profile', 'Profile', 'users']];

function PlumberDashboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState('overview');
  const [bookings, setBookings] = useState([]); const [profile, setProfile] = useState(null); const [loading, setLoading] = useState(true); const [saving, setSaving] = useState(false); const [error, setError] = useState(''); const [message, setMessage] = useState(''); const [photoBusy, setPhotoBusy] = useState(false); const [selected, setSelected] = useState(null); const [completionBusy, setCompletionBusy] = useState(false); const [unreadMessages, setUnreadMessages] = useState(0);
  const loadBookings = (opts = {}) => getPlumberBookings().then(b => { setBookings(b.bookings || []); if (selected) setSelected(prev => b.bookings.find(x => x.id === prev.id) || prev) }).catch(e => { if (!opts.silent) setError(e.message) });
  const loadUnread = () => getUnreadMessageCount().then(d => setUnreadMessages(d.unread || 0)).catch(() => {});
  const load = async () => { setLoading(true); setError(''); try { const [b, p] = await Promise.all([getPlumberBookings(), getMyPlumberProfile()]); setBookings(b.bookings || []); setProfile(p.profile); } catch (e) { setError(e.message) } finally { setLoading(false) } };
  useEffect(() => { load(); loadUnread(); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Only bookings/messages are polled in the background — the profile form is left alone while the plumber may be mid-edit.
  useAutoRefresh(() => { loadBookings({ silent: true }); loadUnread(); });
  const update = async (id, status) => { setError(''); try { await updatePlumberBooking(id, status); load() } catch (e) { setError(e.message) } };
  const saveProfile = async e => { e.preventDefault(); setSaving(true); setError(''); setMessage(''); try { const data = await updateMyPlumberProfile(profile); setProfile(data.profile); setMessage('Profile updated. Verification status is controlled by the platform.') } catch (e) { setError(e.message) } finally { setSaving(false) } };
  const changePhoto = async e => { const file = e.target.files?.[0]; if (!file) return; setPhotoBusy(true); setError(''); try { const data = await uploadPlumberPhoto(file); setProfile(v => ({ ...v, photo_url: data.photo_url })) } catch (err) { setError(err.message) } finally { setPhotoBusy(false); e.target.value = '' } };
  const addCompletionPhoto = async (id, file) => { if (!file) return; setCompletionBusy(true); setError(''); try { await uploadCompletionPhoto(id, file); load() } catch (err) { setError(err.message) } finally { setCompletionBusy(false) } };
  const active = bookings.filter(b => ['confirmed', 'on_the_way', 'arrived', 'in_progress', 'assigned'].includes(b.status)).length; const completed = bookings.filter(b => b.status === 'completed' || b.status === 'reviewed').length;
  const recentJobs = bookings.slice(0, 5);

  return <div className="dashboard-app">
    <DashboardTopbar roleLabel="Plumber Workspace" tabs={tabs} activeTab={tab} onTabChange={key => { setTab(key); if (key === 'messages') loadUnread(); }} unreadMessages={unreadMessages} />
    <div className={`dashboard-shell customer-dashboard plumber-dashboard ${tab === 'messages' ? 'dash-shell-full' : ''}`}>
      {tab === 'overview' && <NewAccountWelcome role="plumber" />}
      {tab === 'overview' && (
        <div className="dashboard-header"><div><span className="eyebrow">PLUMBER WORKSPACE</span><h1>Welcome, {user?.name?.split(' ')[0]}</h1><p>Manage your profile, availability, assigned jobs and customer messages.</p></div><span className={`verification-pill ${profile?.verified ? 'verified' : 'pending'}`}>{profile?.verified && <Icon name="check" size={13} />}{profile?.verified ? 'Verified profile' : 'Pending verification'}</span></div>
      )}
      {error && <div className="form-error">{error}</div>}{message && <div className="form-success">{message}</div>}
      {tab === 'overview' && (
        <div className="dashboard-cards"><div className="dashboard-card"><span>Assigned jobs</span><strong>{bookings.length}</strong></div><div className="dashboard-card"><span>Active jobs</span><strong>{active}</strong></div><div className="dashboard-card"><span>Completed</span><strong>{completed}</strong></div><div className="dashboard-card"><span>Rating</span><strong>{Number(profile?.rating || 0).toFixed(1)} <small><Icon name="star" size={14} filled /></small></strong></div></div>
      )}

      {tab === 'overview' && (
        <div className="dash-section-page">
          <VerificationChecklist profile={profile} completedJobs={completed} />
          <FeedbackPrompt role="plumber" hasCompletedWork={completed > 0} />
          <section className="booking-history"><div className="section-heading"><div><h2>Recent jobs</h2><p>Your latest assigned bookings.</p></div><button onClick={() => setTab('jobs')}>View all</button></div>{loading ? <div className="empty-state">Loading jobs…</div> : recentJobs.length === 0 ? <div className="empty-state">No jobs have been assigned to you yet.</div> : <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Service</th><th>Date</th><th>Status</th><th>Action</th></tr></thead><tbody>{recentJobs.map(b => <tr key={b.id}><td><strong>{b.customer_name}</strong></td><td>{b.service_name}</td><td>{new Date(b.booking_date).toLocaleDateString()}</td><td><span className={`status status-${b.status}`}>{b.status.replace('_', ' ')}</span></td><td><button className="table-btn" onClick={() => setSelected(b)}>View</button></td></tr>)}</tbody></table></div>}</section>
          <DashboardWatermark />
        </div>
      )}

      {tab === 'jobs' && (
        <section className="booking-history dash-section-page"><div className="section-heading"><div><h2>Assigned jobs</h2><p>Only bookings assigned to your plumber account are shown here.</p></div><button onClick={() => load()}><Icon name="refresh" size={13} /> Refresh</button></div>{loading ? <div className="empty-state">Loading jobs…</div> : bookings.length === 0 ? <div className="empty-state">No jobs have been assigned to you yet.</div> : <div className="table-wrap"><table><thead><tr><th>Customer</th><th>Service</th><th>Date</th><th>Address</th><th>Status</th><th>Actions</th></tr></thead><tbody>{bookings.map(b => <tr key={b.id}><td><strong>{b.customer_name}</strong><small className="time-line">{b.customer_email}</small></td><td>{b.service_name}</td><td>{new Date(b.booking_date).toLocaleDateString()}</td><td>{b.address}</td><td><span className={`status status-${b.status}`}>{b.status.replace('_', ' ')}</span></td><td><button className="table-btn" onClick={() => setSelected(b)}>View</button>{b.status === 'assigned' && <button className="table-btn" onClick={() => update(b.id, 'confirmed')}>Accept</button>}{b.status === 'confirmed' && <button className="table-btn" onClick={() => update(b.id, 'on_the_way')}>On the way</button>}{b.status === 'on_the_way' && <button className="table-btn" onClick={() => update(b.id, 'arrived')}>Arrived</button>}{b.status === 'arrived' && <button className="table-btn" onClick={() => update(b.id, 'in_progress')}>Start job</button>}{b.status === 'in_progress' && <button className="table-btn" onClick={() => update(b.id, 'completed')}>Mark complete</button>}{b.status === 'assigned' && <button className="table-btn danger" onClick={() => update(b.id, 'rejected')}>Reject</button>}{['confirmed', 'on_the_way', 'arrived'].includes(b.status) && <button className="table-btn danger" onClick={() => update(b.id, 'cancelled')}>Cancel</button>}</td></tr>)}</tbody></table></div>}
        <DashboardWatermark />
        </section>
      )}

      {tab === 'messages' && (
        <div className="dash-section-page dash-section-fill">
          <MessagesInbox title="Messages" emptyHint="Once you accept an assigned job, you can message the customer here." />
          <DashboardWatermark thin />
        </div>
      )}

      {tab === 'profile' && profile && (
        <section className="profile-page dash-section-page">
          <div className="section-heading"><div><h2>Professional profile</h2><p>Keep your public service information accurate. Verified status is managed by the platform.</p></div></div>
          <div className="profile-layout">
            <aside className="profile-summary-card">
              <div className="profile-summary-photo">
                {profile.photo_url ? <img src={profile.photo_url} alt="Your profile" /> : <span>{(user?.name || 'P').charAt(0).toUpperCase()}</span>}
                <label className="profile-photo-edit" title="Change photo">
                  {photoBusy ? <Icon name="refresh" size={14} /> : <Icon name="camera" size={14} />}
                  <input type="file" accept="image/jpeg,image/png,image/webp" onChange={changePhoto} disabled={photoBusy} hidden />
                </label>
              </div>
              <strong className="profile-summary-name">{user?.name}</strong>
              <span className="profile-summary-role">{profile.profession || 'Plumbing professional'}</span>
              <span className={`verification-pill ${profile.verified ? 'verified' : 'pending'}`}>{profile.verified && <Icon name="check" size={12} />}{profile.verified ? 'Verified' : 'Pending verification'}</span>
              <div className="profile-summary-stats">
                <div><strong>{Number(profile.rating || 0).toFixed(1)}</strong><span>Rating</span></div>
                <div><strong>{completed}</strong><span>Jobs done</span></div>
                <div><strong>{Number(profile.experience_years || 0)}</strong><span>Yrs exp.</span></div>
              </div>
              <p className="profile-photo-hint">{photoBusy ? 'Uploading…' : 'Tap the icon on your photo to update it. JPG, PNG or WEBP, up to 3MB.'}</p>
            </aside>

            <form onSubmit={saveProfile} className="profile-form-card">
              <div className="profile-form-section">
                <h3>Professional details</h3>
                <div className="profile-grid">
                  <label>Profession<input value={profile.profession || ''} onChange={e => setProfile({ ...profile, profession: e.target.value })} required /></label>
                  <label>Education / training<input value={profile.education || ''} onChange={e => setProfile({ ...profile, education: e.target.value })} /></label>
                  <label>Certifications<input value={profile.certifications || ''} onChange={e => setProfile({ ...profile, certifications: e.target.value })} placeholder="e.g. Licensed plumber, safety training" /></label>
                  <label>Experience (years)<input type="number" min="0" step="0.5" value={profile.experience_years || 0} onChange={e => setProfile({ ...profile, experience_years: e.target.value })} /></label>
                  <label>Work model<select value={profile.work_mode || 'solo'} onChange={e => setProfile({ ...profile, work_mode: e.target.value })}><option value="solo">Solo</option><option value="team">Team</option></select></label>
                </div>
              </div>

              <div className="profile-form-section">
                <h3>Service area &amp; availability</h3>
                <div className="profile-grid">
                  <label>Service area<input value={profile.location_name || ''} onChange={e => setProfile({ ...profile, location_name: e.target.value })} required /></label>
                  <label>Service radius<select value={profile.service_radius_km || 15} onChange={e => setProfile({ ...profile, service_radius_km: e.target.value })}><option value="10">10 km</option><option value="15">15 km</option><option value="25">25 km</option><option value="50">50 km</option></select></label>
                </div>
                <div className="profile-toggle-row">
                  <label className={`profile-toggle ${profile.available ? 'on' : ''}`}><input type="checkbox" checked={!!profile.available} onChange={e => setProfile({ ...profile, available: e.target.checked })} /><span className="profile-toggle-track"><span className="profile-toggle-thumb" /></span>I am currently available</label>
                  <label className={`profile-toggle ${profile.can_travel ? 'on' : ''}`}><input type="checkbox" checked={!!profile.can_travel} onChange={e => setProfile({ ...profile, can_travel: e.target.checked })} /><span className="profile-toggle-track"><span className="profile-toggle-thumb" /></span>I can travel to nearby areas</label>
                </div>
              </div>

              <div className="profile-form-section">
                <h3>Bio</h3>
                <label className="profile-bio-label">Professional bio<textarea rows="4" value={profile.bio || ''} onChange={e => setProfile({ ...profile, bio: e.target.value })} placeholder="Tell customers about your experience and approach to the job." /></label>
              </div>

              <div className="profile-form-actions"><button className="dashboard-action" disabled={saving}>{saving ? 'Saving…' : 'Save profile'}</button></div>
            </form>
          </div>
          <DashboardWatermark />
        </section>
      )}

      {selected && <div className="modal-backdrop" onClick={() => setSelected(null)}><div className="modal-card modal-wide" onClick={e => e.stopPropagation()}><button className="modal-close" onClick={() => setSelected(null)}>×</button><h2>Job #{selected.id}</h2><p><b>Customer:</b> {selected.customer_name} · {selected.customer_phone || selected.customer_email}</p><p><b>Service:</b> {selected.service_name}</p><p><b>Status:</b> {selected.status.replace('_', ' ')}</p><p><b>Date:</b> {new Date(selected.booking_date).toLocaleDateString()} at {String(selected.booking_time).slice(0, 5)}</p><p><b>Address:</b> {selected.address}</p><p><b>Description:</b> {selected.description || 'No additional description.'}</p>
        <div className="booking-photo-row">
          {selected.photo_url && <div className="booking-photo-block"><span>Customer's photo</span><img src={selected.photo_url} alt="Reported problem" /></div>}
          {selected.completion_photo_url && <div className="booking-photo-block"><span>Your completion photo</span><img src={selected.completion_photo_url} alt="Completed work" /></div>}
          {!selected.completion_photo_url && ['in_progress', 'completed'].includes(selected.status) && <label className="photo-upload-btn booking-photo-add">{completionBusy ? 'Uploading…' : 'Add a completion photo'}<input type="file" accept="image/jpeg,image/png,image/webp" hidden disabled={completionBusy} onChange={e => addCompletionPhoto(selected.id, e.target.files?.[0])} /></label>}
        </div>
        <div className="booking-chat-wrap"><h3>Messages</h3><BookingChat bookingId={selected.id} plumberAssigned={true} /><p className="chat-inbox-hint">Prefer a full inbox view? Head to the <button type="button" className="link-btn" onClick={() => { setSelected(null); setTab('messages'); loadUnread() }}>Messages tab</button>.</p></div>
      </div></div>}
    </div>
  </div>;
}
export default PlumberDashboard;
