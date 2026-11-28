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

  // One rAF-throttled scroll handler. Layout is only read when the page size
  // changes (not on every scroll event), so scrolling never forces a reflow.
  useEffect(() => {
    let raf = 0;
    let max = 0;
    const measureMax = () => { max = Math.max(document.documentElement.scrollHeight - window.innerHeight, 0); };
    const paint = () => {
      raf = 0;
      const y = window.scrollY;
      setScrolled(y > 12);
      if (barRef.current) barRef.current.style.setProperty('--sp', max > 0 ? Math.min(y / max, 1).toFixed(3) : '0');
    };
    const onScroll = () => { if (!raf) raf = window.requestAnimationFrame(paint); };
    const onResize = () => { measureMax(); onScroll(); };
    measureMax();
    paint();
    const ro = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null;
    if (ro) ro.observe(document.body);
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    return () => {
      if (raf) window.cancelAnimationFrame(raf);
      if (ro) ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
    };
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
    return () => { clearTimeout(t); window.removeEventListener('resize', measure); };
  }, [location.pathname]);

  const moveRaf = useRef(0);
  const onMove = e => {
    const el = barRef.current; if (!el || moveRaf.current) return;
    const { clientX, clientY } = e;
    moveRaf.current = window.requestAnimationFrame(() => {
      moveRaf.current = 0;
      const r = el.getBoundingClientRect();
      el.style.setProperty('--mx', `${clientX - r.left}px`);
      el.style.setProperty('--my', `${clientY - r.top}px`);
    });
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
