const express = require('express');
const supabase = require('../config/supabase');
const auth = require('../middleware/auth');
const { transformUser, transformPost } = require('../utils/transforms');

const router = express.Router();

// transformUser and transformPost are imported from ../utils/transforms

const POST_SELECT = `
  *,
  author:profiles!author_id(id, name, avatar, school),
  comments(id, text, created_at, author:profiles!author_id(id, name, avatar)),
  likes(user_id)
`;

// GET /api/users/search/find?q=query — search users (must be before /:id)

// GET /api/users/scholars — get recent scholars on the platform
router.get('/scholars', auth, async (req, res) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, avatar, school')
      .order('created_at', { ascending: false })
      .limit(50);

    if (error && error.code === 'PGRST205') return res.json([]);

    res.json(
      (users || []).map((u) => ({
        _id: u.id,
        name: u.name,
        avatar: u.avatar,
        school: u.school,
      }))
    );
  } catch (error) {
    console.error('Scholars error:', error);
    res.json([]);
  }
});

// GET /api/users/stats/count — get total registered users count
router.get('/stats/count', auth, async (req, res) => {
  try {
    const { count, error } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    if (error && error.code === 'PGRST205') {
      return res.json({ totalUsers: 0 });
    }

    res.json({ totalUsers: count || 0 });
  } catch (error) {
    console.error('User count error:', error);
    res.json({ totalUsers: 0 });
  }
});

// GET /api/users/debug/env — temporary diagnostic endpoint
router.get('/debug/env', (req, res) => {
  let role = 'unknown';
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const parts = process.env.SUPABASE_SERVICE_ROLE_KEY.split('.');
      if (parts.length === 3) {
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8'));
        role = payload.role;
      }
    } catch(e) { role = 'error decoding'; }
  }
  res.json({
    hasUrl: !!process.env.SUPABASE_URL,
    hasServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    keyRole: role,
    urlPrefix: process.env.SUPABASE_URL ? process.env.SUPABASE_URL.substring(0, 15) + '...' : 'none',
  });
});

router.get('/search/find', auth, async (req, res) => {
  try {
    const { q } = req.query;
    if (!q) return res.json([]);

    const sanitized = q.replace(/[^a-zA-Z0-9\s]/g, '').trim().slice(0, 100);
    if (!sanitized) return res.json([]);
    const { data: users, error } = await supabase
      .from('profiles')
      .select('id, name, avatar, school, subjects')
      .or(`name.ilike.%${sanitized}%,school.ilike.%${sanitized}%`)
      .limit(20);

    if (error && error.code === 'PGRST205') return res.json([]);

    res.json(
      (users || []).map((u) => ({
        _id: u.id,
        name: u.name,
        avatar: u.avatar,
        school: u.school,
        subjects: u.subjects,
      }))
    );
  } catch (error) {
    console.error('Search error:', error);
    res.json([]);
  }
});

