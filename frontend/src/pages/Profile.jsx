import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getUser, updateUser, getTotalUsers, getPresignedUrl, uploadDirect } from '../api';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { SUBJECTS, getSubjectColor } from '../utils';
import toast from 'react-hot-toast';
import { HiPencil, HiX, HiCamera, HiUserGroup } from 'react-icons/hi';
import ParticleCanvas from '../components/ParticleCanvas';
import imageCompression from 'browser-image-compression';

export default function Profile() {
  const { id } = useParams();
  const { user: currentUser, updateUserData } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalUsers, setTotalUsers] = useState(0);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const isOwnProfile = currentUser?._id === id;

  useEffect(() => {
    setLoading(true);
    Promise.all([
      getUser(id),
      getTotalUsers().catch(() => ({ data: { totalUsers: 0 } })),
    ])
      .then(([res, statsRes]) => {
        setProfile(res.data.user);
        setPosts(res.data.posts);
        setTotalUsers(statsRes.data.totalUsers || 0);
        setEditForm({
          name: res.data.user.name,
          bio: res.data.user.bio || '',
          school: res.data.user.school || '',
          subjects: res.data.user.subjects || [],
        });
      })
      .catch(() => toast.error('Failed to load profile.'))
      .finally(() => setLoading(false));
  }, [id, currentUser?._id]);

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      let avatarUrl = profile.avatar;
      if (editForm.avatarFile) {
        // Compress avatar
        const options = { maxSizeMB: 0.1, maxWidthOrHeight: 400, useWebWorker: true };
        let fileToUpload = editForm.avatarFile;
        try { fileToUpload = await imageCompression(editForm.avatarFile, options); } catch (e) { console.error(e); }
        
        const { data: { uploadUrl, publicUrl } } = await getPresignedUrl(editForm.avatarFile.name, fileToUpload.type, 'avatars');
        await uploadDirect(uploadUrl, fileToUpload);
        avatarUrl = publicUrl;
      }
      const res = await updateUser(id, {
        name: editForm.name,
        bio: editForm.bio,
        school: editForm.school,
        subjects: editForm.subjects,
        avatar: avatarUrl,
      });
      setProfile(res.data);
      updateUserData(res.data);
      setEditing(false);
      toast.success('Profile saved!');
    } catch (err) {
      toast.error(err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div>
        <div className="flex items-center gap-8 mb-8 animate-pulse">
          <div className="w-20 h-20 sm:w-36 sm:h-36 rounded-full" style={{ background: 'var(--neu-bg)', boxShadow: 'inset 3px 3px 8px var(--neu-shadow-dark), inset -3px -3px 8px var(--neu-shadow-light)' }} />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-32 skeleton" />
            <div className="h-4 w-48 skeleton" />
            <div className="h-4 w-40 skeleton" />
          </div>
        </div>
        <PostSkeleton />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="text-center py-16">
        <span className="text-5xl block mb-4">😕</span>
        <h3 className="text-base font-semibold text-ig-text dark:text-ig-text-light">
          This page isn't available
        </h3>
        <p className="text-sm text-ig-text-2 mt-2">
          The link you followed may be broken, or the user may have been removed.
        </p>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen pb-24 bg-[var(--neu-bg)] font-body">
      {/* Top Liquid Banner */}
      <div className="absolute top-0 left-0 w-full h-72 bg-liquid-swirl rounded-b-[48px] shadow-lg"></div>

      {/* Top Header Nav (Back / Message) */}
      <div className="relative z-20 flex justify-between items-center px-6 pt-6">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-sm border border-white/40">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <button className="w-10 h-10 rounded-full bg-[var(--neu-bg)] flex items-center justify-center text-ig-text shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </button>
      </div>

      <div className="relative z-10 px-4 max-w-md mx-auto mt-16">
        {/* Profile Card */}
        <div className="relative p-6 pt-0 rounded-[40px] text-center"
             style={{
               background: 'var(--neu-bg)',
               boxShadow: '0 -10px 40px rgba(0,0,0,0.05), 8px 8px 20px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light)',
             }}>
          
          {/* Avatar and Stats Row */}
          <div className="flex justify-between items-end -mt-12 mb-6 px-4">
            <div className="flex flex-col items-center pb-2">
              <span className="text-xl font-bold text-ig-text dark:text-ig-text-light">1k</span>
              <span className="text-[10px] font-semibold text-ig-text-2 uppercase tracking-wider">Followers</span>
            </div>

            <div className="relative z-20">
              <div className="p-2 rounded-[32px] bg-[var(--neu-bg)] shadow-[inset_3px_3px_8px_var(--neu-shadow-dark),inset_-3px_-3px_8px_var(--neu-shadow-light)]">
                <img
                  src={
                    editForm?.avatarFile 
                      ? URL.createObjectURL(editForm.avatarFile) 
                      : (profile.avatar || `https://ui-avatars.com/api/?name=${profile.name}`)
                  }
                  onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${profile.name}&background=1e3a5f&color=fbbf24&size=200`; }}
                  alt={profile.name}
                  className="w-24 h-24 rounded-[24px] object-cover shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)]"
                />
              </div>
              {isOwnProfile && (
                <button 
                  onClick={() => setEditing(!editing)}
                  className="absolute -bottom-2 -right-2 p-2 rounded-full bg-blue-500 text-white shadow-lg z-30 hover:bg-blue-600 transition"
                >
                  {editing ? <HiX className="w-3 h-3" /> : <HiPencil className="w-3 h-3" />}
                </button>
              )}
            </div>

            <div className="flex flex-col items-center pb-2">
              <span className="text-xl font-bold text-ig-text dark:text-ig-text-light">342</span>
              <span className="text-[10px] font-semibold text-ig-text-2 uppercase tracking-wider">Following</span>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-lg font-bold text-ig-text dark:text-ig-text-light mb-2">
            @{profile.name.replace(/\s+/g, '')}
          </h1>
          <p className="text-xs text-ig-text-2 mb-6 px-4 leading-relaxed">
            {profile.bio || `My name is ${profile.name}. I like dancing in the rain and travelling all around the world.`}
          </p>

          {/* Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button className="btn-primary w-32 py-3 !rounded-[20px] text-sm font-semibold shadow-[6px_6px_14px_var(--neu-shadow-dark),-6px_-6px_14px_var(--neu-shadow-light)]">
              Follow
            </button>
            <button className="w-32 py-3 rounded-[20px] text-sm font-bold bg-[var(--neu-bg)] text-ig-text dark:text-ig-text-light shadow-[6px_6px_14px_var(--neu-shadow-dark),-6px_-6px_14px_var(--neu-shadow-light)] border border-[rgba(255,255,255,0.1)] active:shadow-[inset_3px_3px_8px_var(--neu-shadow-dark),inset_-3px_-3px_8px_var(--neu-shadow-light)] transition-all">
              Message
            </button>
          </div>

          {/* Tabs */}
          <div className="flex justify-center gap-8 mb-6 relative">
            <button className="text-sm font-bold text-ig-text dark:text-ig-text-light pb-1 relative">
              All
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ig-text dark:bg-ig-text-light"></div>
            </button>
            <button className="text-sm font-semibold text-ig-text-2 pb-1">Photos</button>
            <button className="text-sm font-semibold text-ig-text-2 pb-1">Videos</button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-2 gap-3" style={{ gridAutoRows: '140px' }}>
             {/* Staggered Layout for images */}
             <div className="col-span-1 row-span-2 rounded-[28px] overflow-hidden shadow-[inset_3px_3px_8px_var(--neu-shadow-dark),inset_-3px_-3px_8px_var(--neu-shadow-light)] p-1">
                <img src="https://images.unsplash.com/photo-1544551763-46a013bb70d5?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover rounded-[24px]" alt="post" />
             </div>
             <div className="col-span-1 row-span-1 rounded-[28px] overflow-hidden shadow-[inset_3px_3px_8px_var(--neu-shadow-dark),inset_-3px_-3px_8px_var(--neu-shadow-light)] p-1">
                <img src="https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover rounded-[24px]" alt="post" />
             </div>
             <div className="col-span-1 row-span-1 rounded-[28px] overflow-hidden shadow-[inset_3px_3px_8px_var(--neu-shadow-dark),inset_-3px_-3px_8px_var(--neu-shadow-light)] p-1">
                <img src="https://images.unsplash.com/photo-1506744626753-eda818c6cce5?auto=format&fit=crop&w=400&q=80" className="w-full h-full object-cover rounded-[24px]" alt="post" />
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
