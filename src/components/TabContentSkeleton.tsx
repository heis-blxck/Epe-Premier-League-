import React from 'react';

type SkeletonTab = 'matches' | 'standings' | 'news' | 'fantasy' | 'cup' | 'admin' | 'about';

interface TabContentSkeletonProps {
  tab: string;
  isDark?: boolean;
}

const Block: React.FC<{ className?: string }> = ({ className = '' }) => (
  <div aria-hidden="true" className={`skeleton-shimmer rounded-xl ${className}`} />
);

const Card: React.FC<{ isDark: boolean; className?: string; children: React.ReactNode }> = ({
  isDark,
  className = '',
  children
}) => (
  <div
    className={`rounded-2xl border p-4 sm:p-5 ${
      isDark ? 'border-slate-800 bg-slate-900/70' : 'border-slate-200 bg-white'
    } ${className}`}
  >
    {children}
  </div>
);

const SectionHeading: React.FC<{ isDark: boolean; width?: string }> = ({ isDark, width = 'w-40' }) => (
  <div className="flex items-center justify-between gap-3">
    <div className="flex items-center gap-2.5">
      <Block className="h-8 w-8 rounded-lg" />
      <Block className={`h-4 ${width}`} />
    </div>
    <Block className="h-3 w-16" />
  </div>
);

const MatchCardSkeleton: React.FC<{ isDark: boolean }> = ({ isDark }) => (
  <Card isDark className="space-y-4">
    <div className="flex items-center justify-between">
      <Block className="h-3 w-20" />
      <Block className="h-5 w-14 rounded-full" />
    </div>
    <div className="flex items-center justify-between gap-3">
      <div className="flex flex-1 flex-col items-center gap-2">
        <Block className="h-11 w-11 rounded-full" />
        <Block className="h-3 w-20" />
      </div>
      <Block className="h-7 w-12 rounded-lg" />
      <div className="flex flex-1 flex-col items-center gap-2">
        <Block className="h-11 w-11 rounded-full" />
        <Block className="h-3 w-20" />
      </div>
    </div>
    <Block className="h-3 w-full" />
  </Card>
);

const StatRowSkeleton: React.FC = () => (
  <div className="flex items-center gap-3 py-2.5">
    <Block className="h-7 w-7 rounded-full" />
    <Block className="h-4 flex-1" />
    <Block className="h-3 w-8" />
    <Block className="h-3 w-8" />
    <Block className="h-3 w-10" />
  </div>
);

