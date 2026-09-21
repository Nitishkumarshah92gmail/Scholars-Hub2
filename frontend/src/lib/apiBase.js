// Resolves the API base URL for the current deployment.
//
// Why this exists: the app is served from several places (custom domain, *.onrender.com,
// Vercel). When the frontend and API are served from the SAME origin we want to use
// "/api" — it avoids a CORS preflight round-trip and a separate DNS/TLS connection,
// which makes every request noticeably faster. Otherwise we fall back to the
// absolute backend URL.
const ABSOLUTE_FALLBACK = (import.meta.env.VITE_API_URL || 'https://scholars-hub2.onrender.com/api').replace(/\/+$/, '');
const CACHE_KEY = 'sh_api_base_v1';
const PROBE_TIMEOUT_MS = 2500;

let _resolved = null;
let _probing = null;

function readCache() {
  try {
    return sessionStorage.getItem(CACHE_KEY) || null;
  } catch {
    return null;
  }
}

function writeCache(value) {
  try {
    sessionStorage.setItem(CACHE_KEY, value);
  } catch {
    /* private mode / storage disabled — in-memory value still applies */
  }
}

/** API base that can be used synchronously right now. */
export function getApiBaseSync() {
  return _resolved || ABSOLUTE_FALLBACK;
}

/** Same-origin /api turned out to be wrong (static host SPA fallback) — use the absolute URL. */
export function markSameOriginApiUnavailable() {
  _resolved = ABSOLUTE_FALLBACK;
  writeCache(ABSOLUTE_FALLBACK);
}

/**
 * Resolves once per session whether the API lives on this origin.
 * Positive results are cached in sessionStorage so a reload skips the probe.
 */
export async function resolveApiBase() {
  if (_resolved) return _resolved;
  if (_probing) return _probing;

  const cached = readCache();
  if (cached) {
    _resolved = cached;
    return _resolved;
  }

  _probing = (async () => {
    try {
      if (typeof window !== 'undefined' && window.location.protocol.startsWith('http')) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
        try {
          const res = await fetch('/api/health', { signal: controller.signal, cache: 'no-store' });
          const type = res.headers.get('content-type') || '';
          if (res.ok && type.includes('application/json')) {
            const data = await res.json();
            if (data && data.status === 'ok') {
              _resolved = '/api';
              writeCache('/api');
              return _resolved;
            }
          }
        } finally {
          clearTimeout(timer);
        }
      }
    } catch {
      /* not same-origin (or offline) — use the absolute backend */
    }
    // Do NOT cache negative results: the next visit can probe again.
    _resolved = ABSOLUTE_FALLBACK;
    return _resolved;
  })();

  return _probing;
}

/** Warm up the connection to the API host so the first real request is faster. */
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
  } catch {
    /* invalid URL — ignore */
  }
}
