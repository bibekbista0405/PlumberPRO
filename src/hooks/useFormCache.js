import { useEffect, useRef, useState } from 'react';

// Persists form state to localStorage as the user types, so a half-filled form
// (e.g. a booking request) survives a page reload or a detour through login.
// Nothing here is sensitive — no passwords are ever cached.
export function useFormCache(key, initialValue) {
  const storageKey = `plumbpro:${key}`;
  const [value, setValue] = useState(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw) return { ...initialValue, ...JSON.parse(raw) };
    } catch { /* ignore corrupt cache */ }
    return initialValue;
  });
  const first = useRef(true);

  useEffect(() => {
    if (first.current) { first.current = false; return; }
    try { window.localStorage.setItem(storageKey, JSON.stringify(value)); } catch { /* storage full or unavailable */ }
  }, [storageKey, value]);

  const clearCache = () => {
    try { window.localStorage.removeItem(storageKey); } catch { /* ignore */ }
  };

  return [value, setValue, clearCache];
}