// POST /api/users/bookmark/:postId — bookmark/unbookmark post
router.post('/bookmark/:postId', auth, async (req, res) => {
  try {
    const userId = req.user.id;
    const postId = req.params.postId;

    // Check if already bookmarked
    const { data: existing, error: checkErr } = await supabase
      .from('bookmarks')
      .select('id')
      .eq('user_id', userId)
      .eq('post_id', postId)
      .maybeSingle();

    if (checkErr && checkErr.code === 'PGRST205') {
      return res.status(503).json({ error: 'Database tables not set up yet.' });
    }

    let isBookmarked;
    if (existing) {
      await supabase.from('bookmarks').delete().eq('id', existing.id);
      isBookmarked = false;
    } else {
      await supabase.from('bookmarks').insert({ user_id: userId, post_id: postId });
      isBookmarked = true;
    }

    // Get all bookmark IDs
    const { data: allBookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', userId);

    res.json({
      isBookmarked,
      bookmarks: (allBookmarks || []).map((b) => b.post_id),
    });
  } catch (error) {
    console.error('Bookmark error:', error);
    res.status(500).json({ error: 'Failed to bookmark.' });
  }
});

// GET /api/users/:id/bookmarks — get bookmarked posts
router.get('/:id/bookmarks', auth, async (req, res) => {
  try {
    const { data: bookmarkData, error: bErr } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', req.params.id);

    if (bErr && bErr.code === 'PGRST205') return res.json([]);

    const postIds = (bookmarkData || []).map((b) => b.post_id);
    if (postIds.length === 0) return res.json([]);

    const { data: posts } = await supabase
      .from('posts')
      .select(`
        *,
        author:profiles!author_id(id, name, avatar, school),
        comments(id, text, created_at, author:profiles!author_id(id, name, avatar)),
        likes(user_id)
      `)
      .in('id', postIds)
      .order('created_at', { ascending: false });

    res.json((posts || []).map(transformPost));
  } catch (error) {
    console.error('Bookmarks error:', error);
    res.json([]);
  }
});

// GET /api/users/:id — get user profile
router.get('/:id', auth, async (req, res) => {
  try {
    const userId = req.params.id;

    let { data: profile, error: profileErr } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle();

    // If tables don't exist or profile is missing, return basic auth info for own profile
    if (!profile || (profileErr && profileErr.code === 'PGRST205')) {
      if (userId === req.user.id) {
        profile = {
          id: req.user.id,
          name: req.user.name || 'User',
          email: req.user.email || '',
          avatar: req.user.avatar || '',
          bio: req.user.bio || '',
          school: req.user.school || '',
          subjects: req.user.subjects || [],
          created_at: req.user.created_at,
          updated_at: req.user.updated_at || req.user.created_at,
        };
      } else {
        return res.status(404).json({ error: 'User not found.' });
      }
    }

    // Run all 4 queries in parallel for maximum speed
    const [followersResult, followingResult, bookmarksResult, postsResult] = await Promise.all([
      supabase
        .from('follows')
        .select('follower_id, follower:profiles!follower_id(id, name, avatar)')
        .eq('following_id', userId)
        .then(r => r).catch(() => ({ data: [] })),
      supabase
        .from('follows')
        .select('following_id, following:profiles!following_id(id, name, avatar)')
        .eq('follower_id', userId)
        .then(r => r).catch(() => ({ data: [] })),
      supabase
        .from('bookmarks')
        .select('post_id')
        .eq('user_id', userId)
        .then(r => r).catch(() => ({ data: [] })),
      supabase
        .from('posts')
        .select(POST_SELECT)
        .eq('author_id', userId)
        .order('created_at', { ascending: false })
        .then(r => r).catch(() => ({ data: [] })),
    ]);

    const followers = followersResult.data || [];
    const following = followingResult.data || [];
    const bookmarkIds = (bookmarksResult.data || []).map((b) => b.post_id);
    const posts = postsResult.data || [];

    res.json({
      user: transformUser(profile, followers || [], following || [], bookmarkIds),
      posts: (posts || []).map(transformPost),
    });
  } catch (error) {
    console.error('Profile error:', error);
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// PUT /api/users/:id — edit profile
router.put('/:id', auth, async (req, res) => {
  try {
    if (req.params.id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const { name, bio, school, subjects, avatar } = req.body;
    const updates = { updated_at: new Date().toISOString() };

    if (name) updates.name = name;
    if (bio !== undefined) updates.bio = bio;
    if (school !== undefined) updates.school = school;
    if (subjects) {
      updates.subjects = typeof subjects === 'string' ? JSON.parse(subjects) : subjects;
    }
    if (avatar) updates.avatar = avatar;

    const { data: profile, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) {
      console.error('Update profile error:', error);
      if (error.code === 'PGRST205') {
        return res.status(503).json({ error: 'Database tables not set up yet.' });
      }
      return res.status(500).json({ error: 'Failed to update profile.' });
    }

    // Get followers/following for response
    const { data: followers } = await supabase
      .from('follows')
      .select('follower_id, follower:profiles!follower_id(id, name, avatar)')
      .eq('following_id', req.params.id);

    const { data: following } = await supabase
      .from('follows')
      .select('following_id, following:profiles!following_id(id, name, avatar)')
      .eq('follower_id', req.params.id);

    const { data: bookmarks } = await supabase
      .from('bookmarks')
      .select('post_id')
      .eq('user_id', req.params.id);

    const bookmarkIds = (bookmarks || []).map((b) => b.post_id);

    res.json(transformUser(profile, followers, following, bookmarkIds));
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile.' });
  }
});

// POST /api/users/:id/follow — follow/unfollow user
router.post('/:id/follow', auth, async (req, res) => {
  try {
    const targetId = req.params.id;
    const currentId = req.user.id;

    if (targetId === currentId) {
      return res.status(400).json({ error: 'Cannot follow yourself.' });
    }

    // Check if target exists
    const { data: target, error: targetErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', targetId)
      .maybeSingle();

    if (targetErr && targetErr.code === 'PGRST205') {
      return res.status(503).json({ error: 'Database tables not set up yet.' });
    }
    if (!target) return res.status(404).json({ error: 'User not found.' });

    // Check if already following
    const { data: existing } = await supabase
      .from('follows')
      .select('id')
      .eq('follower_id', currentId)
      .eq('following_id', targetId)
      .maybeSingle();

    let isFollowing;
    if (existing) {
      // Unfollow
      await supabase.from('follows').delete().eq('id', existing.id);
      isFollowing = false;
    } else {
      // Follow
      await supabase.from('follows').insert({
        follower_id: currentId,
        following_id: targetId,
      });
      isFollowing = true;

      // Create notification
      await supabase.from('notifications').insert({
        recipient_id: targetId,
        sender_id: currentId,
        type: 'follow',
      });
    }

    // Get updated counts
    const { count: followersCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('following_id', targetId);

    const { count: followingCount } = await supabase
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('follower_id', currentId);

    res.json({
      isFollowing,
      followersCount: followersCount || 0,
      followingCount: followingCount || 0,
    });
  } catch (error) {
    console.error('Follow error:', error);
    res.status(500).json({ error: 'Failed to follow/unfollow.' });
  }
});

module.exports = router;
