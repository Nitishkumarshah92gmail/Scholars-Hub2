import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense, useEffect } from 'react';

const CANONICAL_ORIGIN = (import.meta.env.VITE_CANONICAL_ORIGIN || 'https://scholars-hub2-1.onrender.com').replace(/\/+$/, '');

function isAllowedOrigin(origin) {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    return (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host.endsWith('.localhost')
    );
  } catch {
    return false;
  }
}

/**
 * Wraps the route tree. If the app is accessed on an unverified domain,
 * safely redirects to the canonical origin.
 */
function CanonicalGate({ children }) {
  const foreignOrigin =
    typeof window !== 'undefined' &&
    window.location.origin !== CANONICAL_ORIGIN &&
    !isAllowedOrigin(window.location.origin);

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



