import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Sparkline } from '../src/components/Sparkline';

describe('Sparkline', () => {
  it('renders without crash', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    expect(container).toBeTruthy();
  });

  it('renders an SVG element', () => {
    const { container } = render(<Sparkline data={[10, 20, 30]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
  });

  it('generates correct number of path points from input data array', () => {
    const data = [5, 10, 15, 20, 25];
    const { container } = render(<Sparkline data={data} />);
    const polyline = container.querySelector('polyline');
    expect(polyline).toBeTruthy();
    const points = polyline!.getAttribute('points');
    expect(points).toBeTruthy();
    // Should have same number of coordinate pairs as data points
    const pointCount = points!.trim().split(' ').length;
    expect(pointCount).toBe(data.length);
  });

  it('handles empty data array gracefully (renders empty SVG)', () => {
    const { container } = render(<Sparkline data={[]} />);
    const svg = container.querySelector('svg');
    expect(svg).toBeTruthy();
    const polyline = container.querySelector('polyline');
    // Either no polyline or polyline with no points
    if (polyline) {
      const points = polyline.getAttribute('points');
      expect(!points || points.trim() === '').toBe(true);
    }
  });
});
