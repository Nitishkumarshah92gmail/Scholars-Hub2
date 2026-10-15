// Resolves the API base URL for the current deployment with zero-latency resolution.

const BACKEND_URL = (import.meta.env.VITE_API_URL || 'https://scholars-hub2.onrender.com/api').replace(/\/+$/, '');
const CACHE_KEY = 'sh_api_base_v2';

let _resolved = null;

function isStaticFrontendHost() {
  if (typeof window === 'undefined') return true;
  const host = window.location.hostname.toLowerCase();
  // Static Render frontend, custom domain, Vercel, or local development
  return (
    host === 'scholarshub.qd.je' ||
    host.includes('scholars-hub2-1') ||
    host === 'localhost' ||
    host === '127.0.0.1' ||
    window.location.protocol === 'capacitor:' ||
    window.location.protocol === 'ionic:'
  );
}

function initApiBase() {
  if (_resolved) return _resolved;

  try {
    const cached = sessionStorage.getItem(CACHE_KEY);
    if (cached) {
      _resolved = cached;
      return _resolved;
    }
  } catch {}

  // Instant zero-probe check: if we are on a known static host, use dedicated backend
  if (isStaticFrontendHost()) {
    _resolved = BACKEND_URL;
    try { sessionStorage.setItem(CACHE_KEY, _resolved); } catch {}
    return _resolved;
  }

  // If running directly on the backend server itself
  if (typeof window !== 'undefined' && window.location.hostname.includes('scholars-hub2.onrender.com')) {
    _resolved = '/api';
    try { sessionStorage.setItem(CACHE_KEY, _resolved); } catch {}
    return _resolved;
  }

  _resolved = BACKEND_URL;
  return _resolved;
}

/** API base that can be used synchronously right now without any delay. */
export function getApiBaseSync() {
  return _resolved || initApiBase();
}

/** Same-origin /api turned out to be wrong (static host SPA fallback) — lock to absolute URL. */
export function markSameOriginApiUnavailable() {
  _resolved = BACKEND_URL;
  try {
    sessionStorage.setItem(CACHE_KEY, BACKEND_URL);
  } catch {}
}

/**
 * Resolves API base URL. Guaranteed to return in 0ms on static frontend.
 */
export async function resolveApiBase() {
  return getApiBaseSync();
}

/** Warm up the connection to the API host with DNS-prefetch and preconnect. */
export function warmApiConnection() {
  if (typeof document === 'undefined') return;
  const base = getApiBaseSync();
  if (!base.startsWith('http')) return;
  try {
    const origin = new URL(base).origin;
    if (document.querySelector(`link[rel="preconnect"][href="${origin}"]`)) return;
    const link = document.createElement('link');
    link.rel = 'preconnect';
    link.href = origin;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);

    const dnsLink = document.createElement('link');
    dnsLink.rel = 'dns-prefetch';
    dnsLink.href = origin;
    document.head.appendChild(dnsLink);
  } catch {
    /* invalid URL — ignore */
  }
}
