import { useCallback, useEffect, useState } from 'react';
import { getPushStatus, subscribeToPush, unsubscribeFromPush } from '../api/pushApi';

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

// Encapsulates everything needed to turn on/off browser push notifications:
// whether the server has VAPID keys configured, whether this browser
// supports it, current permission state, and the actual subscribe/unsubscribe
// calls. Nothing here assumes push is available — every step degrades
// gracefully if it isn't.
export function usePushNotifications() {
  const [serverEnabled, setServerEnabled] = useState(false);
  const [supported] = useState(() => 'serviceWorker' in navigator && 'PushManager' in window);
  const [permission, setPermission] = useState(() => (typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'));
  const [subscribed, setSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    getPushStatus().then((d) => setServerEnabled(d.enabled)).catch(() => setServerEnabled(false));
  }, []);

  useEffect(() => {
    if (!supported) return;
    // getRegistration() resolves immediately (with undefined if nothing is
    // registered yet) — unlike `.ready`, which hangs forever if no service
    // worker has ever been registered. index.js registers sw.js on load, but
    // this stays safe even if that hasn't finished yet or failed silently.
    navigator.serviceWorker.getRegistration()
      .then((reg) => (reg ? reg.pushManager.getSubscription() : null))
      .then((sub) => setSubscribed(Boolean(sub)))
      .catch(() => {});
  }, [supported]);

  const enable = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      if (!supported) throw new Error('This browser does not support push notifications.');
      if (!serverEnabled) throw new Error('Push notifications are not configured on the server yet.');
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') throw new Error('Notification permission was not granted.');

      const vapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY;
      if (!vapidKey) throw new Error('Push is not fully configured yet.');
      // Reuse the registration from index.js if it's ready by now; otherwise
      // register here as a fallback so enabling still works either way.
      const registration = (await navigator.serviceWorker.getRegistration()) || (await navigator.serviceWorker.register('/sw.js'));
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await subscribeToPush(subscription.toJSON());
      setSubscribed(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [supported, serverEnabled]);

  const disable = useCallback(async () => {
    setBusy(true);
    setError('');
    try {
      const registration = await navigator.serviceWorker.getRegistration();
      const subscription = registration ? await registration.pushManager.getSubscription() : null;
      if (subscription) {
        await unsubscribeFromPush(subscription.endpoint);
        await subscription.unsubscribe();
      }
      setSubscribed(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, []);

  return { supported, serverEnabled, permission, subscribed, busy, error, enable, disable };
}
