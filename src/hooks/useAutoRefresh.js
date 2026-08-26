import { useEffect, useRef } from 'react';

// Polls a callback in the background (and on tab focus / visibility) so data
// stays current without the person needing to hit refresh. Manual refresh
// buttons stay in the UI as a fallback for error cases.
export function useAutoRefresh(callback, intervalMs = 20000) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    const tick = () => savedCallback.current();
    const id = setInterval(tick, intervalMs);
    const onFocus = () => tick();
    const onVisibility = () => { if (document.visibilityState === 'visible') tick(); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      clearInterval(id);
      window.removeEventListener('focus', onFocus);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [intervalMs]);
}
