// ============================================================================
// Sparkline — Compact inline SVG chart for showing weekly data trends
// ============================================================================

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
}

export function Sparkline({
  data,
  width = 80,
  height = 24,
  color = '#e27762',
}: SparklineProps): JSX.Element {
  // Unique ID for gradient to avoid collisions
  const gradientId = `sparkline-grad-${Math.round(data.reduce((a, b) => a + b, 0) * 100)}`;

  if (data.length === 0) {
    return (
      <svg
        width={width}
        height={height}
        role="img"
        aria-label="No data available"
        data-testid="sparkline"
      />
    );
  }

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;

  const points = data.map((val, i) => {
    const x = (i / (data.length - 1)) * (width - padding * 2) + padding;
    const y = height - padding - ((val - min) / range) * (height - padding * 2);
    return { x, y };
  });

  const pointStr = points.map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');
  const areaPath = points
    .map((p, i) => (i === 0 ? `M ${p.x.toFixed(1)},${height}` : '') + ` L ${p.x.toFixed(1)},${p.y.toFixed(1)}`)
    .join('') + ` L ${points[points.length - 1].x.toFixed(1)},${height} Z`;

  const lastPoint = points[points.length - 1];

  return (
    <svg
      width={width}
      height={height}
      role="img"
      aria-label="Weekly trend sparkline"
      data-testid="sparkline"
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Filled area */}
      <path d={areaPath} fill={`url(#${gradientId})`} />
      {/* Line */}
      <polyline
        points={pointStr}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      {/* End point dot */}
      <circle
        cx={lastPoint.x}
        cy={lastPoint.y}
        r="2"
        fill={color}
      />
    </svg>
  );
}
