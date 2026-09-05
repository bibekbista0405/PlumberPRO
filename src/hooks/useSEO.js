import { useEffect } from 'react';

function setMeta(name, content, attr = 'name') {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${name}"]`);
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, name);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function setCanonical(path) {
  let el = document.head.querySelector('link[rel="canonical"]');
  if (!el) {
    el = document.createElement('link');
    el.setAttribute('rel', 'canonical');
    document.head.appendChild(el);
  }
  el.setAttribute('href', `${window.location.origin}${path}`);
}

// Sets document title + meta description/OG tags for the current page.
// No dependency needed — CRA apps don't get SSR, but this still helps
// social-share previews and keeps titles distinct per page for search results.
export function useSEO({ title, description, path }) {
  useEffect(() => {
    const fullTitle = title ? `${title} | PlumbPro` : 'PlumbPro — Book a Trusted Plumber Near You';
    document.title = fullTitle;
    setMeta('description', description);
    setMeta('og:title', fullTitle, 'property');
    setMeta('og:description', description, 'property');
    setMeta('twitter:title', fullTitle);
    setMeta('twitter:description', description);
    if (path) setCanonical(path);
  }, [title, description, path]);
}
