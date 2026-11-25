import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </ThemeProvider>
  </React.StrictMode>
);

// Registers the push-only service worker (see public/sw.js) up front, once,
// regardless of whether the person has opted into push yet. Registering
// eagerly here — rather than only inside the "enable push" flow — means
// usePushNotifications can safely check subscription state on every page
// load without waiting on a registration that may never come.
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Push just won't be available this session; nothing else depends on it.
    });
  });
}

