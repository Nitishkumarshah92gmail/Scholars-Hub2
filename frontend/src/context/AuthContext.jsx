import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, warmSupabaseConnection } from '../lib/supabase';
import { resolveApiBase, warmApiConnection } from '../lib/apiBase';

const AuthContext = createContext(null);

// The last profile we successfully loaded, kept so a reload/refresh can render
// the signed-in UI instantly instead of waiting on the network.
const PROFILE_CACHE_KEY = 'sh_profile_cache_v1';
const PROFILE_TIMEOUT_MS = 10000;

function readCachedProfile() {
  try {
    const raw = localStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCachedProfile(profile) {
  try {
    if (profile) localStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {
    /* storage full/disabled — not fatal */
  }
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

// Build a minimal user object from a Supabase session (used for instant render
// and as a fallback when the backend is unreachable).
function buildUserFromSession(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  return {
    _id: supabaseUser.id,
    name: meta.name || meta.full_name || 'User',
    email: supabaseUser.email || '',
    avatar:
      meta.avatar ||
      meta.avatar_url ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=1e3a5f&color=fbbf24&size=200`,
    bio: meta.bio || '',
    school: meta.school || '',
    subjects: meta.subjects || [],
    followers: [],
    following: [],
    bookmarks: [],
    createdAt: supabaseUser.created_at,
  };
}

// Pulls a human-readable OAuth failure out of the URL (Supabase appends
// #error_description=... when a provider sign-in fails) and cleans the URL.
function consumeAuthErrorFromUrl() {
  if (typeof window === 'undefined') return null;
  try {
    const hash = (window.location.hash || '').replace(/^#/, '');
    const search = (window.location.search || '').replace(/^\?/, '');
    const params = new URLSearchParams(hash.includes('error') ? hash : search);
    const description = params.get('error_description') || params.get('error');
    if (!description) return null;
    window.history.replaceState(null, '', window.location.pathname);
    return description.replace(/\+/g, ' ');
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  // Instant paint: if we cached a profile from a previous visit, use it right away.
  // The session check below confirms it (and clears it if it is no longer valid).
  const [user, setUser] = useState(() => readCachedProfile());
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => !readCachedProfile());
  const [authError, setAuthError] = useState(null);

  // Fetch the full profile from the backend with a REAL timeout (the previous
  // version only claimed to have one), falling back to the session user.
  const fetchProfile = async (accessToken, supabaseUser = null) => {
    try {
      const apiUrl = await resolveApiBase();
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), PROFILE_TIMEOUT_MS);
      try {
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
          writeCachedProfile(profile);
          return profile;
        }
        // Non-ok response (e.g. 503 when backend Supabase isn't configured)
        console.warn(`Backend /auth/me returned ${res.status}, using session fallback`);
      } catch (fetchErr) {
        console.warn('Backend /auth/me unavailable, using session fallback:', fetchErr.message);
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }

    // Fallback: construct user from Supabase session if backend is unreachable.
    // Never overwrite richer cached data for the same user with this minimal object.
    if (supabaseUser) {
      const fallback = buildUserFromSession(supabaseUser);
      setUser((prev) => (prev && prev._id === fallback._id ? prev : fallback));
      return fallback;
    }
    return null;
  };


  useEffect(() => {
    // Warm DNS/TLS for Supabase + Google so sign-in feels instant, and for the
    // API host so the first data request doesn't pay the connection cost.
    warmSupabaseConnection();
    warmApiConnection();

    // Surface any OAuth error Supabase appended to the URL instead of silently
    // dumping the user on the login page.
    const urlError = consumeAuthErrorFromUrl();
    if (urlError) setAuthError(urlError);

    let cancelled = false;

    // 1) Resolve the stored session — a LOCAL read, so it is fast. This tells us
    //    whether the user is signed in; the UI is never blocked on the network.
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (cancelled) return;
        setSession(s);
        if (s?.access_token) {
          if (!readCachedProfile()) setUser(buildUserFromSession(s.user)); // instant shell
          setLoading(false);                                              // render immediately
          fetchProfile(s.access_token, s.user);                           // hydrate in background
        } else {
          clearCachedProfile();
          setUser(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    // 2) React to later auth events (OAuth redirect, sign-out, token refresh).
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (cancelled) return;
        setSession(s);

        if (event === 'PASSWORD_RECOVERY') {
          // User clicked the password reset link — let ResetPassword handle it
          return;
        }

        if (event === 'SIGNED_OUT') {
          clearCachedProfile();
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && s?.access_token) {
          // Show the user immediately, then fetch the full profile after a short
          // delay (the backend creates the profile row right after sign-up).
          setUser((prev) => (prev && prev._id === s.user?.id ? prev : buildUserFromSession(s.user)));
          setLoading(false);
          setTimeout(() => { if (!cancelled) fetchProfile(s.access_token, s.user); }, 400);
          return;
        }

        // Session appeared without a SIGNED_IN event (e.g. OAuth hash parsed late)
        if (s?.access_token) {
          setUser((prev) => (prev && prev._id === s.user?.id ? prev : buildUserFromSession(s.user)));
          setLoading(false);
        }
      }
    );

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);


  const loginUser = async (email, password) => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
      );
    }

    let data, error;
    try {
      ({ data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      }));
    } catch (networkErr) {
      // Network-level failure (e.g. wrong Supabase URL, no internet)
      console.error('Login network error:', networkErr);
      throw new Error(
        'Unable to connect to authentication server. Please check your internet connection and try again.'
      );
    }

    if (error) throw error;
    setSession(data.session);

    // Show the user immediately, then load the full profile in the background so
    // the login button never waits on the backend.
    setUser(buildUserFromSession(data.user));
    setLoading(false);
    fetchProfile(data.session.access_token, data.user);
    return data.user;
  };

  const registerUser = async ({ name, email, password, school, subjects }) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          school: school || '',
          subjects: subjects || [],
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1e3a5f&color=fbbf24&size=200`,
        },
      },
    });
    if (error) throw error;

    // If email confirmation is disabled, we get a session immediately
    if (data.session) {
      setSession(data.session);
      setUser(buildUserFromSession(data.user));
      setLoading(false);
      // Give the backend profile trigger a moment, then hydrate (non-blocking).
      setTimeout(() => { fetchProfile(data.session.access_token, data.user); }, 800);
      return data.user;
    }

    // If email confirmation is enabled, return null (user needs to verify email)
    return null;
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    clearCachedProfile();
    setUser(null);
    setSession(null);
    setAuthError(null);
  };

  const loginWithGoogle = async () => {
    if (!isSupabaseConfigured) {
      throw new Error(
        'Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables.'
      );
    }
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
    if (error) throw error;
    return data;
  };

  const updateUserData = (userData) => {
    setUser(userData);
  };

  const getAccessToken = async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    return s?.access_token || null;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        loading,
        authError,
        clearAuthError: () => setAuthError(null),
        loginUser,
        registerUser,
        loginWithGoogle,
        logoutUser,
        updateUserData,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
