// ============================================================================
// useMomentumData — Hook for fetching and caching momentum data
// ============================================================================
// Fetches ranked leaderboard data from the /api/leaderboard serverless
// function (ISR-cached on Vercel's CDN) instead of calling 90+ external
// APIs directly from the browser.  This reduces network requests, improves
// time-to-interactive, and ensures data freshness via server-side ISR.
//
// Hydration priority:
//   1. Prerendered data (injected at build time) — instant render for SEO + UX
//   2. localStorage cache — instant render on repeat visits
//   3. Fresh /api/leaderboard fetch — ISR-cached on CDN, refreshed every ~3h
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  getCache,
  setCache,
  isCacheStale,
  CACHE_TTL,
} from '../lib/dataSources';
import type { TechnologyMomentum } from '../lib/anomaly';
import { getPrerenderedData, type PrerenderedData } from '../lib/prerenderedData';

const CACHE_KEY = 'momentum-radar-v1';

interface MomentumDataState {
  technologies: TechnologyMomentum[];
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
  isStale: boolean;
}

/** Shape of the API response from /api/leaderboard */
interface ApiLeaderboardResponse {
  technologies: TechnologyMomentum[];
  timestamp: number;
  stale?: boolean;
}

/**
 * Hook that manages fetching momentum data from the serverless API.
 *
 * Data flows through three tiers:
 *   1. Prerendered build-time data (instant first paint)
 *   2. localStorage cache (instant on repeat visits)
 *   3. /api/leaderboard endpoint (ISR-cached, refreshed every ~3 hours)
 */
export function useMomentumData(): MomentumDataState & {
  refresh: () => void;
} {
  // Check for build-time prerendered data on first render
  const prerendered: PrerenderedData | null = getPrerenderedData();

  const [state, setState] = useState<MomentumDataState>({
    technologies: prerendered?.technologies ?? [],
    isLoading: prerendered === null,
    lastUpdated: prerendered?.timestamp ?? null,
    error: null,
    isStale: prerendered !== null,
  });

  const fetchFresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const res = await fetch('/api/leaderboard');
      if (!res.ok) {
        throw new Error(`API returned ${res.status}`);
      }
      const data = (await res.json()) as ApiLeaderboardResponse;

      // Cache the computed technologies (setCache adds its own timestamp)
      setCache(CACHE_KEY, data.technologies);

      setState({
        technologies: data.technologies,
        isLoading: false,
        lastUpdated: data.timestamp,
        error: null,
        isStale: data.stale ?? false,
      });

      // Track analytics
      if (typeof window !== 'undefined' && window.aif?.track) {
        window.aif.track('leaderboard_loaded', {
          tech_count: data.technologies.length,
        });
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, []);

  // Initial load: hydrate from prerender/cache, then fetch fresh
  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && window.aif?.track) {
      window.aif.track('page_view', { path: window.location.pathname });
    }

    // If we already have prerendered data, check localStorage for newer cache
    if (prerendered) {
      const cached = getCache<TechnologyMomentum[]>(CACHE_KEY);
      if (cached && cached.timestamp > prerendered.timestamp) {
        const stale = isCacheStale(cached, CACHE_TTL);
        setState({
          technologies: cached.data,
          isLoading: false,
          lastUpdated: cached.timestamp,
          error: null,
          isStale: stale,
        });
        if (!stale) return; // cache is fresh, no need to refetch
      }
      // Fetch fresh data in background (ISR will return fast from CDN)
      fetchFresh();
      return;
    }

    // No prerendered data — try cache, then fetch
    const cached = getCache<TechnologyMomentum[]>(CACHE_KEY);
    if (cached) {
      const stale = isCacheStale(cached, CACHE_TTL);
      setState({
        technologies: cached.data,
        isLoading: false,
        lastUpdated: cached.timestamp,
        error: null,
        isStale: stale,
      });

      if (stale) {
        fetchFresh();
      }
    } else {
      fetchFresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fetchFresh]);

  const refresh = useCallback(() => {
    // Track refresh click
    if (typeof window !== 'undefined' && window.aif?.track) {
      window.aif.track('refresh_click', {});
    }
    fetchFresh();
  }, [fetchFresh]);

  return { ...state, refresh };
}
