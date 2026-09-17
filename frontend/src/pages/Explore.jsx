import { useState, useEffect, useCallback, useRef } from 'react';
import { getExplore } from '../api';
import PostCard from '../components/PostCard';
import PostSkeleton from '../components/PostSkeleton';
import { SUBJECTS } from '../utils';
import { HiSearch } from 'react-icons/hi';

export default function Explore() {
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const observer = useRef();

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  const loadPosts = useCallback(
    async (pageNum, reset = false) => {
      try {
        const params = { page: pageNum, limit: 12 };
        if (selectedSubject !== 'All') params.subject = selectedSubject;
        if (debouncedSearch) params.search = debouncedSearch;

        const res = await getExplore(params);
        if (reset || pageNum === 1) {
          setPosts(res.data.posts);
        } else {
          setPosts((prev) => [...prev, ...res.data.posts]);
        }
        setHasMore(res.data.hasMore);
      } catch {
        // silently fail
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedSubject, debouncedSearch]
  );

  useEffect(() => {
    setPage(1);
    setLoading(true);
    loadPosts(1, true);
  }, [selectedSubject, debouncedSearch, loadPosts]);

  const lastPostRef = useCallback(
    (node) => {
      if (loadingMore) return;
      if (observer.current) observer.current.disconnect();
      observer.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore) {
          setLoadingMore(true);
          const nextPage = page + 1;
          setPage(nextPage);
          loadPosts(nextPage);
        }
      });
      if (node) observer.current.observe(node);
    },
    [loadingMore, hasMore, page, loadPosts]
  );

  return (
    <div className="pb-24 max-w-md mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center px-4 py-4 mb-2">
        <button className="w-10 h-10 rounded-full bg-[var(--neu-bg)] flex items-center justify-center text-ig-text shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)]">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
        </button>
        <h1 className="text-xl font-bold text-ig-text dark:text-ig-text-light">Explore</h1>
        <button className="w-10 h-10 rounded-full bg-[var(--neu-bg)] flex items-center justify-center text-ig-text shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)] relative">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
          <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-blue-500 border border-[var(--neu-bg)]"></div>
        </button>
      </div>

      {/* Stories/Users List */}
      <div className="flex gap-4 overflow-x-auto px-4 pb-6 pt-2 mb-2 scrollbar-hide">
        {/* 'You' Story */}
        <div className="flex flex-col items-center gap-1.5 flex-shrink-0">
          <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)]">
             <div className="p-0.5 bg-[var(--neu-bg)] rounded-full">
               <img src="https://ui-avatars.com/api/?name=You&background=1e3a5f&color=fbbf24" className="w-14 h-14 rounded-full object-cover" alt="You" />
             </div>
             <div className="absolute bottom-0 right-0 w-5 h-5 bg-white text-blue-500 rounded-full flex items-center justify-center border border-[var(--neu-bg)]">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
             </div>
          </div>
          <span className="text-xs font-semibold text-ig-text dark:text-ig-text-light">You</span>
        </div>

        {/* Other stories mock */}
        {['Benjamin', 'Farita', 'Marie', 'Claire'].map((name) => (
          <div key={name} className="flex flex-col items-center gap-1.5 flex-shrink-0">
            <div className="relative p-[3px] rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)]">
               <div className="p-0.5 bg-[var(--neu-bg)] rounded-full">
                 <img src={`https://ui-avatars.com/api/?name=${name}&background=random`} className="w-14 h-14 rounded-full object-cover" alt={name} />
               </div>
            </div>
            <span className="text-xs font-semibold text-ig-text dark:text-ig-text-light">{name}</span>
          </div>
        ))}
      </div>

      {/* Posts */}
      <div className="space-y-6 px-4">
        {loading ? (
          <>
            <PostSkeleton />
            <PostSkeleton />
            <PostSkeleton />
          </>
        ) : posts.length === 0 ? (
          <div className="card p-12 text-center rounded-[32px] shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)]">
            <span className="text-5xl block mb-4">📭</span>
            <h3 className="text-base font-heading font-semibold text-ig-text dark:text-ig-text-light mb-2">
              No posts found
            </h3>
            <p className="text-sm text-ig-text-2">
              Try adjusting your search or filters.
            </p>
          </div>
        ) : (
          posts.map((post, idx) => (
            <div key={post._id} ref={idx === posts.length - 1 ? lastPostRef : null}>
              <PostCard post={post} />
            </div>
          ))
        )}

        {loadingMore && <PostSkeleton />}
      </div>
    </div>
  );
}
