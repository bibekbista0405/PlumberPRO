import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { updateSettings } from '../api/settingsApi';

import ServiceIcon from '../components/ServiceIcon';
import Icon from '../components/Icon';
import Stars from '../components/Stars';
import NotificationBell from '../components/NotificationBell';
import DashboardWatermark from '../components/DashboardWatermark';
import { useAutoRefresh } from '../hooks/useAutoRefresh';
import { useConfirm } from '../context/ConfirmContext';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { useSettings } from '../context/SettingsContext';

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
  { key: 'settings', label: 'Settings', icon: 'settings' },
];

// Sidebar grouping: related tools sit together so the nav reads as a map of
// the job (what's happening, who is involved, what the site says).
const NAV_GROUPS = [
  { label: 'Workspace', items: ['overview', 'analytics'] },
  { label: 'Operations', items: ['bookings', 'plumbers', 'users', 'support'] },
  { label: 'Content', items: ['services', 'feedback'] },
  { label: 'System', items: ['settings'] },
];
const TAB_BY_KEY = Object.fromEntries(TABS.map((t) => [t.key, t]));
const GROUP_OF = Object.fromEntries(NAV_GROUPS.flatMap((g) => g.items.map((k) => [k, g.label])));
const SEARCHABLE_TABS = ['bookings', 'users', 'plumbers', 'support', 'feedback'];
const TAB_META = {
  overview: 'A live snapshot of bookings, people and support activity.',
  bookings: 'Assign plumbers and move every job through its stages.',
  users: 'Customer, plumber and admin accounts in one place.',
  plumbers: 'Review profiles and decide who gets the verified badge.',
  services: 'The service catalogue customers book from.',
  support: 'Reports and contact messages that need a response.',
  feedback: 'Moderate what customers and plumbers say about the platform.',
  analytics: 'Trends across bookings and activity over time.',
  settings: 'Site-wide switches that change what visitors see.',
};

