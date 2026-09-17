import { useState, memo } from 'react';
import { Link } from 'react-router-dom';
import ParticleCanvas from './ParticleCanvas';
import { useAuth } from '../context/AuthContext';
import { likePost, commentPost, bookmarkPost, reportPost, deletePost } from '../api';
import { useNavigate } from 'react-router-dom';
import { getSubjectColor, getPostTypeIcon, timeAgo } from '../utils';
import toast from 'react-hot-toast';
import {
  HiHeart,
  HiOutlineHeart,
  HiOutlineChat,
  HiBookmark,
  HiOutlineBookmark,
  HiOutlineFlag,
  HiDownload,
  HiDotsHorizontal,
  HiOutlineShare,
  HiTrash,
} from 'react-icons/hi';

/**
 * Convert Google Drive URLs to lh3 format for reliable <img> embedding.
 */
function toDriveImageUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://lh3.googleusercontent.com/d/${match[1]}=s1600`;
  }
  return url;
}

function toDriveDownloadUrl(url) {
  if (!url || typeof url !== 'string') return url;
  const patterns = [
    /[?&]id=([a-zA-Z0-9_-]+)/,
    /\/file\/d\/([a-zA-Z0-9_-]+)/,
    /\/d\/([a-zA-Z0-9_-]+)/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return `https://drive.google.com/uc?export=download&id=${match[1]}`;
  }
  return url;
}

