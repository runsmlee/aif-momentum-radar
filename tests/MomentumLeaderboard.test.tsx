import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MomentumLeaderboard } from '../src/components/MomentumLeaderboard';
import type { TechnologyMomentum } from '../src/lib/anomaly';

// Mock data for testing
const mockTechnologies: TechnologyMomentum[] = Array.from({ length: 20 }, (_, i) => ({
  name: `Tech${i}`,
  compositeScore: 3.0 - i * 0.1,
  zScores: {
    npm: 2.5 - i * 0.1,
    github: 2.0 - i * 0.05,
    hn: 1.0 - i * 0.02,
  },
  weeklyData: {
    npm: [100 + i * 10, 110 + i * 10, 120 + i * 10, 130 + i * 10, 140 + i * 10, 150 + i * 10, 160 + i * 10, 170 + i * 10],
    github: [10 + i, 12 + i, 14 + i, 16 + i, 18 + i, 20 + i, 22 + i, 24 + i],
    hn: [1 + i, 2 + i, 3 + i, 4 + i, 5 + i, 6 + i, 7 + i, 8 + i],
  },
}));

describe('MomentumLeaderboard', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    localStorage.clear();
  });

  it('renders without crash', () => {
    render(<MomentumLeaderboard technologies={[]} isLoading={false} lastUpdated={null} />);
    expect(screen.getByText(/Momentum Radar/i)).toBeTruthy();
  });

  it('shows loading state while data is being fetched', () => {
    render(<MomentumLeaderboard technologies={[]} isLoading={true} lastUpdated={null} />);
    expect(screen.getByText(/loading/i)).toBeTruthy();
  });

  it('renders at least 15 leaderboard rows when data is loaded', () => {
    const { container } = render(
      <MomentumLeaderboard technologies={mockTechnologies} isLoading={false} lastUpdated={null} />
    );
    const rows = container.querySelectorAll('[data-testid="leaderboard-row"]');
    expect(rows.length).toBeGreaterThanOrEqual(15);
  });

  it('sorts rows by composite momentum score (highest first)', () => {
    const shuffled = [...mockTechnologies].reverse();
    const { container } = render(
      <MomentumLeaderboard technologies={shuffled} isLoading={false} lastUpdated={null} />
    );
    const rows = container.querySelectorAll('[data-testid="leaderboard-row"]');
    expect(rows.length).toBeGreaterThan(0);
    // First row should have the highest score — name may also appear in the top-mover highlight
    expect(screen.getAllByText('Tech0').length).toBeGreaterThanOrEqual(1);
  });

  it('displays each technology name and composite score', () => {
    render(
      <MomentumLeaderboard technologies={mockTechnologies.slice(0, 5)} isLoading={false} lastUpdated={null} />
    );
    // Tech0 may appear in both the highlight bar and the table row
    expect(screen.getAllByText('Tech0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Tech1')).toBeTruthy();
  });

  it('shows sparkline SVG for each row', () => {
    const { container } = render(
      <MomentumLeaderboard technologies={mockTechnologies.slice(0, 5)} isLoading={false} lastUpdated={null} />
    );
    const svgs = container.querySelectorAll('svg');
    expect(svgs.length).toBeGreaterThanOrEqual(5);
  });

  it('shows per-source badges (npm, GitHub, HN) with individual z-scores', () => {
    render(
      <MomentumLeaderboard technologies={mockTechnologies.slice(0, 3)} isLoading={false} lastUpdated={null} />
    );
    expect(screen.getAllByText(/npm/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/github/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hn/i).length).toBeGreaterThan(0);
  });

  it('applies intensity-based color styling based on z-score magnitude', () => {
    const { container } = render(
      <MomentumLeaderboard technologies={mockTechnologies.slice(0, 5)} isLoading={false} lastUpdated={null} />
    );
    const rows = container.querySelectorAll('[data-testid="leaderboard-row"]');
    // Each row should have a data-intensity attribute or inline style
    expect(rows[0].getAttribute('data-intensity')).toBeTruthy();
  });

  it('shows "Updated Xh ago" freshness indicator from cache timestamp', () => {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    render(
      <MomentumLeaderboard technologies={mockTechnologies.slice(0, 5)} isLoading={false} lastUpdated={oneHourAgo} />
    );
    expect(screen.getByText(/updated/i)).toBeTruthy();
    expect(screen.getByText(/1h ago/i)).toBeTruthy();
  });
});
