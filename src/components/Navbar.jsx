import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import Icon from './Icon';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboard = user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'plumber' ? '/plumber-dashboard' : '/customer-dashboard';
  const close = () => setMenuOpen(false);
  const handleLogout = () => { logout(); close(); navigate('/'); };
  const active = path => location.pathname === path ? 'active' : '';

  return <header className="navbar">
    <div className="navbar-container">
      <Link to="/" className="brand" onClick={close} aria-label="PlumbPro home">
        <img src="/plumbpro-mark.svg" alt="" className="brand-mark" />
        <span className="brand-word">Plumb<b>Pro</b></span>
      </Link>
      <nav className={`nav-links ${menuOpen ? 'active' : ''}`}>
        <Link className={active('/')} to="/" onClick={close}>Home</Link>
        <Link className={active('/services')} to="/services" onClick={close}>Services</Link>
        <Link className={active('/about')} to="/about" onClick={close}>About</Link>
        <Link className={active('/book-plumber')} to="/book-plumber" onClick={close}>Book a Plumber</Link>
        <Link className={active('/contact')} to="/contact" onClick={close}>Contact</Link>
      </nav>
      <div className="nav-actions">
        <button className="theme-toggle" onClick={toggleTheme} aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'} title={isDark ? 'Light mode' : 'Dark mode'}>
          <Icon name={isDark ? 'sun' : 'moon'} size={16} /><small>{isDark ? 'Light' : 'Dark'}</small>
        </button>
        {user ? <>
          <NotificationBell />
          <Link to={dashboard} className="nav-outline" onClick={close}>Dashboard</Link>
          <button className="nav-primary" onClick={handleLogout}>Logout</button>
        </> : <>
          <Link to="/login" className="nav-outline" onClick={close}>Login</Link>
          <Link to="/login" className="nav-primary" onClick={close}>Get Started</Link>
        </>}
      </div>
      <button className={`hamburger ${menuOpen ? 'active' : ''}`} aria-label="Toggle navigation" onClick={() => setMenuOpen(v => !v)}><span/><span/><span/></button>
    </div>
  </header>;
}
export default Navbar;
