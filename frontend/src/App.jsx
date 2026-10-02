import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense, useEffect, useState } from 'react';
import { Capacitor } from '@capacitor/core';

// The canonical origin is the single origin that owns the auth session.
// Supabase keeps the session in localStorage, which is scoped PER-ORIGIN.
const CANONICAL_ORIGIN = (import.meta.env.VITE_CANONICAL_ORIGIN || 'https://scholars-hub2-1.onrender.com').replace(/\/+$/, '');

function isDevOrigin(origin) {
  try {
    if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) return true;
    if (origin.startsWith('capacitor://') || origin.startsWith('ionic://')) return true;
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.localhost');
  } catch {
    return false;
  }
}

/**
 * When OAuth redirects to the website in a mobile browser (Chrome on Android),
 * automatically relay the authentication credentials into the native Scholars Hub app.
 */
function MobileOAuthRelay() {
  const [tokens, setTokens] = useState(null);

  useEffect(() => {
    if (typeof window === 'undefined' || Capacitor.isNativePlatform()) return;

    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const hasTokens = hash.includes('access_token=') || search.includes('code=');

    if (hasTokens) {
      const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
      if (isMobile) {
        const fullParams = hash || search;
        const appDeepLink = `scholarshub://auth-callback${fullParams}`;
        setTokens({ deepLink: appDeepLink });
        try {
          window.location.href = appDeepLink;
        } catch {
          /* ignore */
        }
      }
    }
  }, []);

  if (!tokens) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0F172A] text-white p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/10 p-3 mb-6 shadow-xl flex items-center justify-center backdrop-blur-md">
        <img src="/logo.png" alt="Scholars Hub" className="w-full h-full object-contain" />
      </div>
      <h1 className="text-2xl font-bold mb-2">Welcome to Scholars Hub</h1>
      <p className="text-gray-300 text-sm mb-6">Returning you to the Scholars Hub App...</p>
      <a
        href={tokens.deepLink}
        className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base shadow-xl hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
      >
        Open Scholars Hub App
      </a>
      <p className="text-xs text-gray-500 mt-6">
        If the app did not open automatically, tap the button above.
      </p>
    </div>
  );
}

/**
 * Wraps the route tree. If the app is running on an origin other than the
 * canonical one (and not in local development or native Capacitor app),
 * bounces the browser to the exact same URL on the canonical origin.
 */
function CanonicalGate({ children }) {
  const isNative = typeof window !== 'undefined' && Capacitor.isNativePlatform();
  const foreignOrigin =
    !isNative &&
    typeof window !== 'undefined' &&
    window.location.origin !== CANONICAL_ORIGIN &&
    !isDevOrigin(window.location.origin);

  useEffect(() => {
    if (foreignOrigin) {
      window.location.replace(
        `${CANONICAL_ORIGIN}${window.location.pathname}${window.location.search}${window.location.hash}`
      );
    }
  }, [foreignOrigin]);

  if (foreignOrigin) return <PageSpinner />;
  return children;
}

const importLayout = () => import('./components/Layout');
const importLogin = () => import('./pages/Login');
const importAuthCallback = () => import('./pages/AuthCallback');
const importForgotPassword = () => import('./pages/ForgotPassword');
const importResetPassword = () => import('./pages/ResetPassword');
const importFeed = () => import('./pages/Feed');
const importExplore = () => import('./pages/Explore');
const importUpload = () => import('./pages/Upload');
const importProfile = () => import('./pages/Profile');
const importNotifications = () => import('./pages/Notifications');
const importPostDetail = () => import('./pages/PostDetail');
const importBookmarks = () => import('./pages/Bookmarks');
const importPdfTools = () => import('./pages/PdfTools');
const importChat = () => import('./pages/Chat');

const Layout = lazy(importLayout);
const Login = lazy(importLogin);
const AuthCallback = lazy(importAuthCallback);
const ForgotPassword = lazy(importForgotPassword);
const ResetPassword = lazy(importResetPassword);
const Feed = lazy(importFeed);
const Explore = lazy(importExplore);
const Upload = lazy(importUpload);
const Profile = lazy(importProfile);
const Notifications = lazy(importNotifications);
const PostDetail = lazy(importPostDetail);
const Bookmarks = lazy(importBookmarks);
const PdfTools = lazy(importPdfTools);
const Chat = lazy(importChat);

const IDLE_PREFETCH = [
  importLayout,
  importFeed,
  importExplore,
  importChat,
  importNotifications,
  importProfile,
  importBookmarks,
  importUpload,
  importPostDetail,
  importLogin,
];

function useIdlePrefetch() {
  useEffect(() => {
    let cancelled = false;
    const warm = () => {
      if (cancelled) return;
      for (const load of IDLE_PREFETCH) {
        try { load(); } catch { /* non-fatal */ }
      }
    };
    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const id = window.requestIdleCallback(warm, { timeout: 2500 });
      return () => { cancelled = true; window.cancelIdleCallback(id); };
    }
    const t = setTimeout(warm, 1200);
    return () => { cancelled = true; clearTimeout(t); };
  }, []);
}

function PageSpinner() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-ig-bg-2 dark:bg-black">
      <div className="loading-spinner"></div>
    </div>
  );
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return <PageSpinner />;
  }
  return user ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

function RootRoute() {
  const { user, loading } = useAuth();
  if (loading) return <PageSpinner />;

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <Navigate
      to={{
        pathname: '/login',
        search: window.location.search,
        hash: window.location.hash
      }}
      replace
    />
  );
}

function AppRoutes() {
  useIdlePrefetch();

  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<RootRoute />} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/auth-callback" element={<AuthCallback />} />
        <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/dashboard" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Feed />} />
          <Route path="explore" element={<Explore />} />
          <Route path="upload" element={<Upload />} />
          <Route path="profile/:id" element={<Profile />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="post/:id" element={<PostDetail />} />
          <Route path="bookmarks" element={<Bookmarks />} />
          <Route path="pdf-tools" element={<PdfTools />} />
          <Route path="messages" element={<Chat />} />
        </Route>
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </Suspense>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <Router>
          <MobileOAuthRelay />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                borderRadius: '999px',
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                color: '#E8EAED',
                border: '1px solid var(--glass-border)',
                fontSize: '14px',
                padding: '10px 16px',
                boxShadow: '6px 6px 14px var(--neu-shadow-dark), -6px -6px 14px var(--neu-shadow-light), inset 0 1px 0 var(--glass-highlight)',
              },
              success: {
                iconTheme: {
                  primary: '#34A853',
                  secondary: '#121212',
                },
              },
              error: {
                iconTheme: {
                  primary: '#EA4335',
                  secondary: '#121212',
                },
              },
            }}
          />
          <CanonicalGate>
            <AppRoutes />
          </CanonicalGate>
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
