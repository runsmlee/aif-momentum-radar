import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LeaderboardRow } from '../src/components/LeaderboardRow';
import type { TechnologyMomentum } from '../src/lib/anomaly';

const mockTech: TechnologyMomentum = {
  name: 'React',
  compositeScore: 2.3456,
  zScores: { npm: 2.1, github: 1.8, hn: 0.5 },
  weeklyData: {
    npm: [100, 120, 130, 140, 150, 160, 170, 180],
    github: [10, 12, 14, 16, 18, 20, 22, 24],
    hn: [1, 2, 3, 4, 5, 6, 7, 8],
  },
};

describe('LeaderboardRow', () => {
  it('renders without crash given valid props', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );
    expect(container).toBeTruthy();
  });

  it('displays technology name', () => {
    render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );
    expect(screen.getByText('React')).toBeTruthy();
  });

  it('displays composite momentum score rounded to 2 decimal places', () => {
    render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );
    // 2.3456 rounded to 2 decimal places = 2.35
    expect(screen.getByText('2.35')).toBeTruthy();
  });

  it('shows upward arrow when z-score > 0, downward when < 0', () => {
    const { rerender } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );
    expect(screen.getByText(/▲/)).toBeTruthy();

    const negativeTech: TechnologyMomentum = {
      ...mockTech,
      compositeScore: -1.5,
    };
    rerender(
      <table>
        <tbody>
          <LeaderboardRow tech={negativeTech} rank={2} />
        </tbody>
      </table>
    );
    expect(screen.getByText(/▼/)).toBeTruthy();
  });

  it('renders sparkline with correct number of data points', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeTruthy();
    const points = polyline!.getAttribute('points');
    expect(points).toBeTruthy();
    const pointCount = points!.trim().split(' ').length;
    // Should have 8 points (npm weekly data length)
    expect(pointCount).toBe(8);
  });

  it('shows per-source z-score badges with correct values', () => {
    render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );
    expect(screen.getByText(/npm/i)).toBeTruthy();
    expect(screen.getByText(/github/i)).toBeTruthy();
    expect(screen.getByText(/hn/i)).toBeTruthy();
    // Check z-score values are displayed
    expect(screen.getByText(/2\.1/)).toBeTruthy();
    expect(screen.getByText(/1\.8/)).toBeTruthy();
    expect(screen.getByText(/0\.5/)).toBeTruthy();
  });
});
