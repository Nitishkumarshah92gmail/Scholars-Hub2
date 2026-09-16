const supabase = require('../config/supabase');

// In-memory cache for verified tokens (avoids 2-3 DB calls per request)
const tokenCache = new Map();
const TOKEN_CACHE_TTL = 60_000; // 1 minute

// Periodically clean expired entries to prevent memory leaks
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of tokenCache) {
    if (now - value.timestamp > TOKEN_CACHE_TTL) tokenCache.delete(key);
  }
}, 5 * 60_000); // every 5 minutes

const auth = async (req, res, next) => {
  if (!supabase) {
    return res.status(503).json({ error: 'Database not configured.' });
  }
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    // Check cache first
    const cached = tokenCache.get(token);
    if (cached && Date.now() - cached.timestamp < TOKEN_CACHE_TTL) {
      req.user = cached.user;
      return next();
    }

    // Verify token with Supabase Auth
    const { data: { user }, error } = await supabase.auth.getUser(token);
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid token.' });
    }

    // Try to get profile from database
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, name, email, avatar, bio, school, subjects, created_at, updated_at')
      .eq('id', user.id)
      .maybeSingle();

    let userData;
    if (profile) {
      userData = profile;
    } else {
      // Fallback: build profile from Supabase Auth metadata
      const meta = user.user_metadata || {};
      userData = {
        id: user.id,
        name: meta.name || meta.full_name || 'User',
        email: user.email || '',
        avatar: meta.avatar || meta.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(meta.name || 'User')}&background=1e3a5f&color=fbbf24&size=200`,
        bio: meta.bio || '',
        school: meta.school || '',
        subjects: meta.subjects || [],
        created_at: user.created_at,
        updated_at: user.updated_at || user.created_at,
      };

      // Auto-create the profile row (fire and forget — no await)
      supabase.from('profiles').upsert({
        id: user.id,
        name: userData.name,
        email: userData.email,
        avatar: userData.avatar,
        bio: userData.bio,
        school: userData.school,
        subjects: userData.subjects,
      }, { onConflict: 'id' }).catch(() => {});
    }

    // Cache the result
    tokenCache.set(token, { user: userData, timestamp: Date.now() });
    req.user = userData;

    next();
  } catch (error) {
    console.error('Auth middleware error:', error.message);
    res.status(401).json({ error: 'Invalid token.' });
  }
};

module.exports = auth;
