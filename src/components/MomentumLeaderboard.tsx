// ============================================================================
// MomentumLeaderboard — The hero component: ranked technologies by momentum
// ============================================================================

import { useMemo } from 'react';
import { LeaderboardRow } from './LeaderboardRow';
import { sortByCompositeScore } from '../lib/anomaly';
import { formatTimeAgo } from '../lib/dataSources';
import type { TechnologyMomentum } from '../lib/anomaly';

interface MomentumLeaderboardProps {
  technologies: TechnologyMomentum[];
  isLoading: boolean;
  lastUpdated: number | null;
  onRefresh?: () => void;
}

function SkeletonRow({ index }: { index: number }) {
  return (
    <tr className="border-b border-charcoal-700/50">
      <td className="py-4 px-4 text-right">
        <div className="skeleton h-4 w-6 rounded ml-auto" style={{ animationDelay: `${index * 100}ms` }} />
      </td>
      <td className="py-4 px-4">
        <div className="skeleton h-4 w-24 rounded" style={{ animationDelay: `${index * 100 + 50}ms` }} />
      </td>
      <td className="py-4 px-4 hidden sm:table-cell">
        <div className="skeleton h-5 w-20 rounded" style={{ animationDelay: `${index * 100 + 100}ms` }} />
      </td>
      <td className="py-4 px-4 text-right">
        <div className="skeleton h-4 w-10 rounded ml-auto" style={{ animationDelay: `${index * 100 + 150}ms` }} />
      </td>
      <td className="py-4 px-4">
        <div className="flex gap-2 justify-end">
          <div className="skeleton h-4 w-10 rounded" style={{ animationDelay: `${index * 100 + 200}ms` }} />
          <div className="skeleton h-4 w-10 rounded" style={{ animationDelay: `${index * 100 + 250}ms` }} />
          <div className="skeleton h-4 w-10 rounded" style={{ animationDelay: `${index * 100 + 300}ms` }} />
        </div>
      </td>
    </tr>
  );
}

export function MomentumLeaderboard({
  technologies,
  isLoading,
  lastUpdated,
  onRefresh,
}: MomentumLeaderboardProps): JSX.Element {
  const sortedTechs = useMemo(() => sortByCompositeScore(technologies), [technologies]);
  const topMover = sortedTechs[0];
  const showSkeleton = isLoading && technologies.length === 0;

  return (
    <div className="w-full max-w-5xl mx-auto animate-fade-in" data-testid="momentum-leaderboard">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6 px-1">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-rust-500 animate-pulse-subtle" />
            <span className="text-xs font-medium text-rust-400 uppercase tracking-widest">Live Radar</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-charcoal-50 tracking-tight">
            Momentum Radar
          </h1>
          <p className="text-sm text-charcoal-400 mt-1 max-w-md leading-relaxed">
            Fastest growing open source projects this week — ranked by real growth signals, not popularity.
          </p>
        </div>

        {/* Freshness indicator + Refresh button */}
        <div className="flex items-center gap-3 shrink-0">
          {lastUpdated && !isLoading && (
            <span
              className="text-xs text-charcoal-400 font-mono tabular-nums"
              data-testid="freshness-badge"
              aria-label={`Data last updated ${formatTimeAgo(lastUpdated)}`}
            >
              Updated {formatTimeAgo(lastUpdated)}
            </span>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg bg-rust-500 text-white hover:bg-rust-600 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200 min-h-[36px]"
              aria-label="Refresh momentum data"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={isLoading ? 'animate-spin' : ''}>
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
                <path d="M21 3v5h-5" />
              </svg>
              <span>{isLoading ? 'Refreshing…' : 'Refresh'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Top mover highlight bar — shows when data available */}
      {!showSkeleton && topMover && topMover.compositeScore > 0 && (
        <div className="mb-4 flex items-center gap-3 px-4 py-2.5 rounded-lg bg-rust-500/[0.07] border border-rust-500/20 animate-slide-up">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-rust-400 shrink-0">
            <polyline points="23 6 13.5 15.5 8.5 10.5 1 18" />
            <polyline points="17 6 23 6 23 12" />
          </svg>
          <span className="text-sm text-charcoal-300">
            <span className="font-semibold text-charcoal-50">{topMover.name}</span>
            {' '}is surging with a momentum score of{' '}
            <span className="font-mono font-semibold text-rust-400 tabular-nums">{topMover.compositeScore.toFixed(2)}</span>
          </span>
        </div>
      )}

      {/* Leaderboard table container */}
      <div className="rounded-xl border border-charcoal-700/60 bg-charcoal-800/40 overflow-hidden">
        <div className="overflow-x-auto leaderboard-scroll">
          <table className="w-full text-sm">
            {showSkeleton && (
              <caption className="sr-only" data-testid="loading-state">
                Loading momentum data…
              </caption>
            )}
            <thead>
              <tr className="text-left border-b border-charcoal-700 text-charcoal-500 text-[11px] font-medium uppercase tracking-wider">
                <th className="py-3 px-4 text-right w-12">#</th>
                <th className="py-3 px-4">Technology</th>
                <th className="py-3 px-4 hidden sm:table-cell">8-Week Trend</th>
                <th className="py-3 px-4 text-right">Score</th>
                <th className="py-3 px-4 text-right">Sources</th>
              </tr>
            </thead>
            <tbody>
              {showSkeleton
                ? Array.from({ length: 8 }, (_, i) => <SkeletonRow key={i} index={i} />)
                : sortedTechs.map((tech, index) => (
                    <LeaderboardRow key={tech.name} tech={tech} rank={index + 1} />
                  ))}
            </tbody>
          </table>

          {/* Empty state */}
          {!showSkeleton && sortedTechs.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
              <div className="w-12 h-12 rounded-full bg-charcoal-700 flex items-center justify-center mb-4">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-charcoal-400">
                  <circle cx="11" cy="11" r="8" />
                  <path d="m21 21-4.3-4.3" />
                </svg>
              </div>
              <p className="text-sm font-medium text-charcoal-300 mb-1">No momentum data available</p>
              <p className="text-xs text-charcoal-500 mb-4 max-w-xs">
                API requests may have been rate-limited. Try refreshing in a moment.
              </p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-charcoal-700 text-charcoal-200 hover:bg-charcoal-600 transition-colors min-h-[36px]"
                >
                  Try Again
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Stats summary */}
      {!showSkeleton && sortedTechs.length > 0 && (
        <div className="flex items-center justify-between px-4 mt-3 text-xs text-charcoal-500">
          <span>
            <span className="text-charcoal-300 font-medium tabular-nums">{sortedTechs.length}</span> technologies tracked
          </span>
          <span className="hidden sm:inline">
            Sources:{' '}
            <span className="text-charcoal-400">npm</span> (0.5) ·{' '}
            <span className="text-charcoal-400">GitHub</span> (0.3) ·{' '}
            <span className="text-charcoal-400">HN</span> (0.2)
          </span>
        </div>
      )}
    </div>
  );
}
