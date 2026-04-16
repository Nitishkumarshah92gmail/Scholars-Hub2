const express = require('express');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');

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

// Helper: transform profile to match frontend expectations
function transformUser(profile, followers, following, bookmarkIds) {
  return {
    _id: profile.id,
    name: profile.name,
    email: profile.email,
    avatar: profile.avatar,
    bio: profile.bio,
    school: profile.school,
    subjects: profile.subjects || [],
    followers: (followers || []).map((f) => ({
      _id: f.follower?.id || f.follower_id,
      name: f.follower?.name,
      avatar: f.follower?.avatar,
    })),
    following: (following || []).map((f) => ({
      _id: f.following?.id || f.following_id,
      name: f.following?.name,
      avatar: f.following?.avatar,
    })),
    bookmarks: bookmarkIds || [],
    createdAt: profile.created_at,
    updatedAt: profile.updated_at,
  };
}

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

      const bookmarkIds = (bookmarksResult.data || []).map((b) => b.post_id);
      return res.json(transformUser(profile, followersResult.data || [], followingResult.data || [], bookmarkIds));
    }

    // Fallback: get from Supabase Auth token
    const token = req.header('Authorization')?.replace('Bearer ', '');
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      return res.json(buildUserFromAuth(user));
    }

    res.status(404).json({ error: 'Profile not found.' });
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

// POST /api/auth/forgot-password — generate a password reset link
router.post('/forgot-password', async (req, res) => {
  try {
    const { email, redirectTo } = req.body;
    if (!email) return res.status(400).json({ error: 'Email is required.' });

    // Use admin API (service role) to generate the recovery link
    const { data, error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: email.trim(),
      options: {
        redirectTo: redirectTo || undefined,
      },
    });

    if (error) {
      console.error('Generate recovery link error:', error);
      // Common errors
      if (error.message?.includes('User not found') || error.message?.includes('not found')) {
        return res.status(404).json({ error: 'No account found with this email address.' });
      }
      return res.status(400).json({ error: error.message || 'Failed to generate reset link.' });
    }

    // Return the action link to the frontend
    const actionLink = data?.properties?.action_link;
    if (!actionLink) {
      return res.status(500).json({ error: 'Failed to generate reset link. Please try again.' });
    }

    res.json({ success: true, actionLink });
  } catch (err) {
    console.error('Forgot password error:', err);
    res.status(500).json({ error: 'Server error. Please try again later.' });
  }
});

module.exports = router;
