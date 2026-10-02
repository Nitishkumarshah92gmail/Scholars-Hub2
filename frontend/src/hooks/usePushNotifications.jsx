import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import request from '../api';

let _Capacitor = null;
let _PushNotifications = null;

async function loadCapacitorAPIs() {
  if (_Capacitor !== null) return { Capacitor: _Capacitor, PushNotifications: _PushNotifications };
  try {
    const { Capacitor } = await import('@capacitor/core');
    let PushNotifications = null;
    try {
      const pnModule = await import('@capacitor/push-notifications');
      PushNotifications = pnModule.PushNotifications;
    } catch {
      // Push notifications plugin not available
    }
    _Capacitor = Capacitor;
    _PushNotifications = PushNotifications;
  } catch {
    _Capacitor = { isNativePlatform: () => false };
    _PushNotifications = null;
  }
  return { Capacitor: _Capacitor, PushNotifications: _PushNotifications };
}

export default function usePushNotifications(userId) {
  const navigate = useNavigate();
  const listenersRef = useRef([]);
  const registeredForRef = useRef(null);

  useEffect(() => {
    if (!userId) return;
    if (registeredForRef.current === userId) return;

    let cancelled = false;

    async function setup() {
      const { Capacitor, PushNotifications } = await loadCapacitorAPIs();

      if (!Capacitor.isNativePlatform() || !PushNotifications) return;

      let permResult;
      try {
        if (typeof PushNotifications.requestPermissions === 'function') {
          permResult = await PushNotifications.requestPermissions();
        }
      } catch (err) {
        console.warn('[PushNotifications] requestPermissions failed:', err);
        return;
      }

      if (permResult?.receive !== 'granted') {
        console.log('[PushNotifications] Permission not granted:', permResult?.receive);
        return;
      }

      try {
        if (typeof PushNotifications.register === 'function') {
          await PushNotifications.register();
        }
      } catch (err) {
        console.warn('[PushNotifications] register() failed:', err);
        return;
      }

      if (cancelled) return;

      try {
        const registrationListener = await PushNotifications.addListener(
          'registration',
          async (token) => {
            if (cancelled) return;
            console.log('[PushNotifications] FCM token received, registering with backend...');
            try {
              await request('/notifications/register-device', {
                method: 'POST',
                data: {
                  fcm_token: token.value,
                  platform: Capacitor.getPlatform(),
                },
              });
              registeredForRef.current = userId;
              console.log('[PushNotifications] Device registered successfully.');
            } catch (err) {
              console.error('[PushNotifications] Failed to register device token:', err);
            }
          }
        );
        listenersRef.current.push(registrationListener);

        const errorListener = await PushNotifications.addListener(
          'registrationError',
          (err) => {
            console.warn('[PushNotifications] Registration error:', err);
          }
        );
        listenersRef.current.push(errorListener);

        const foregroundListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            if (cancelled) return;
            const { title, body } = notification;
            toast(
              (t) => (
                <div
                  style={{ cursor: 'pointer' }}
                  onClick={() => {
                    toast.dismiss(t.id);
                    const postId = notification.data?.postId;
                    if (postId) navigate(`/post/${postId}`);
                  }}
                >
                  {title && (
                    <strong style={{ display: 'block', marginBottom: 2 }}>{title}</strong>
                  )}
                  {body && <span>{body}</span>}
                </div>
              ),
              { duration: 5000 }
            );
          }
        );
        listenersRef.current.push(foregroundListener);

        const actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (action) => {
            if (cancelled) return;
            const data = action.notification?.data || {};
            if (data.postId) {
              navigate(`/post/${data.postId}`);
            } else if (data.userId) {
              navigate(`/profile/${data.userId}`);
            } else {
              navigate('/');
            }
          }
        );
        listenersRef.current.push(actionListener);
      } catch (listenerErr) {
        console.warn('[PushNotifications] Failed to register notification listeners:', listenerErr);
      }
    }

    setup().catch((err) => {
      console.warn('[usePushNotifications] Error during setup:', err);
    });

    return () => {
      cancelled = true;
      listenersRef.current.forEach((listener) => {
        try {
          if (listener && typeof listener.remove === 'function') {
            listener.remove().catch(() => {});
          }
        } catch { /* ignore */ }
      });
      listenersRef.current = [];
    };
  }, [userId, navigate]);
}
