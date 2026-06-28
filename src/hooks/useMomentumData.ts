// ============================================================================
// useMomentumData — Hook for fetching, caching, and computing momentum data
// ============================================================================

import { useState, useEffect, useCallback } from 'react';
import {
  fetchAllTechData,
  getCache,
  setCache,
  isCacheStale,
  CACHE_TTL,
  type RawTechData,
} from '../lib/dataSources';
import {
  computeTechnologyMomentum,
  type TechnologyMomentum,
} from '../lib/anomaly';
import { getPrerenderedData } from '../lib/prerenderedData';

const CACHE_KEY = 'momentum-radar-v1';

interface MomentumDataState {
  technologies: TechnologyMomentum[];
  isLoading: boolean;
  lastUpdated: number | null;
  error: string | null;
  isStale: boolean;
}

/**
 * Hook that manages fetching momentum data from APIs.
 *
 * Hydration priority:
 *   1. Prerendered data (injected at build time) — instant render for SEO + UX
 *   2. localStorage cache — instant render on repeat visits
 *   3. Fresh API fetch — fallback for first visit with no prerender
 *
 * Always fetches fresh data in the background for up-to-date rankings.
 */
export function useMomentumData(): MomentumDataState & {
  refresh: () => void;
} {
  // Check for build-time prerendered data on first render
  const prerendered = getPrerenderedData();

  const [state, setState] = useState<MomentumDataState>({
    technologies: prerendered?.technologies ?? [],
    isLoading: prerendered === null,
    lastUpdated: prerendered?.timestamp ?? null,
    error: null,
    isStale: prerendered !== null,
  });

  const processData = useCallback((rawData: RawTechData[]): TechnologyMomentum[] => {
    return rawData
      .map((raw) => {
        const weeklyData = {
          npm: raw.npmWeekly,
          github: raw.githubWeekly,
          hn: raw.hnWeekly,
        };
        return computeTechnologyMomentum(raw.name, weeklyData);
      })
      .filter((t) => t.compositeScore !== 0 || t.zScores.npm !== null);
  }, []);

  const fetchFresh = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true, error: null }));
    try {
      const rawData = await fetchAllTechData();
      const technologies = processData(rawData);

      // Cache the raw data
      setCache(CACHE_KEY, rawData);

      setState({
        technologies,
        isLoading: false,
        lastUpdated: Date.now(),
        error: null,
        isStale: false,
      });

      // Track analytics
      if (typeof window !== 'undefined' && window.aif?.track) {
        window.aif.track('leaderboard_loaded', {
          tech_count: technologies.length,
        });
      }
    } catch (err) {
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load data',
      }));
    }
  }, [processData]);

  // Initial load: hydrate from prerender/cache, then fetch fresh
  useEffect(() => {
    // Track page view
    if (typeof window !== 'undefined' && window.aif?.track) {
      window.aif.track('page_view', { path: window.location.pathname });
    }

    // If we already have prerendered data, fetch fresh in the background
    if (prerendered) {
      // Also check localStorage cache — prefer the most recent of the two
      const cached = getCache<RawTechData[]>(CACHE_KEY);
      if (cached && cached.timestamp > prerendered.timestamp) {
        const technologies = processData(cached.data);
        const stale = isCacheStale(cached, CACHE_TTL);
        setState({
          technologies,
          isLoading: false,
          lastUpdated: cached.timestamp,
          error: null,
          isStale: stale,
        });
        if (!stale) return; // cache is fresh, no need to refetch
      }
      // Fetch fresh data in background
      fetchFresh();
      return;
    }

    // No prerendered data — try cache, then fetch
    const cached = getCache<RawTechData[]>(CACHE_KEY);
    if (cached) {
      const technologies = processData(cached.data);
      const stale = isCacheStale(cached, CACHE_TTL);
      setState({
        technologies,
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
  }, [fetchFresh, processData]);

  const refresh = useCallback(() => {
    // Track refresh click
    if (typeof window !== 'undefined' && window.aif?.track) {
      window.aif.track('refresh_click', {});
    }
    fetchFresh();
  }, [fetchFresh]);

  return { ...state, refresh };
}