export const TabContentSkeleton: React.FC<TabContentSkeletonProps> = ({ tab, isDark = true }) => {
  const activeTab = (['matches', 'standings', 'news', 'fantasy', 'cup', 'admin', 'about'] as SkeletonTab[]).includes(
    tab as SkeletonTab
  )
    ? (tab as SkeletonTab)
    : 'matches';

  return (
    <div role="status" aria-live="polite" aria-label="Loading page content" className="space-y-6 sm:space-y-8">
      <span className="sr-only">Loading page content…</span>

      {activeTab === 'matches' && (
        <>
          <Block className="h-28 w-full rounded-2xl sm:h-32" />

          <div className="space-y-4">
            <SectionHeading isDark={isDark} width="w-48" />
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <MatchCardSkeleton isDark={isDark} />
              <MatchCardSkeleton isDark={isDark} />
              <MatchCardSkeleton isDark={isDark} />
            </div>
          </div>

          <Card isDark className="space-y-4">
            <div className="flex items-center justify-between">
              <Block className="h-5 w-52" />
              <Block className="h-8 w-24 rounded-lg" />
            </div>
            <Block className="h-3 w-3/4" />
            <div className="grid grid-cols-3 gap-3 pt-2">
              <Block className="h-16" />
              <Block className="h-16" />
              <Block className="h-16" />
            </div>
            <Block className="h-10 w-full rounded-xl" />
          </Card>
        </>
      )}

      {activeTab === 'standings' && (
        <>
          <Card isDark className="space-y-3">
            <div className="flex items-center justify-between gap-4">
              <Block className="h-5 w-40" />
              <Block className="h-8 w-28 rounded-lg" />
            </div>
            <Block className="h-3 w-64" />
          </Card>

          <Card isDark className="space-y-1">
            <div className="mb-2 flex items-center gap-3 border-b border-slate-800/40 pb-3">
              <Block className="h-3 w-6" />
              <Block className="h-3 flex-1" />
              <Block className="h-3 w-8" />
              <Block className="h-3 w-8" />
              <Block className="h-3 w-10" />
            </div>
            {Array.from({ length: 9 }).map((_, index) => (
              <StatRowSkeleton key={index} />
            ))}
          </Card>

          <Card isDark className="space-y-4">
            <SectionHeading isDark={isDark} width="w-56" />
            <div className="grid gap-3 sm:grid-cols-3">
              <Block className="h-24" />
              <Block className="h-24" />
              <Block className="h-24" />
            </div>
          </Card>
        </>
      )}

      {activeTab === 'news' && (
        <>
          <Card isDark className="space-y-4 p-0 overflow-hidden">
            <Block className="h-48 w-full rounded-none sm:h-64" />
            <div className="space-y-3 p-4 sm:p-5">
              <Block className="h-3 w-28" />
              <Block className="h-6 w-11/12" />
              <Block className="h-3 w-full" />
              <Block className="h-3 w-2/3" />
            </div>
          </Card>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} isDark className="space-y-3 p-0 overflow-hidden">
                <Block className="h-32 w-full rounded-none" />
                <div className="space-y-2 p-4">
                  <Block className="h-3 w-20" />
                  <Block className="h-4 w-full" />
                  <Block className="h-3 w-3/4" />
                </div>
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'fantasy' && (
        <>
          <Card isDark className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <Block className="h-6 w-44" />
              <Block className="h-9 w-28 rounded-lg" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <Block className="h-14" />
              <Block className="h-14" />
              <Block className="h-14" />
            </div>
          </Card>

          <Card isDark className="space-y-6">
            <div className="flex items-center justify-between">
              <Block className="h-4 w-32" />
              <Block className="h-3 w-20" />
            </div>
            <Block className="h-56 w-full rounded-2xl" />
            <div className="space-y-3">
              <Block className="h-4 w-28" />
              <div className="grid grid-cols-4 gap-3">
                <Block className="h-14" />
                <Block className="h-14" />
                <Block className="h-14" />
                <Block className="h-14" />
              </div>
            </div>
          </Card>
        </>
      )}

      {activeTab === 'cup' && (
        <>
          <Block className="h-32 w-full rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-2">
            {Array.from({ length: 2 }).map((_, index) => (
              <Card key={index} isDark className="space-y-4">
                <SectionHeading isDark={isDark} width="w-36" />
                {Array.from({ length: 4 }).map((__, rowIndex) => (
                  <div key={rowIndex} className="flex items-center gap-3">
                    <Block className="h-9 w-9 rounded-full" />
                    <Block className="h-4 flex-1" />
                    <Block className="h-5 w-10 rounded-md" />
                  </div>
                ))}
              </Card>
            ))}
          </div>
        </>
      )}

      {activeTab === 'admin' && (
        <>
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Card key={index} isDark className="space-y-3">
                <Block className="h-8 w-8 rounded-lg" />
                <Block className="h-6 w-16" />
                <Block className="h-3 w-24" />
              </Card>
            ))}
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            <Card isDark className="space-y-4">
              <SectionHeading isDark={isDark} width="w-40" />
              {Array.from({ length: 5 }).map((_, index) => (
                <div key={index} className="flex items-center gap-3">
                  <Block className="h-9 w-9 rounded-lg" />
                  <Block className="h-4 flex-1" />
                  <Block className="h-8 w-16 rounded-lg" />
                </div>
              ))}
            </Card>
            <Card isDark className="space-y-4">
              <SectionHeading isDark={isDark} width="w-44" />
              <Block className="h-10 w-full rounded-xl" />
              <Block className="h-10 w-full rounded-xl" />
              <Block className="h-24 w-full" />
              <Block className="h-10 w-32 rounded-xl" />
            </Card>
          </div>
        </>
      )}

      {activeTab === 'about' && (
        <>
          <Block className="h-44 w-full rounded-2xl sm:h-56" />
          <Card isDark className="space-y-4">
            <Block className="h-5 w-48" />
            <Block className="h-3 w-full" />
            <Block className="h-3 w-11/12" />
            <Block className="h-3 w-4/5" />
          </Card>
          <div className="grid gap-4 sm:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Card key={index} isDark className="space-y-3">
                <Block className="h-14 w-14 rounded-full" />
                <Block className="h-4 w-28" />
                <Block className="h-3 w-20" />
              </Card>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
