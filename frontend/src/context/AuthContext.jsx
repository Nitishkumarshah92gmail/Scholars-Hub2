import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Build a minimal user object from a Supabase session as fallback
  const buildUserFromSession = (supabaseUser) => {
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
  };

  // Fetch profile from backend API with a 10-second timeout.
  // Falls back to session-based user object if the backend is unavailable.
  const fetchProfile = async (accessToken, supabaseUser = null) => {
    try {
      const apiUrl = import.meta.env.VITE_API_URL || '/api';
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10000); // 10 s timeout
      try {
        const res = await fetch(`${apiUrl}/auth/me`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          signal: controller.signal,
        });
        clearTimeout(timer);
        if (res.ok) {
          const profile = await res.json();
          setUser(profile);
          return profile;
        }
      } catch (fetchErr) {
        clearTimeout(timer);
        console.warn('Backend /auth/me unavailable, using session fallback:', fetchErr.message);
      }
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }

    // Fallback: construct user from Supabase session if backend is unreachable
    if (supabaseUser) {
      const fallback = buildUserFromSession(supabaseUser);
      setUser(fallback);
      return fallback;
    }
    return null;
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      if (s?.access_token) {
        fetchProfile(s.access_token, s.user).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, s) => {
        setSession(s);
        if (event === 'PASSWORD_RECOVERY') {
          // User clicked the password reset link — don't fetch profile,
          // let the ResetPassword page handle it
          return;
        } else if (event === 'SIGNED_IN' && s?.access_token) {
          // Small delay to ensure the profile trigger has completed
          await new Promise((r) => setTimeout(r, 500));
          await fetchProfile(s.access_token, s.user);
        } else if (event === 'SIGNED_OUT') {
          setUser(null);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const loginUser = async (email, password) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    setSession(data.session);
    const profile = await fetchProfile(data.session.access_token, data.user);
    return profile;
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
      // Wait for trigger to create profile
      await new Promise((r) => setTimeout(r, 800));
      const profile = await fetchProfile(data.session.access_token, data.user);
      return profile;
    }

    // If email confirmation is enabled, return null (user needs to verify email)
    return null;
  };

  const logoutUser = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
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
        loginUser,
        registerUser,
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
