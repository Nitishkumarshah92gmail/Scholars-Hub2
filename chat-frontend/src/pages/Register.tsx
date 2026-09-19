import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate, Link } from 'react-router-dom';
import { GlassCard, Button, Input, Spinner } from '../components/GlassUI';
import { UserPlus } from 'lucide-react';
import API from '../services/api';

export default function Register() {
  const { user, login, loading } = useAuth();
  const [formData, setFormData] = useState({ name: '', email: '', password: '', school: '' });
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (loading) return <div className="flex items-center justify-center h-full"><Spinner /></div>;
  if (user) return <Navigate to="/" replace />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);
    try {
      const { data } = await API.post('/auth/register', formData);
      login(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to register');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-slide-up">
      <GlassCard className="text-center flex flex-col items-center">
        <div className="w-16 h-16 bg-chat-primary/20 rounded-full flex items-center justify-center mb-6">
          <UserPlus className="w-8 h-8 text-chat-primary" />
        </div>
        <h1 className="text-3xl font-bold mb-2">Create Account</h1>
        <p className="text-white/60 mb-8">Join Scholars Chat today</p>

        {error && <div className="w-full bg-red-500/20 text-red-200 p-3 rounded-2xl mb-4 text-sm border border-red-500/50">{error}</div>}

        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <Input type="text" placeholder="Full Name" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} />
          <Input type="email" placeholder="Email address" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} />
          <Input type="password" placeholder="Password" required value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} />
          <Input type="text" placeholder="School/University (Optional)" value={formData.school} onChange={(e) => setFormData({...formData, school: e.target.value})} />
          
          <Button type="submit" className="w-full py-3 text-lg" disabled={isSubmitting}>
            {isSubmitting ? <Spinner /> : 'Create Account'}
          </Button>
        </form>
        
        <p className="mt-6 text-white/60">
          Already have an account? <Link to="/login" className="text-chat-primary hover:underline">Log in</Link>
        </p>
      </GlassCard>
    </div>
  );
}
