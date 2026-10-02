import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Capacitor } from '@capacitor/core';
import logoImg from '../assets/logo.png';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying credentials...');
  const [appUrl, setAppUrl] = useState('');

  useEffect(() => {
    const hash = window.location.hash || '';
    const search = window.location.search || '';
    const fullParams = hash || search;
    const deepLink = `scholarshub://auth-callback${fullParams}`;
    setAppUrl(deepLink);

    // If already in native app, the deep link listener in AuthContext handles it.
    if (Capacitor.isNativePlatform()) {
      navigate('/dashboard', { replace: true });
      return;
    }

    // Check if on a mobile device (Chrome on Android or Safari on iOS)
    const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

    if (isMobile) {
      setStatus('Redirecting to Scholars Hub App...');
      // Try to open the native app immediately
      window.location.href = deepLink;
    }

    // Also process locally for desktop browser fallback
    const processAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          navigate('/dashboard', { replace: true });
        }
      } catch (err) {
        console.error('Auth processing error:', err);
      }
    };

    const timer = setTimeout(processAuth, 1200);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/10 p-3 mb-6 shadow-xl flex items-center justify-center backdrop-blur-md">
        <img src={logoImg} alt="Scholars Hub" className="w-full h-full object-contain" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Welcome to Scholars Hub</h1>
      <p className="text-gray-300 text-sm mb-6">{status}</p>

      {appUrl && (
        <a
          href={appUrl}
          className="inline-flex items-center justify-center px-8 py-3.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold text-base shadow-xl hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
        >
          Open Scholars Hub App
        </a>
      )}

      <p className="text-xs text-gray-500 mt-6">
        If you are on a computer, you will be redirected to the web dashboard automatically.
      </p>
    </div>
  );
}
