import { useEffect } from 'react';

const SCRIPT_ID = 'plumbpro-structured-data';

// Adds a single JSON-LD <script> tag describing PlumbPro as a LocalBusiness.
// Helps search engines understand what the site is, independent of page copy.
export function useStructuredData() {
  useEffect(() => {
    const data = {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: 'PlumbPro',
      description: 'A location-aware plumbing service marketplace connecting customers with verified, available plumbers in Nepal.',
      areaServed: 'NP',
      url: window.location.origin,
      priceRange: '$$',
      '@id': `${window.location.origin}/#business`,
    };
    let el = document.getElementById(SCRIPT_ID);
    if (!el) {
      el = document.createElement('script');
      el.id = SCRIPT_ID;
      el.type = 'application/ld+json';
      document.head.appendChild(el);
    }
    el.textContent = JSON.stringify(data);
  }, []);
}
