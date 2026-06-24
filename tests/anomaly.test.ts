import { describe, it, expect } from 'vitest';
import {
  computeZScore,
  computeBaselineMean,
  computeBaselineStdDev,
  computeCompositeScore,
  sortByCompositeScore,
  type TechnologyMomentum,
} from '../src/lib/anomaly';

describe('computeZScore', () => {
  it('computes correct z-score for a simple known dataset (mean=50, std=10, value=70 → z=2.0)', () => {
    expect(computeZScore(70, 50, 10)).toBe(2.0);
  });

  it('returns z-score of 0 when value equals the mean', () => {
    expect(computeZScore(50, 50, 10)).toBe(0);
  });

  it('handles edge case of zero standard deviation (returns 0 to avoid division by zero)', () => {
    expect(computeZScore(70, 50, 0)).toBe(0);
  });
});

describe('computeBaselineMean', () => {
  it('correctly computes 8-week baseline mean from weekly download arrays', () => {
    const weeklyDownloads = [100, 200, 150, 300, 250, 200, 180, 220];
    // mean = (100+200+150+300+250+200+180+220) / 8 = 1600 / 8 = 200
    expect(computeBaselineMean(weeklyDownloads)).toBe(200);
  });
});

describe('computeBaselineStdDev', () => {
  it('correctly computes 8-week baseline standard deviation from weekly download arrays', () => {
    const weeklyDownloads = [100, 200, 150, 300, 250, 200, 180, 220];
    const mean = computeBaselineMean(weeklyDownloads);
    const stdDev = computeBaselineStdDev(weeklyDownloads, mean);
    // Population std dev calculation
    // variance = sum((x - mean)^2) / n
    const deviations = weeklyDownloads.map((x) => Math.pow(x - mean, 2));
    const expectedVariance = deviations.reduce((a, b) => a + b, 0) / weeklyDownloads.length;
    const expectedStdDev = Math.sqrt(expectedVariance);
    expect(stdDev).toBeCloseTo(expectedStdDev, 5);
  });
});

describe('computeCompositeScore', () => {
  it('composite momentum score correctly weights npm (0.5), GitHub (0.3), HN (0.2) z-scores', () => {
    const zScores = { npm: 2.0, github: 1.0, hn: 0.5 };
    // 2.0 * 0.5 + 1.0 * 0.3 + 0.5 * 0.2 = 1.0 + 0.3 + 0.1 = 1.4
    expect(computeCompositeScore(zScores)).toBeCloseTo(1.4, 5);
  });

  it('handles missing data source gracefully (treats as z-score 0, excludes from composite weight renormalization)', () => {
    const zScores = { npm: 2.0, github: null, hn: 0.5 };
    // Missing github → still weighted with 0, using full weights (npm 0.5 + hn 0.2 = 0.7)
    // Score = (2.0 * 0.5 + 0 * 0.3 + 0.5 * 0.2) / (0.5 + 0.2) = 1.1 / 0.7 ≈ 1.5714
    expect(computeCompositeScore(zScores)).toBeCloseTo(1.1 / 0.7, 5);
  });
});

describe('sortByCompositeScore', () => {
  it('sorts technologies by composite score descending', () => {
    const techs: TechnologyMomentum[] = [
      { name: 'A', compositeScore: 0.5, zScores: { npm: 0.5, github: 0.5, hn: 0.5 }, weeklyData: { npm: [], github: [], hn: [] } },
      { name: 'B', compositeScore: 2.1, zScores: { npm: 2.0, github: 2.5, hn: 1.5 }, weeklyData: { npm: [], github: [], hn: [] } },
      { name: 'C', compositeScore: 1.3, zScores: { npm: 1.0, github: 1.5, hn: 1.5 }, weeklyData: { npm: [], github: [], hn: [] } },
    ];
    const sorted = sortByCompositeScore(techs);
    expect(sorted[0].name).toBe('B');
    expect(sorted[1].name).toBe('C');
    expect(sorted[2].name).toBe('A');
  });
});
