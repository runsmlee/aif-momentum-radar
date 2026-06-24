// ============================================================================
// Momentum Radar — Anomaly Detection Library
// ============================================================================
// Core statistical functions for computing momentum z-scores and
// composite momentum rankings from weekly time-series data.
// ============================================================================

/** Z-scores per data source. `null` means no data available. */
export interface SourceZScores {
  npm: number | null;
  github: number | null;
  hn: number | null;
}

/** Weekly time-series data per source (8+ weeks for baseline). */
export interface WeeklyData {
  npm: number[];
  github: number[];
  hn: number[];
}

/** Complete momentum data for a single technology. */
export interface TechnologyMomentum {
  name: string;
  compositeScore: number;
  zScores: SourceZScores;
  weeklyData: WeeklyData;
}

/** Weights for each data source in the composite score. */
export const SOURCE_WEIGHTS = {
  npm: 0.5,
  github: 0.3,
  hn: 0.2,
} as const;

/**
 * Computes a z-score: how many standard deviations a value is from the mean.
 * Returns 0 if standard deviation is 0 to avoid division by zero.
 */
export function computeZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Computes the mean (average) of an array of numbers.
 * Returns 0 for empty arrays.
 */
export function computeBaselineMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Computes the population standard deviation of an array of numbers.
 * Uses the provided mean to avoid recomputing it.
 */
export function computeBaselineStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map((val) => Math.pow(val - mean, 2));
  const variance = squaredDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  return Math.sqrt(variance);
}

/**
 * Computes a composite momentum score from per-source z-scores.
 * Uses weights: npm (0.5), GitHub (0.3), HN (0.2).
 * Missing sources (null) are excluded from the denominator (weight renormalization).
 */
export function computeCompositeScore(zScores: SourceZScores): number {
  let weightedSum = 0;
  let totalWeight = 0;

  if (zScores.npm !== null) {
    weightedSum += zScores.npm * SOURCE_WEIGHTS.npm;
    totalWeight += SOURCE_WEIGHTS.npm;
  }
  if (zScores.github !== null) {
    weightedSum += zScores.github * SOURCE_WEIGHTS.github;
    totalWeight += SOURCE_WEIGHTS.github;
  }
  if (zScores.hn !== null) {
    weightedSum += zScores.hn * SOURCE_WEIGHTS.hn;
    totalWeight += SOURCE_WEIGHTS.hn;
  }

  if (totalWeight === 0) return 0;
  return weightedSum / totalWeight;
}

/**
 * Sorts technologies by composite score in descending order (highest momentum first).
 */
export function sortByCompositeScore(techs: TechnologyMomentum[]): TechnologyMomentum[] {
  return [...techs].sort((a, b) => b.compositeScore - a.compositeScore);
}

/**
 * Computes z-score for a single source given its weekly data.
 * The last value is the "current" week; the preceding values form the baseline.
 */
export function computeSourceZScore(weeklyData: number[]): number | null {
  if (weeklyData.length < 2) return null;
  const currentValue = weeklyData[weeklyData.length - 1];
  const baseline = weeklyData.slice(0, -1);
  const mean = computeBaselineMean(baseline);
  const stdDev = computeBaselineStdDev(baseline, mean);
  return computeZScore(currentValue, mean, stdDev);
}

/**
 * Full pipeline: takes raw weekly data for a technology and computes
 * its complete momentum profile including per-source z-scores and composite score.
 */
export function computeTechnologyMomentum(
  name: string,
  weeklyData: WeeklyData
): TechnologyMomentum {
  const zScores: SourceZScores = {
    npm: weeklyData.npm.length >= 2 ? computeSourceZScore(weeklyData.npm) : null,
    github: weeklyData.github.length >= 2 ? computeSourceZScore(weeklyData.github) : null,
    hn: weeklyData.hn.length >= 2 ? computeSourceZScore(weeklyData.hn) : null,
  };

  const compositeScore = computeCompositeScore(zScores);

  return {
    name,
    compositeScore,
    zScores,
    weeklyData,
  };
}
