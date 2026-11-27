import React, { useEffect, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/LoginRegister.css';
import { useAuth } from '../context/AuthContext';
import Icon from '../components/Icon';

const PROFESSIONS = [
  'Residential Plumber',
  'Commercial Plumber',
  'Industrial Plumber',
  'Pipefitter',
  'Drainage Specialist',
  'Water Heater Specialist',
  'Emergency / 24-7 Plumber',
  'General Plumbing Contractor',
];

const POINTS = [
  ['01', 'Real profiles', 'See who you are booking before you book.'],
  ['02', 'Clear booking status', 'Follow every job from request to completion.'],
  ['03', 'Location-aware discovery', 'Find professionals who can actually reach you.'],
];

function passwordStrength(pw) {
  if (!pw) return { score: 0, label: '' };
  let score = 0;
  if (pw.length >= 6) score += 1;
  if (pw.length >= 10) score += 1;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw) && /\d/.test(pw)) score += 1;
  if (/[^A-Za-z0-9]/.test(pw)) score += 1;
  return { score, label: ['Too short', 'Weak', 'Fair', 'Good', 'Strong'][pw.length < 6 ? 0 : score] };
}

const initial = { name: '', email: '', phone: '', password: '', confirmPassword: '', profession: '', professionOther: '', location_name: '', latitude: '', longitude: '', termsAccepted: false };

