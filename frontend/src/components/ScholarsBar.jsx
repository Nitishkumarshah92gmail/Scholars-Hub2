import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getScholars } from '../api';
import { motion, AnimatePresence } from 'framer-motion';

export default function ScholarsBar() {
  const [scholars, setScholars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getScholars()
      .then((res) => setScholars(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="card mb-4 p-4">
        <div className="flex gap-4 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex flex-col items-center gap-2 animate-pulse">
              <div className="w-16 h-16 rounded-full" style={{ background: 'var(--neu-bg)', boxShadow: 'inset 3px 3px 8px var(--neu-shadow-dark), inset -3px -3px 8px var(--neu-shadow-light)' }} />
              <div className="w-12 h-3 rounded" style={{ background: 'var(--neu-bg)', boxShadow: 'inset 2px 2px 5px var(--neu-shadow-dark), inset -2px -2px 5px var(--neu-shadow-light)' }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (scholars.length === 0) return null;

  const displayScholars = showAll ? scholars : scholars;

  return (
    <>
      <div className="card mb-4 p-3 overflow-hidden">
        <div className="flex items-center justify-between mb-3 px-1">
          <h3 className="text-sm font-semibold text-ig-text dark:text-ig-text-light">
            Scholars on Platform
          </h3>
          {scholars.length > 8 && (
            <button
              onClick={() => setShowAll(true)}
              className="text-xs font-semibold text-ig-primary hover:text-ig-primary-hover transition-colors"
            >
              See All
            </button>
          )}
        </div>
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide pb-1 scroll-smooth"
        >
          {displayScholars.map((scholar) => (
            <button
              key={scholar._id}
              onClick={() => navigate(`/dashboard/profile/${scholar._id}`)}
              className="flex flex-col items-center gap-1.5 min-w-[72px] max-w-[72px] group"
            >
              <div className="relative">
                <div className="w-[62px] h-[62px] rounded-full p-[2.5px] bg-gradient-to-br from-ig-primary via-purple-500 to-pink-500 group-hover:scale-105 transition-transform"
                  style={{ boxShadow: '3px 3px 8px var(--neu-shadow-dark), -3px -3px 8px var(--neu-shadow-light)' }}>
                    <img
                      src={
                        scholar.avatar ||
                        `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name)}`
                      }
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name)}&background=1e3a5f&color=fbbf24`; }}
                      alt={scholar.name}
                      loading="lazy"
                      decoding="async"
                      className="w-full h-full rounded-full object-cover border-[2.5px] border-ig-bg dark:border-black"
                    />
                </div>
                {/* Online indicator */}
                <span className="absolute bottom-0.5 right-0.5 w-3.5 h-3.5 bg-blue-500 rounded-full border-2 border-ig-bg dark:border-black" />
              </div>
              <span className="text-[11px] text-ig-text dark:text-ig-text-light truncate w-full text-center leading-tight">
                {scholar.name?.length > 10
                  ? scholar.name.slice(0, 9) + '...'
                  : scholar.name}
              </span>
            </button>
          ))}

          {/* "All" button at the end */}
          {scholars.length > 5 && (
            <button
              onClick={() => setShowAll(true)}
              className="flex flex-col items-center gap-1.5 min-w-[72px] max-w-[72px]"
            >
              <div className="w-[62px] h-[62px] rounded-full bg-gradient-to-br from-ig-primary/20 to-purple-500/20 dark:from-ig-primary/30 dark:to-purple-500/30 flex items-center justify-center hover:scale-105 transition-transform border-2 border-dashed border-ig-primary/40">
                <span className="text-base font-bold text-ig-primary">All</span>
              </div>
              <span className="text-[11px] text-ig-primary font-semibold">
                {scholars.length}
              </span>
            </button>
          )}
        </div>
      </div>

      {/* "See All" Modal - Bottom Sheet on Mobile */}
      <AnimatePresence>
        {showAll && (
          <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 bg-black/60"
              onClick={() => setShowAll(false)}
            />
            <motion.div 
              initial={{ opacity: 0, y: 100 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 100 }}
              transition={{ type: "spring", damping: 28, stiffness: 350 }}
              className="relative w-full sm:max-w-md max-h-[85vh] sm:max-h-[80vh] flex flex-col overflow-hidden rounded-t-[24px] sm:rounded-[28px] sm:mx-4 sm:mb-0"
              style={{
                background: 'var(--glass-bg-strong)',
                backdropFilter: 'blur(24px) saturate(200%)',
                WebkitBackdropFilter: 'blur(24px) saturate(200%)',
                border: '1px solid var(--glass-border)',
                boxShadow: '0 -10px 40px rgba(0,0,0,0.3), 8px 8px 20px var(--neu-shadow-dark), -8px -8px 20px var(--neu-shadow-light)',
              }}
            >
              {/* Drag handle for mobile */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="w-10 h-1 rounded-full bg-gray-400/50"></div>
              </div>

              {/* Header */}
              <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid var(--glass-border)' }}>
                <h3 className="text-base font-semibold text-ig-text dark:text-ig-text-light">
                  All Scholars ({scholars.length})
                </h3>
                <button
                  onClick={() => setShowAll(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-ag-surface-container-high transition-colors text-ig-text dark:text-ig-text-light"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
  
              {/* Scholar list */}
              <div className="overflow-y-auto flex-1 p-2 pb-[env(safe-area-inset-bottom,16px)]">
                {scholars.map((scholar) => (
                  <button
                    key={scholar._id}
                    onClick={() => {
                      setShowAll(false);
                      navigate(`/dashboard/profile/${scholar._id}`);
                    }}
                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-ag-sm hover:bg-gray-100 dark:hover:bg-ag-surface-container-high transition-colors"
                  >
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 rounded-full p-[2px] bg-gradient-to-br from-ig-primary via-purple-500 to-pink-500"
                        style={{ boxShadow: '2px 2px 5px var(--neu-shadow-dark), -2px -2px 5px var(--neu-shadow-light)' }}>
                        <img
                          src={
                            scholar.avatar ||
                            `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name)}`
                          }
                          onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(scholar.name)}&background=1e3a5f&color=fbbf24`; }}
                          alt={scholar.name}
                          className="w-full h-full rounded-full object-cover border-2 border-ig-bg dark:border-black"
                        />
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-blue-500 rounded-full border-2 border-ig-bg dark:border-black" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-semibold text-ig-text dark:text-ig-text-light truncate">
                        {scholar.name}
                      </p>
                      <p className="text-xs text-ig-text-2 truncate">
                        {scholar.school || 'Scholar'}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
