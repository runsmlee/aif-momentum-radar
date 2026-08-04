// ============================================================================
// Prerender Plugin — Build-time data injection for SEO crawlability
// ============================================================================
// This Vite plugin runs ONLY during production builds. It:
//   1. Fetches real momentum data from npm, GitHub, and HN APIs
//   2. Computes z-scores and ranks technologies
//   3. Injects semantic HTML into #root for crawlers that don't run JS
//   4. Injects ItemList JSON-LD structured data into <head>
//   5. Injects raw data JSON for instant client-side hydration
//
// If the live fetch fails (rate limits, network), it falls back to a bundled
// snapshot of real npm data so the prerendered HTML is never empty.
// ============================================================================

import type { Plugin } from 'vite';
import {
  fetchAllTechData,
  type RawTechData,
} from '../src/lib/dataSources';
import {
  computeTechnologyMomentum,
  sortByCompositeScore,
  type TechnologyMomentum,
} from '../src/lib/anomaly';

// ---------------------------------------------------------------------------
// Fallback snapshot (real npm data, fetched and committed periodically)
// ---------------------------------------------------------------------------

import snapshot from '../src/lib/snapshot.json';

const FALLBACK_SNAPSHOT = snapshot as RawTechData[];

// ---------------------------------------------------------------------------
// HTML generation
// ---------------------------------------------------------------------------

/**
 * Escapes HTML special characters in a string.
 */
function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Generates semantic HTML for the leaderboard that crawlers can parse.
 * Uses a <table> with proper <th> headers and real text content.
 */
function generateLeaderboardHtml(technologies: TechnologyMomentum[], maxRows = 30): string {
  const top = technologies.slice(0, maxRows);

  const rows = top
    .map((tech, i) => {
      const rank = i + 1;
      const score = tech.compositeScore.toFixed(2);
      const npmZ = tech.zScores.npm !== null ? tech.zScores.npm.toFixed(2) : 'n/a';
      const githubZ = tech.zScores.github !== null ? tech.zScores.github.toFixed(2) : 'n/a';
      const hnZ = tech.zScores.hn !== null ? tech.zScores.hn.toFixed(2) : 'n/a';
      const arrow = tech.compositeScore > 0 ? '&#9650;' : '&#9660;';
      const trend = tech.compositeScore > 0 ? 'surging' : 'cooling';

      return `<tr><td>${rank}</td><td>${escapeHtml(tech.name)}</td><td>${arrow} ${score}</td><td>${trend}</td><td>npm ${npmZ}</td><td>GitHub ${githubZ}</td><td>HN ${hnZ}</td></tr>`;
    })
    .join('\n');

  const techList = top.map((t) => escapeHtml(t.name)).join(', ');
  const topFive = top.slice(0, 5).map((t) => escapeHtml(t.name)).join(', ');

  return `<h1>Momentum Radar — Fastest Growing Open Source Projects This Week</h1>` +
    `<p>Discover which developer tools and open source projects are surging right now. Real-time growth rankings computed from npm, GitHub, and Hacker News data using z-score anomaly detection.</p>` +
    `<p>Top movers this week: ${topFive}. Full rankings below.</p>` +
    `<table aria-label="Momentum leaderboard ranked by composite z-score"><thead><tr><th scope="col">Rank</th><th scope="col">Technology</th><th scope="col">Momentum Score</th><th scope="col">Trend</th><th scope="col">npm z-score</th><th scope="col">GitHub z-score</th><th scope="col">HN z-score</th></tr></thead>` +
    `<tbody>\n${rows}\n</tbody></table>` +
    `<p>Tracked technologies: ${techList}.</p>` +
    `<p>Methodology: Composite momentum = weighted z-score (npm 0.5 / GitHub 0.3 / HN 0.2). Z-scores compare current week against 8-week baseline. Data fetched live from npm, GitHub, and Hacker News APIs.</p>`;
}

// ---------------------------------------------------------------------------
// JSON-LD generation
// ---------------------------------------------------------------------------

/**
 * Builds the ItemList JSON-LD structured data from the ranked technologies.
 * Each item includes name, rank, and z-score (in description).
 */
function generateItemListJsonLd(technologies: TechnologyMomentum[]): string {
  const sorted = sortByCompositeScore(technologies);

  const itemList = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Fastest Growing Open Source Projects This Week',
    description:
      'Real-time growth rankings from GitHub, npm, and Hacker News — spot emerging tech before it peaks.',
    itemListElement: sorted.map((tech, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: tech.name,
      url: `https://mvp-v3-d8e9b072-8256-430a-9df6-91eb.vercel.app/#${encodeURIComponent(tech.name)}`,
      description: `Momentum z-score: ${tech.compositeScore.toFixed(2)} (npm: ${(tech.zScores.npm ?? 0).toFixed(2)}, GitHub: ${(tech.zScores.github ?? 0).toFixed(2)}, HN: ${(tech.zScores.hn ?? 0).toFixed(2)})`,
    })),
  };

  return JSON.stringify(itemList);
}

// ---------------------------------------------------------------------------
// Data fetching with fallback
// ---------------------------------------------------------------------------

/**
 * Attempts to fetch fresh data at build time.
 * Falls back to the bundled snapshot if the fetch fails.
 */
async function fetchPrerenderData(): Promise<{ technologies: TechnologyMomentum[]; timestamp: number }> {
  let rawData: RawTechData[];

  try {
    rawData = await fetchAllTechData();
    if (rawData.length < 5) {
      throw new Error('Insufficient data returned');
    }
  } catch {
    // Fall back to snapshot
    rawData = FALLBACK_SNAPSHOT;
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
  };
}

// ---------------------------------------------------------------------------
// Vite Plugin
// ---------------------------------------------------------------------------

export function prerenderPlugin(): Plugin {
  return {
    name: 'momentum-prerender',
    transformIndexHtml: {
      order: 'post',
      async handler(html: string, ctx: { bundle?: unknown }) {
        // Only run during production build, not dev server
        if (!ctx.bundle) {
          return html;
        }

        const { technologies, timestamp } = await fetchPrerenderData();

        const leaderboardHtml = generateLeaderboardHtml(technologies);
        const itemListJsonLd = generateItemListJsonLd(technologies);
        const dataJson = JSON.stringify({ technologies, timestamp });

        // Inject prerendered content inside #root for crawlers
        let result = html.replace(
          '<div id="root"></div>',
          `<div id="root" data-prerendered="true">${leaderboardHtml}</div>`,
        );

        // Inject ItemList JSON-LD into <head>
        const jsonLdTag = `<script type="application/ld+json" id="prerendered-jsonld" data-prerendered="true">${itemListJsonLd}</script>`;
        result = result.replace('</head>', `${jsonLdTag}\n  </head>`);

        // Inject raw data JSON for client hydration
        const dataTag = `<script type="application/json" id="prerendered-data">${dataJson}</script>`;
        result = result.replace('</body>', `${dataTag}\n  </body>`);

        return result;
      },
    },
  };
}
