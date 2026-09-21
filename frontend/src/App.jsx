import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense, useEffect } from 'react';

// The canonical origin is the single origin that owns the auth session.
// Supabase keeps the session in localStorage, which is scoped PER-ORIGIN, so a
// session created here is invisible on any other origin the app is served from
// (e.g. the scholarshub.qd.je custom domain). To avoid "logged in on one URL,
// logged out on the other", every non-canonical origin is hard-forwarded to the
// canonical one (preserving path, query and hash), which then decides:
//   signed in  ->  /dashboard
//   signed out ->  /login
const CANONICAL_ORIGIN = (import.meta.env.VITE_CANONICAL_ORIGIN || 'https://scholars-hub2-1.onrender.com').replace(/\/+$/, '');

function isDevOrigin(origin) {
  try {
    const url = new URL(origin);
    return url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.localhost');
  } catch {
    return false;
  }
}

/**
 * Wraps the route tree. If the app is running on an origin other than the
 * canonical one (and not in local development), bounces the browser to the
 * exact same URL on the canonical origin and shows a spinner while navigating.
 */
function CanonicalGate({ children }) {
  const foreignOrigin =
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

// Named importers so the same functions can be reused for idle prefetching.
// NOTE: PdfTools is deliberately NOT prefetched — it pulls the 400KB+ pdf chunk.
const importLayout = () => import('./components/Layout');
const importLogin = () => import('./pages/Login');
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

// Warm the route chunks during browser idle time so tab switches (Home -> Messages
// -> Search ...) render instantly instead of showing the Suspense spinner while
// the chunk downloads. Runs once, ~after first paint, in priority order.
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
        // Fire sequentially-ish; each import() is cached by the browser after first call
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

  // If user is authenticated, go to dashboard
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  // If not authenticated, go to login but PRESERVE the hash and search params.
  // This is critical for OAuth redirects (like Google Login) which put the access_token in the hash.
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