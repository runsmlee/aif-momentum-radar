import { describe, it, expect, beforeEach } from 'vitest';
import { getPrerenderedData, clearPrerenderedHtml } from '../src/lib/prerenderedData';
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

describe('prerenderedData', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  describe('getPrerenderedData', () => {
    it('returns null when no prerendered-data script exists', () => {
      expect(getPrerenderedData()).toBeNull();
    });

    it('returns parsed data when valid prerendered-data script exists', () => {
      const script = document.createElement('script');
      script.id = 'prerendered-data';
      script.type = 'application/json';
      script.textContent = JSON.stringify({
        technologies: mockTechnologies,
        timestamp: 1700000000000,
      });
      document.body.appendChild(script);

      const result = getPrerenderedData();
      expect(result).not.toBeNull();
      expect(result!.technologies).toHaveLength(2);
      expect(result!.technologies[0].name).toBe('React');
      expect(result!.timestamp).toBe(1700000000000);
    });

    it('returns null when script content is invalid JSON', () => {
      const script = document.createElement('script');
      script.id = 'prerendered-data';
      script.type = 'application/json';
      script.textContent = 'not valid json';
      document.body.appendChild(script);

      expect(getPrerenderedData()).toBeNull();
    });

    it('returns null when technologies array is missing', () => {
      const script = document.createElement('script');
      script.id = 'prerendered-data';
      script.type = 'application/json';
      script.textContent = JSON.stringify({ timestamp: 123 });
      document.body.appendChild(script);

      expect(getPrerenderedData()).toBeNull();
    });

    it('returns null when timestamp is not a number', () => {
      const script = document.createElement('script');
      script.id = 'prerendered-data';
      script.type = 'application/json';
      script.textContent = JSON.stringify({
        technologies: mockTechnologies,
        timestamp: 'not-a-number',
      });
      document.body.appendChild(script);

      expect(getPrerenderedData()).toBeNull();
    });
  });

  describe('clearPrerenderedHtml', () => {
    it('removes prerendered HTML from root element', () => {
      const root = document.createElement('div');
      root.id = 'root';
      root.setAttribute('data-prerendered', 'true');
      root.innerHTML = '<h1>Momentum Radar</h1><table><tr><td>React</td></tr></table>';
      document.body.appendChild(root);

      clearPrerenderedHtml();

      const updatedRoot = document.getElementById('root')!;
      expect(updatedRoot.hasAttribute('data-prerendered')).toBe(false);
      expect(updatedRoot.innerHTML).toBe('');
    });

    it('does nothing when root has no data-prerendered attribute', () => {
      const root = document.createElement('div');
      root.id = 'root';
      root.innerHTML = '<span>React content</span>';
      document.body.appendChild(root);

      clearPrerenderedHtml();

      const updatedRoot = document.getElementById('root')!;
      expect(updatedRoot.innerHTML).toBe('<span>React content</span>');
    });
  });
});
