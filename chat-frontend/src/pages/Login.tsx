import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { GlassCard, Button, Input, Spinner } from '../components/GlassUI';
import { LogIn } from 'lucide-react';
import API from '../services/api';

export default function Login() {
  const { user, login, loading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      <GlassCard className="text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-chat-primary/20 rounded-full flex items-center justify-center mb-6">
          <LogIn className="w-8 h-8 text-chat-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Welcome Back</h1>
        <p className="text-white/60 mb-8">Sign in to your account</p>

        {error && <div className="w-full bg-red-500/20 text-red-200 p-3 rounded-2xl mb-4 text-sm border border-red-500/50">{error}</div>}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <Input 
            type="email" 
            placeholder="Email address" 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required 
          />
          <Input 
            type="password" 
            placeholder="Password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required 
          />
          <Button type="submit" className="w-full py-3 text-lg" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : 'Sign In'}
          </Button>
        </form>
        
        <p className="mt-6 text-white/60">
          Don't have an account? <Link to="/register" className="text-chat-primary hover:underline">Register here</Link>
        </p>
      </GlassCard>
    </div>
  );
}