const BOOKING_FILTERS = {
  all: { label: 'All', test: () => true },
  needs: { label: 'Needs plumber', test: (b) => !b.plumber_id && ['pending', 'assigned'].includes(b.status) },
  active: { label: 'In progress', test: (b) => ['assigned', 'confirmed', 'on_the_way', 'arrived', 'in_progress'].includes(b.status) },
  done: { label: 'Completed', test: (b) => ['completed', 'reviewed'].includes(b.status) },
  closed: { label: 'Cancelled', test: (b) => ['cancelled', 'rejected', 'expired'].includes(b.status) },
};
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
  const [navOpen, setNavOpen] = useState(false);
  const [bookingFilter, setBookingFilter] = useState('all');
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    try { return window.localStorage.getItem('plumbpro:admin-collapsed') === '1'; } catch { return false; }
  });
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

  const load = useCallback(async (opts = {}) => {
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
  }, [analyticsRange]);

  useEffect(() => { load(); }, [load]);
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
      BOOKING_FILTERS[bookingFilter].test(b)
      && `${b.customer_name} ${b.customer_email || ''} ${b.service_name} ${b.status} ${b.address}`.toLowerCase().includes(q)
    );
  }, [bookings, query, bookingFilter]);

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
    setNavOpen(false);
  };

  const toggleCollapsed = () => {
    setCollapsed((v) => {
      try { window.localStorage.setItem('plumbpro:admin-collapsed', v ? '0' : '1'); } catch { /* storage unavailable */ }
      return !v;
    });
  };

  // Ctrl/Cmd+K opens quick jump from anywhere in the console; Escape closes overlays.
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPaletteOpen((v) => !v); }
      else if (e.key === 'Escape') setNavOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const commands = [
    ...TABS.map((t) => ({ id: `go-${t.key}`, label: t.label, group: 'Go to', hint: GROUP_OF[t.key], icon: t.icon, keywords: TAB_META[t.key], run: () => switchTab(t.key) })),
    { id: 'refresh', label: 'Refresh data', group: 'Actions', icon: 'refresh', run: () => load() },
    { id: 'theme', label: isDark ? 'Switch to light mode' : 'Switch to dark mode', group: 'Actions', icon: isDark ? 'sun' : 'moon', keywords: 'theme appearance', run: toggleTheme },
    { id: 'site', label: 'Back to website', group: 'Actions', icon: 'arrowUpRight', run: () => navigate('/') },
    { id: 'logout', label: 'Log out', group: 'Actions', icon: 'logout', run: handleLogout },
  ];

  // -- Render --------------------------------------------------------------

  return (
    <div className={`admin-container ${collapsed ? 'rail' : ''}`}>
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
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
        open={navOpen}
        onClose={() => setNavOpen(false)}
      />

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} commands={commands} />

      <main className="admin-main">
        <AdminHeader
          title={activeTabLabel}
          group={GROUP_OF[tab]}
          subtitle={TAB_META[tab]}
          showSearch={SEARCHABLE_TABS.includes(tab)}
          query={query}
          onQueryChange={setQuery}
          onClearQuery={() => setQuery('')}
          onRefresh={() => load()}
          loading={loading}
          onOpenNav={() => setNavOpen(true)}
          onOpenPalette={() => setPaletteOpen(true)}
        />

        {error && <div className="form-error">{error}</div>}

        {loading ? (
          <div className="admin-loading"><span className="spinner" />Loading live data…</div>
        ) : (
          <div key={tab} className="admin-tab-content">
            {tab === 'overview' && (
              <OverviewTab
                queue={[
                  { key: 'needs', icon: 'bookings', tone: 'amber', count: bookings.filter(BOOKING_FILTERS.needs.test).length, title: 'Bookings need a plumber', text: 'Assign someone so the customer is not left waiting.', cta: 'Assign now', go: () => { setBookingFilter('needs'); switchTab('bookings'); } },
                  { key: 'verify', icon: 'shieldCheck', tone: 'green', count: plumbers.filter((p) => !p.verified && p.status === 'active').length, title: 'Plumbers awaiting verification', text: 'Review their details and decide on the badge.', cta: 'Review', go: () => switchTab('plumbers') },
                  { key: 'support', icon: 'message', tone: 'blue', count: supportBadge, title: 'Support items to answer', text: 'New contact messages and plumber reports.', cta: 'Open support', go: () => switchTab('support') },
                  { key: 'feedback', icon: 'star', tone: 'purple', count: pendingFeedbackCount, title: 'Feedback to moderate', text: 'Approve or hide what users submitted.', cta: 'Moderate', go: () => switchTab('feedback') },
                ]}
                stats={stats}
                bookings={bookings.slice(0, 8)}
                plumbers={plumbers}
                onStatus={changeBookingStatus}
                onNavigate={switchTab}
              />
            )}

            {tab === 'bookings' && (
              <Panel title="Bookings" text={`${filteredBookings.length} matching booking${filteredBookings.length === 1 ? '' : 's'}.`}>
                <div className="admin-pills" role="group" aria-label="Filter bookings">
                  {Object.entries(BOOKING_FILTERS).map(([key, f]) => (
                    <button key={key} type="button" className={bookingFilter === key ? 'on' : ''} aria-pressed={bookingFilter === key} onClick={() => setBookingFilter(key)}>
                      {f.label}<b>{bookings.filter(f.test).length}</b>
                    </button>
                  ))}
                </div>
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

            {tab === 'settings' && <SettingsTab />}
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

function Sidebar({ activeTab, onTabChange, supportBadge, pendingFeedbackCount, user, isDark, onToggleTheme, onRefresh, onLogout, collapsed, onToggleCollapse, open, onClose }) {
  const itemRefs = useRef({});
  const [glide, setGlide] = useState({ top: 0, height: 0, ready: false });

  useEffect(() => {
    const measure = () => {
      const el = itemRefs.current[activeTab];
      if (el) setGlide({ top: el.offsetTop, height: el.offsetHeight, ready: true });
    };
    measure();
    const t = setTimeout(measure, 320);
    window.addEventListener('resize', measure);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [activeTab, collapsed, open]);

  const badgeFor = (key) => (key === 'support' ? supportBadge : key === 'feedback' ? pendingFeedbackCount : 0);

  return (
    <>
      <div className={`sidebar-backdrop ${open ? 'show' : ''}`} onClick={onClose} aria-hidden="true" />
      <aside className={`sidebar ${collapsed ? 'collapsed' : ''} ${open ? 'open' : ''}`} aria-label="Admin navigation">
        <div className="admin-brand">
          <div className="admin-logo-surface">
            <img src="/plumbpro-mark.svg" alt="PlumbPro logo" />
          </div>
          <div className="admin-brand-text">
            <strong>Admin Console</strong>
            <span>Operations workspace</span>
          </div>
          <button type="button" className="sidebar-collapse" onClick={onToggleCollapse} title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
            <Icon name="panel" size={16} />
          </button>
          <button type="button" className="sidebar-close" onClick={onClose} aria-label="Close navigation">
            <Icon name="close" size={16} />
          </button>
        </div>

        <nav aria-label="Admin sections">
          <span className="sidebar-glide" style={{ transform: `translateY(${glide.top}px)`, height: `${glide.height}px`, opacity: glide.ready ? 1 : 0 }} aria-hidden="true" />
          {NAV_GROUPS.map((group) => (
            <div className="nav-group" key={group.label}>
              <span className="nav-group-label">{group.label}</span>
              {group.items.map((key) => {
                const { label, icon } = TAB_BY_KEY[key];
                const badge = badgeFor(key);
                return (
                  <button
                    key={key}
                    ref={(el) => { itemRefs.current[key] = el; }}
                    className={activeTab === key ? 'active' : ''}
                    onClick={() => onTabChange(key)}
                    title={collapsed ? label : undefined}
                    aria-current={activeTab === key ? 'page' : undefined}
                  >
                    <Icon name={icon} size={16} />
                    <span className="nav-label">{label}</span>
                    {badge > 0 && <em>{badge}</em>}
                  </button>
                );
              })}
            </div>
          ))}
        </nav>

        <div className="sidebar-foot">
          <div className="sidebar-account">
            <div className="sidebar-account-chip">{(user?.name || 'A').charAt(0).toUpperCase()}</div>
            <div className="sidebar-account-text">
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

          <Link to="/" className="sidebar-back-link" title="Back to website">
            <Icon name="chevronRight" size={13} className="flip" /> <span>Back to website</span>
          </Link>

          <button className="sidebar-logout" onClick={onLogout} title="Logout">
            <Icon name="logout" size={14} /> <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}

// ---------------------------------------------------------------------------
// Quick jump (Ctrl/Cmd + K)
// ---------------------------------------------------------------------------

function CommandPalette({ open, onClose, commands }) {
  const [q, setQ] = useState('');
  const [index, setIndex] = useState(0);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    setQ('');
    setIndex(0);
    const t = setTimeout(() => inputRef.current && inputRef.current.focus(), 30);
    return () => clearTimeout(t);
  }, [open]);

  const results = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return commands;
    const byLabel = commands.filter((c) => c.label.toLowerCase().includes(term));
    const byOther = commands.filter((c) => !byLabel.includes(c) && `${c.group} ${c.hint || ''} ${c.keywords || ''}`.toLowerCase().includes(term));
    return [...byLabel, ...byOther];
  }, [q, commands]);

  useEffect(() => { setIndex(0); }, [q]);
  useEffect(() => {
    const el = listRef.current && listRef.current.querySelector('[data-active="true"]');
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }, [index, results]);

  if (!open) return null;

  const run = (cmd) => { if (!cmd) return; onClose(); cmd.run(); };
  const onKeyDown = (e) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setIndex((i) => (results.length ? (i + 1) % results.length : 0)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setIndex((i) => (results.length ? (i - 1 + results.length) % results.length : 0)); }
    else if (e.key === 'Enter') { e.preventDefault(); run(results[index]); }
    else if (e.key === 'Escape') { e.preventDefault(); onClose(); }
  };

  let lastGroup = null;
  return (
    <div className="palette-backdrop" onMouseDown={onClose}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Quick jump" onMouseDown={(e) => e.stopPropagation()} onKeyDown={onKeyDown}>
        <div className="palette-input">
          <Icon name="search" size={17} />
          <input ref={inputRef} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Jump to a section or run an action…" aria-label="Search commands" />
          <kbd>Esc</kbd>
        </div>
        <div className="palette-list" ref={listRef} role="listbox">
          {results.length === 0 && <div className="palette-empty">Nothing matches “{q}”.</div>}
          {results.map((cmd, i) => {
            const header = cmd.group !== lastGroup ? <div className="palette-group" key={`g-${cmd.id}`}>{cmd.group}</div> : null;
            lastGroup = cmd.group;
            return (
              <React.Fragment key={cmd.id}>
                {header}
                <button type="button" role="option" aria-selected={i === index} data-active={i === index} className={`palette-item ${i === index ? 'active' : ''}`} onMouseEnter={() => setIndex(i)} onClick={() => run(cmd)}>
                  <span className="palette-icon"><Icon name={cmd.icon} size={15} /></span>
                  <span className="palette-label">{cmd.label}</span>
                  {cmd.hint && <span className="palette-hint">{cmd.hint}</span>}
                </button>
              </React.Fragment>
            );
          })}
        </div>
        <div className="palette-foot"><span><kbd>↑</kbd><kbd>↓</kbd> navigate</span><span><kbd>Enter</kbd> open</span><span><kbd>Ctrl</kbd><kbd>K</kbd> toggle</span></div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Header
// ---------------------------------------------------------------------------

function AdminHeader({ title, group, subtitle, showSearch, query, onQueryChange, onClearQuery, onRefresh, loading, onOpenNav, onOpenPalette }) {
  return (
    <header className="admin-top">
      <div className="admin-top-main">
        <button type="button" className="admin-menu-btn" onClick={onOpenNav} aria-label="Open navigation">
          <Icon name="menu" size={20} />
        </button>
        <div>
          <nav className="admin-crumbs" aria-label="Breadcrumb">
            <span>Admin</span><Icon name="chevronRight" size={11} /><span>{group}</span><Icon name="chevronRight" size={11} /><b>{title}</b>
          </nav>
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className="admin-tools">
        {showSearch && (
          <div className="admin-search">
            <Icon name="search" size={15} />
            <input value={query} onChange={(e) => onQueryChange(e.target.value)} placeholder={`Filter ${title.toLowerCase()}…`} aria-label={`Filter ${title.toLowerCase()}`} />
            {query && <button onClick={onClearQuery} aria-label="Clear search">×</button>}
          </div>
        )}
        <button type="button" className="palette-trigger" onClick={onOpenPalette}>
          <Icon name="search" size={14} /> <span>Quick jump</span><kbd>Ctrl K</kbd>
        </button>
        <button className="refresh-btn" onClick={onRefresh} disabled={loading}>
          <Icon name="refresh" size={14} /> <span>{loading ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>
    </header>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------

function OverviewTab({ queue, stats, bookings, plumbers, onStatus, onNavigate }) {
  const open = queue.filter((q) => q.count > 0);
  return (
    <>
      <section className={`action-queue ${open.length ? '' : 'clear'}`} aria-label="Needs attention">
        <header><h2>{open.length ? 'Needs your attention' : 'All clear'}</h2><p>{open.length ? 'The things waiting on an admin, most urgent first.' : 'Nothing is waiting on you right now.'}</p></header>
        {open.length > 0 && (
          <div className="action-queue-grid">
            {open.map((q) => (
              <button type="button" key={q.key} className={`aq-item tone-${q.tone}`} onClick={q.go}>
                <span className="aq-icon"><Icon name={q.icon} size={18} /></span>
                <span className="aq-body"><strong>{q.count}</strong><b>{q.title}</b><small>{q.text}</small></span>
                <span className="aq-cta">{q.cta} <Icon name="chevronRight" size={13} /></span>
              </button>
            ))}
          </div>
        )}
      </section>

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

function SettingsTab() {
  const { showServicePrices, setSettings } = useSettings();
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState('');
  const [failure, setFailure] = useState('');

  const togglePrices = async () => {
    const next = !showServicePrices;
    setSaving(true);
    setNotice('');
    setFailure('');
    try {
      const res = await updateSettings({ show_service_prices: next });
      setSettings((current) => ({ ...current, ...(res.settings || { show_service_prices: next }) }));
      setNotice(next ? 'Prices are now visible to visitors.' : 'Prices are now hidden from visitors.');
    } catch (err) {
      setFailure(err.message || 'Could not save the setting. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Panel title="Public website" text="Control what visitors see on the public pages.">
      <div className="setting-row">
        <div className="setting-copy">
          <strong>Show service prices</strong>
          <p>When this is off, prices are hidden on the Services page, the homepage service cards and the booking form. Prices you have entered are kept and still editable under Services.</p>
          <span className={`setting-state ${showServicePrices ? 'on' : 'off'}`}>{showServicePrices ? 'Visible to the public' : 'Hidden from the public'}</span>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={showServicePrices}
          aria-label="Show service prices on the public website"
          className={`switch ${showServicePrices ? 'on' : ''}`}
          onClick={togglePrices}
          disabled={saving}
        >
          <i />
        </button>
      </div>
      {notice && <div className="form-success">{notice}</div>}
      {failure && <div className="form-error">{failure}</div>}
      <div className="setting-links">
        <Link to="/services" target="_blank" rel="noreferrer">Preview the Services page <Icon name="arrowUpRight" size={13} /></Link>
      </div>
    </Panel>
  );
}

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
