import { createContext, useContext, useState, useEffect } from 'react';
import { supabase, isSupabaseConfigured, warmSupabaseConnection } from '../lib/supabase';
import { resolveApiBase, warmApiConnection } from '../lib/apiBase';
import { Capacitor } from '@capacitor/core';
import { Browser } from '@capacitor/browser';
import { App as CapApp } from '@capacitor/app';

const AuthContext = createContext(null);

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
    /* storage full/disabled */
  }
}

function clearCachedProfile() {
  try {
    localStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {
    /* ignore */
  }
}

function buildUserFromSession(supabaseUser) {
  if (!supabaseUser) return null;
  const meta = supabaseUser.user_metadata || {};
  return {
    _id: supabaseUser.id,
    name: meta.name || meta.full_name || supabaseUser.email?.split('@')[0] || 'User',
    email: supabaseUser.email,
    school: meta.school || '',
    subjects: meta.subjects || [],
    avatar:
      meta.avatar_url ||
      meta.avatar ||
      `https://ui-avatars.com/api/?name=${encodeURIComponent(
        meta.name || supabaseUser.email || 'User'
      )}&background=1e3a5f&color=fbbf24&size=200`,
    bio: meta.bio || '',
    isShell: true,
  };
}

function consumeAuthErrorFromUrl() {
  if (typeof window === 'undefined') return null;

  try {
    const hash = window.location.hash ? window.location.hash.substring(1) : '';
    const search = window.location.search ? window.location.search.substring(1) : '';
    const params = new URLSearchParams(hash || search);

    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (!error && !errorDescription) return null;

    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState(null, '', cleanUrl);
    }

    if (errorDescription) {
      return decodeURIComponent(errorDescription.replace(/\+/g, ' '));
    }
    return error || 'Authentication failed.';
  } catch {
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readCachedProfile());
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(() => !readCachedProfile());
  const [authError, setAuthError] = useState(null);

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
        console.warn(`Backend /auth/me returned ${res.status}, using session fallback`);
      } catch (fetchErr) {
        console.warn('Backend /auth/me unavailable, using session fallback:', fetchErr.message);
      } finally {
        clearTimeout(timer);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }

    if (supabaseUser) {
      const fallback = buildUserFromSession(supabaseUser);
      setUser((prev) => (prev && prev._id === fallback._id ? prev : fallback));
      return fallback;
    }
    return null;
  };

  useEffect(() => {
    warmSupabaseConnection();
    warmApiConnection();

    const urlError = consumeAuthErrorFromUrl();
    if (urlError) setAuthError(urlError);

    let cancelled = false;

    // 1) Read local session
    supabase.auth
      .getSession()
      .then(({ data: { session: s } }) => {
        if (cancelled) return;
        setSession(s);
        if (s?.access_token) {
          if (!readCachedProfile()) setUser(buildUserFromSession(s.user));
          setLoading(false);
          fetchProfile(s.access_token, s.user);
        } else {
          clearCachedProfile();
          setUser(null);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    // 2) Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, s) => {
        if (cancelled) return;
        setSession(s);

        if (event === 'PASSWORD_RECOVERY') return;

        if (event === 'SIGNED_OUT') {
          clearCachedProfile();
          setUser(null);
          setLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && s?.access_token) {
          setUser((prev) => (prev && prev._id === s.user?.id ? prev : buildUserFromSession(s.user)));
          setLoading(false);
          setTimeout(() => { if (!cancelled) fetchProfile(s.access_token, s.user); }, 400);
          return;
        }

        if (s?.access_token) {
          setUser((prev) => (prev && prev._id === s.user?.id ? prev : buildUserFromSession(s.user)));
          setLoading(false);
        }
      }
    );

    // 3) Listen for native deep links (OAuth callback on Android)
    let appUrlListener = null;
    if (Capacitor.isNativePlatform()) {
      CapApp.addListener('appUrlOpen', async ({ url }) => {
        try {
          await Browser.close();
        } catch {
          /* ignore */
        }

        if (!url) return;

        try {
          const hashIdx = url.indexOf('#');
          const queryIdx = url.indexOf('?');
          const fragment = hashIdx !== -1 ? url.substring(hashIdx + 1) : '';
          const query = queryIdx !== -1 ? url.substring(queryIdx + 1) : '';
          const hashParams = new URLSearchParams(fragment);
          const queryParams = new URLSearchParams(query);

          const accessToken = hashParams.get('access_token') || queryParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token') || queryParams.get('refresh_token');
          const code = queryParams.get('code') || hashParams.get('code');
          const errorDesc = hashParams.get('error_description') || queryParams.get('error_description');

          if (errorDesc) {
            setAuthError(decodeURIComponent(errorDesc.replace(/\+/g, ' ')));
            return;
          }

          if (accessToken && refreshToken) {
            const { data, error: setErr } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (!setErr && data?.session) {
              setSession(data.session);
              setUser(buildUserFromSession(data.session.user));
              setLoading(false);
              fetchProfile(data.session.access_token, data.session.user);
            }
          } else if (code) {
            const { data, error: codeErr } = await supabase.auth.exchangeCodeForSession(code);
            if (!codeErr && data?.session) {
              setSession(data.session);
              setUser(buildUserFromSession(data.session.user));
              setLoading(false);
              fetchProfile(data.session.access_token, data.session.user);
            }
          }
        } catch (deepErr) {
          console.error('[OAuth DeepLink Error]', deepErr);
        }
      }).then((l) => {
        appUrlListener = l;
      });
    }

    return () => {
      cancelled = true;
      subscription.unsubscribe();
      if (appUrlListener) {
        appUrlListener.remove();
      }
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
      console.error('Login network error:', networkErr);
      throw new Error(
        'Unable to connect to authentication server. Please check your internet connection and try again.'
      );
    }

    if (error) throw error;
    setSession(data.session);
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

    if (data.session) {
      setSession(data.session);
      setUser(buildUserFromSession(data.user));
      setLoading(false);
      setTimeout(() => { fetchProfile(data.session.access_token, data.user); }, 800);
      return data.user;
    }

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

    const isNative = Capacitor.isNativePlatform();
    // On native app, request custom scheme redirect so Android routes back into app.
    // On web browser, use /auth-callback.
    const redirectTo = isNative
      ? 'scholarshub://auth-callback'
      : `${window.location.origin}/auth-callback`;

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo,
        skipBrowserRedirect: isNative,
      },
    });
    if (error) throw error;

    if (isNative && data?.url) {
      await Browser.open({ url: data.url, windowName: '_self' });
    }
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
