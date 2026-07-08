// ============================================================================
// Tests for useMomentumData hook — verifies API-based data fetching
// ============================================================================

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useMomentumData } from '../src/hooks/useMomentumData';
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

const mockApiResponse = {
  technologies: mockTechnologies,
  timestamp: Date.now(),
  stale: false,
};

describe('useMomentumData', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
    document.body.innerHTML = '';
    document.head.innerHTML = '';
  });

  it('fetches data from /api/leaderboard on mount', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useMomentumData());

    // Initially loading
    expect(result.current.isLoading).toBe(true);

    // Wait for fetch to complete
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledWith('/api/leaderboard');
    expect(result.current.technologies).toHaveLength(2);
    expect(result.current.technologies[0].name).toBe('React');
    expect(result.current.error).toBeNull();
    expect(result.current.lastUpdated).toBe(mockApiResponse.timestamp);
  });

  it('caches fetched data in localStorage', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useMomentumData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    // Verify localStorage was populated
    const cached = localStorage.getItem('momentum-radar-v1');
    expect(cached).not.toBeNull();
    const parsed = JSON.parse(cached!);
    expect(parsed.data).toHaveLength(2);
    expect(parsed.data[0].name).toBe('React');
    expect(typeof parsed.timestamp).toBe('number');
  });

  it('handles API error gracefully', async () => {
    const fetchSpy = vi.fn().mockRejectedValue(new Error('Network error'));
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useMomentumData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(result.current.error).toBe('Network error');
    expect(result.current.technologies).toHaveLength(0);
  });

  it('uses prerendered data for initial render when available', async () => {
    // Inject prerendered data script
    const script = document.createElement('script');
    script.id = 'prerendered-data';
    script.type = 'application/json';
    script.textContent = JSON.stringify({
      technologies: mockTechnologies,
      timestamp: Date.now() - 60000, // 1 minute ago
    });
    document.body.appendChild(script);

    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        ...mockApiResponse,
        timestamp: Date.now(),
      }),
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useMomentumData());

    // Should have prerendered data immediately
    expect(result.current.technologies).toHaveLength(2);
    expect(result.current.technologies[0].name).toBe('React');

    // Should still fetch fresh data in background
    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith('/api/leaderboard');
    });
  });

  it('refresh() triggers a new fetch', async () => {
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => mockApiResponse,
    });
    vi.stubGlobal('fetch', fetchSpy);

    const { result } = renderHook(() => useMomentumData());

    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });

    expect(fetchSpy).toHaveBeenCalledTimes(1);

    // Trigger refresh
    result.current.refresh();

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledTimes(2);
    });
  });
});
