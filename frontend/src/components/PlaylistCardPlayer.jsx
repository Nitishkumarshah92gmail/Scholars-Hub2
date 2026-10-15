import { useState, useEffect, useRef, useCallback } from 'react';
import { HiCollection, HiExternalLink, HiChevronLeft, HiChevronRight, HiPlay } from 'react-icons/hi';
import { FaYoutube } from 'react-icons/fa';
import { getYoutubePlaylistItems } from '../api';

export default function PlaylistCardPlayer({ post, playlistId, videoId, playlistLink }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [autoplay, setAutoplay] = useState(false);
  const [items, setItems] = useState([]);
  const [virtualCount, setVirtualCount] = useState(12);
  const [loadingItems, setLoadingItems] = useState(false);
  const sliderRef = useRef(null);
  const iframeRef = useRef(null);
  const playerIframeId = useRef(`yt-iframe-${post.id || Math.random().toString(36).substring(2, 9)}`);

  // 1. Fetch playlist items from backend (Data API or HTML extraction fallback)
  useEffect(() => {
    if (!playlistId) return;
    let isMounted = true;
    setLoadingItems(true);
    getYoutubePlaylistItems(playlistId)
      .then((res) => {
        if (!isMounted) return;
        const apiItems = res.data?.items;
        if (Array.isArray(apiItems) && apiItems.length > 0) {
          setItems(apiItems);
          setVirtualCount(apiItems.length);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (isMounted) setLoadingItems(false);
      });

    return () => {
      isMounted = false;
    };
  }, [playlistId]);

  // 2. Listen for postMessage from the YouTube iframe player (enablejsapi=1)
  useEffect(() => {
    const handleWindowMessage = (event) => {
      try {
        const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
        if (!data) return;

        // When YouTube delivers player state or playlist data
        if (data.event === 'infoDelivery' && data.info) {
          // Sync playlist video array if provided by player
          if (Array.isArray(data.info.playlist) && data.info.playlist.length > 0) {
            setItems((prev) => {
              if (prev.length >= data.info.playlist.length && prev[0]?.videoId) return prev;
              return data.info.playlist.map((vid, idx) => ({
                index: idx,
                videoId: vid,
                title: prev[idx]?.title && !prev[idx].title.startsWith('Video ') ? prev[idx].title : `Video ${idx + 1}`,
                thumbnail: `https://i.ytimg.com/vi/${vid}/mqdefault.jpg`,
              }));
            });
            setVirtualCount(data.info.playlist.length);
          }

          // Sync currently playing video index
          if (typeof data.info.playlistIndex === 'number' && data.info.playlistIndex >= 0) {
            setCurrentIndex(data.info.playlistIndex);
          }
        }
      } catch {
        // Ignore non-JSON postMessages from other extensions or scripts
      }
    };

    window.addEventListener('message', handleWindowMessage);
    return () => {
      window.removeEventListener('message', handleWindowMessage);
    };
  }, []);

  // Tell iframe we are listening once it loads
  const handleIframeLoad = () => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({ event: 'listening' }),
        '*'
      );
    } catch {}
  };

  // If real items exist use them, otherwise create virtual numbered parts
  const displayItems = items.length > 0
    ? items
    : Array.from({ length: virtualCount }, (_, i) => ({
        index: i,
        videoId: i === 0 && videoId ? videoId : '',
        title: `Video ${i + 1}`,
        thumbnail: i === 0 && videoId ? `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg` : '',
      }));

  const activeItem = displayItems[currentIndex] || displayItems[0];
  const targetVideoId = activeItem?.videoId || (currentIndex === 0 ? videoId : '');

  // Determine embed URL:
  // Using specific video ID + list ensures YouTube always loads the exact selected video!
  const embedSrc = targetVideoId
    ? `https://www.youtube-nocookie.com/embed/${targetVideoId}?list=${playlistId}&index=${currentIndex}&autoplay=${autoplay ? 1 : 0}&enablejsapi=1&rel=0`
    : playlistId
    ? `https://www.youtube-nocookie.com/embed/videoseries?list=${playlistId}&index=${currentIndex}&autoplay=${autoplay ? 1 : 0}&enablejsapi=1&rel=0`
    : `https://www.youtube-nocookie.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}&enablejsapi=1&rel=0`;

  // Scroll active item into view
  const scrollToActive = (index) => {
    if (!sliderRef.current) return;
    const card = sliderRef.current.querySelector(`[data-index="${index}"]`);
    if (card) {
      card.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
    }
  };

  // PostMessage helper to control YouTube iframe
  const sendPlayerCommand = useCallback((func, args = []) => {
    try {
      iframeRef.current?.contentWindow?.postMessage(
        JSON.stringify({
          event: 'command',
          func,
          args,
        }),
        '*'
      );
    } catch {}
  }, []);

  const handleSelectVideo = (index) => {
    setCurrentIndex(index);
    setAutoplay(true);
    scrollToActive(index);
    sendPlayerCommand('playVideoAt', [index]);
  };

  const handlePrev = (e) => {
    e?.stopPropagation();
    if (currentIndex > 0) {
      const newIdx = currentIndex - 1;
      setCurrentIndex(newIdx);
      setAutoplay(true);
      scrollToActive(newIdx);
      sendPlayerCommand('playVideoAt', [newIdx]);
      sendPlayerCommand('previousVideo');
    }
  };

  const handleNext = (e) => {
    e?.stopPropagation();
    if (currentIndex < displayItems.length - 1) {
      const newIdx = currentIndex + 1;
      setCurrentIndex(newIdx);
      setAutoplay(true);
      scrollToActive(newIdx);
      sendPlayerCommand('playVideoAt', [newIdx]);
      sendPlayerCommand('nextVideo');
    }
  };

  const scrollSlider = (direction) => {
    if (!sliderRef.current) return;
    const scrollAmount = direction === 'left' ? -220 : 220;
    sliderRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
  };

  return (
    <div className="w-full overflow-hidden bg-black/5 dark:bg-black/30 select-none">
      {/* 1. Playlist Card Top Ribbon */}
      <div className="px-4 py-2.5 bg-gradient-to-r from-red-600 via-rose-600 to-red-700 text-white flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 min-w-0">
          <span className="p-1.5 rounded-lg bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0">
            <HiCollection className="w-4 h-4 text-white" />
          </span>
          <div className="min-w-0 flex items-center gap-2">
            <span className="text-[10px] uppercase tracking-wider font-extrabold bg-black/30 px-2.5 py-0.5 rounded-full text-white shrink-0 border border-white/20">
              YouTube Playlist
            </span>
            <span className="text-xs font-semibold text-white/95 truncate hidden sm:inline">
              {post.title || 'Course Series'}
            </span>
          </div>
        </div>
        <a
          href={playlistLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 text-xs font-bold bg-white text-red-600 hover:bg-white/95 px-3 py-1 rounded-full shadow transition-all active:scale-95 shrink-0 ml-2"
        >
          <FaYoutube className="w-3.5 h-3.5 text-red-600" />
          <span>Open</span>
          <HiExternalLink className="w-3.5 h-3.5" />
        </a>
      </div>

      {/* 2. 16:9 Interactive Player */}
      <div className="aspect-video w-full bg-black relative">
        <iframe
          ref={iframeRef}
          id={playerIframeId.current}
          key={`${targetVideoId || playlistId}-${currentIndex}`}
          src={embedSrc}
          title={activeItem?.title || post.title || 'YouTube Playlist Video'}
          onLoad={handleIframeLoad}
          className="w-full h-full"
          frameBorder="0"
          allowFullScreen
          loading="lazy"
          sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        />
      </div>

      {/* 3. Slider Navigation & Status Bar */}
      <div className="px-4 py-2.5 bg-[var(--neu-bg-2)] border-t border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2 min-w-0 text-ig-text-2">
          <span className="relative flex h-2.5 w-2.5 shrink-0">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <div className="min-w-0 flex items-center gap-1.5">
            <span className="font-bold text-red-600 dark:text-red-400 text-[11px] sm:text-xs shrink-0">
              Video #{currentIndex + 1}:
            </span>
            <span className="font-medium text-ig-text dark:text-ig-text-light truncate text-[11px] sm:text-xs">
              {activeItem?.title || `Part ${currentIndex + 1}`}
            </span>
          </div>
          <span className="text-[10px] text-ig-text-2 shrink-0 hidden xs:inline">
            ({currentIndex + 1} of {displayItems.length})
          </span>
        </div>

        {/* Prev / Next controls */}
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={handlePrev}
            disabled={currentIndex === 0}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentIndex === 0
                ? 'opacity-40 cursor-not-allowed text-ig-text-2 bg-black/5 dark:bg-white/5'
                : 'text-ig-text dark:text-ig-text-light hover:bg-red-500/10 hover:text-red-600 active:scale-95 bg-black/5 dark:bg-white/10'
            }`}
            title="Previous Video"
          >
            <HiChevronLeft className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Prev</span>
          </button>

          <button
            type="button"
            onClick={handleNext}
            disabled={currentIndex === displayItems.length - 1}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all ${
              currentIndex === displayItems.length - 1
                ? 'opacity-40 cursor-not-allowed text-ig-text-2 bg-black/5 dark:bg-white/5'
                : 'bg-red-600 text-white hover:bg-red-700 shadow-sm active:scale-95'
            }`}
            title="Next Video"
          >
            <span className="hidden sm:inline">Next</span>
            <HiChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 4. Sliding Carousel Track */}
      <div className="relative group/slider px-3 py-2 bg-black/5 dark:bg-black/20 border-t border-[rgba(255,255,255,0.05)]">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => scrollSlider('left')}
          className="absolute left-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition-all active:scale-90 opacity-80 hover:opacity-100"
          title="Slide Left"
        >
          <HiChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable Track */}
        <div
          ref={sliderRef}
          className="flex items-center gap-2.5 overflow-x-auto scroll-smooth py-1 px-5 no-scrollbar"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          {displayItems.map((item, idx) => {
            const isActive = idx === currentIndex;
            const thumbUrl = item.thumbnail || (item.videoId ? `https://i.ytimg.com/vi/${item.videoId}/mqdefault.jpg` : '');

            return (
              <button
                key={idx}
                type="button"
                data-index={idx}
                onClick={() => handleSelectVideo(idx)}
                className={`flex-shrink-0 w-32 sm:w-40 text-left rounded-xl p-1.5 transition-all duration-200 group relative ${
                  isActive
                    ? 'ring-2 ring-red-500 bg-red-500/10 shadow-[0_4px_16px_rgba(239,68,68,0.25)] scale-[1.02]'
                    : 'bg-[var(--neu-bg-2)] hover:bg-red-500/5 hover:border-red-500/40 border border-[var(--glass-border)]'
                }`}
              >
                {/* Thumbnail / Placeholder */}
                <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-black/40 mb-1.5 flex items-center justify-center">
                  {thumbUrl ? (
                    <img
                      src={thumbUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-neutral-800 to-neutral-900 text-white/80">
                      <FaYoutube className={`w-5 h-5 ${isActive ? 'text-red-500' : 'text-white/60'}`} />
                      <span className="text-[10px] font-bold mt-1 text-white/90">Part {idx + 1}</span>
                    </div>
                  )}

                  {/* Number Badge */}
                  <span className="absolute top-1 left-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/75 text-white backdrop-blur-sm">
                    #{idx + 1}
                  </span>

                  {/* Playing Indicator Pill */}
                  {isActive && (
                    <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-600 text-white shadow-sm flex items-center gap-0.5">
                      <HiPlay className="w-2.5 h-2.5" />
                      <span>Playing</span>
                    </span>
                  )}
                </div>

                {/* Title */}
                <p className={`text-[11px] leading-tight line-clamp-1 font-semibold ${
                  isActive
                    ? 'text-red-600 dark:text-red-400 font-bold'
                    : 'text-ig-text dark:text-ig-text-light group-hover:text-red-500'
                }`}>
                  {item.title}
                </p>
                <p className="text-[10px] text-ig-text-2 mt-0.5">
                  {isActive ? '● Active lecture' : 'Click to watch'}
                </p>
              </button>
            );
          })}

          {/* Expand More Virtual Items button (when API items not present) */}
          {items.length === 0 && virtualCount < 50 && (
            <button
              type="button"
              onClick={() => setVirtualCount((prev) => Math.min(prev + 10, 50))}
              className="flex-shrink-0 w-24 h-[90px] rounded-xl border border-dashed border-[var(--glass-border)] hover:border-red-500/60 bg-[var(--neu-bg-2)] hover:bg-red-500/5 text-ig-text-2 hover:text-red-500 flex flex-col items-center justify-center text-center p-2 transition-all active:scale-95"
              title="Load more video parts"
            >
              <span className="text-xs font-bold">+ 10 More</span>
              <span className="text-[9px] mt-0.5">Videos</span>
            </button>
          )}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => scrollSlider('right')}
          className="absolute right-1 top-1/2 -translate-y-1/2 z-10 w-7 h-7 rounded-full bg-black/70 hover:bg-black text-white flex items-center justify-center shadow-md transition-all active:scale-90 opacity-80 hover:opacity-100"
          title="Slide Right"
        >
          <HiChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
