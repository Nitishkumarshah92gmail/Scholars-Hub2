const express = require('express');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

const router = express.Router();

// GET /api/notifications — get user notifications
router.get('/', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    const { data: notifications, error: notifErr } = await supabase
      .from('notifications')
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar),
        post:posts!post_id(id, title, type)
      `)
      .eq('recipient_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (notifErr && notifErr.code === 'PGRST205') {
      return res.json({ notifications: [], unreadCount: 0 });
    }

    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('recipient_id', userId)
      .eq('read', false);

    // Transform to match frontend expectations
    const transformed = (notifications || []).map((n) => ({
      _id: n.id,
      type: n.type,
      read: n.read,
      sender: n.sender
        ? { _id: n.sender.id, name: n.sender.name, avatar: n.sender.avatar }
        : null,
      post: n.post
        ? { _id: n.post.id, title: n.post.title, type: n.post.type }
        : null,
      createdAt: n.created_at,
    }));

    res.json({ notifications: transformed, unreadCount: unreadCount || 0 });
  } catch (error) {
    console.error('Notifications error:', error);
    res.json({ notifications: [], unreadCount: 0 });
  }
});

// PUT /api/notifications/read — mark all as read
router.put('/read', auth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('recipient_id', req.user.id)
      .eq('read', false);

    if (error && error.code === 'PGRST205') {
      return res.json({ message: 'No notifications to mark.' });
    }

    res.json({ message: 'All notifications marked as read.' });
  } catch (error) {
    res.json({ message: 'No notifications to mark.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Push notification device token registration
// Called by the usePushNotifications hook on the Android APK after FCM registers.
// ─────────────────────────────────────────────────────────────────────────────

// POST /api/notifications/register-device
// Body: { fcm_token: string, platform: 'android' | 'ios' }
//
// Upserts the FCM token for the authenticated user. Uses ON CONFLICT (fcm_token)
// so the same physical device never creates duplicate rows even if the app
// re-registers after a reinstall (token stays the same in that case).
router.post('/register-device', auth, async (req, res) => {
  try {
    const { fcm_token, platform = 'android' } = req.body;

    if (!fcm_token || typeof fcm_token !== 'string') {
      return res.status(400).json({ error: 'fcm_token is required.' });
    }

    const { error } = await supabase
      .from('device_tokens')
      .upsert(
        {
          user_id: req.user.id,
          fcm_token,
          platform,
          // updated_at not in schema, but upsert refreshes created_at on conflict
        },
        {
          onConflict: 'fcm_token',       // unique column — update user_id / platform if changed
          ignoreDuplicates: false,
        }
      );

    if (error) {
      // Table might not exist yet — warn but don't crash the app
      if (error.code === 'PGRST205' || error.message?.includes('does not exist')) {
        console.warn('[register-device] device_tokens table not set up yet — run supabase-push-schema.sql');
        return res.json({ message: 'Device registration skipped (table not set up).' });
      }
      console.error('[register-device] Upsert error:', error);
      return res.status(500).json({ error: 'Failed to register device.' });
    }

    res.json({ message: 'Device registered for push notifications.' });
  } catch (error) {
    console.error('[register-device] Unexpected error:', error);
    res.status(500).json({ error: 'Failed to register device.' });
  }
});

// DELETE /api/notifications/unregister-device
// Body: { fcm_token: string }
//
// Removes a specific FCM token (call this on logout so the user stops
// receiving push notifications on their device).
router.delete('/unregister-device', auth, async (req, res) => {
  try {
    const { fcm_token } = req.body;

    if (!fcm_token) {
      return res.status(400).json({ error: 'fcm_token is required.' });
    }

    const { error } = await supabase
      .from('device_tokens')
      .delete()
      .eq('fcm_token', fcm_token)
      .eq('user_id', req.user.id); // safety: only delete own tokens

    if (error && error.code !== 'PGRST205') {
      console.error('[unregister-device] Delete error:', error);
      return res.status(500).json({ error: 'Failed to unregister device.' });
    }

    res.json({ message: 'Device unregistered.' });
  } catch (error) {
    console.error('[unregister-device] Unexpected error:', error);
    res.status(500).json({ error: 'Failed to unregister device.' });
  }
});

module.exports = router;
