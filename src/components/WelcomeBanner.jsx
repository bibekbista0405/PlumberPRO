import React, { useEffect, useState } from 'react';
import Icon from './Icon';
import '../styles/WelcomeBanner.css';

const STORAGE_KEY = 'plumbpro:welcomed';

function WelcomeBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!window.localStorage.getItem(STORAGE_KEY)) {
        const timer = setTimeout(() => setVisible(true), 900);
        return () => clearTimeout(timer);
      }
    } catch { /* localStorage unavailable */ }
    return undefined;
  }, []);

  const dismiss = () => {
    setVisible(false);
    try { window.localStorage.setItem(STORAGE_KEY, '1'); } catch { /* ignore */ }
  };

  if (!visible) return null;

  return (
    <div className="welcome-banner" role="status">
      <div className="welcome-banner-inner">
        <div className="welcome-banner-icon"><Icon name="shieldCheck" size={18} /></div>
        <div className="welcome-banner-copy">
          <strong>New here? Here's the short version.</strong>
          <span>Every plumber you see is platform-verified, every rating is from a real completed job, and you always pick who you book — no random assignment.</span>
        </div>
        <div className="welcome-banner-actions">
          <a href="#find-plumber" className="welcome-banner-cta" onClick={dismiss}>Find a plumber</a>
          <button type="button" className="welcome-banner-close" onClick={dismiss} aria-label="Dismiss"><Icon name="close" size={15} /></button>
        </div>
      </div>
    </div>
  );
}
export default WelcomeBanner;
