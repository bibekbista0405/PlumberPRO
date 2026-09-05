const API_URL = process.env.REACT_APP_API_URL || '/api';

export async function apiRequest(path, options = {}) {
  const token = localStorage.getItem('plumbpro_token');
  const headers = {
    ...(options.body instanceof FormData ? {} : { 'Content-Type': 'application/json' }),
    // ngrok's free tier shows an HTML "you are about to visit..." interstitial
    // in front of every browser request to a tunnel URL until the visitor
    // clicks through it once. That interstitial is served with a 200 status,
    // so without this header a fetch here would "succeed" but hand back HTML
    // instead of JSON — the frontend loads fine (it's a normal page visit),
    // while every API call silently gets no usable data back. This header
    // tells ngrok to skip the interstitial for this request; it's ignored
    // (harmless) by every other host.
    'ngrok-skip-browser-warning': 'true',
    ...(options.headers || {}),
  };
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    // Something in front of the API (an ngrok interstitial, a misconfigured
    // proxy, an nginx error page) answered instead of the API itself. Surface
    // this clearly rather than silently treating it as an empty success.
    throw new Error(
      response.ok
        ? 'The server returned an unexpected response instead of data. If you are accessing this through ngrok, make sure you are using the latest frontend build.'
        : `Request failed (${response.status}).`
    );
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || 'Something went wrong.');
  return data;
}

export { API_URL };
