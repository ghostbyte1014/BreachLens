import React from 'react';
import { ScoreFactor } from '../lib/scoring';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface SecurityScoreGaugeProps {
  score: number;
  grade: string;
  color: string;
  factors: ScoreFactor[];
}

export const SecurityScoreGauge: React.FC<SecurityScoreGaugeProps> = ({ score, grade, color, factors }) => {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const progress = (score / 100) * circumference;
  const dashOffset = circumference - progress;

  return (
    <div className="bg-paper-card border border-line rounded-xl p-6 sm:p-8 shadow-xs">
      <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-10">
        {/* Circular Gauge */}
        <div className="relative shrink-0">
          <svg width="180" height="180" viewBox="0 0 180 180" className="drop-shadow-sm">
            {/* Background track */}
            <circle
              cx="90" cy="90" r={radius}
              fill="none"
              stroke="#D8DACF"
              strokeWidth="10"
              strokeLinecap="round"
            />
            {/* Progress arc */}
            <circle
              cx="90" cy="90" r={radius}
              fill="none"
              stroke={color}
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 90 90)"
              className="transition-all duration-1000 ease-out"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-serif text-4xl font-semibold" style={{ color }}>{score}</span>
            <span className="font-mono text-xs text-ink-faint">/ 100</span>
            <span className="font-sans text-sm font-medium mt-0.5" style={{ color }}>{grade}</span>
          </div>
        </div>

        {/* Score Factors */}
        <div className="flex-1 space-y-3 w-full">
          <h3 className="font-sans font-medium text-ink text-base">Your Security Score</h3>
          <p className="text-xs text-ink-faint leading-relaxed">
            Calculated from your breach exposure, unresolved actions, password reuse, dark web presence, and completed security steps.
          </p>

          {factors.length > 0 ? (
            <div className="space-y-1.5 pt-2">
              {factors.map((f, i) => (
                <div key={i} className="flex items-center justify-between gap-2 text-xs py-1">
                  <div className="flex items-center gap-2">
                    {f.type === 'negative' ? (
                      <TrendingDown className="w-3.5 h-3.5 text-accent shrink-0" />
                    ) : (
                      <TrendingUp className="w-3.5 h-3.5 text-resolve shrink-0" />
                    )}
                    <span className="text-ink-soft">{f.label}</span>
                  </div>
                  <span className={`font-mono text-xs font-medium ${f.type === 'negative' ? 'text-accent' : 'text-resolve'}`}>
                    {f.impact > 0 ? '+' : ''}{f.impact}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-xs text-ink-faint pt-2">
              Check your email on the Email Check tab to start building your security profile.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
