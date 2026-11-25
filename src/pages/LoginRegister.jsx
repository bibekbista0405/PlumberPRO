import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import '../styles/LoginRegister.css';
import { useAuth } from '../context/AuthContext';

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
  const { user, login, register } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => { if (location.state?.register) setIsLogin(false); }, [location.state]);
  useEffect(() => { if (user) { navigate(user.role === 'admin' ? '/admin-dashboard' : user.role === 'plumber' ? '/plumber-dashboard' : '/customer-dashboard', { replace: true }); } }, [user, navigate]);

  const change = e => setForm(v => ({ ...v, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));
  const switchMode = mode => { setIsLogin(mode === 'login'); setError(''); setLocationNotice(''); setForm(initial); };

  const detectLocation = () => {
    setError(''); setLocationNotice('');
    if (!navigator.geolocation) return setError('Your browser does not support location access.');
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
      setError('Location permission was not granted. Enter your service area manually instead.');
    }, { enableHighAccuracy: true, timeout: 10000, maximumAge: 300000 });
  };

  const submit = async e => {
    e.preventDefault();
    setError('');
    const profession = form.profession === 'Other' ? form.professionOther.trim() : form.profession;
    if (!isLogin && form.password !== form.confirmPassword) return setError('Passwords do not match.');
    if (!isLogin && !form.termsAccepted) return setError('Please agree to the Terms and Privacy Policy to continue.');
    if (!isLogin && form.password.length < 6) return setError('Use at least 6 characters for your password.');
    if (!isLogin && accountType === 'plumber' && (!profession || !form.location_name.trim())) return setError('Plumbers need a profession and service area.');
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
      setError(err.message || 'Unable to complete the request.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="auth-page">
      <div className="auth-shell">
        <section className="auth-showcase">
          <Link to="/" className="auth-logo"><img src="/plumbpro-mark.svg" alt="PlumbPro logo" /><span>Plumb<span>Pro</span></span></Link>
          <span className="eyebrow">PLUMBPRO NETWORK</span>
          <h1>{isLogin ? 'Your service account, without the clutter.' : 'Join the network that connects customers with real plumbers.'}</h1>
          <p>{isLogin ? 'Sign in to manage bookings, review completed work and keep your service history organized.' : 'Customers can request service. Plumbers can create an account in under a minute, then build out a full profile afterward.'}</p>
          <div className="auth-showcase-points"><span><b>01</b> Real profiles</span><span><b>02</b> Clear booking status</span><span><b>03</b> Location-aware discovery</span></div>
        </section>
        <section className="auth-card">
          <div className="auth-heading">
            <span className="eyebrow">{isLogin ? 'WELCOME BACK' : 'CREATE ACCOUNT'}</span>
            <h2>{isLogin ? 'Sign in' : 'Get started'}</h2>
            <p>{isLogin ? 'Use your account credentials to continue.' : 'Choose the account type that matches how you use PlumbPro.'}</p>
          </div>
          {!isLogin && (
            <div className="account-type-toggle">
              <button type="button" className={accountType === 'customer' ? 'active' : ''} onClick={() => setAccountType('customer')}><strong>Customer</strong><small>Book and track services</small></button>
              <button type="button" className={accountType === 'plumber' ? 'active' : ''} onClick={() => setAccountType('plumber')}><strong>Plumber</strong><small>Offer professional services</small></button>
            </div>
          )}
          {error && <div className="form-error">{error}</div>}
          {locationNotice && <div className="form-success">{locationNotice}</div>}
          <form onSubmit={submit} className="auth-form">
            {!isLogin && <>
              <div className="form-row">
                <label>Full name<input name="name" value={form.name} onChange={change} autoComplete="name" required placeholder="Your full name" /></label>
                <label>Phone number<input name="phone" value={form.phone} onChange={change} autoComplete="tel" required={accountType === 'plumber'} placeholder="98XXXXXXXX" /></label>
              </div>
              {accountType === 'plumber' && <>
                <div className="form-section-label">A quick start — you can fill in the rest later</div>
                <label>Profession
                  <select name="profession" value={form.profession} onChange={change} required>
                    <option value="">Choose your profession</option>
                    {PROFESSIONS.map(p => <option key={p} value={p}>{p}</option>)}
                    <option value="Other">Other (add your own)</option>
                  </select>
                </label>
                {form.profession === 'Other' && <label>Your profession<input name="professionOther" value={form.professionOther} onChange={change} required placeholder="e.g. Solar water heater technician" /></label>}
                <div className="location-panel">
                  <div><strong>Service area</strong><span>Allow location access to save coordinates and make local discovery more accurate.</span></div>
                  <button type="button" onClick={detectLocation} disabled={locationBusy}>{locationBusy ? 'Detecting…' : 'Use my location'}</button>
                  <label className="full-field">Area / city<input name="location_name" value={form.location_name} onChange={change} required placeholder="e.g. Nepalgunj, Banke" /></label>
                </div>
                <p className="auth-note">After you sign up, add your photo, experience, education and a bio from your dashboard — a short checklist there shows exactly what's left before the platform reviews your profile for verification.</p>
              </>}
            </>}
            <label>Email address<input name="email" type="email" value={form.email} onChange={change} autoComplete="email" required placeholder="you@example.com" /></label>
            <label>Password<div className="password-field"><input name="password" type={showPassword ? 'text' : 'password'} value={form.password} onChange={change} autoComplete={isLogin ? 'current-password' : 'new-password'} minLength="6" required placeholder="At least 6 characters" /><button type="button" onClick={() => setShowPassword(v => !v)}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
            {!isLogin && <label>Confirm password<input name="confirmPassword" type={showPassword ? 'text' : 'password'} value={form.confirmPassword} onChange={change} autoComplete="new-password" required placeholder="Repeat your password" /></label>}
            {!isLogin && (
              <label className="terms-checkbox">
                <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={change} required />
                <span>I agree to the <Link to="/terms">Terms & Conditions</Link> and <Link to="/privacy">Privacy Policy</Link>.</span>
              </label>
            )}
            <button className="auth-submit" type="submit" disabled={busy}>{busy ? (isLogin ? 'Signing in…' : 'Creating account…') : (isLogin ? 'Sign in' : accountType === 'plumber' ? 'Create plumber account' : 'Create customer account')}</button>
          </form>
          <div className="auth-switch"><span>{isLogin ? 'New to PlumbPro?' : 'Already have an account?'}</span><button type="button" onClick={() => switchMode(isLogin ? 'register' : 'login')}>{isLogin ? 'Create account' : 'Sign in'}</button></div>
          {isLogin && <p className="auth-legal">By continuing, you agree to our <Link to="/terms">Terms</Link> and acknowledge our <Link to="/privacy">Privacy Policy</Link>.</p>}
          {!isLogin && accountType === 'plumber' && <p className="auth-note">Plumber profiles are not shown as verified in public search until the platform verifies the profile.</p>}
        </section>
      </div>
    </main>
  );
}
export default LoginRegister;
