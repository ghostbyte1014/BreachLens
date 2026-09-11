import React from 'react';
import { BreachItem } from '../types';
import { BarChart3 } from 'lucide-react';

interface BreachTrendsChartProps {
  breaches: BreachItem[];
}

export const BreachTrendsChart: React.FC<BreachTrendsChartProps> = ({ breaches }) => {
  if (breaches.length === 0) return null;

  // Group breaches by year
  const yearCounts: Record<number, { total: number; critical: number; resolved: number }> = {};
  breaches.forEach(b => {
    const yr = b.breachYear || 0;
    if (yr === 0) return;
    if (!yearCounts[yr]) yearCounts[yr] = { total: 0, critical: 0, resolved: 0 };
    yearCounts[yr].total++;
    if (b.severity === 'critical') yearCounts[yr].critical++;
    if (b.resolved) yearCounts[yr].resolved++;
  });

  const years = Object.keys(yearCounts).map(Number).sort((a, b) => a - b);
  if (years.length === 0) return null;

  const maxCount = Math.max(...years.map(y => yearCounts[y].total), 1);
  const chartHeight = 120;
  const barWidth = Math.min(36, Math.max(16, 500 / years.length));
  const gap = 6;
  const chartWidth = years.length * (barWidth + gap) - gap;

  return (
    <div className="bg-paper-card border border-line rounded-xl p-6 shadow-xs space-y-4">
      <h3 className="font-sans font-medium text-ink text-base flex items-center gap-2">
        <BarChart3 className="w-4 h-4 text-accent" /> Your Breach History Over Time
      </h3>
      <p className="text-xs text-ink-faint">
        A timeline of your personal data breaches by year. Taller bars mean more incidents that year.
      </p>

      <div className="overflow-x-auto pb-2">
        <svg
          width={Math.max(chartWidth + 20, 280)}
          height={chartHeight + 40}
          viewBox={`0 0 ${Math.max(chartWidth + 20, 280)} ${chartHeight + 40}`}
          className="mx-auto"
        >
          {/* Bars */}
          {years.map((yr, i) => {
            const data = yearCounts[yr];
            const barH = (data.total / maxCount) * chartHeight;
            const criticalH = (data.critical / maxCount) * chartHeight;
            const x = 10 + i * (barWidth + gap);
            const y = chartHeight - barH;

            return (
              <g key={yr}>
                {/* Total bar */}
                <rect
                  x={x} y={y} width={barWidth} height={barH}
                  rx={3} ry={3}
                  fill="#D8DACF"
                  className="transition-all duration-500"
                />
                {/* Critical portion */}
                {criticalH > 0 && (
                  <rect
                    x={x} y={chartHeight - criticalH} width={barWidth} height={criticalH}
                    rx={3} ry={3}
                    fill="#B3271D"
                    opacity={0.7}
                    className="transition-all duration-500"
                  />
                )}
                {/* Count label */}
                <text
                  x={x + barWidth / 2} y={y - 5}
                  textAnchor="middle"
                  fill="#7C8898"
                  fontSize="10"
                  fontFamily="'IBM Plex Mono', monospace"
                >
                  {data.total}
                </text>
                {/* Year label */}
                <text
                  x={x + barWidth / 2} y={chartHeight + 16}
                  textAnchor="middle"
                  fill="#7C8898"
                  fontSize="10"
                  fontFamily="'IBM Plex Mono', monospace"
                >
                  {yr}
                </text>
              </g>
            );
          })}
        </svg>
      </div>

      <div className="flex items-center gap-4 text-[11px] font-mono text-ink-faint pt-1">
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-line inline-block" /> All breaches
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-sm bg-accent/70 inline-block" /> Critical severity
        </span>
      </div>
    </div>
  );
};
