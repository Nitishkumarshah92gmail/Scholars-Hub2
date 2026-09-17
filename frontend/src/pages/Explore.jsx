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
    <div className="pb-24 max-w-6xl mx-auto w-full">
      {/* Header with Search */}
      <div className="px-4 py-4 sticky top-0 z-20 bg-[var(--neu-bg)]/90 backdrop-blur-md">
        <div className="relative flex items-center">
          <div className="absolute left-4 text-ig-text-2">
            <HiSearch className="w-5 h-5" />
          </div>
          <input
            type="text"
            placeholder="Search scholars, posts..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[var(--neu-bg)] text-ig-text dark:text-ig-text-light pl-11 pr-4 py-3 rounded-full outline-none shadow-[inset_4px_4px_10px_var(--neu-shadow-dark),inset_-4px_-4px_10px_var(--neu-shadow-light)] text-sm transition-all focus:shadow-[inset_6px_6px_12px_var(--neu-shadow-dark),inset_-6px_-6px_12px_var(--neu-shadow-light)]"
          />
        </div>
      </div>

      {/* Subjects Filter */}
      <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide z-10 relative bg-[var(--neu-bg)]">
        {SUBJECTS.map((s) => (
          <button
            key={s.name}
            onClick={() => setSelectedSubject(s.name)}
            className={`flex-shrink-0 px-5 py-2 rounded-full text-sm font-semibold transition-all ${
              selectedSubject === s.name
                ? 'bg-blue-500 text-white shadow-[inset_2px_2px_5px_rgba(0,0,0,0.2)]'
                : 'bg-[var(--neu-bg)] text-ig-text dark:text-ig-text-light shadow-[4px_4px_10px_var(--neu-shadow-dark),-4px_-4px_10px_var(--neu-shadow-light)] hover:shadow-[2px_2px_5px_var(--neu-shadow-dark),-2px_-2px_5px_var(--neu-shadow-light)] active:shadow-[inset_2px_2px_5px_var(--neu-shadow-dark),inset_-2px_-2px_5px_var(--neu-shadow-light)]'
            }`}
          >
            {s.name}
          </button>
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
