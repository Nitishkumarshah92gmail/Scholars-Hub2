import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { isSupabaseConfigured } from '../lib/supabase';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import { HiEye, HiEyeOff, HiExclamation } from 'react-icons/hi';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { loginUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return toast.error('Please fill in all fields.');
    if (!isSupabaseConfigured) {
      toast.error('App is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your Vercel environment variables.', { duration: 8000 });
      return;
    }
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed.';
      if (msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('networkerror') || msg.toLowerCase().includes('fetch')) {
        toast.error('Cannot connect to authentication server. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set in Vercel.', { duration: 8000 });
      } else if (msg.toLowerCase().includes('invalid login')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (msg.toLowerCase().includes('rate limit')) {
        toast.error('Too many login attempts. Please wait a few minutes.', { duration: 6000 });
      } else if (msg.toLowerCase().includes('email not confirmed')) {
        toast.error('Please confirm your email before logging in.');
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ig-bg-2 dark:bg-ig-bg-dark px-4">
      <div className="w-full max-w-[380px] space-y-3">
        {/* Config Warning Banner */}
        {!isSupabaseConfigured && (
          <div className="flex items-start gap-3 bg-yellow-500/10 border border-yellow-500/40 rounded-xl px-4 py-3">
            <HiExclamation className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-yellow-400">App Not Configured</p>
              <p className="text-xs text-yellow-300/80 mt-0.5 leading-relaxed">
                Missing <code className="bg-yellow-500/20 px-1 rounded">VITE_SUPABASE_URL</code> and <code className="bg-yellow-500/20 px-1 rounded">VITE_SUPABASE_ANON_KEY</code>.
                Set them in your Vercel project → Settings → Environment Variables, then redeploy.
              </p>
            </div>
          </div>
        )}
        {/* Main Card */}
        <div className="card px-10 pt-10 pb-6">
          {/* Logo */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-heading font-bold text-ig-text dark:text-ig-text-light flex items-center justify-center gap-2">
              <img src={logoImg} alt="Scholars Hub" className="w-10 h-10 rounded-full object-cover" />
              Scholars<span className="gradient-text"> Hub</span>
            </h1>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input-field text-xs !py-2.5"
              placeholder="Email address"
            />

            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field text-xs !py-2.5 pr-10"
                placeholder="Password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-ig-text-2 hover:text-ig-text dark:hover:text-ig-text-light text-sm font-semibold"
              >
                {showPassword ? 'Hide' : 'Show'}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading || !email || !password}
              className="btn-primary w-full mt-3 text-sm"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto" />
              ) : (
                'Log in'
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-5">
            <div className="flex-1 h-px bg-ig-separator dark:bg-ig-separator-dark" />
            <span className="text-xs text-ig-text-2 font-semibold uppercase">Or</span>
            <div className="flex-1 h-px bg-ig-separator dark:bg-ig-separator-dark" />
          </div>

          <Link to="/forgot-password" className="block text-center text-xs text-ig-primary font-semibold hover:text-ig-primary-hover">
            Forgot password?
          </Link>

          <p className="text-center text-xs text-ig-text-2 mt-3">
            Welcome to Scholars Hub — learn together, grow together.
          </p>
        </div>

        {/* Sign Up Card */}
        <div className="card p-5 text-center">
          <p className="text-sm text-ig-text dark:text-ig-text-light">
            Don't have an account?{' '}
            <Link to="/register" className="text-ig-primary font-semibold hover:text-ig-primary-hover">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
