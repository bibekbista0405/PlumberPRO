import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import Icon from './Icon';
import '../styles/DashboardTopbar.css';

// The dashboard is a deliberately separate "app mode" from the marketing
// site: no site nav, no footer, nothing to click into by accident while
// managing a real booking. The only way back to the public site is the
// explicit link below — never implicit through the brand mark, so a tap
// meant for the dashboard can't accidentally leave it.
function DashboardTopbar({ roleLabel, tabs, activeTab, onTabChange, unreadMessages = 0 }) {
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/'); };

  return (
    <header className="dash-topbar">
      <div className="dash-topbar-row">
        <div className="dash-topbar-brand">
          <img src="/plumbpro-mark.svg" alt="" />
          <div><strong>PlumbPro</strong><span>{roleLabel}</span></div>
        </div>

        <button className={`dash-topbar-hamburger ${menuOpen ? 'active' : ''}`} aria-label="Toggle menu" onClick={() => setMenuOpen(v => !v)}>
          <span /><span /><span />
        </button>

        <div className="dash-topbar-actions">
          <Link to="/" className="dash-back-link"><Icon name="chevronRight" size={13} className="flip" /> <span className="dash-back-label">Back to website</span></Link>
          <button className="theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'}>
            <Icon name={isDark ? 'sun' : 'moon'} size={16} />
          </button>
          <NotificationBell />
          <div className="dash-user-chip"><span>{(user?.name || '?').charAt(0).toUpperCase()}</span></div>
          <button className="dash-logout" onClick={handleLogout}><Icon name="logout" size={15} /> Logout</button>
        </div>
      </div>

      {tabs && (
        <nav className="dash-topbar-tabs">
          {tabs.map(([key, label, icon]) => (
            <button key={key} className={activeTab === key ? 'active' : ''} onClick={() => onTabChange(key)}>
              <Icon name={icon} size={14} /> {label}
              {key === 'messages' && unreadMessages > 0 && <em>{unreadMessages > 9 ? '9+' : unreadMessages}</em>}
            </button>
          ))}
        </nav>
      )}

      {menuOpen && (
        <div className="dash-topbar-mobile-menu">
          <div className="dash-mobile-notif"><NotificationBell /></div>
          <Link to="/" onClick={() => setMenuOpen(false)}><Icon name="chevronRight" size={14} className="flip" /> Back to website</Link>
          <button onClick={() => { toggleTheme(); }}><Icon name={isDark ? 'sun' : 'moon'} size={14} /> {isDark ? 'Light mode' : 'Dark mode'}</button>
          <button onClick={handleLogout}><Icon name="logout" size={14} /> Logout</button>
        </div>
      )}
    </header>
  );
}
export default DashboardTopbar;
