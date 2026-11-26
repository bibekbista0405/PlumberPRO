import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/Navbar.css';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from './NotificationBell';
import Icon from './Icon';

function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const navRef = useRef(null);
  const barRef = useRef(null);
  const [glide, setGlide] = useState({ x: 0, ready: false });
  const { user, logout } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const dashboard = user?.role === 'admin' ? '/admin-dashboard' : user?.role === 'plumber' ? '/plumber-dashboard' : '/customer-dashboard';
  const close = () => setMenuOpen(false);

  useEffect(() => {
    const updateScroll = () => {
      setScrolled(window.scrollY > 12);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      if (barRef.current) barRef.current.style.setProperty('--sp', max > 0 ? Math.min(window.scrollY / max, 1).toFixed(4) : '0');
    };
    updateScroll();
    window.addEventListener('scroll', updateScroll, { passive: true });
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);

  useEffect(() => { setMenuOpen(false); }, [location.pathname]);

  useEffect(() => {
    const measure = () => {
      const el = navRef.current && navRef.current.querySelector('a.active');
      if (el) setGlide({ x: el.offsetLeft + el.offsetWidth / 2, ready: true });
      else setGlide(g => ({ ...g, ready: false }));
    };
    measure();
    const t = setTimeout(measure, 350);
    window.addEventListener('resize', measure);
    // The capsule changes width when it condenses on scroll, shifting the links.
    const ro = typeof ResizeObserver !== 'undefined' && navRef.current ? new ResizeObserver(measure) : null;
    if (ro) ro.observe(navRef.current);
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); if (ro) ro.disconnect(); };
  }, [location.pathname]);

  const onMove = e => {
    const el = barRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  };
  const handleLogout = () => { logout(); close(); navigate('/'); };
  const active = path => (path === '/blog' ? location.pathname.startsWith('/blog') : location.pathname === path) ? 'active' : '';

  return <header className={`navbar ${scrolled ? 'navbar-scrolled' : ''} ${menuOpen ? 'navbar-menu-open' : ''}`}>
    <div className="navbar-container" ref={barRef} onMouseMove={onMove}>
      <Link to="/" className="brand" onClick={close} aria-label="PlumbPro home">
        <span className="brand-mark-wrap"><img src="/plumbpro-mark.svg" alt="" className="brand-mark" /><i className="brand-drip" /></span>
        <span className="brand-word">Plumb<b>Pro</b><small>Service, made simpler.</small></span>
      </Link>
      <nav className={`nav-links ${menuOpen ? 'active' : ''}`} aria-label="Main navigation" ref={navRef}>
        <span className="nav-drop" style={{ transform: `translateX(${glide.x - 4}px)`, opacity: glide.ready ? 1 : 0 }} aria-hidden="true"><i key={location.pathname} /></span>
        {[['/', 'Home'], ['/services', 'Services'], ['/about', 'About'], ['/blog', 'Blog'], ['/book-plumber', 'Book a Plumber'], ['/contact', 'Contact']].map(([to, label]) => (
          <Link key={to} className={active(to)} to={to} onClick={close}><span className="nl-text"><span data-text={label}>{label}</span></span></Link>
        ))}
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
