import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/AdminDashboard.css';

import { getAdminBookings, updateAdminBooking } from '../api/bookingApi';
import {
  getAdminStats,
  getMessages,
  getPlumbers,
  getUsers,
  setUserStatus,
  verifyPlumber,
  updateMessage,
  createPlumber,
  getAnalytics,
} from '../api/adminApi';
import { getAllServices, createService, updateService, deleteService } from '../api/serviceApi';
import { getReports, updateReport, REPORT_REASONS } from '../api/reportApi';
import { getAllFeedback, updateFeedbackStatus } from '../api/feedbackApi';

import ServiceIcon from '../components/ServiceIcon';
import Icon from '../components/Icon';
import Stars from '../components/Stars';
import NotificationBell from '../components/NotificationBell';
import DashboardWatermark from '../components/DashboardWatermark';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

// ---------------------------------------------------------------------------
// Static config
// ---------------------------------------------------------------------------

const TABS = [
  { key: 'overview', label: 'Overview', icon: 'dashboard' },
  { key: 'bookings', label: 'Bookings', icon: 'bookings' },
  { key: 'users', label: 'Users', icon: 'users' },
  { key: 'plumbers', label: 'Plumbers', icon: 'briefcase' },
  { key: 'services', label: 'Services', icon: 'wrench' },
  { key: 'support', label: 'Support', icon: 'shield' },
  { key: 'feedback', label: 'Feedback', icon: 'star' },
  { key: 'analytics', label: 'Analytics', icon: 'chart' },
];

const BOOKING_STATUSES = [
  'pending', 'assigned', 'confirmed', 'on_the_way', 'arrived',
  'in_progress', 'completed', 'reviewed', 'cancelled', 'rejected', 'expired',
];

const ROLE_FILTERS = [
  ['all', 'All accounts'],
  ['admin', 'Admins'],
  ['plumber', 'Plumbers'],
  ['customer', 'Customers'],
];

const EMPTY_SERVICE_FORM = { name: '', description: '', price: '', is_negotiable: false, icon: '' };

const reasonLabel = (value) => REPORT_REASONS.find((r) => r.value === value)?.label || value;

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

