const express = require('express');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const { transformUser } = require('../utils/transforms');

const router = express.Router();

// Guard: if supabase client is not configured, all routes return 503
router.use((req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.' });
  }
  next();
});

// Helper: build user object from auth metadata
function buildUserFromAuth(user) {
  const meta = user.user_metadata || {};
  return {
    _id: user.id,
    name: meta.name || meta.full_name || 'User',
    email: user.email || '',
    avatar: meta.avatar || meta.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=1e3a5f&color=fbbf24&size=200`,
    bio: meta.bio || '',
    school: meta.school || '',
    subjects: meta.subjects || [],
    followers: [],
    following: [],
    bookmarks: [],
    createdAt: user.created_at,
    updatedAt: user.updated_at || user.created_at,
  };
}

// transformUser is imported from ../utils/transforms

// GET /api/auth/me — get current user profile
router.get('/me', auth, async (req, res) => {
  try {
    const userId = req.user.id;

    // Try to get full profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    if (profile) {
      // Run all three queries in parallel for speed
      const [followersResult, followingResult, bookmarksResult] = await Promise.all([
        supabase
          .from('follows')
          .select('follower_id, follower:profiles!follower_id(id, name, avatar)')
          .eq('following_id', userId)
          .then(r => r)
          .catch(() => ({ data: [] })),
        supabase
          .from('follows')
          .select('following_id, following:profiles!following_id(id, name, avatar)')
          .eq('follower_id', userId)
          .then(r => r)
          .catch(() => ({ data: [] })),
        supabase
          .from('bookmarks')
          .select('post_id')
          .eq('user_id', userId)
          .then(r => r)
          .catch(() => ({ data: [] })),
      ]);

      const followers = followersResult.data || [];
      const following = followingResult.data || [];
      const bookmarkIds = (bookmarksResult.data || []).map((b) => b.post_id);

      res.json(transformUser(profile, followers, following, bookmarkIds));
    } else {
      // Fallback if profile doesn't exist yet in DB, ensure shape matches transformUser
      res.json({
        _id: req.user.id,
        name: req.user.name,
        email: req.user.email,
        avatar: req.user.avatar,
        bio: req.user.bio,
        school: req.user.school,
        subjects: req.user.subjects || [],
        followers: [],
        following: [],
        bookmarks: [],
        createdAt: req.user.created_at,
        updatedAt: req.user.updated_at
      });
    }
  } catch (error) {
    console.error('Get me error:', error);
    // Even on error, try to return auth-based profile
    try {
      const token = req.header('Authorization')?.replace('Bearer ', '');
      const { data: { user } } = await supabase.auth.getUser(token);
      if (user) return res.json(buildUserFromAuth(user));
    } catch {}
    res.status(500).json({ error: 'Server error.' });
  }
});

// POST /api/auth/forgot-password — send password reset email
router.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    // Use Supabase's built-in email-based reset flow (never leak the link to the client)
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: 'https://scholars-hub2.onrender.com/reset-password',
    });

    if (error) {
      console.error('Password reset error:', error);
      // Don't reveal whether the email exists — always return success
    }

    // Always return success to prevent email enumeration
    res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;
