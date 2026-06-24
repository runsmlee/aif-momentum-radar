// ============================================================================
// SourceBadge — Displays a single data source z-score with label
// ============================================================================

interface SourceBadgeProps {
  source: string;
  zScore: number | null;
}

/**
 * Returns text color class based on z-score magnitude.
 * Single-hue ramp from neutral (low) to rust (high).
 */
function getScoreColor(z: number | null): string {
  if (z === null) return 'text-charcoal-600';
  const abs = Math.abs(z);
  if (abs > 2) return 'text-rust-400';
  if (abs > 1) return 'text-rust-300';
  if (abs > 0.5) return 'text-charcoal-300';
  return 'text-charcoal-400';
}

export function SourceBadge({ source, zScore }: SourceBadgeProps): JSX.Element {
  const hasData = zScore !== null;
  const intensity = hasData ? Math.min(Math.abs(zScore!) / 3, 1) : 0;
  const dotSize = hasData ? Math.max(4, 4 + intensity * 4) : 4;

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-[11px] font-mono ${getScoreColor(zScore)}`}
      role="status"
      aria-label={`${source} z-score: ${hasData ? zScore!.toFixed(2) : 'no data'}`}
    >
      <span className="text-charcoal-500 uppercase tracking-wide text-[10px]">{source}</span>
      <span className="font-semibold tabular-nums" data-testid={`source-badge-${source}`}>
        {hasData ? zScore!.toFixed(1) : '—'}
      </span>
      <span
        className="rounded-full shrink-0"
        style={{
          width: `${dotSize}px`,
          height: `${dotSize}px`,
          backgroundColor: hasData ? `rgba(226, 119, 98, ${0.2 + intensity * 0.8})` : 'rgba(90, 90, 82, 0.4)',
        }}
      />
    </span>
  );
}
