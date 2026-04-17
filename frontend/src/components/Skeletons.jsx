// ──────────────────────────────────────────────────────────────
// Skeletons.jsx  —  Centralised skeleton components
// ──────────────────────────────────────────────────────────────

// Reusable shimmer block
function Shimmer({ className = '' }) {
  return (
    <div
      className={`skeleton-shimmer rounded ${className}`}
    />
  );
}

// ── Post card skeleton ───────────────────────────────────────
export function PostSkeleton() {
  return (
    <div className="card overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 flex items-center gap-3">
        <Shimmer className="w-9 h-9 !rounded-full flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <Shimmer className="h-3 w-28" />
          <Shimmer className="h-2.5 w-40" />
        </div>
        <Shimmer className="h-5 w-14 !rounded-full" />
      </div>

      {/* Media placeholder */}
      <Shimmer className="h-[280px] w-full !rounded-none" />

      {/* Actions */}
      <div className="px-4 py-3 space-y-2.5">
        <div className="flex gap-4">
          <Shimmer className="h-6 w-6 !rounded-full" />
          <Shimmer className="h-6 w-6 !rounded-full" />
          <Shimmer className="h-6 w-6 !rounded-full" />
          <Shimmer className="ml-auto h-6 w-6 !rounded-full" />
        </div>
        <Shimmer className="h-3 w-16" />
        <Shimmer className="h-3.5 w-52" />
        <Shimmer className="h-2.5 w-24" />
      </div>
    </div>
  );
}

