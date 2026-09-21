import { supabase } from './lib/supabase';
import { getApiBaseSync, resolveApiBase, markSameOriginApiUnavailable } from './lib/apiBase';

// ─────────────────────────────────────────────────────────────────────────────
// Lightweight fetch client (replaces axios: ~53KB less JS, real timeouts, and
// a same-origin API base that avoids a CORS preflight on every request).
//
// Response/error shapes intentionally mirror axios so existing callers keep
// working unchanged:  res.data  /  err.response.data  /  err.message
// ─────────────────────────────────────────────────────────────────────────────
const DEFAULT_TIMEOUT_MS = 20000; // generous: backend can cold-start

class ApiError extends Error {
  constructor(message, status, data) {
    super(message);
    this.name = 'ApiError';
    this.response = { status, data };
    this.status = status;
  }
}

function buildUrl(base, path, params) {
  const url = new URL(`${base}${path}`, window.location.origin);
  if (params && typeof params === 'object') {
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') continue;
      url.searchParams.set(key, value);
    }
  }
  return url.toString();
}

async function parseBody(res) {
  const text = await res.text().catch(() => '');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

// Cache the session briefly so we don't call getSession() on every request
let _cachedSession = null;
let _sessionFetchedAt = 0;
let _refreshInFlight = null;
const SESSION_CACHE_MS = 30_000;

async function getCachedSession(force = false) {
  const now = Date.now();
  if (!force && _cachedSession && now - _sessionFetchedAt < SESSION_CACHE_MS) {
    return _cachedSession;
  }
  try {
    const { data } = await supabase.auth.getSession();
    _cachedSession = data?.session || null;
  } catch {
    /* keep last known value */
  }
  _sessionFetchedAt = now;
  return _cachedSession;
}

// Keep cache in sync when auth state changes
supabase.auth.onAuthStateChange((_event, session) => {
  _cachedSession = session;
  _sessionFetchedAt = Date.now();
});

// Try a token refresh (deduplicated). Returns the new access token or null.
async function refreshAccessToken() {
  if (_refreshInFlight) return _refreshInFlight;
  _refreshInFlight = (async () => {
    try {
      const { data, error } = await supabase.auth.refreshSession();
      if (error || !data?.session) return null;
      _cachedSession = data.session;
      _sessionFetchedAt = Date.now();
      return data.session.access_token;
    } catch {
      return null;
    } finally {
      setTimeout(() => { _refreshInFlight = null; }, 3000);
    }
  })();
  return _refreshInFlight;
}

async function rawRequest(base, path, { method, params, data, headers, timeoutMs }) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const session = await getCachedSession();
  const finalHeaders = { ...headers };
  if (data !== undefined) finalHeaders['Content-Type'] = 'application/json';
  if (session?.access_token) finalHeaders.Authorization = `Bearer ${session.access_token}`;

  try {
    return await fetch(buildUrl(base, path, params), {
      method,
      headers: finalHeaders,
      body: data !== undefined ? JSON.stringify(data) : undefined,
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timer);
  }
}

async function request(path, options = {}) {
  const {
    method = 'GET',
    params,
    data,
    headers,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retryOn401 = true,
  } = options;

  let base = await resolveApiBase();
  const send = (b) => rawRequest(b, path, { method, params, data, headers, timeoutMs });

  let res;
  try {
    res = await send(base);
  } catch (err) {
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please check your connection.', 0, null);
    }
    if (base === '/api') {
      // Same-origin attempt failed — fall back to the absolute backend once.
      markSameOriginApiUnavailable();
      base = await resolveApiBase();
      res = await send(base);
    } else {
      throw new ApiError(err.message || 'Network error. Please try again.', 0, null);
    }
  }

  let body = await parseBody(res);

  // A static host can answer /api/* with the SPA HTML — treat that as wrong base
  if (typeof body === 'string' && base === '/api') {
    markSameOriginApiUnavailable();
    base = await resolveApiBase();
    res = await send(base);
    body = await parseBody(res);
  }

  // 401 → refresh the token and retry ONCE instead of logging the user out.
  // (The old behaviour force-signed-out and redirected on any 401, which is why
  //  already-logged-in users were constantly bounced back to the login page.)
  if (res.status === 401 && retryOn401) {
    const newToken = await refreshAccessToken();
    if (newToken) {
      const retryRes = await send(base);
      const retryBody = await parseBody(retryRes);
      if (retryRes.ok) return { data: retryBody };
      if (retryRes.status !== 401) {
        throw new ApiError(
          (retryBody && retryBody.error) || `Request failed (${retryRes.status})`,
          retryRes.status,
          retryBody
        );
      }
    }
    // Refresh failed → the session is genuinely gone. Clear local state so the
    // router routes to /login; never hard-reload the page.
    try { await supabase.auth.signOut({ scope: 'local' }); } catch { /* ignore */ }
    throw new ApiError((body && body.error) || 'Session expired. Please sign in again.', 401, body);
  }

  if (!res.ok) {
    const message = (body && (body.error || body.message)) || `Request failed (${res.status})`;
    throw new ApiError(message, res.status, body);
  }

  return { data: body };
}


// ── Auth ────────────────────────────────────────────────────────────────────
export const getMe = () => request('/auth/me');

// ── Posts ───────────────────────────────────────────────────────────────────
export const getFeed = (page = 1) => request('/posts', { params: { page } });
export const getExplore = (params) => request('/posts/explore', { params });
export const getPost = (id) => request(`/posts/${id}`);
export const createPost = (data) => request('/posts', { method: 'POST', data });
export const likePost = (id) => request(`/posts/${id}/like`, { method: 'POST' });
export const commentPost = (id, text) => request(`/posts/${id}/comment`, { method: 'POST', data: { text } });
export const reportPost = (id, reason) => request(`/posts/${id}/report`, { method: 'POST', data: { reason } });
export const deletePost = (id) => request(`/posts/${id}`, { method: 'DELETE' });
export const validateYoutubeUrl = (url) => request('/posts/youtube/validate', { params: { url } });

// ── Users ───────────────────────────────────────────────────────────────────
export const getUser = (id) => request(`/users/${id}`);
export const updateUser = (id, data) => request(`/users/${id}`, { method: 'PUT', data });
export const followUser = (id) => request(`/users/${id}/follow`, { method: 'POST' });
export const getTotalUsers = () => request('/users/stats/count');
export const getScholars = () => request('/users/scholars');
export const bookmarkPost = (postId) => request(`/users/bookmark/${postId}`, { method: 'POST' });
export const getBookmarks = (id) => request(`/users/${id}/bookmarks`);
export const searchUsers = (q) => request('/users/search/find', { params: { q } });

// ── Notifications ───────────────────────────────────────────────────────────
export const getNotifications = () => request('/notifications');
export const markNotificationsRead = () => request('/notifications/read', { method: 'PUT' });

// ── Supabase Storage direct uploads ─────────────────────────────────────────
export const getPresignedUrl = (fileName, fileType, subfolder = 'images') =>
  request('/upload/presigned-url', { params: { fileName, fileType, subfolder } });

// Presigned URLs already carry their own auth — no Authorization header, no API base.
export const uploadDirect = async (signedUrl, file) => {
  const res = await fetch(signedUrl, {
    method: 'PUT',
    headers: { 'Content-Type': file.type || 'application/octet-stream' },
    body: file,
  });
  if (!res.ok) {
    throw new ApiError(`Upload failed (${res.status})`, res.status, null);
  }
  return { data: null };
};

export const deleteFile = (fileId) => request(`/upload/${fileId}`, { method: 'DELETE' });

export { getApiBaseSync };
export default request;
