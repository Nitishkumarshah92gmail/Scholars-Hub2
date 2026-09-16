/**
 * Shared transform functions for converting Supabase database rows
 * into the frontend-expected format.
 */

/**
 * Transform a profile row + relations into a frontend user object.
 */
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

/**
 * Transform a post row + relations into a frontend post object.
 */
function transformPost(post) {
  return {
    _id: post.id,
    author: post.author
      ? { _id: post.author.id, name: post.author.name, avatar: post.author.avatar, school: post.author.school }
      : null,
    type: post.type,
    fileUrl: post.file_url,
    fileUrls: post.file_urls || [],
    youtubeId: post.youtube_id || '',
    playlistId: post.playlist_id || '',
    title: post.title,
    description: post.description,
    subject: post.subject,
    likes: (post.likes || []).map((l) => l.user_id),
    likeCount: (post.likes || []).length,
    comments: (post.comments || [])
      .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
      .map((c) => ({
        _id: c.id,
        text: c.text,
        author: c.author
          ? { _id: c.author.id, name: c.author.name, avatar: c.author.avatar }
          : null,
        createdAt: c.created_at,
      })),
    commentCount: (post.comments || []).length,
    createdAt: post.created_at,
    updatedAt: post.updated_at,
  };
}

module.exports = { transformUser, transformPost };