// ── Profile page skeleton ────────────────────────────────────
export function ProfileSkeleton() {
  return (
    <div>
      {/* Header */}
      <div className="flex items-start gap-6 sm:gap-12 mb-8">
        <Shimmer className="w-20 h-20 sm:w-36 sm:h-36 !rounded-full flex-shrink-0" />
        <div className="flex-1 pt-2 space-y-4">
          <div className="flex items-center gap-4 flex-wrap">
            <Shimmer className="h-5 w-36" />
            <Shimmer className="h-8 w-28 !rounded-lg" />
          </div>
          {/* Stats */}
          <div className="flex gap-8">
            <Shimmer className="h-4 w-20" />
            <Shimmer className="h-4 w-32" />
          </div>
          {/* Bio lines */}
          <div className="space-y-2">
            <Shimmer className="h-3.5 w-24" />
            <Shimmer className="h-3 w-40" />
            <Shimmer className="h-3 w-56" />
          </div>
          {/* Subject badges */}
          <div className="flex gap-2 flex-wrap">
            {[80, 64, 96, 72].map((w, i) => (
              <Shimmer key={i} className={`h-5 w-${w < 90 ? 16 : 24} !rounded-full`} style={{ width: w }} />
            ))}
          </div>
        </div>
      </div>

      {/* Divider */}
      <div className="border-t border-ig-separator dark:border-ig-separator-dark pt-6 mb-4">
        <Shimmer className="h-3 w-16 mx-auto" />
      </div>

      {/* Post skeletons */}
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}

// ── Post detail skeleton ─────────────────────────────────────
export function PostDetailSkeleton() {
  return (
    <div>
      {/* Back button */}
      <div className="flex items-center gap-2 mb-4">
        <Shimmer className="h-5 w-5 !rounded-full" />
        <Shimmer className="h-4 w-12" />
      </div>

      <div className="card overflow-hidden">
        {/* Author header */}
        <div className="px-4 py-3 flex items-center justify-between border-b border-ig-separator dark:border-ig-separator-dark">
          <div className="flex items-center gap-3">
            <Shimmer className="w-8 h-8 !rounded-full" />
            <div className="space-y-1.5">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-2.5 w-16" />
            </div>
          </div>
          <Shimmer className="h-5 w-16 !rounded-full" />
        </div>

        {/* Media */}
        <Shimmer className="h-[340px] w-full !rounded-none" />

        {/* Actions */}
        <div className="px-4 pt-3 pb-2 space-y-2.5">
          <div className="flex gap-4">
            <Shimmer className="h-7 w-7 !rounded-full" />
            <Shimmer className="h-7 w-7 !rounded-full" />
            <Shimmer className="h-7 w-7 !rounded-full" />
            <Shimmer className="ml-auto h-7 w-7 !rounded-full" />
          </div>
          <Shimmer className="h-3 w-16" />
          <Shimmer className="h-4 w-48" />
          <Shimmer className="h-3 w-64" />
          <Shimmer className="h-2.5 w-20" />
        </div>

        {/* Comments */}
        <div className="px-4 pb-4 border-t border-ig-separator dark:border-ig-separator-dark pt-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex gap-3">
              <Shimmer className="w-8 h-8 !rounded-full flex-shrink-0" />
              <div className="flex-1 space-y-1.5">
                <Shimmer className="h-3 w-3/4" />
                <Shimmer className="h-2.5 w-12" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Notifications skeleton ───────────────────────────────────
export function NotificationsSkeleton() {
  return (
    <div>
      <Shimmer className="h-6 w-36 mb-5" />
      <div className="space-y-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex items-center gap-3 px-3 py-3">
            <Shimmer className="w-11 h-11 !rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Shimmer className={`h-3 ${i % 3 === 0 ? 'w-3/4' : i % 3 === 1 ? 'w-2/3' : 'w-4/5'}`} />
              <Shimmer className="h-2.5 w-14" />
            </div>
            <Shimmer className="h-6 w-6 !rounded-full flex-shrink-0" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Scholars bar skeleton (stories row) ─────────────────────
export function ScholarsBarSkeleton() {
  return (
    <div className="card mb-4 p-3">
      <div className="flex items-center justify-between mb-3 px-1">
        <Shimmer className="h-3.5 w-36" />
      </div>
      <div className="flex gap-3 overflow-hidden pb-1">
        {[...Array(7)].map((_, i) => (
          <div key={i} className="flex flex-col items-center gap-2 min-w-[72px]">
            <Shimmer className="w-[62px] h-[62px] !rounded-full" />
            <Shimmer className="h-2.5 w-12" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Bookmarks skeleton ───────────────────────────────────────
export function BookmarksSkeleton() {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <Shimmer className="h-6 w-14" />
        <Shimmer className="h-3.5 w-48" />
      </div>
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}

// ── Explore skeleton ─────────────────────────────────────────
export function ExploreSkeleton() {
  return (
    <div>
      {/* Search bar */}
      <Shimmer className="h-10 w-full mb-4 !rounded-lg" />
      {/* Subject pills */}
      <div className="flex gap-2 overflow-hidden pb-3 mb-4">
        {[48, 64, 80, 56, 72, 60].map((w, i) => (
          <Shimmer key={i} className="h-8 !rounded-lg flex-shrink-0" style={{ width: w }} />
        ))}
      </div>
      {/* Post list */}
      <div className="space-y-4">
        <PostSkeleton />
        <PostSkeleton />
        <PostSkeleton />
      </div>
    </div>
  );
}

// ── Full-page app loading shell ──────────────────────────────
export function AppShellSkeleton() {
  return (
    <div className="min-h-screen flex bg-ig-bg-2 dark:bg-ig-bg-dark">
      {/* Sidebar skeleton (desktop) */}
      <aside className="hidden md:flex flex-col w-[245px] xl:w-[335px] fixed h-full bg-ig-bg dark:bg-ig-bg-dark border-r border-ig-separator dark:border-ig-separator-dark">
        {/* Logo */}
        <div className="px-6 pt-5 pb-3 flex items-center gap-3">
          <Shimmer className="w-9 h-9 !rounded-full" />
          <Shimmer className="h-6 w-28" />
        </div>
        {/* Nav items */}
        <div className="flex-1 px-3 pt-2 space-y-1">
          {[...Array(7)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-3 py-3">
              <Shimmer className="w-6 h-6 !rounded-md" />
              <Shimmer className="h-4 w-24 hidden xl:block" />
            </div>
          ))}
        </div>
        {/* User info bottom */}
        <div className="px-3 py-4 border-t border-ig-separator/30 dark:border-ig-separator-dark/30">
          <div className="flex items-center gap-3 p-2">
            <Shimmer className="w-8 h-8 !rounded-full" />
            <div className="hidden xl:block space-y-1.5">
              <Shimmer className="h-3 w-24" />
              <Shimmer className="h-2.5 w-16" />
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile top header */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-ig-bg dark:bg-ig-bg-dark border-b border-ig-separator dark:border-ig-separator-dark z-30 flex items-center justify-between px-4 py-2.5">
        <div className="flex items-center gap-2">
          <Shimmer className="w-7 h-7 !rounded-full" />
          <Shimmer className="h-5 w-28" />
        </div>
        <Shimmer className="w-6 h-6 !rounded-full" />
      </header>

      {/* Main content area */}
      <main className="flex-1 md:ml-[245px] xl:ml-[335px] pb-16 md:pb-0 pt-14 md:pt-0">
        <div className="max-w-[630px] mx-auto px-4 py-6 space-y-4">
          {/* ScholarsBar */}
          <ScholarsBarSkeleton />
          {/* Feed posts */}
          <PostSkeleton />
          <PostSkeleton />
          <PostSkeleton />
        </div>
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-ig-bg dark:bg-ig-bg-dark border-t border-ig-separator dark:border-ig-separator-dark z-30 flex justify-around py-2 px-1">
        {[...Array(5)].map((_, i) => (
          <Shimmer key={i} className="w-7 h-7 !rounded-md" />
        ))}
      </nav>
    </div>
  );
}

// Default export for backward compat (same as PostSkeleton)
export default PostSkeleton;
