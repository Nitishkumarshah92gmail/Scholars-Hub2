import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import logoImg from '../assets/logo.png';

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState('Verifying credentials...');

  useEffect(() => {
    let cancelled = false;

    const processAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session && !cancelled) {
          navigate('/dashboard', { replace: true });
          return;
        }
      } catch (err) {
        console.error('Auth processing error:', err);
      }

      const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
        if (session && !cancelled) {
          navigate('/dashboard', { replace: true });
        }
      });

      const fallbackTimer = setTimeout(() => {
        if (!cancelled) {
          setStatus('Redirecting to dashboard...');
          navigate('/dashboard', { replace: true });
        }
      }, 2500);

      return () => {
        subscription.unsubscribe();
        clearTimeout(fallbackTimer);
      };
    };

    processAuth();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white p-6 text-center">
      <div className="w-20 h-20 rounded-2xl bg-white/10 p-3 mb-6 shadow-xl flex items-center justify-center backdrop-blur-md">
        <img src={logoImg} alt="Scholars Hub" className="w-full h-full object-contain" />
      </div>

      <h1 className="text-2xl font-bold mb-2">Welcome to Scholars Hub</h1>
      <p className="text-gray-300 text-sm mb-6">{status}</p>

      <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
}

