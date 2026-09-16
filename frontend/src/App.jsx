import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { lazy, Suspense } from 'react';

// Lazy load all pages — only Layout is kept eager for shell rendering
const Layout = lazy(() => import('./components/Layout'));
const Landing = lazy(() => import('./pages/Landing'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword = lazy(() => import('./pages/ResetPassword'));
const Feed = lazy(() => import('./pages/Feed'));
const Explore = lazy(() => import('./pages/Explore'));
const Upload = lazy(() => import('./pages/Upload'));
const Profile = lazy(() => import('./pages/Profile'));
const Notifications = lazy(() => import('./pages/Notifications'));
const PostDetail = lazy(() => import('./pages/PostDetail'));
const Bookmarks = lazy(() => import('./pages/Bookmarks'));
const PdfTools = lazy(() => import('./pages/PdfTools'));
const Chat = lazy(() => import('./pages/Chat'));

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
  return user ? children : <Navigate to="/landing" />;
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return null;
  return user ? <Navigate to="/dashboard" /> : children;
}

function AppRoutes() {
  return (
    <Suspense fallback={<PageSpinner />}>
      <Routes>
        <Route path="/" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/landing" element={<PublicRoute><Landing /></PublicRoute>} />
        <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
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
                background: '#121212',
                color: '#E8EAED',
                border: '1px solid #3C4043',
                fontSize: '14px',
                padding: '10px 16px',
                boxShadow: '0 8px 32px rgba(0,0,0,0.3)',
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
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}