export default memo(function PostCard({ post, onUpdate }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isOwner = user?._id === post.author?._id;
  const [liked, setLiked] = useState(post.likes?.includes(user?._id));
  const [likeCount, setLikeCount] = useState(post.likes?.length || 0);
  const [bookmarked, setBookmarked] = useState(user?.bookmarks?.includes(post._id));
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [comments, setComments] = useState(post.comments || []);
  const [showMenu, setShowMenu] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [likeAnimating, setLikeAnimating] = useState(false);
  const [deleted, setDeleted] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const handleLike = async () => {
    try {
      setLikeAnimating(true);
      const res = await likePost(post._id);
      setLiked(res.data.isLiked);
      setLikeCount(res.data.likeCount);
      setTimeout(() => setLikeAnimating(false), 300);
    } catch {
      setLikeAnimating(false);
      toast.error('Failed to like post.');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    setSubmitting(true);
    try {
      const res = await commentPost(post._id, commentText.trim());
      setComments((prev) => [res.data, ...prev]);
      setCommentText('');
    } catch {
      toast.error('Failed to add comment.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleBookmark = async () => {
    try {
      const res = await bookmarkPost(post._id);
      setBookmarked(res.data.isBookmarked);
      toast.success(res.data.isBookmarked ? 'Post saved.' : 'Post removed from saved.');
    } catch {
      toast.error('Failed to bookmark.');
    }
  };

  const handleReport = async () => {
    try {
      await reportPost(post._id, 'Inappropriate content');
      toast.success('Post reported. We will review it.');
      setShowMenu(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to report.');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      return;
    }
    try {
      await deletePost(post._id);
      toast.success('Post deleted.');
      setDeleted(true);
      if (onUpdate) onUpdate();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to delete post.');
      setConfirmDelete(false);
    }
  };

  if (deleted) return null;

  const renderContent = () => {
    switch (post.type) {
      case 'pdf':
        return (
          <div className="p-6 flex items-center justify-between" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">📄</span>
              <div>
                <p className="font-semibold text-ig-text dark:text-ig-text-light">PDF Document</p>
                <p className="text-sm text-ig-text-2">{post.title}</p>
              </div>
            </div>
            <a
              href={toDriveDownloadUrl(post.fileUrl)}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <HiDownload className="w-4 h-4" />
              Download
            </a>
          </div>
        );
      case 'image': {
        const imageUrls = post.fileUrls?.length > 0 ? post.fileUrls : [post.fileUrl];
        return (
          <div>
            <div className={`${imageUrls.length > 1 ? 'grid grid-cols-2 gap-0.5' : ''}`}>
              {imageUrls.map((url, i) => (
                <img
                  key={i}
                  src={toDriveImageUrl(url)}
                  alt={`${post.title} - ${i + 1}`}
                  className="w-full object-cover max-h-[585px] cursor-pointer"
                  loading="lazy"
                  onError={(e) => {
                    if (e.target.src !== url) {
                      e.target.src = url;
                    }
                  }}
                />
              ))}
            </div>
            <div className="px-4 py-2 flex justify-end">
              <a
                href={toDriveDownloadUrl(imageUrls[0])}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-xs font-medium text-ig-primary hover:text-ig-primary-dark transition-colors"
              >
                <HiDownload className="w-4 h-4" />
                Download
              </a>
            </div>
          </div>
        );
      }
      case 'drive_link':
        return (
          <div className="p-6 flex items-center justify-between" style={{ background: 'var(--glass-bg)', backdropFilter: 'blur(12px)' }}>
            <div className="flex items-center gap-3">
              <span className="text-4xl">🔗</span>
              <div>
                <p className="font-semibold text-ig-text dark:text-ig-text-light">{post.title}</p>
                <p className="text-sm text-ig-text-2">Google Drive Link</p>
              </div>
            </div>
            <a
              href={post.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary flex items-center gap-2 text-sm"
            >
              <HiDownload className="w-4 h-4" />
              Open
            </a>
          </div>
        );
      case 'youtube_video':
      case 'youtube_playlist':
      case 'video_link': {
        const url = post.youtubeUrl || post.fileUrl || '';
        if (!url) return <div className="p-6 text-center text-ig-text-2">Invalid Video URL</div>;

        // 1. YouTube
        let ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/live\/)([a-zA-Z0-9_-]{11})/);
        if (ytMatch) {
          const videoId = ytMatch[1];
          const plMatch = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
          const embedSrc = plMatch 
            ? `https://www.youtube-nocookie.com/embed/${videoId}?list=${plMatch[1]}&rel=0`
            : `https://www.youtube-nocookie.com/embed/${videoId}?rel=0`;
          
          return (
            <div>
              <div className="aspect-video">
                <iframe src={embedSrc} title={post.title} className="w-full h-full" frameBorder="0" allowFullScreen loading="lazy" sandbox="allow-scripts allow-same-origin allow-presentation allow-popups" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" />
              </div>
              <div className="px-4 py-2 flex justify-end">
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-ig-primary hover:text-ig-primary-dark transition-colors">
                  <HiDownload className="w-4 h-4" /> Watch on YouTube
                </a>
              </div>
            </div>
          );
        }

        // 2. TikTok
        if (url.includes('tiktok.com')) {
          let tiktokId = url.split('/').pop()?.split('?')[0];
          return (
            <div>
              <div className="flex justify-center bg-black">
                <iframe 
                  src={`https://www.tiktok.com/embed/v2/${tiktokId}`} 
                  className="w-full max-w-[325px] h-[700px] border-none" 
                  title={post.title} allowFullScreen allow="encrypted-media;" 
                />
              </div>
              <div className="px-4 py-2 flex justify-end">
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-ig-primary hover:text-ig-primary-dark transition-colors">
                  <HiDownload className="w-4 h-4" /> Watch on TikTok
                </a>
              </div>
            </div>
          );
        }

        // 3. Instagram Reels/Posts
        if (url.includes('instagram.com')) {
          return (
            <div>
              <div className="flex justify-center bg-white dark:bg-black p-4">
                <iframe 
                  src={`${url.replace(/\/?$/, '')}/embed`} 
                  className="w-full max-w-[400px] h-[480px] border border-ig-separator rounded-lg" 
                  frameBorder="0" scrolling="no" allowTransparency allowFullScreen 
                />
              </div>
              <div className="px-4 py-2 flex justify-end">
                <a href={url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs font-medium text-ig-primary hover:text-ig-primary-dark transition-colors">
                  <HiDownload className="w-4 h-4" /> Watch on Instagram
                </a>
              </div>
            </div>
          );
        }

        return <div className="p-6 text-center text-ig-text-2">Unsupported Video Format</div>;
      }

      default:
        return null;
    }
  };

  return (
    <div className="relative overflow-hidden mb-6 rounded-[32px] shadow-[6px_6px_14px_var(--neu-shadow-dark),-6px_-6px_14px_var(--neu-shadow-light)] bg-[var(--neu-bg)] transition-all">
      
      {/* Header */}
      <div className="px-5 py-3 flex items-center justify-between">
        <Link to={`/dashboard/profile/${post.author?._id}`} className="flex items-center gap-3 group">
          <div className="p-0.5 rounded-full shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]">
            <img
              src={post.author?.avatar || `https://ui-avatars.com/api/?name=${post.author?.name}`}
              onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${post.author?.name}&background=1e3a5f&color=fbbf24`; }}
              alt={post.author?.name}
              loading="lazy"
              decoding="async"
              className="w-10 h-10 rounded-full object-cover shadow-[2px_2px_5px_var(--neu-shadow-dark),-2px_-2px_5px_var(--neu-shadow-light)]"
            />
          </div>
          <div>
            <p className="font-bold text-sm text-ig-text dark:text-ig-text-light group-hover:opacity-60 transition-opacity">
              {post.author?.name}
            </p>
            <p className="text-[10px] font-semibold text-ig-text-2">
              @{post.author?.name.replace(/\s+/g, '')}
            </p>
          </div>
        </Link>
        <button onClick={() => setShowMenu(!showMenu)} className="p-2 text-ig-text hover:opacity-60">
          <HiDotsHorizontal className="w-5 h-5" />
        </button>
      </div>

      {/* Main Image / Content */}
      <div className="w-full px-4 mb-2">
        <div className="w-full rounded-[24px] overflow-hidden shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)] border border-[rgba(255,255,255,0.05)] bg-[var(--neu-bg)]">
           {post.type === 'image' ? (
             <img src={toDriveImageUrl(post.fileUrls?.[0] || post.fileUrl)} alt="Post" className="w-full h-80 object-cover" loading="lazy" />
           ) : (
             <div className="flex items-center justify-center bg-[var(--neu-bg)] w-full">
                {renderContent()}
             </div>
           )}
        </div>
      </div>

      {/* Action Bar */}
      <div className="px-5 py-2 flex justify-between items-center">
         <div className="flex items-center gap-5">
            <button onClick={handleLike} className={`flex items-center gap-1.5 font-semibold text-sm transition hover:opacity-80 ${liked ? 'text-red-500' : 'text-ig-text dark:text-ig-text-light'}`}>
               {liked ? '❤️' : '🤍'} {likeCount}
            </button>
            <button onClick={() => setShowComments(!showComments)} className="flex items-center gap-1.5 font-semibold text-sm text-ig-text dark:text-ig-text-light hover:opacity-80 transition">
               💬 {comments.length}
            </button>
         </div>
         <div className="flex items-center gap-4">
            <button className="text-ig-text dark:text-ig-text-light hover:opacity-80 transition">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path></svg>
            </button>
            <button onClick={handleBookmark} className={`transition hover:opacity-80 ${bookmarked ? 'text-ig-text dark:text-ig-text-light' : 'text-ig-text dark:text-ig-text-light'}`}>
              {bookmarked ? (
                 <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M5 4a2 2 0 012-2h6a2 2 0 012 2v14l-5-2.5L5 18V4z"></path></svg>
              ) : (
                 <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"></path></svg>
              )}
            </button>
         </div>
      </div>

      {/* Description & Timestamp */}
      {(post.description || post.title) && (
        <div className="px-5 pb-3">
          <p className="text-sm text-ig-text dark:text-ig-text-light line-clamp-2">
            <span className="font-bold mr-1">{post.author?.name}</span>
            {post.description || post.title}
          </p>
        </div>
      )}

      {/* Comments Section */}
      {showComments && (
        <div className="px-5 py-4 animate-fade-in" style={{ borderTop: '1px solid var(--glass-border)' }}>
          {/* Comments List */}
          <div className="space-y-3 max-h-60 overflow-y-auto">
            {comments.map((comment, idx) => (
              <div key={comment._id || idx} className="flex gap-2">
                <img src={comment.author?.avatar || `https://ui-avatars.com/api/?name=${comment.author?.name}`} className="w-8 h-8 rounded-full shadow-[2px_2px_5px_var(--neu-shadow-dark)]" alt="avatar" />
                <div>
                  <p className="text-sm text-ig-text"><span className="font-bold">{comment.author?.name}</span> {comment.text}</p>
                  <span className="text-[10px] text-ig-text-2">{timeAgo(comment.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleComment} className="flex items-center gap-2 mt-3 pt-3" style={{ borderTop: '1px solid var(--glass-border)' }}>
            <input
              type="text"
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              placeholder="Add a comment..."
              className="flex-1 bg-transparent text-sm outline-none text-ig-text dark:text-ig-text-light placeholder:text-ig-text-2 py-2"
            />
            <button
              type="submit"
              disabled={submitting || !commentText.trim()}
              className="text-ig-primary font-semibold text-sm disabled:opacity-30"
            >
              Post
            </button>
          </form>
        </div>
      )}
    </div>
  );
})
