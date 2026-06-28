// ============================================================================
// Prerendered Data Reader — Client-side hydration from build-time data
// ============================================================================
// Reads the JSON embedded by the prerender plugin so the leaderboard renders
// instantly on first paint without waiting for API calls.
// ============================================================================

import type { TechnologyMomentum } from './anomaly';

/** Shape of the embedded prerendered data. */
export interface PrerenderedData {
  technologies: TechnologyMomentum[];
  timestamp: number;
}

/**
 * Reads prerendered data injected by the build-time plugin.
 * Returns null if no prerendered data is available (e.g. dev mode).
 */
export function getPrerenderedData(): PrerenderedData | null {
  if (typeof document === 'undefined') return null;

  const script = document.getElementById('prerendered-data');
  if (!script?.textContent) return null;

  try {
    const parsed = JSON.parse(script.textContent) as PrerenderedData;
    if (!parsed.technologies || !Array.isArray(parsed.technologies)) return null;
    if (typeof parsed.timestamp !== 'number') return null;
    return parsed;
  } catch {
    return null;
  }
}

/**
 * Removes the prerendered HTML content from #root before React mounts.
 * This prevents React hydration mismatch warnings.
 */
export function clearPrerenderedHtml(): void {
  if (typeof document === 'undefined') return;
  const root = document.getElementById('root');
  if (root?.hasAttribute('data-prerendered')) {
    root.removeAttribute('data-prerendered');
    root.innerHTML = '';
  }
}