function LoginRegister() {
  const [isLogin, setIsLogin] = useState(true);
  const [accountType, setAccountType] = useState('customer');
  const [showPassword, setShowPassword] = useState(false);
  const [form, setForm] = useState(initial);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const [locationNotice, setLocationNotice] = useState('');
  const [shake, setShake] = useState(false);
  const [pointIndex, setPointIndex] = useState(0);
  const showcaseRef = useRef(null);
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { if (location.state?.register) setIsLogin(false); }, [location.state]);
  useEffect(() => { if (user) { navigate(user.role === 'admin' ? '/admin-dashboard' : user.role === 'plumber' ? '/plumber-dashboard' : '/customer-dashboard', { replace: true }); } }, [user, navigate]);

  const fail = message => { setError(message); setShake(true); };
  useEffect(() => { if (!shake) return undefined; const t = setTimeout(() => setShake(false), 520); return () => clearTimeout(t); }, [shake]);
  useEffect(() => {
    const t = setInterval(() => setPointIndex(i => (i + 1) % POINTS.length), 3200);
    return () => clearInterval(t);
  }, []);

  const onShowcaseMove = e => {
    const el = showcaseRef.current; if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--px', (((e.clientX - r.left) / r.width) * 2 - 1).toFixed(3));
    el.style.setProperty('--py', (((e.clientY - r.top) / r.height) * 2 - 1).toFixed(3));
  };
  const strength = passwordStrength(form.password);

  const change = e => setForm(v => ({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const switchMode = mode => { setIsLogin(mode === 'login'); setError(''); setLocationNotice(''); setForm(initial); };

  const detectLocation = () => {
    setError(''); setLocationNotice('');
    if (!navigator.geolocation) return fail('Your browser does not support location access.');
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(async ({ coords }) => {
      let locationName = 'Current location';
      try {
        const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${coords.latitude}&lon=${coords.longitude}`);
        if (r.ok) {
          const d = await r.json();
          const a = d.address || {};
          locationName = [a.suburb || a.neighbourhood || a.village, a.city || a.town || a.municipality, a.state].filter(Boolean).join(', ') || locationName;
        }
      } catch { /* fall back to the placeholder name */ }
      setForm(v => ({ ...v, latitude: coords.latitude.toFixed(7), longitude: coords.longitude.toFixed(7), location_name: locationName }));
      setLocationNotice('Location detected. You can edit the area name before submitting.');
      setLocationBusy(false);
    }, () => {
      setLocationBusy(false);
      fail('Location permission was not granted. Enter your service area manually instead.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    const profession = form.profession === 'Other' ? form.professionOther.trim() : form.profession;
    if (!isLogin && form.password !== form.confirmPassword) return fail('Passwords do not match.');
    if (!isLogin && !form.termsAccepted) return fail('Please agree to the Terms and Privacy Policy to continue.');
    if (!isLogin && form.password.length < 6) return fail('Use at least 6 characters for your password.');
    if (!isLogin && accountType === 'plumber' && (!profession || !form.location_name.trim())) return fail('Plumbers need a profession and service area.');
    setBusy(true);
    try {
      const payload = isLogin
        ? { email: form.email.trim(), password: form.password }
        : {
            name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim(), password: form.password, role: accountType,
            profession, location_name: form.location_name.trim(), latitude: form.latitude, longitude: form.longitude,
            terms_accepted: form.termsAccepted,
            // Sensible defaults for everything else — the plumber fills these in
            // from their dashboard right after signing up, where a checklist
            // guides them toward a complete, verification-ready profile.
            work_mode: 'solo', experience_years: 0, service_radius_km: 15, can_travel: true, available: true, education: '', bio: '',
          };
      const loggedUser = isLogin ? await login(payload) : await register(payload);
      const fallback = loggedUser.role === 'admin' ? '/admin-dashboard' : loggedUser.role === 'plumber' ? '/plumber-dashboard' : '/customer-dashboard';
      navigate(location.state?.from || fallback, { replace: true, state: isLogin ? undefined : { justRegistered: true, firstName: (loggedUser.name || '').split(' ')[0] } });
    } catch (err) {
      fail(err.message || 'Unable to complete the request.');
    } finally {
      setBusy(false);
    }
  };

  const eye = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {showPassword
        ? <><path d="M3 3l18 18" /><path d="M10.6 6.2A9.8 9.8 0 0 1 12 6c5 0 8.5 4.2 9.5 6-.4.8-1.3 2-2.6 3.2" /><path d="M6.4 7.6C4.4 9 3 11 2.5 12c1 1.8 4.5 6 9.5 6 1.4 0 2.7-.3 3.8-.8" /><path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" /></>
        : <><path d="M2.5 12C3.5 10.2 7 6 12 6s8.5 4.2 9.5 6c-1 1.8-4.5 6-9.5 6s-8.5-4.2-9.5-6Z" /><circle cx="12" cy="12" r="3" /></>}
    </svg>
  );
  const submitLabel = busy ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign in' : accountType === 'plumber' ? 'Create plumber account' : 'Create customer account');

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-showcase" data-mode={isLogin ? 'login' : 'register'} ref={showcaseRef} onMouseMove={onShowcaseMove}>
          <svg className="auth-pipes" viewBox="0 0 600 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
            <path className="auth-pipe auth-pipe-a" d="M -20 150 L 150 150 L 190 190 L 190 330 L 230 370 L 420 370 L 460 410 L 460 560 L 620 560" />
            <path className="auth-pipe auth-pipe-b" d="M 620 90 L 430 90 L 390 130 L 390 250 L 350 290 L 120 290 L 80 330 L 80 470 L -20 470" />
            <path className="auth-pulse auth-pulse-a" d="M -20 150 L 150 150 L 190 190 L 190 330 L 230 370 L 420 370 L 460 410 L 460 560 L 620 560" />
            <path className="auth-pulse auth-pulse-b" d="M 620 90 L 430 90 L 390 130 L 390 250 L 350 290 L 120 290 L 80 330 L 80 470 L -20 470" />
            {[[190, 190], [230, 370], [460, 410], [390, 130], [350, 290], [80, 330]].map(([cx, cy], i) => <circle key={i} className="auth-joint" cx={cx} cy={cy} r="5" style={{ animationDelay: `${0.9 + i * 0.12}s` }} />)}
          </svg>
          <div className="auth-water" aria-hidden="true">
            <svg className="auth-wave auth-wave-back" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 60 Q150 0 300 60 T600 60 T900 60 T1200 60 V120 H0Z" /></svg>
            <svg className="auth-wave auth-wave-front" viewBox="0 0 1200 120" preserveAspectRatio="none"><path d="M0 60 Q150 0 300 60 T600 60 T900 60 T1200 60 V120 H0Z" /></svg>
          </div>
          <div className="auth-drops" aria-hidden="true">{Array.from({ length: 9 }, (_, i) => <i key={i} style={{ left: `${8 + i * 10.5}%`, animationDelay: `${(i % 5) * 0.9}s`, animationDuration: `${5 + (i % 4)}s`, width: 6 + (i % 3) * 3, height: 6 + (i % 3) * 3 }} />)}</div>

          <Link to="/" className="auth-logo"><img src="/plumbpro-mark.svg" alt="PlumbPro logo" /><span>Plumb<span>Pro</span></span></Link>
          <div className="auth-showcase-body" key={isLogin ? 'l' : 'r'}>
            <span className="eyebrow">PLUMBPRO NETWORK</span>
            <h1>{isLogin ? 'Your service account, without the clutter.' : 'Join the network that connects customers with real plumbers.'}</h1>
            <p>{isLogin ? 'Sign in to manage bookings, review completed work and keep your service history organized.' : 'Customers can request service. Plumbers can create an account in under a minute, then build out a full profile afterward.'}</p>
          </div>
          <ul className="auth-points" aria-label="Why PlumbPro">
            {POINTS.map(([n, title, text], i) => (
              <li key={n} className={i === pointIndex ? 'on' : ''}><b>{n}</b><span><strong>{title}</strong><small>{text}</small></span></li>
            ))}
          </ul>
        </section>

        <section className={`auth-card ${shake ? 'shake' : ''}`}>
          <div className="auth-switcher" role="tablist" aria-label="Sign in or create an account" data-active={isLogin ? 'login' : 'register'}>
            <i className="auth-switcher-thumb" aria-hidden="true" />
            <button type="button" role="tab" aria-selected={isLogin} className={isLogin ? 'active' : ''} onClick={() => !isLogin && switchMode('login')}>Sign in</button>
            <button type="button" role="tab" aria-selected={!isLogin} className={!isLogin ? 'active' : ''} onClick={() => isLogin && switchMode('register')}>Create account</button>
          </div>

          <div className="auth-stage" key={isLogin ? 'login' : 'register'}>
            <div className="auth-heading">
              <span className="eyebrow">{isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</span>
              <h2>{isLogin ? 'Sign in' : 'Get started'}</h2>
              <p>{isLogin ? 'Use your account credentials to continue.' : 'Choose the account type that matches how you use PlumbPro.'}</p>
            </div>
            {!isLogin && (
              <div className="account-type-toggle" role="radiogroup" aria-label="Account type">
                <button type="button" role="radio" aria-checked={accountType === 'customer'} className={accountType === 'customer' ? 'active' : ''} onClick={() => setAccountType('customer')}>
                  <span className="type-icon"><Icon name="users" size={20} /></span><strong>Customer</strong><small>Book and track services</small><em aria-hidden="true"><Icon name="check" size={12} /></em>
                </button>
                <button type="button" role="radio" aria-checked={accountType === 'plumber'} className={accountType === 'plumber' ? 'active' : ''} onClick={() => setAccountType('plumber')}>
                  <span className="type-icon"><Icon name="wrench" size={20} /></span><strong>Plumber</strong><small>Offer professional services</small><em aria-hidden="true"><Icon name="check" size={12} /></em>
                </button>
              </div>
            )}
            {error && <div className="form-error" role="alert" key={error}>{error}</div>}
            {locationNotice && <div className="form-success">{locationNotice}</div>}
            <form onSubmit={submit} className="auth-form">
              {!isLogin && <>
                <div className="form-row">
                  <label className="fl"><input name="name" value={form.name} onChange={change} autoComplete="name" required placeholder="Your full name" /><span>Full name</span><i /></label>
                  <label className="fl"><input name="phone" value={form.phone} onChange={change} autoComplete="tel" required={accountType === 'plumber'} placeholder="98XXXXXXXX" /><span>Phone number</span><i /></label>
                </div>
                {accountType === 'plumber' && <>
                  <div className="form-section-label">A quick start — you can fill in the rest later</div>
                  <label className="fl fl-select">
                    <select name="profession" value={form.profession} onChange={change} required>
                      <option value="">Choose your profession</option>
                      {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                      <option value="Other">Other (add your own)</option>
                    </select>
                    <span>Profession</span><i />
                  </label>
                  {form.profession === 'Other' && <label className="fl"><input name="professionOther" value={form.professionOther} onChange={change} required placeholder="e.g. Solar water heater technician" /><span>Your profession</span><i /></label>}
                  <div className="location-panel">
                    <div><strong>Service area</strong><span>Allow location access to save coordinates and make local discovery more accurate.</span></div>
                    <button type="button" onClick={detectLocation} disabled={locationBusy}><Icon name="mapPin" size={15} /> {locationBusy ? 'Detecting…' : 'Use my location'}</button>
                    <label className="fl full-field"><input name="location_name" value={form.location_name} onChange={change} required placeholder="e.g. Nepalgunj, Banke" /><span>Area / city</span><i /></label>
                  </div>
                  <p className="auth-note">After you sign up, add your photo, experience, education and a bio from your dashboard — a short checklist there shows exactly what's left before the platform reviews your profile for verification.</p>
                </>}
              </>}
              <label className="fl"><input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required placeholder="you@example.com" /><span>Email address</span><i /></label>
              <label className="fl fl-pw">
                <input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={change} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength="6" required placeholder="At least 6 characters" />
                <span>Password</span><i />
                <button type="button" className="pw-toggle" onClick={() => setShowPassword(v => !v)} aria-label={showPassword ? 'Hide password' : 'Show password'} aria-pressed={showPassword}>{eye}</button>
              </label>
              {!isLogin && form.password && (
                <div className="pw-meter" data-score={strength.score} aria-live="polite">
                  <div className="pw-bars"><i /><i /><i /><i /></div>
                  <span>{strength.label}</span>
                </div>
              )}
              {!isLogin && <label className="fl"><input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={change} autoComplete="new-password" required placeholder="Repeat your password" /><span>Confirm password</span><i /></label>}
              {!isLogin && (
                <label className="terms-checkbox">
                  <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={change} required />
                  <span>I agree to the <Link to="/terms">Terms & Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
                </label>
              )}
              <button className={`auth-submit ${busy ? 'busy' : ''}`} type="submit" disabled={busy}><span className="auth-submit-fill" aria-hidden="true" /><span className="auth-submit-label">{submitLabel}{!busy && <Icon name="arrowUpRight" size={16} />}</span></button>
            </form>
            <div className="auth-switch"><span>{isLogin ? 'New to PlumbPro?' : 'Already have an account?'}</span><button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>{isLogin ? 'Create account' : 'Sign in'}</button></div>
            {isLogin && <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and acknowledge our <Link to="/privacy">Privacy Policy</Link>.</p>}
            {!isLogin && accountType === 'plumber' && <p className="auth-note">Plumber profiles are not shown as verified in public search until the platform verifies the profile.</p>}
          </div>
        </section>
      </div>
    </main>
  );
}
export default LoginRegister;
