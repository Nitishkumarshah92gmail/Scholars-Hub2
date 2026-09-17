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
      <div className="relative z-20 flex justify-between items-center px-6 pt-6 max-w-4xl mx-auto">
        <button onClick={() => navigate(-1)} className="w-10 h-10 rounded-full bg-white/30 backdrop-blur-md flex items-center justify-center text-white shadow-sm border border-white/40 hover:bg-white/40 transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
        </button>
        <button className="w-10 h-10 rounded-full bg-[var(--neu-bg)] flex items-center justify-center text-ig-text shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)] hover:shadow-[2px_2px_5px_var(--neu-shadow-dark),-2px_-2px_5px_var(--neu-shadow-light)] transition">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path></svg>
        </button>
      </div>

      <div className="relative z-10 px-4 max-w-3xl mx-auto mt-16 w-full">
        {/* Profile Card */}
        <div className="relative p-6 pt-0 sm:p-10 sm:pt-0 rounded-[40px] text-center w-full"
             style={{
               background: 'var(--neu-bg)',
               boxShadow: '0 -10px 40px rgba(0,0,0,0.05), 8px 8px 20px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light)',
             }}>
          
          {/* Avatar and Stats Row */}
          <div className="flex justify-between items-end -mt-12 sm:-mt-16 mb-8 px-4 sm:px-12">
            <div className="flex flex-col items-center pb-2">
              <span className="text-xl font-bold text-ig-text dark:text-ig-text-light">{posts.length}</span>
              <span className="text-[10px] font-semibold text-ig-text-2 uppercase tracking-wider">Posts</span>
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
              <span className="text-xl font-bold text-ig-text dark:text-ig-text-light">{totalUsers}</span>
              <span className="text-[10px] font-semibold text-ig-text-2 uppercase tracking-wider">Scholars</span>
            </div>
          </div>

          {/* Info */}
          <h1 className="text-lg font-bold text-ig-text dark:text-ig-text-light mb-2">
            {profile.name}
          </h1>
          <p className="text-xs text-ig-text-2 mb-6 px-4 leading-relaxed">
            {profile.bio || (isOwnProfile ? "Click the edit button to add a bio." : "No bio available.")}
          </p>

          {/* Subject tags */}
          {profile.subjects?.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5 mb-6">
              {profile.subjects.map((s) => (
                <span key={s} className={`subject-badge text-[10px] ${getSubjectColor(s)}`}>{s}</span>
              ))}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            {isOwnProfile ? (
              <button onClick={() => setEditing(!editing)} className="btn-primary w-32 py-3 !rounded-[20px] text-sm font-semibold shadow-[6px_6px_14px_var(--neu-shadow-dark),-6px_-6px_14px_var(--neu-shadow-light)]">
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            ) : (
              <>
                <button className="btn-primary w-32 py-3 !rounded-[20px] text-sm font-semibold shadow-[6px_6px_14px_var(--neu-shadow-dark),-6px_-6px_14px_var(--neu-shadow-light)]">
                  Follow
                </button>
                <button className="w-32 py-3 rounded-[20px] text-sm font-bold bg-[var(--neu-bg)] text-ig-text dark:text-ig-text-light shadow-[6px_6px_14px_var(--neu-shadow-dark),-6px_-6px_14px_var(--neu-shadow-light)] border border-[rgba(255,255,255,0.1)] active:shadow-[inset_3px_3px_8px_var(--neu-shadow-dark),inset_-3px_-3px_8px_var(--neu-shadow-light)] transition-all">
                  Message
                </button>
              </>
            )}
          </div>

          {/* Edit Form */}
          {editing && (
            <div className="p-5 mb-6 text-left" style={{ background: 'var(--neu-bg)', borderRadius: '24px', boxShadow: 'inset 4px 4px 10px var(--neu-shadow-dark), inset -4px -4px 10px var(--neu-shadow-light)' }}>
              <form onSubmit={handleSaveProfile} className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-ig-text dark:text-ig-text-light mb-1">Name</label>
                    <input type="text" value={editForm.name} onChange={(e) => setEditForm((prev) => ({ ...prev, name: e.target.value }))} className="w-full bg-transparent border-none outline-none text-sm p-2 shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] rounded-[12px]" />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-ig-text dark:text-ig-text-light mb-1">School</label>
                    <input type="text" value={editForm.school} onChange={(e) => setEditForm((prev) => ({ ...prev, school: e.target.value }))} className="w-full bg-transparent border-none outline-none text-sm p-2 shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] rounded-[12px]" />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ig-text dark:text-ig-text-light mb-1">Bio</label>
                  <textarea value={editForm.bio} onChange={(e) => setEditForm((prev) => ({ ...prev, bio: e.target.value }))} className="w-full bg-transparent border-none outline-none text-sm p-2 shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)] rounded-[12px] min-h-[70px]" maxLength={300} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ig-text dark:text-ig-text-light mb-2">Subjects</label>
                  <div className="flex flex-wrap gap-1.5">
                    {SUBJECTS.filter((s) => s.name !== 'Other').map((s) => (
                      <button
                        key={s.name}
                        type="button"
                        onClick={() => setEditForm((prev) => ({ ...prev, subjects: prev.subjects.includes(s.name) ? prev.subjects.filter((x) => x !== s.name) : [...prev.subjects, s.name] }))}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${editForm.subjects?.includes(s.name) ? 'bg-blue-500 text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]' : 'bg-transparent shadow-[2px_2px_5px_var(--neu-shadow-dark),-2px_-2px_5px_var(--neu-shadow-light)]'}`}
                      >
                        {s.name}
                      </button>
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={saving} className="btn-primary text-sm flex items-center gap-2 mt-4">
                  {saving && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                  Save Profile
                </button>
              </form>
            </div>
          )}

          {/* Tabs */}
          <div className="flex justify-center gap-8 mb-6 relative">
            <button className="text-sm font-bold text-ig-text dark:text-ig-text-light pb-1 relative">
              All Posts
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-ig-text dark:bg-ig-text-light"></div>
            </button>
          </div>

          {/* Grid / Posts list */}
          <div className="text-left space-y-6">
             {posts.length === 0 ? (
               <div className="text-center py-8">
                 <p className="text-ig-text-2 text-sm">No posts yet.</p>
               </div>
             ) : (
               posts.map((post) => (
                 <PostCard key={post._id} post={post} />
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
