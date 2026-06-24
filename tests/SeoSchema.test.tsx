import { describe, it, expect, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { SeoSchema } from '../src/components/SeoSchema';
import type { TechnologyMomentum } from '../src/lib/anomaly';

const mockTechnologies: TechnologyMomentum[] = [
  {
    name: 'React',
    compositeScore: 2.5,
    zScores: { npm: 2.0, github: 1.5, hn: 0.8 },
    weeklyData: {
      npm: [100, 120, 130, 140, 150, 160, 170, 180],
      github: [10, 12, 14, 16, 18, 20, 22, 24],
      hn: [1, 2, 3, 4, 5, 6, 7, 8],
    },
  },
  {
    name: 'Vue',
    compositeScore: 1.8,
    zScores: { npm: 1.5, github: 1.0, hn: 0.5 },
    weeklyData: {
      npm: [50, 55, 60, 65, 70, 75, 80, 85],
      github: [5, 6, 7, 8, 9, 10, 11, 12],
      hn: [1, 1, 2, 2, 3, 3, 4, 4],
    },
  },
];

describe('SeoSchema', () => {
  beforeEach(() => {
    // Clean up any dynamic JSON-LD
    document.querySelectorAll('script[data-dynamic-jsonld]').forEach((el) => el.remove());
  });

  it('injects ItemList JSON-LD script when technologies are provided', () => {
    render(<SeoSchema technologies={mockTechnologies} />);

    const script = document.querySelector('script[data-dynamic-jsonld="itemlist"]');
    expect(script).toBeTruthy();
    expect(script!.getAttribute('type')).toBe('application/ld+json');

    const jsonLd = JSON.parse(script!.textContent!);
    expect(jsonLd['@type']).toBe('ItemList');
    expect(jsonLd.itemListElement).toHaveLength(2);
  });

  it('sorts items by composite score descending', () => {
    render(<SeoSchema technologies={mockTechnologies} />);

    const script = document.querySelector('script[data-dynamic-jsonld="itemlist"]')!;
    const jsonLd = JSON.parse(script.textContent!);

    expect(jsonLd.itemListElement[0].name).toBe('React');
    expect(jsonLd.itemListElement[0].position).toBe(1);
    expect(jsonLd.itemListElement[1].name).toBe('Vue');
    expect(jsonLd.itemListElement[1].position).toBe(2);
  });

  it('does not inject script when technologies array is empty', () => {
    render(<SeoSchema technologies={[]} />);

    const script = document.querySelector('script[data-dynamic-jsonld="itemlist"]');
    expect(script).toBeNull();
  });

  it('includes position, name, and description for each item', () => {
    render(<SeoSchema technologies={mockTechnologies} />);

    const script = document.querySelector('script[data-dynamic-jsonld="itemlist"]')!;
    const jsonLd = JSON.parse(script.textContent!);

    const firstItem = jsonLd.itemListElement[0];
    expect(firstItem['@type']).toBe('ListItem');
    expect(firstItem.position).toBe(1);
    expect(firstItem.name).toBe('React');
    expect(firstItem.description).toContain('2.50');
  });

  it('cleans up script tag on unmount', () => {
    const { unmount } = render(<SeoSchema technologies={mockTechnologies} />);
    expect(document.querySelector('script[data-dynamic-jsonld="itemlist"]')).toBeTruthy();

    unmount();

    expect(document.querySelector('script[data-dynamic-jsonld="itemlist"]')).toBeNull();
  });
});
