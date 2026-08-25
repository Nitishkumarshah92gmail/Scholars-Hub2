import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import logoImg from '../assets/logo.png';
import { HiEye, HiEyeOff } from 'react-icons/hi';

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
    setLoading(true);
    try {
      await loginUser(email, password);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      const msg = err.message || 'Login failed.';
      const msgLower = msg.toLowerCase();
      if (msgLower.includes('invalid login')) {
        toast.error('Invalid email or password. Please try again.');
      } else if (msgLower.includes('rate limit')) {
        toast.error('Too many login attempts. Please wait a few minutes.', { duration: 6000 });
      } else if (msgLower.includes('email not confirmed')) {
        toast.error('Please confirm your email before logging in.');
      } else if (msgLower.includes('failed to fetch') || msgLower.includes('networkerror') || msgLower.includes('unable to connect')) {
        toast.error('Unable to connect to server. Please check your internet connection and try again.', { duration: 5000 });
      } else if (msgLower.includes('not configured')) {
        toast.error('App configuration error. Please contact the administrator.', { duration: 6000 });
      } else {
        toast.error(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-ig-bg-2 dark:bg-ig-bg-dark px-4">
      <div className="w-full max-w-[350px] space-y-3">
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
          <p className="text-sm text-ig-text dark:text-ig-text-light mb-3">
            Don't have an account?{' '}
            <Link to="/register" className="text-ig-primary font-semibold hover:text-ig-primary-hover">
              Sign up
            </Link>
          </p>
        </div>

        {/* Get the App Card */}
        <div className="text-center pt-2">
          <p className="text-sm text-ig-text dark:text-ig-text-light mb-3">Get the App.</p>
          <div className="flex justify-center gap-2">
            <a href="/scholars-hub.apk" download className="bg-white dark:bg-ig-bg-elevated hover:bg-gray-50 dark:hover:bg-ig-separator-dark transition-colors px-4 py-2 rounded-lg flex items-center gap-2 text-sm font-semibold shadow-sm border border-ig-separator dark:border-ig-separator-dark text-ig-text dark:text-ig-text-light">
              <svg className="w-5 h-5 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.523 15.3414c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993.0004.5511-.4482.9997-.9993.9997m-11.046 0c-.5511 0-.9993-.4486-.9993-.9997s.4482-.9993.9993-.9993c.5511 0 .9993.4482.9993.9993 0 .5511-.4482.9997-.9993.9997m11.4045-6.02l1.9973-3.4592a.416.416 0 0 0-.1521-.5676.416.416 0 0 0-.5676.1521l-2.0222 3.503c-1.4259-.652-2.9997-1.0182-4.6627-1.0182-1.6631 0-3.2369.3662-4.6627 1.0182l-2.0222-3.503a.416.416 0 0 0-.5676-.1521.416.416 0 0 0-.1521.5676l1.9973 3.4592C2.695 11.2335.2536 14.6191.0772 18.5912h23.8456c-.1764-3.9721-2.6178-7.3577-6.046-9.2698"/></svg>
              Download for Android
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
