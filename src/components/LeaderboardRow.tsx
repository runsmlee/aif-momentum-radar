// ============================================================================
// LeaderboardRow — Single technology row in the momentum leaderboard
// ============================================================================

import { useState } from 'react';
import { Sparkline } from './Sparkline';
import { SourceBadge } from './SourceBadge';
import type { TechnologyMomentum } from '../lib/anomaly';

interface LeaderboardRowProps {
  tech: TechnologyMomentum;
  rank: number;
}

/**
 * Determines the intensity level (0-5) for row background coloring.
 * Based on the absolute value of the composite z-score.
 */
function getIntensity(score: number): number {
  const abs = Math.abs(score);
  if (abs > 2.5) return 5;
  if (abs > 2.0) return 4;
  if (abs > 1.5) return 3;
  if (abs > 1.0) return 2;
  if (abs > 0.5) return 1;
  return 0;
}

/**
 * Returns the background color for a row based on intensity level.
 * Uses a single-hue ramp from transparent to vivid rust.
 */
function getRowBackground(intensity: number): string {
  const opacity = intensity * 0.06;
  return `rgba(199, 69, 46, ${opacity})`;
}

/**
 * Returns the left border color for top-ranked items.
 * Creates a visual "heat" indicator on the left edge.
 */
function getBorderIntensity(intensity: number): string {
  if (intensity >= 4) return 'border-l-rust-500';
  if (intensity >= 3) return 'border-l-rust-600/60';
  if (intensity >= 2) return 'border-l-rust-700/40';
  return 'border-l-transparent';
}

/**
 * Inline detail panel shown when a row is expanded.
 * Shows per-source sparklines and z-score breakdowns.
 */
function ExpandedDetail({ tech }: { tech: TechnologyMomentum }): JSX.Element {
  const sources: Array<{ label: string; key: 'npm' | 'github' | 'hn'; data: number[]; z: number | null }> = [
    { label: 'npm', key: 'npm', data: tech.weeklyData.npm, z: tech.zScores.npm },
    { label: 'GitHub', key: 'github', data: tech.weeklyData.github, z: tech.zScores.github },
    { label: 'Hacker News', key: 'hn', data: tech.weeklyData.hn, z: tech.zScores.hn },
  ];

  return (
    <tr data-testid="expanded-detail">
      <td colSpan={5} className="px-4 pb-4 pt-1">
        <div className="rounded-lg bg-charcoal-900/60 border border-charcoal-700/40 p-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {sources.map((src) => (
              <div key={src.key} className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-medium text-charcoal-400 uppercase tracking-wider">
                    {src.label}
                  </span>
                  {src.z !== null && (
                    <span className="text-[11px] font-mono tabular-nums text-charcoal-300">
                      z={src.z.toFixed(2)}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-center bg-charcoal-800/40 rounded px-2 py-1.5">
                  <Sparkline data={src.data} width={100} height={28} color="#e27762" />
                </div>
                <p className="text-[10px] text-charcoal-500 leading-tight">
                  {src.data.length > 0
                    ? `8-week baseline trend`
                    : 'No data available'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </td>
    </tr>
  );
}

export function LeaderboardRow({ tech, rank }: LeaderboardRowProps): JSX.Element {
  const [expanded, setExpanded] = useState(false);
  const intensity = getIntensity(tech.compositeScore);
  const bgColor = getRowBackground(intensity);
  const isPositive = tech.compositeScore > 0;
  const borderColor = getBorderIntensity(intensity);

  const handleClick = () => setExpanded((prev) => !prev);
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      setExpanded((prev) => !prev);
    }
  };

  return (
    <>
      <tr
        data-testid="leaderboard-row"
        data-intensity={intensity}
        data-expanded={expanded}
        style={{ backgroundColor: bgColor }}
        className={`leaderboard-row border-b border-charcoal-700/40 border-l-2 ${borderColor} hover:bg-charcoal-700/40 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-rust-500/60`}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="button"
        aria-expanded={expanded}
        aria-label={`${tech.name}, momentum score ${tech.compositeScore.toFixed(2)}. Press Enter to ${expanded ? 'collapse' : 'expand'} details.`}
      >
        {/* Rank */}
        <td className="py-3.5 px-4 text-right">
          <span className={`font-mono text-sm tabular-nums ${rank <= 3 ? 'text-charcoal-200 font-semibold' : 'text-charcoal-500'}`}>
            {rank}
          </span>
        </td>

        {/* Technology name with expand chevron */}
        <td className="py-3.5 px-4">
          <span className="inline-flex items-center gap-1.5">
            <span className="font-semibold text-charcoal-50 whitespace-nowrap text-[15px]">
              {tech.name}
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={`text-charcoal-500 transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}
              aria-hidden="true"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </span>
        </td>

        {/* Sparkline */}
        <td className="py-2 px-4 hidden sm:table-cell">
          <Sparkline data={tech.weeklyData.npm} color="#e27762" />
        </td>

        {/* Composite score */}
        <td className="py-3.5 px-4 text-right">
          <span className="inline-flex items-center gap-1" data-testid="score-display">
            <svg
              width="10"
              height="10"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              className={isPositive ? 'text-rust-400' : 'text-charcoal-500'}
              aria-hidden="true"
            >
              {isPositive ? (
                <polyline points="6 15 12 9 18 15" />
              ) : (
                <polyline points="6 9 12 15 18 9" />
              )}
            </svg>
            <span className={`font-mono font-bold tabular-nums ${isPositive ? 'text-charcoal-50' : 'text-charcoal-300'}`}>
              {Math.abs(tech.compositeScore).toFixed(2)}
            </span>
            <span className="sr-only">{isPositive ? '▲' : '▼'}</span>
          </span>
        </td>

        {/* Source z-score badges */}
        <td className="py-3.5 px-4">
          <div className="flex items-center gap-2.5 flex-wrap justify-end">
            <SourceBadge source="npm" zScore={tech.zScores.npm} />
            <SourceBadge source="github" zScore={tech.zScores.github} />
            <SourceBadge source="hn" zScore={tech.zScores.hn} />
          </div>
        </td>
      </tr>
      {expanded && <ExpandedDetail tech={tech} />}
    </>
  );
}
