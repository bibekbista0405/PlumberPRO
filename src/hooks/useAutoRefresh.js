import { useEffect, useRef } from 'react';

// Polls a callback in the background (and on tab focus / visibility) so data
// stays current without the person needing to hit refresh. Manual refresh
// buttons stay in the UI as a fallback for error cases.
//
// Background tabs skip their tick entirely instead of polling on a timer
// they can't see: a hidden tab still refreshes the moment it becomes visible
// again, but it stops silently burning through the server's request budget
// while it's in the background. This matters a lot for anyone who keeps
// several tabs of the app open at once — every additional idle tab used to
// add its own full set of polling requests on top of the visible one.
export function useAutoRefresh(callback, intervalMs = 20000) {
  const savedCallback = useRef(callback);
  useEffect(() => { savedCallback.current = callback; }, [callback]);

  useEffect(() => {
    const tick = () => {
      if (document.visibilityState === 'hidden') return;
      savedCallback.current();
    };
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