function AdminDashboard() {
  const confirmAction = useConfirm();
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [tab, setTab] = useState('overview');
  const [query, setQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [stats, setStats] = useState({});
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [plumbers, setPlumbers] = useState([]);
  const [services, setServices] = useState([]);
  const [messages, setMessages] = useState([]);
  const [reports, setReports] = useState([]);
  const [feedback, setFeedback] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [analyticsRange, setAnalyticsRange] = useState(30);

  const [serviceForm, setServiceForm] = useState(EMPTY_SERVICE_FORM);
  const [editingService, setEditingService] = useState(null);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const load = async (opts = {}) => {
    if (!opts.silent) setLoading(true);
    setError('');
    try {
      const [statsRes, bookingsRes, usersRes, plumbersRes, servicesRes, messagesRes, reportsRes, analyticsRes, feedbackRes] =
        await Promise.all([
          getAdminStats(),
          getAdminBookings(),
          getUsers(),
          getPlumbers(),
          getAllServices(),
          getMessages(),
          getReports(),
          getAnalytics(analyticsRange),
          getAllFeedback(),
        ]);
      setStats(statsRes.stats || {});
      setBookings(bookingsRes.bookings || []);
      setUsers(usersRes.users || []);
      setPlumbers(plumbersRes.plumbers || []);
      setServices(servicesRes.services || []);
      setMessages(messagesRes.messages || []);
      setReports(reportsRes.reports || []);
      setAnalyticsData(analyticsRes);
      setFeedback(feedbackRes.feedback || []);
    } catch (err) {
      if (!opts.silent) setError(err.message);
    } finally {
      if (!opts.silent) setLoading(false);
    }
  };

  useEffect(() => { load(); /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [analyticsRange]);
  useAutoRefresh(() => load({ silent: true }), 40000);

  // -- Derived data ----------------------------------------------------------

  const usersByRole = useMemo(() => ({
    all: users,
    admin: users.filter((u) => u.role === 'admin'),
    plumber: users.filter((u) => u.role === 'plumber'),
    customer: users.filter((u) => u.role === 'customer'),
  }), [users]);

  const filteredUsers = useMemo(() => {
    const q = query.toLowerCase();
    return usersByRole[userRoleFilter].filter((u) =>
      `${u.name} ${u.email} ${u.phone || ''} ${u.role} ${u.status}`.toLowerCase().includes(q)
    );
  }, [usersByRole, userRoleFilter, query]);

  const filteredBookings = useMemo(() => {
    const q = query.toLowerCase();
    return bookings.filter((b) =>
      `${b.customer_name} ${b.customer_email || ''} ${b.service_name} ${b.status} ${b.address}`.toLowerCase().includes(q)
    );
  }, [bookings, query]);

  const filteredPlumbers = useMemo(() => {
    const q = query.toLowerCase();
    return plumbers.filter((p) =>
      `${p.name} ${p.email} ${p.phone || ''} ${p.profession || ''} ${p.location_name || ''} ${p.verified ? 'verified' : 'pending'}`
        .toLowerCase().includes(q)
    );
  }, [plumbers, query]);

  const filteredMessages = useMemo(() => {
    const q = query.toLowerCase();
    return messages.filter((m) => `${m.name} ${m.email} ${m.subject} ${m.status}`.toLowerCase().includes(q));
  }, [messages, query]);

  const filteredReports = useMemo(() => {
    const q = query.toLowerCase();
    return reports.filter((r) =>
      `${r.reporter_name} ${r.plumber_name} ${reasonLabel(r.reason)} ${r.status}`.toLowerCase().includes(q)
    );
  }, [reports, query]);

  const filteredFeedback = useMemo(() => {
    const q = query.toLowerCase();
    return feedback.filter((f) => `${f.user_name} ${f.role} ${f.comment || ''} ${f.status}`.toLowerCase().includes(q));
  }, [feedback, query]);

  const newMessageCount = messages.filter((m) => m.status === 'new').length;
  const openReportCount = reports.filter((r) => r.status === 'new').length;
  const supportBadge = newMessageCount + openReportCount;
  const pendingFeedbackCount = feedback.filter((f) => f.status === 'pending').length;
  const activeTabLabel = TABS.find((t) => t.key === tab)?.label || 'Overview';

  // -- Actions -----------------------------------------------------------

  const changeBookingStatus = async (id, value, plumberId) => {
    try {
      await updateAdminBooking(id, { status: value, plumber_id: plumberId || null });
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleUserStatus = async (id, currentStatus) => {
    const suspending = currentStatus === 'active';
    if (suspending) {
      const confirmed = await confirmAction({
        title: 'Suspend this account?',
        message: 'They will not be able to log in until you reactivate the account. This does not delete any of their data.',
        confirmLabel: 'Suspend account',
      });
      if (!confirmed) return;
    }
    try {
      await setUserStatus(id, suspending ? 'suspended' : 'active');
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changePlumberVerification = async (id, nextValue) => {
    if (!nextValue) {
      const confirmed = await confirmAction({
        title: 'Remove verification?',
        message: "This plumber will be hidden from public search results until they're re-verified.",
        confirmLabel: 'Remove verification',
      });
      if (!confirmed) return;
    }
    try {
      await verifyPlumber(id, nextValue);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeMessageStatus = async (id, value) => {
    if (value === 'archived') {
      const confirmed = await confirmAction({
        title: 'Archive this message?',
        message: "It will be moved out of the active inbox. You can still find it, but it won't show in the default list.",
        confirmLabel: 'Archive message',
      });
      if (!confirmed) return;
    }
    try {
      await updateMessage(id, value);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeReportStatus = async (id, value, note) => {
    try {
      await updateReport(id, value, note);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const changeFeedbackStatus = async (id, value) => {
    try {
      await updateFeedbackStatus(id, value);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveService = async (e) => {
    e.preventDefault();
    try {
      if (editingService) {
        await updateService(editingService.id, serviceForm);
      } else {
        await createService(serviceForm);
      }
      setEditingService(null);
      setServiceForm(EMPTY_SERVICE_FORM);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const startEditingService = (service) => {
    setEditingService(service);
    setServiceForm({
      name: service.name,
      description: service.description || '',
      price: service.price || '',
      is_negotiable: Boolean(service.is_negotiable),
      icon: service.icon || '',
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const removeService = async (service) => {
    const confirmed = await confirmAction({
      title: `Disable "${service.name}"?`,
      message: 'Customers will no longer be able to book this service. You can re-enable it later by editing it.',
      confirmLabel: 'Disable service',
    });
    if (!confirmed) return;
    try {
      await deleteService(service.id);
      load();
    } catch (err) {
      setError(err.message);
    }
  };

  const switchTab = (key) => {
    setTab(key);
    setQuery('');
    setUserRoleFilter('all');
  };

  // -- Render --------------------------------------------------------------

  return (
    <div className="admin-container">
      <Sidebar
        activeTab={tab}
        onTabChange={switchTab}
        supportBadge={supportBadge}
        pendingFeedbackCount={pendingFeedbackCount}
        user={user}
        isDark={isDark}
        onToggleTheme={toggleTheme}
        onRefresh={() => load()}
        onLogout={handleLogout}
      />

      <main className="admin-main">
        <AdminHeader
          title={activeTabLabel}
          showSearch={tab !== 'overview'}
          query={query}
          onQueryChange={setQuery}
          onClearQuery={() => setQuery('')}
          onRefresh={() => load()}
          loading={loading}
        />

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="admin-loading"><span className="spinner" />Loading live data…</div>
        ) : (
          <div key={tab} className="admin-tab-content">
            {tab === 'overview' && (
              <OverviewTab
                stats={stats}
                bookings={bookings.slice(0, 8)}
                plumbers={plumbers}
                onStatus={changeBookingStatus}
                onNavigate={switchTab}
              />
            )}

            {tab === 'bookings' && (
              <Panel title="Bookings" text={`${filteredBookings.length} matching booking${filteredBookings.length === 1 ? '' : 's'}.`}>
                <BookingTable bookings={filteredBookings} plumbers={plumbers} onStatus={changeBookingStatus} />
              </Panel>
            )}

            {tab === 'users' && (
              <UsersTab
                usersByRole={usersByRole}
                filteredUsers={filteredUsers}
                roleFilter={userRoleFilter}
                onRoleFilterChange={setUserRoleFilter}
                onToggleStatus={toggleUserStatus}
              />
            )}

            {tab === 'plumbers' && (
              <PlumbersTab
                plumbers={filteredPlumbers}
                onVerify={changePlumberVerification}
                onCreated={load}
              />
            )}

            {tab === 'services' && (
              <ServicesTab
                services={services}
                form={serviceForm}
                onFormChange={setServiceForm}
                editingService={editingService}
                onSubmit={saveService}
                onCancelEdit={() => { setEditingService(null); setServiceForm(EMPTY_SERVICE_FORM); }}
                onEdit={startEditingService}
                onRemove={removeService}
              />
            )}

            {tab === 'support' && (
              <SupportTab
                reports={filteredReports}
                messages={filteredMessages}
                onReportChange={changeReportStatus}
                onMessageChange={changeMessageStatus}
              />
            )}

            {tab === 'feedback' && (
              <FeedbackTab feedback={filteredFeedback} onChange={changeFeedbackStatus} />
            )}

            {tab === 'analytics' && (
              <AnalyticsTab data={analyticsData} range={analyticsRange} onRangeChange={setAnalyticsRange} />
            )}
          </div>
        )}

        <DashboardWatermark />
      </main>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Sidebar
// ---------------------------------------------------------------------------

function Sidebar({ activeTab, onTabChange, supportBadge, pendingFeedbackCount, user, isDark, onToggleTheme, onRefresh, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="admin-brand">
        <div className="admin-logo-surface">
          <img src="/plumbpro-mark.svg" alt="PlumbPro logo" />
        </div>
        <div>
          <strong>Admin Console</strong>
          <span>Operations workspace</span>
        </div>
      </div>

      <nav>
        {TABS.map(({ key, label, icon }) => (
          <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => onTabChange(key)}>
            <Icon name={icon} size={16} />
            {label}
            {key === 'support' && supportBadge > 0 && <em>{supportBadge}</em>}
            {key === 'feedback' && pendingFeedbackCount > 0 && <em>{pendingFeedbackCount}</em>}
          </button>
        ))}
      </nav>

      <div className="sidebar-foot">
        <div className="sidebar-account">
          <div className="sidebar-account-chip">{(user?.name || 'A').charAt(0).toUpperCase()}</div>
          <div>
            <strong>{user?.name}</strong>
            <span>{user?.email}</span>
          </div>
          <NotificationBell />
        </div>

        <div className="sidebar-icon-row">
          <button onClick={onToggleTheme} title={isDark ? 'Light mode' : 'Dark mode'}>
            <Icon name={isDark ? 'sun' : 'moon'} size={14} />
          </button>
          <button onClick={onRefresh} title="Refresh data">
            <Icon name="refresh" size={14} />
          </button>
        </div>

        <Link to="/" className="sidebar-back-link">
          <Icon name="chevronRight" size={13} className="flip" /> Back to website
        </Link>

        <button className="sidebar-logout" onClick={onLogout}>
          <Icon name="logout" size={14} /> Logout
        </button>
      </div>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function AdminHeader({ title, showSearch, query, onQueryChange, onClearQuery, onRefresh, loading }) {
  return (
    <header className="admin-top">
      <div>
        <span className="eyebrow">ADMINISTRATION</span>
        <h1>{title}</h1>
        <p>One workspace for the real data connected to your MySQL database.</p>
      </div>
      <div className="admin-tools">
        {showSearch && (
          <div className="admin-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={`Search ${title.toLowerCase()}…`} />
            {query && <button onClick={onClearQuery} aria-label="Clear search">×</button>}
          </div>
        )}
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" size={14} /> {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({ stats, bookings, plumbers, onStatus, onNavigate }) {
  return (
    <>
      <div className="stat-grid">
        <StatCard label="Customers" value={stats.customers || 0} icon="users" tone="blue" />
        <StatCard label="Plumbers" value={stats.plumbers || 0} icon="briefcase" tone="accent" />
        <StatCard label="Verified plumbers" value={stats.verified_plumbers || 0} icon="shieldCheck" tone="green" />
        <StatCard label="Bookings" value={stats.bookings || 0} icon="bookings" tone="primary" />
        <StatCard label="Pending" value={stats.pending || 0} icon="clock" tone="amber" />
        <StatCard label="Active jobs" value={stats.active || 0} icon="bolt" tone="purple" />
        <StatCard label="Completed" value={stats.completed || 0} icon="check" tone="green" />
        <StatCard label="New messages" value={stats.new_messages || 0} icon="message" tone="blue" />
      </div>

      <div className="overview-grid">
        <Panel title="Recent bookings" text="Latest live booking activity.">
          <BookingTable bookings={bookings} plumbers={plumbers} onStatus={onStatus} />
          <button className="panel-link" onClick={() => onNavigate('bookings')}>View all bookings →</button>
        </Panel>

        <Panel title="Quick actions" text="Jump directly to the most common admin tasks.">
          <div className="quick-actions">
            <QuickAction icon="users" title="Users" text="Manage customer and plumber accounts" onClick={() => onNavigate('users')} />
            <QuickAction icon="briefcase" title="Plumbers" text="Review and verify professional profiles" onClick={() => onNavigate('plumbers')} />
            <QuickAction icon="bookings" title="Bookings" text="Assign plumbers and update progress" onClick={() => onNavigate('bookings')} />
            <QuickAction icon="shield" title="Support" text="Handle reports and contact messages" onClick={() => onNavigate('support')} />
          </div>
        </Panel>
      </div>
    </>
  );
}

function QuickAction({ icon, title, text, onClick }) {
  return (
    <button onClick={onClick}>
      <span className="quick-action-icon"><Icon name={icon} size={15} /></span>
      <span><b>{title}</b><span>{text}</span></span>
      <span aria-hidden="true">→</span>
    </button>
  );
}

function StatCard({ label, value, icon, tone = 'primary' }) {
  return (
    <div className="stat-card">
      {icon && <span className={`stat-icon tone-${tone}`}><Icon name={icon} size={16} /></span>}
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Bookings table (shared by Overview + Bookings tab)
// ---------------------------------------------------------------------------

function BookingTable({ bookings, plumbers, onStatus }) {
  return (
    <div className="table-wrap admin-table">
      <table>
        <thead>
          <tr>
            <th>Customer</th>
            <th>Service</th>
            <th>Date</th>
            <th>Status</th>
            <th>Plumber</th>
          </tr>
        </thead>
        <tbody>
          {bookings.length === 0 ? <EmptyRow cols={5} /> : bookings.map((b) => (
            <tr key={b.id}>
              <td>
                <div className="customer-booking">
                  <strong>{b.customer_name}</strong>
                  <small>{b.customer_email || 'No email'}</small>
                </div>
              </td>
              <td>{b.service_name}</td>
              <td>
                {new Date(b.booking_date).toLocaleDateString()}
                <small className="subline">{String(b.booking_time).slice(0, 5)}</small>
              </td>
              <td>
                <select className="status-select" value={b.status} onChange={(e) => onStatus(b.id, e.target.value, b.plumber_id)}>
                  {BOOKING_STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                </select>
              </td>
              <td>
                <select
                  className="assignment-select"
                  value={b.plumber_id || ''}
                  onChange={(e) => { const id = Number(e.target.value); if (id) onStatus(b.id, 'assigned', id); }}
                >
                  <option value="">{b.plumber_name || 'Assign plumber'}</option>
                  {plumbers.filter((p) => p.status === 'active').map((p) => (
                    <option key={p.id} value={p.id}>{p.name}{p.verified ? ' ✓' : ''}</option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users tab
// ---------------------------------------------------------------------------

function UsersTab({ usersByRole, filteredUsers, roleFilter, onRoleFilterChange, onToggleStatus }) {
  return (
    <Panel title="User accounts" text="Browse by account type, or search by Gmail, name, phone, role or status. Email cells stay readable and can be copied or opened directly.">
      <div className="role-filter-pills">
        {ROLE_FILTERS.map(([key, label]) => (
          <button key={key} className={roleFilter === key ? 'active' : ''} onClick={() => onRoleFilterChange(key)}>
            {label}<em>{usersByRole[key].length}</em>
          </button>
        ))}
      </div>

      <div className="table-wrap admin-table">
        <table>
          <thead>
            <tr>
              <th>User</th><th>Email</th><th>Role</th><th>Phone</th><th>Status</th><th>Created</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.length === 0 ? <EmptyRow cols={7} /> : filteredUsers.map((u) => (
              <tr key={u.id}>
                <td>
                  <div className="person-cell">
                    <span>{(u.name || '?').charAt(0).toUpperCase()}</span>
                    <strong>{u.name}</strong>
                  </div>
                </td>
                <td>
                  <div className="email-cell">
                    <a href={`mailto:${u.email}`} title={u.email}>{u.email}</a>
                    <button onClick={() => navigator.clipboard?.writeText(u.email)}>Copy</button>
                  </div>
                </td>
                <td><span className="role-chip">{u.role}</span></td>
                <td>{u.phone || '—'}</td>
                <td><span className={`status status-${u.status}`}>{u.status}</span></td>
                <td>{new Date(u.created_at).toLocaleDateString()}</td>
                <td>
                  {u.role !== 'admin' && (
                    <button className="table-btn" onClick={() => onToggleStatus(u.id, u.status)}>
                      {u.status === 'active' ? 'Suspend' : 'Activate'}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Plumbers tab
// ---------------------------------------------------------------------------

function PlumbersTab({ plumbers, onVerify, onCreated }) {
  return (
    <>
      <Panel
        title="Plumber verification"
        text="Review professional details and decide which real plumber profiles get the verified badge. Unverified plumbers still appear in search — verification is a trust signal, not a visibility gate."
      >
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr>
                <th>Plumber</th><th>Professional</th><th>Location</th><th>Experience</th><th>Rating</th><th>Availability</th><th>Verification</th>
              </tr>
            </thead>
            <tbody>
              {plumbers.length === 0 ? <EmptyRow cols={7} /> : plumbers.map((p) => (
                <tr key={p.id}>
                  <td>
                    <div className="person-cell">
                      <span>{p.name?.charAt(0) || 'P'}</span>
                      <strong>{p.name}</strong>
                    </div>
                    <small className="subline">{p.email}</small>
                  </td>
                  <td>
                    {p.profession || '—'}
                    <small className="subline">{p.work_mode === 'team' ? 'Team' : 'Solo'} · {p.education || 'Training not listed'}</small>
                  </td>
                  <td>
                    {p.location_name || '—'}
                    <small className="subline">{p.can_travel ? 'Can travel' : 'Local only'}</small>
                  </td>
                  <td>{Number(p.experience_years || 0)} yrs</td>
                  <td><Stars rating={p.rating} count={p.review_count} /></td>
                  <td><span className={`status ${p.available ? 'status-active' : 'status-suspended'}`}>{p.available ? 'Available' : 'Unavailable'}</span></td>
                  <td>
                    <button className={`table-btn ${p.verified ? 'danger' : ''}`} onClick={() => onVerify(p.id, !p.verified)}>
                      {p.verified ? 'Remove verification' : 'Verify plumber'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Create plumber account" text="Admins can create a plumber login for professionals who prefer to be onboarded directly.">
        <PlumberCreateForm onCreated={onCreated} />
      </Panel>
    </>
  );
}

function PlumberCreateForm({ onCreated }) {
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '', profession: '', location_name: '' });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const save = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await createPlumber(form);
      setForm({ name: '', email: '', phone: '', password: '', profession: '', location_name: '' });
      onCreated();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <form className="admin-form-grid" onSubmit={save}>
        <input placeholder="Full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <input type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
        <input placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
        <input type="password" minLength="6" placeholder="Temporary password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
        <input placeholder="Profession" value={form.profession} onChange={(e) => setForm({ ...form, profession: e.target.value })} required />
        <input placeholder="Service area" value={form.location_name} onChange={(e) => setForm({ ...form, location_name: e.target.value })} required />
        <button className="primary-action" disabled={busy}>{busy ? 'Creating…' : 'Create plumber'}</button>
      </form>
      {error && <div className="form-error">{error}</div>}
    </>
  );
}

// ---------------------------------------------------------------------------
// Services tab
// ---------------------------------------------------------------------------

function ServicesTab({ services, form, onFormChange, editingService, onSubmit, onCancelEdit, onEdit, onRemove }) {
  return (
    <>
      <Panel
        title={editingService ? 'Edit service' : 'Add service'}
        text="This catalog powers the public Services section. Mark a service negotiable to show 'Negotiable at the job' instead of a fixed number."
      >
        <form className="admin-form-grid" onSubmit={onSubmit}>
          <input placeholder="Service name" value={form.name} onChange={(e) => onFormChange({ ...form, name: e.target.value })} required />
          <input
            type="number" min="0" placeholder="Price (NPR)" value={form.price} disabled={form.is_negotiable}
            onChange={(e) => onFormChange({ ...form, price: e.target.value })}
          />
          <label className="negotiable-toggle">
            <input type="checkbox" checked={form.is_negotiable} onChange={(e) => onFormChange({ ...form, is_negotiable: e.target.checked })} />
            Negotiable — price agreed at the job, no fixed number
          </label>
          <input className="wide-field" placeholder="Description" value={form.description} onChange={(e) => onFormChange({ ...form, description: e.target.value })} required />
          <button className="primary-action">{editingService ? 'Save changes' : 'Add service'}</button>
          {editingService && <button type="button" className="secondary-action" onClick={onCancelEdit}>Cancel</button>}
        </form>
      </Panel>

      <Panel title="Service catalog" text={`${services.length} configured services.`}>
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr><th>Service</th><th>Description</th><th>Price</th><th>Status</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {services.length === 0 ? <EmptyRow cols={5} /> : services.map((s) => (
                <tr key={s.id}>
                  <td><div className="service-cell"><ServiceIcon name={s.name} size={17} /><strong>{s.name}</strong></div></td>
                  <td className="description-cell">{s.description}</td>
                  <td>{s.is_negotiable ? <span className="negotiable-pill">Negotiable at the job</span> : `NPR ${Number(s.price || 0).toLocaleString()}`}</td>
                  <td><span className={`status status-${s.status}`}>{s.status}</span></td>
                  <td>
                    <button className="table-btn" onClick={() => onEdit(s)}>Edit</button>
                    {s.status === 'active' && <button className="table-btn danger" onClick={() => onRemove(s)}>Disable</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

// ---------------------------------------------------------------------------
// Support tab (reports + contact inbox)
// ---------------------------------------------------------------------------

function SupportTab({ reports, messages, onReportChange, onMessageChange }) {
  return (
    <>
      <Panel
        title="Plumber reports"
        text="Reports submitted by customers about a specific plumber. Investigate before taking action — you can suspend the plumber's account from the Plumbers or Users tab."
      >
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr><th>Reported plumber</th><th>Reported by</th><th>Reason</th><th>Details</th><th>Status</th><th>Received</th><th>Action</th></tr>
            </thead>
            <tbody>
              {reports.length === 0 ? <EmptyRow cols={7} /> : reports.map((r) => {
                const statusTone = r.status === 'new' ? 'pending' : r.status === 'investigating' ? 'confirmed' : r.status === 'resolved' ? 'completed' : 'cancelled';
                return (
                  <tr key={r.id}>
                    <td><strong>{r.plumber_name}</strong><small className="subline">{r.plumber_email}</small></td>
                    <td>{r.reporter_name}<small className="subline">{r.reporter_email}</small></td>
                    <td><span className="status status-pending">{reasonLabel(r.reason)}</span></td>
                    <td className="message-preview" title={r.description}>{r.description || '—'}</td>
                    <td><span className={`status status-${statusTone}`}>{r.status}</span></td>
                    <td>{new Date(r.created_at).toLocaleString()}</td>
                    <td><ReportResolver report={r} onChange={onReportChange} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel title="Contact inbox" text="Every contact form submission is stored here. Work through messages and update their status as you handle them.">
        <div className="table-wrap admin-table">
          <table>
            <thead>
              <tr><th>Sender</th><th>Email</th><th>Subject</th><th>Message</th><th>Status</th><th>Received</th><th>Action</th></tr>
            </thead>
            <tbody>
              {messages.length === 0 ? <EmptyRow cols={7} /> : messages.map((m) => (
                <tr key={m.id}>
                  <td><strong>{m.name}</strong></td>
                  <td><div className="email-cell"><a href={`mailto:${m.email}`}>{m.email}</a></div></td>
                  <td>{m.subject}</td>
                  <td className="message-preview" title={m.message}>{m.message}</td>
                  <td><span className={`status status-${m.status}`}>{m.status}</span></td>
                  <td>{new Date(m.created_at).toLocaleString()}</td>
                  <td>
                    <select value={m.status} onChange={(e) => onMessageChange(m.id, e.target.value)}>
                      <option value="new">New</option>
                      <option value="read">Read</option>
                      <option value="resolved">Resolved</option>
                      <option value="archived">Archived</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </>
  );
}

function ReportResolver({ report, onChange }) {
  const [status, setStatus] = useState(report.status);
  const [note, setNote] = useState(report.resolution_note || '');
  const [open, setOpen] = useState(false);

  const apply = () => {
    onChange(report.id, status, note || undefined);
    setOpen(false);
  };

  return (
    <div className="report-resolver">
      <select value={status} onChange={(e) => { setStatus(e.target.value); setOpen(true); }}>
        <option value="new">New</option>
        <option value="investigating">Investigating</option>
        <option value="resolved">Resolved</option>
        <option value="dismissed">Dismissed</option>
      </select>
      {(open || report.resolution_note) && (
        <textarea rows="2" placeholder="Resolution note (sent to the reporter)" value={note} onChange={(e) => { setNote(e.target.value); setOpen(true); }} />
      )}
      {open && <button type="button" className="table-btn" onClick={apply}>Save</button>}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Feedback tab
// ---------------------------------------------------------------------------

function FeedbackTab({ feedback, onChange }) {
  return (
    <Panel
      title="Platform feedback"
      text={`Feedback customers and plumbers leave about PlumbPro itself. Approve the ones worth featuring — they'll appear in "What customers say" on the homepage.`}
    >
      <div className="table-wrap admin-table">
        <table>
          <thead>
            <tr><th>From</th><th>Role</th><th>Rating</th><th>Comment</th><th>Status</th><th>Received</th><th>Action</th></tr>
          </thead>
          <tbody>
            {feedback.length === 0 ? <EmptyRow cols={7} /> : feedback.map((f) => {
              const statusTone = f.status === 'pending' ? 'pending' : f.status === 'approved' ? 'completed' : 'cancelled';
              return (
                <tr key={f.id}>
                  <td><strong>{f.user_name}</strong></td>
                  <td><span className="role-chip">{f.role}</span></td>
                  <td><Stars rating={f.rating} count={1} showCount={false} /></td>
                  <td className="message-preview" title={f.comment}>{f.comment || '—'}</td>
                  <td><span className={`status status-${statusTone}`}>{f.status}</span></td>
                  <td>{new Date(f.created_at).toLocaleString()}</td>
                  <td>
                    <select value={f.status} onChange={(e) => onChange(f.id, e.target.value)}>
                      <option value="pending">Pending</option>
                      <option value="approved">Approved — show on homepage</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Panel>
  );
}

// ---------------------------------------------------------------------------
// Analytics tab
// ---------------------------------------------------------------------------

function AnalyticsTab({ data, range, onRangeChange }) {
  if (!data) return <div className="empty-state">Loading analytics…</div>;

  const totals = data.totals || {};
  const days = [...new Set((data.daily || []).map((d) => d.day))].sort();
  const byDay = (name) => days.map((day) => (data.daily || []).find((d) => d.day === day && d.event_name === name)?.total || 0);
  const created = byDay('booking_created');
  const searches = byDay('plumber_search');
  const maxVal = Math.max(1, ...created, ...searches);

  return (
    <>
      <div className="section-heading">
        <div><h2>Product analytics</h2><p>Self-hosted — real events from real use, no third-party service.</p></div>
        <select value={range} onChange={(e) => onRangeChange(Number(e.target.value))}>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      <div className="stat-grid">
        <StatCard label="Searches" value={totals.searches || 0} />
        <StatCard label="Bookings created" value={totals.bookings_created || 0} />
        <StatCard label="Bookings completed" value={totals.bookings_completed || 0} />
        <StatCard label="New accounts" value={totals.registrations || 0} />
        <StatCard label="Reviews left" value={totals.reviews || 0} />
      </div>

      <div className="overview-grid">
        <Panel title="Conversion" text="What share of activity moves to the next stage of the funnel.">
          <div className="conversion-rows">
            <div><span>Search → booking</span><strong>{data.conversion?.search_to_booking != null ? `${data.conversion.search_to_booking}%` : '—'}</strong></div>
            <div><span>Booking → completed</span><strong>{data.conversion?.booking_to_completed != null ? `${data.conversion.booking_to_completed}%` : '—'}</strong></div>
          </div>
        </Panel>

        <Panel title="Daily activity" text="Searches and new bookings per day.">
          {days.length === 0 ? (
            <div className="empty-state">Not enough data yet for a trend.</div>
          ) : (
            <div className="mini-chart">
              {days.map((day, i) => {
                const searchHeight = Math.round((searches[i] / maxVal) * 10) * 10;
                const createdHeight = Math.round((created[i] / maxVal) * 10) * 10;
                return (
                  <div key={day} className="mini-chart-col" title={`${day}: ${created[i]} bookings, ${searches[i]} searches`}>
                    <div className={`mini-bar mini-bar-search bar-h-${searchHeight}`} />
                    <div className={`mini-bar mini-bar-booking bar-h-${createdHeight}`} />
                  </div>
                );
              })}
            </div>
          )}
          <div className="mini-chart-legend">
            <span><i className="dot-primary" /> Bookings</span>
            <span><i className="dot-accent" /> Searches</span>
          </div>
        </Panel>
      </div>
    </>
  );
}

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function Panel({ title, text, children }) {
  return (
    <section className="admin-panel">
      <div className="panel-heading">
        <div><h2>{title}</h2><p>{text}</p></div>
      </div>
      {children}
    </section>
  );
}

function EmptyRow({ cols }) {
  return <tr><td colSpan={cols}><div className="empty-state">No records found.</div></td></tr>;
}

export default AdminDashboard;
