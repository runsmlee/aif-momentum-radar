// ============================================================================
// SeoSchema — Dynamically updates ItemList JSON-LD structured data
// ============================================================================
// On initial page load, the build-time prerender plugin injects a static
// ItemList JSON-LD into <head>. When the client fetches fresh data, this
// component replaces it with updated z-scores so crawlers and users always
// see the most accurate rankings.

import { useEffect } from 'react';
import type { TechnologyMomentum } from '../lib/anomaly';

interface SeoSchemaProps {
  technologies: TechnologyMomentum[];
}

/**
 * Builds the ItemList JSON-LD structured data from the ranked technologies.
 * Each item includes the technology name, position, and momentum z-score
 * (including per-source breakdown in the description).
 */
function buildItemListJsonLd(technologies: TechnologyMomentum[]): string {
  const sorted = [...technologies].sort((a, b) => b.compositeScore - a.compositeScore);

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

/**
 * Replaces the JSON-LD script tag (prerendered or dynamic) with fresh data.
 * Cleans up previous script tags on unmount or when data changes.
 */
export function SeoSchema({ technologies }: SeoSchemaProps): null {
  useEffect(() => {
    if (technologies.length === 0) return;

    const jsonLdString = buildItemListJsonLd(technologies);

    // Remove any existing dynamic JSON-LD
    const existingDynamic = document.querySelector('script[data-dynamic-jsonld="itemlist"]');
    if (existingDynamic) {
      existingDynamic.remove();
    }

    // Remove the static prerendered JSON-LD (replaced by fresh data)
    const existingPrerendered = document.getElementById('prerendered-jsonld');
    if (existingPrerendered) {
      existingPrerendered.remove();
    }

    // Inject the updated JSON-LD
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-dynamic-jsonld', 'itemlist');
    script.textContent = jsonLdString;
    document.head.appendChild(script);

    return () => {
      const existing = document.querySelector('script[data-dynamic-jsonld="itemlist"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [technologies]);

  return null;
}
