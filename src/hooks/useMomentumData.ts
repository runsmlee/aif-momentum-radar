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
 * On first load: attempts to render from localStorage cache instantly,
 * then fetches fresh data in the background.
 * Provides a manual refresh function.
 */
export function useMomentumData(): MomentumDataState & {
  refresh: () => void;
} {
  const [state, setState] = useState<MomentumDataState>({
    technologies: [],
    isLoading: true,
    lastUpdated: null,
    error: null,
    isStale: false,
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

  // Initial load: try cache first, then fetch fresh
  useEffect(() => {
    // Try to load from cache immediately
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

      // If stale, fetch fresh data in background
      if (stale) {
        fetchFresh();
      }
    } else {
      // No cache — fetch fresh data
      fetchFresh();
    }

    // Track page view
    if (typeof window !== 'undefined' && window.aif?.track) {
      window.aif.track('page_view', { path: window.location.pathname });
    }
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
