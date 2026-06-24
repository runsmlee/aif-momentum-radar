import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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
    // Find the sparkline SVG specifically (has data-testid="sparkline")
    const sparklineSvg = container.querySelector('[data-testid="sparkline"]');
    expect(sparklineSvg).toBeTruthy();
    const polyline = sparklineSvg!.querySelector('polyline');
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
    expect(screen.getAllByText(/github/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/hn/i).length).toBeGreaterThan(0);
    // Check z-score values are displayed
    expect(screen.getByText(/2\.1/)).toBeTruthy();
    expect(screen.getByText(/1\.8/)).toBeTruthy();
    expect(screen.getByText(/0\.5/)).toBeTruthy();
  });

  it('expands detail panel on click showing per-source sparklines', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );

    // No expanded detail initially
    expect(container.querySelector('[data-testid="expanded-detail"]')).toBeNull();

    // Click the row to expand
    const row = container.querySelector('[data-testid="leaderboard-row"]')!;
    fireEvent.click(row);

    // Expanded detail should now be visible
    expect(container.querySelector('[data-testid="expanded-detail"]')).toBeTruthy();
  });

  it('collapses detail panel on second click', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );

    const row = container.querySelector('[data-testid="leaderboard-row"]')!;

    // Expand
    fireEvent.click(row);
    expect(container.querySelector('[data-testid="expanded-detail"]')).toBeTruthy();

    // Collapse
    fireEvent.click(row);
    expect(container.querySelector('[data-testid="expanded-detail"]')).toBeNull();
  });

  it('supports keyboard navigation (Enter to expand)', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );

    const row = container.querySelector('[data-testid="leaderboard-row"]')!;

    // Enter key should expand
    fireEvent.keyDown(row, { key: 'Enter' });
    expect(container.querySelector('[data-testid="expanded-detail"]')).toBeTruthy();
  });

  it('has aria-expanded attribute reflecting state', () => {
    const { container } = render(
      <table>
        <tbody>
          <LeaderboardRow tech={mockTech} rank={1} />
        </tbody>
      </table>
    );

    const row = container.querySelector('[data-testid="leaderboard-row"]')!;
    expect(row.getAttribute('aria-expanded')).toBe('false');

    fireEvent.click(row);
    expect(row.getAttribute('aria-expanded')).toBe('true');
  });
});
