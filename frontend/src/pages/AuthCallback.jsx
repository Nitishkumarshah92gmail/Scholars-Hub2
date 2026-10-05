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

      return null;
        clearTimeout(fallbackTimer);
      };
    };

    processAuth();
    return null;

  return null;
}


