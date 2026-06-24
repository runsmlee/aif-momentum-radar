// ============================================================================
// Momentum Radar — App
// ============================================================================

import { MomentumLeaderboard } from './components/MomentumLeaderboard';
import { useMomentumData } from './hooks/useMomentumData';

export default function App(): JSX.Element {
  const { technologies, isLoading, lastUpdated, error, refresh } = useMomentumData();

  return (
    <div className="min-h-screen bg-charcoal-900 text-charcoal-100">
      <main className="container mx-auto px-4 py-8 md:py-12 max-w-6xl">
        <MomentumLeaderboard
          technologies={technologies}
          isLoading={isLoading}
          lastUpdated={lastUpdated}
          onRefresh={refresh}
        />

        {error && (
          <div
            className="mt-4 flex items-start gap-3 p-4 text-sm text-rust-300 bg-rust-500/[0.08] rounded-lg border border-rust-500/25 animate-slide-up"
            role="alert"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-rust-400">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            <div>
              <p className="font-medium text-rust-200">Couldn't fetch all data sources</p>
              <p className="text-rust-300/80 mt-0.5 text-xs">{error}</p>
            </div>
          </div>
        )}

        {/* Footer with methodology note */}
        <footer className="mt-10 pt-6 border-t border-charcoal-700/40 text-center text-xs text-charcoal-500 max-w-2xl mx-auto leading-relaxed">
          <p>
            Composite momentum = weighted z-score (npm 0.5 / GitHub 0.3 / HN 0.2).
            Z-scores compare current week against 8-week baseline.
            Data fetched live from npm, GitHub, and Hacker News APIs.
          </p>
        </footer>
      </main>
    </div>
  );
}
