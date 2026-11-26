import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import Icon from './Icon';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboard = user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'plumber' ? '/plumber-dashboard' : '/customer-dashboard';
  const close = () => setMenuOpen(false);

  useEffect(() => {
    const updateScroll = () => setScrolled(window.scrollY > 12);
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);
  const handleLogout = () => { logout(); close(); navigate('/'); };
  const active = path => (path === '/blog' ? location.pathname.startsWith('/blog') : location.pathname === path) ? 'active' : '';

  return <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${menuOpen ? 'navbar-menu-open' : ''}`}>
    <div className="navbar-container">
      <Link to="/" className="brand" onClick={close} aria-label="PlumbPro home">
        <img src="/plumbpro-mark.svg" alt="" className="brand-mark" />
        <span className="brand-word">Plumb<b>Pro</b><small>Service, made simpler.</small></span>
      </Link>
      <nav className={`nav-links ${menuOpen ? 'active' : ''}`} aria-label="Main navigation">
        <Link className={active('/')} to="/" onClick={close}>Home</Link>
        <Link className={active('/services')} to="/services" onClick={close}>Services</Link>
        <Link className={active('/about')} to="/about" onClick={close}>About</Link>
        <Link className={active('/blog')} to="/blog" onClick={close}>Blog</Link>
        <Link className={active('/book-plumber')} to="/book-plumber" onClick={close}>Book a Plumber</Link>
        <Link className={active('/contact')} to="/contact" onClick={close}>Contact</Link>
        <div className="nav-mobile-actions">
          {user ? <>
            <Link to={dashboard} className="nav-outline" onClick={close}>Dashboard</Link>
            <button className="nav-primary" onClick={handleLogout}>Logout</button>
          </> : <>
            <Link to="/login" className="nav-outline" onClick={close}>Login</Link>
            <Link to="/login" className="nav-primary" onClick={close}>Get Started</Link>
          </>}
        </div>
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
      <button className={`hamburger ${menuOpen ? 'active' : ''}`} aria-label={menuOpen ? 'Close navigation' : 'Open navigation'} aria-expanded={menuOpen} onClick={() => setMenuOpen(v => !v)}><span/><span/><span/></button>
    </div>
  </header>;
}
export default Navbar;
