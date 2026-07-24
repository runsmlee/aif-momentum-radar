// ============================================================================
// /api/leaderboard — Vercel Serverless Function with ISR caching
// ============================================================================
// Fetches live data from npm, GitHub, and Hacker News APIs, computes z-score
// momentum rankings, and returns JSON.  CDN-cached via Cache-Control headers
// for ISR-like behaviour: fresh data every 3 hours, stale-while-revalidate
// up to 24 hours.
//
// This endpoint replaces 90+ direct client→external API calls with a single
// client→Vercel→CDN request, dramatically reducing time-to-interactive and
// guaranteeing crawlable prerendered HTML.
// ============================================================================

import {
  fetchAllTechData,
  type RawTechData,
} from '../src/lib/dataSources';
import {
  computeTechnologyMomentum,
  sortByCompositeScore,
  type TechnologyMomentum,
} from '../src/lib/anomaly';
import snapshot from '../src/lib/snapshot.json';

const FALLBACK_SNAPSHOT = snapshot as RawTechData[];

interface LeaderboardResponse {
  technologies: TechnologyMomentum[];
  timestamp: number;
  stale: boolean;
}

/**
 * Fetches live data and computes the full leaderboard.
 * Falls back to the bundled snapshot if external APIs are unavailable.
 */
async function buildLeaderboard(): Promise<LeaderboardResponse> {
  let rawData: RawTechData[];
  let stale = false;

  try {
    rawData = await fetchAllTechData();
    if (rawData.length < 5) {
      throw new Error('Insufficient data returned from APIs');
    }
  } catch {
    // Fall back to snapshot — still return ranked data, just mark as stale
    rawData = FALLBACK_SNAPSHOT;
    stale = true;
  }

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
    stale,
  };
}

export default async function handler(_req: Request): Promise<Response> {
  try {
    const data = await buildLeaderboard();

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        // ISR: CDN serves cached response for 8 hours (s-maxage),
        //      then revalidates in the background for up to 48 hours
        //      (stale-while-revalidate). This matches the weekly data
        //      cadence while keeping the leaderboard fresh (6-12h range).
        'Cache-Control':
          'public, s-maxage=28800, stale-while-revalidate=172800',
        // Allow the Vite dev server and deployed domain to access this endpoint
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    // Ultimate fallback — return snapshot with error flag
    const technologies = FALLBACK_SNAPSHOT
      .map((raw) => {
        const weeklyData = {
          npm: raw.npmWeekly,
          github: raw.githubWeekly,
          hn: raw.hnWeekly,
        };
        return computeTechnologyMomentum(raw.name, weeklyData);
      })
      .filter((t) => t.compositeScore !== 0 || t.zScores.npm !== null);

    const fallback: LeaderboardResponse = {
      technologies: sortByCompositeScore(technologies),
      timestamp: Date.now(),
      stale: true,
    };

    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=3600',
        'Access-Control-Allow-Origin': '*',
      },
    });
  }
}
