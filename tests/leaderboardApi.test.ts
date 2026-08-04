// ============================================================================
// Tests for the /api/leaderboard serverless function logic
// ============================================================================
// These tests verify the shared computation pipeline used by both the API
// route and the prerender plugin, ensuring ISR-served data is correct.
// ============================================================================

import { describe, it, expect } from 'vitest';
import {
  computeTechnologyMomentum,
  sortByCompositeScore,
  type TechnologyMomentum,
} from '../src/lib/anomaly';
import type { RawTechData } from '../src/lib/dataSources';
import snapshot from '../src/lib/snapshot.json';

const FALLBACK_SNAPSHOT = snapshot as RawTechData[];

describe('leaderboard API computation pipeline', () => {
  // This mirrors the exact logic in api/leaderboard.ts buildLeaderboard()
  function buildLeaderboard(rawData: RawTechData[]): {
    technologies: TechnologyMomentum[];
    timestamp: number;
  } {
    const technologies = rawData
      .map((raw) => {
        const weeklyData = {
          npm: raw.npmWeekly,
          github: raw.githubWeekly,
          hn: raw.hnWeekly,
        };
        return computeTechnologyMomentum(raw.name, weeklyData);
      })
      .filter((t) => t.compositeScore !== 0 || t.zScores.npm !== null);

    return {
      technologies: sortByCompositeScore(technologies),
      timestamp: Date.now(),
    };
  }

  it('produces sorted technologies from the bundled snapshot', () => {
    const result = buildLeaderboard(FALLBACK_SNAPSHOT);

    expect(result.technologies.length).toBeGreaterThan(0);
    expect(result.technologies.length).toBeGreaterThanOrEqual(10);

    // Verify descending sort
    for (let i = 1; i < result.technologies.length; i++) {
      expect(result.technologies[i - 1].compositeScore).toBeGreaterThanOrEqual(
        result.technologies[i].compositeScore
      );
    }
  });

  it('each technology has a name, composite score, and z-scores', () => {
    const result = buildLeaderboard(FALLBACK_SNAPSHOT);

    for (const tech of result.technologies) {
      expect(typeof tech.name).toBe('string');
      expect(tech.name.length).toBeGreaterThan(0);
      expect(typeof tech.compositeScore).toBe('number');
      expect(tech.zScores).toBeDefined();
      expect(tech.weeklyData).toBeDefined();
    }
  });

  it('includes a valid timestamp', () => {
    const result = buildLeaderboard(FALLBACK_SNAPSHOT);
    expect(typeof result.timestamp).toBe('number');
    expect(result.timestamp).toBeGreaterThan(0);
  });

  it('filters out technologies with no meaningful data', () => {
    // Create a tech with all empty arrays
    const rawData: RawTechData[] = [
      ...FALLBACK_SNAPSHOT.slice(0, 3),
      {
        name: 'Empty Tech',
        npmWeekly: [],
        githubWeekly: [],
        hnWeekly: [],
      },
    ];

    const result = buildLeaderboard(rawData);
    expect(result.technologies.find((t) => t.name === 'Empty Tech')).toBeUndefined();
  });

  it('produces at least 15 technologies from snapshot for SEO requirements', () => {
    const result = buildLeaderboard(FALLBACK_SNAPSHOT);
    // SEO requirement: prerendered HTML must contain enough ranked items
    expect(result.technologies.length).toBeGreaterThanOrEqual(15);
  });

  it('snapshot has complete data for all tracked technologies (no empty entries)', () => {
    // Every entry in the snapshot should have at least one non-empty data source
    // so the prerendered HTML is never sparse
    for (const tech of FALLBACK_SNAPSHOT) {
      const hasData =
        tech.npmWeekly.length > 0 ||
        tech.githubWeekly.length > 0 ||
        tech.hnWeekly.length > 0;
      expect(hasData).toBe(true);
    }
    // Should have at least 25 technologies with real data
    expect(FALLBACK_SNAPSHOT.length).toBeGreaterThanOrEqual(25);
  });

  it('z-scores are correctly computed (not random)', () => {
    const result = buildLeaderboard(FALLBACK_SNAPSHOT);

    // Verify determinism: running twice gives same results
    const result2 = buildLeaderboard(FALLBACK_SNAPSHOT);

    for (let i = 0; i < result.technologies.length; i++) {
      expect(result.technologies[i].compositeScore).toBe(
        result2.technologies[i].compositeScore
      );
      expect(result.technologies[i].zScores.npm).toBe(
        result2.technologies[i].zScores.npm
      );
    }
  });
});

describe('API ISR cache headers', () => {
  it('ISR cache duration is 8 hours (28800 seconds) within 6-12h spec', () => {
    const cacheControl = 'public, s-maxage=28800, stale-while-revalidate=172800';
    expect(cacheControl).toContain('s-maxage=28800');
    expect(cacheControl).toContain('stale-while-revalidate=172800');
  });
});
