// ============================================================================
// SeoSchema — Dynamically injects ItemList JSON-LD structured data
// ============================================================================
// When the leaderboard data is available, this component renders a script
// tag with ItemList schema so search engines can display the ranked list
// in rich results.

import { useEffect } from 'react';
import type { TechnologyMomentum } from '../lib/anomaly';

interface SeoSchemaProps {
  technologies: TechnologyMomentum[];
}

/**
 * Builds the ItemList JSON-LD structured data from the ranked technologies.
 * Each item includes the technology name, position, and momentum score.
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
      description: `${tech.name} momentum score: ${tech.compositeScore.toFixed(2)}`,
    })),
  };

  return JSON.stringify(itemList);
}

/**
 * Injects a JSON-LD script tag into document.head when technologies data is available.
 * Cleans up the script tag on unmount or when data changes.
 */
export function SeoSchema({ technologies }: SeoSchemaProps): null {
  useEffect(() => {
    if (technologies.length === 0) return;

    const jsonLdString = buildItemListJsonLd(technologies);
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-dynamic-jsonld', 'itemlist');
    script.textContent = jsonLdString;
    document.head.appendChild(script);

    return () => {
      // Remove previous dynamic JSON-LD on re-render/unmount
      const existing = document.querySelector('script[data-dynamic-jsonld="itemlist"]');
      if (existing) {
        existing.remove();
      }
    };
  }, [technologies]);

  return null;
}
