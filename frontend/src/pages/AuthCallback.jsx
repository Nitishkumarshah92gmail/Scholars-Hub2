import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export default function AuthCallback() {
  const navigate = useNavigate();

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

  return null;
}
