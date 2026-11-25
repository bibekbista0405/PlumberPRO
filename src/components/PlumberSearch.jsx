import React, { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { searchPlumbers } from '../api/plumberApi';
import { getServices } from '../api/serviceApi';
import Icon from './Icon';
import Stars from './Stars';
import ServiceIcon from './ServiceIcon';
import '../styles/PlumberSearch.css';

// Real example areas from the PRD's primary market (Banke / Sudurpashchim region).
// These are quick-pick shortcuts into the same free-text search — not a separate data source.
const QUICK_AREAS = ['Nepalgunj', 'Kohalpur', 'Banke', 'Dhangadhi', 'Surkhet', 'Kathmandu'];

function PlumberSearch() {
  const [mode, setMode] = useState('area'); // 'area' | 'location'
  const [query, setQuery] = useState('');
  const [service, setService] = useState('');
  const [radius, setRadius] = useState(25);
  const [coords, setCoords] = useState(null);
  const [services, setServices] = useState([]);
  const [plumbers, setPlumbers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [locating, setLocating] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [locationState, setLocationState] = useState('idle');

  useEffect(() => { getServices().then(d => setServices(d.services || [])).catch(() => {}); }, []);

  const performSearch = useCallback(async (nextCoords) => {
    setLoading(true);
    setError('');
    setSearched(true);
    try {
      const data = await searchPlumbers({ q: query.trim(), service, lat: nextCoords?.lat, lng: nextCoords?.lng, radius });
      const results = data.plumbers || [];
      setPlumbers(results);
      if (!results.length) {
        setError(nextCoords
          ? 'No available plumber was found within your selected area.'
          : 'No available plumber matched that search. Try a nearby area or a wider radius.');
      }
    } catch (err) {
      setError(err.message || 'Unable to search plumbers right now.');
      setPlumbers([]);
    } finally {
      setLoading(false);
    }
  }, [query, service, radius]);

  const requestLocation = useCallback(() => {
    setError('');
    if (!navigator.geolocation) {
      setLocationState('unsupported');
      setError('Location is not supported by this browser. Search by area instead.');
      return;
    }
    if (!window.isSecureContext) {
      setLocationState('insecure');
      setError('Your browser only allows location access on a secure (https://) connection. Search by area instead, or open this site over https.');
      return;
    }
    setLocating(true);
    setLocationState('requesting');
    navigator.geolocation.getCurrentPosition(
      ({ coords: current }) => {
        const nextCoords = { lat: current.latitude, lng: current.longitude };
        setCoords(nextCoords);
        setLocationState('ready');
        setLocating(false);
        performSearch(nextCoords);
      },
      (positionError) => {
        setLocating(false);
        setLocationState(positionError.code === 1 ? 'denied' : 'error');
        setError(positionError.code === 1
          ? 'Location access was denied. Allow it in your browser settings, or search by area instead.'
          : 'We could not determine your location. Search by area instead.');
      },
      { enableHighAccuracy: true, timeout: 12000, maximumAge: 300000 }
    );
  }, [performSearch]);

  const chooseMode = (next) => {
    setMode(next);
    setError('');
    if (next === 'location') {
      if (locationState === 'ready' && coords) performSearch(coords);
      else requestLocation();
    }
  };

  const submitArea = (e) => {
    e?.preventDefault();
    performSearch(null);
  };

  const pickArea = (area) => {
    setQuery(area);
    setMode('area');
    setError('');
    setLoading(true); setSearched(true);
    searchPlumbers({ q: area, service, radius }).then(d => {
      const results = d.plumbers || [];
      setPlumbers(results);
      if (!results.length) setError('No available plumber matched that area yet.');
    }).catch(err => { setError(err.message); setPlumbers([]); }).finally(() => setLoading(false));
  };

  const toggleService = (name) => {
    const next = service === name ? '' : name;
    setService(next);
    if (searched) {
      setLoading(true);
      searchPlumbers({ q: query.trim(), service: next, lat: mode === 'location' ? coords?.lat : undefined, lng: mode === 'location' ? coords?.lng : undefined, radius })
        .then(d => { const results = d.plumbers || []; setPlumbers(results); setError(results.length ? '' : 'No available plumber matched those filters.'); })
        .catch(err => setError(err.message))
        .finally(() => setLoading(false));
    }
  };

  return (
    <section className="discovery-section" id="find-plumber" data-reveal>
      <div className="discovery-shell">
        <div className="discovery-head">
          <span className="eyebrow">FIND A PROFESSIONAL</span>
          <h2>Find a verified plumber near you</h2>
          <p>Search real PlumbPro plumber profiles by area, or use your current location to see verified, available professionals who can reach you.</p>
        </div>

        <div className="discovery-panel">
          <div className="discovery-tabs" role="tablist">
            <button type="button" role="tab" aria-selected={mode === 'area'} className={mode === 'area' ? 'active' : ''} onClick={() => chooseMode('area')}>
              <Icon name="search" size={15} /> Search by area
            </button>
            <button type="button" role="tab" aria-selected={mode === 'location'} className={mode === 'location' ? 'active' : ''} onClick={() => chooseMode('location')} disabled={locating}>
              <Icon name="location" size={15} /> {locating ? 'Requesting location…' : 'Use my current location'}
            </button>
          </div>

          {mode === 'area' ? (
            <>
              <form className="discovery-search-row" onSubmit={submitArea}>
                <label className="search-input-wrap">
                  <Icon name="search" size={16} />
                  <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="City, area or neighborhood — e.g. Nepalgunj" aria-label="Search plumbers by location" />
                </label>
                <select value={radius} onChange={(e) => setRadius(Number(e.target.value))} aria-label="Search radius">
                  <option value="10">Within 10 km</option>
                  <option value="25">Within 25 km</option>
                  <option value="50">Within 50 km</option>
                  <option value="100">Within 100 km</option>
                </select>
                <button type="submit" className="search-submit" disabled={loading}>{loading ? 'Searching…' : 'Search'}</button>
              </form>
              <div className="quick-chips">
                {QUICK_AREAS.map(area => (
                  <button type="button" key={area} className={`chip ${query === area ? 'chip-active' : ''}`} onClick={() => pickArea(area)}>{area}</button>
                ))}
              </div>
            </>
          ) : (
            <div className={`location-status location-status-${locationState}`}>
              {locationState === 'ready' && <p><Icon name="check" size={15} /> Location access is enabled. We use the coordinates only to match nearby service coverage — nothing else.</p>}
              {locationState === 'denied' && <p><Icon name="close" size={15} /> Location access was denied. Allow it from your browser's address-bar permissions, or switch to "Search by area".</p>}
              {locationState === 'requesting' && <p>Waiting for your browser's location permission…</p>}
              {locationState === 'insecure' && <p><Icon name="close" size={15} /> This page isn't loaded over a secure (https://) connection, so browsers block location access. Switch to "Search by area" instead.</p>}
              {locationState === 'unsupported' && <p><Icon name="close" size={15} /> This browser doesn't support location lookup. Switch to "Search by area" instead.</p>}
              {(locationState === 'ready' || locationState === 'denied') && (
                <button type="button" className="chip" onClick={requestLocation}>Try again</button>
              )}
            </div>
          )}

          {services.length > 0 && (
            <div className="quick-chips service-chips">
              <span className="quick-chips-label"><Icon name="filter" size={13} /> Filter by service</span>
              {services.slice(0, 8).map(s => (
                <button type="button" key={s.id} className={`chip ${service === s.name ? 'chip-active' : ''}`} onClick={() => toggleService(s.name)}>
                  <ServiceIcon name={s.name} size={14} /> {s.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {loading && (
          <div className="discovery-results discovery-skeletons" aria-hidden="true">
            {[0, 1, 2].map(i => <div className="plumber-card plumber-skeleton" key={i}><span /><span /><span /></div>)}
          </div>
        )}

        {!loading && searched && (
          <div className="discovery-results" aria-live="polite">
            {error && plumbers.length === 0 && <div className="search-feedback" role="status">{error}</div>}
            {plumbers.map((p) => (
              <article className="plumber-card" key={p.id}>
                <div className="plumber-card-top">
                  <Link to={`/plumbers/${p.id}`} className="plumber-avatar" aria-label={`View ${p.name}'s profile`}>{p.photo_url ? <img src={p.photo_url} alt="" /> : (p.name || 'P').charAt(0).toUpperCase()}</Link>
                  <div className="plumber-card-heading">
                    <div className="plumber-name-row">
                      <Link to={`/plumbers/${p.id}`} className="plumber-name-link"><h3>{p.name}</h3></Link>
                      {p.verified ? <span className="verified-badge"><Icon name="shieldCheck" size={12} /> Verified</span> : null}
                    </div>
                    <p className="plumber-profession">{p.profession || 'Plumbing professional'} · {Number(p.experience_years || 0)} yrs experience</p>
                  </div>
                </div>
                <p className="plumber-location"><Icon name="mapPin" size={14} /> {p.location_name || 'Service area available'}{p.distance_km != null ? ` · ${Number(p.distance_km).toFixed(1)} km away` : ''}</p>
                <div className="plumber-meta">
                  <Stars rating={p.rating} count={p.review_count} size={13} />
                  <span className="tag">{p.work_mode === 'team' ? 'Team' : 'Solo'}</span>
                  <span className="tag">{p.can_travel ? 'Can travel' : 'Local only'}</span>
                </div>
                <Link className="plumber-cta" to="/book-plumber" state={{ plumberId: p.id, plumberName: p.name }}>
                  Request <Icon name="chevronRight" size={14} />
                </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

export default PlumberSearch;
