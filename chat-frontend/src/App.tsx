import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Spinner } from './components/GlassUI';
import Login from './pages/Login';
import Register from './pages/Register';

function AppBackground() {
  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-chat-bg">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-chat-primary/20 blur-[120px] animate-gentle-pulse" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-chat-secondary/20 blur-[120px] animate-gentle-pulse" style={{ animationDelay: '1.5s' }} />
    </div>
  );
}

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="flex items-center justify-center h-full"><Spinner /></div>;
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <AppBackground />
      <div className="h-[100dvh] w-full flex items-center justify-center p-4 sm:p-8">
        <Routes>
          <Route path="/" element={
            <ProtectedRoute>
              <div className="glass-panel w-full h-full flex flex-col items-center justify-center animate-fade-in">
                <h1 className="text-3xl font-bold mb-4">Welcome to Scholars Chat</h1>
                <p className="text-white/60 mb-8">Select a conversation to start messaging!</p>
              </div>
            </ProtectedRoute>
          } />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Routes>
      </div>
    </AuthProvider>
  );
}

export default App;
