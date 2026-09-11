import React, { useState } from 'react';
import { BreachItem } from '../types';
import { Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

interface TimelineViewProps {
  breaches: BreachItem[];
  onCheckEmail: (email: string) => Promise<void>;
  onToggleResolve: (id: string, resolved: boolean) => Promise<void>;
  loading: boolean;
  statusMessage: { type: 'loading' | 'error' | 'ok'; text: string } | null;
}

export const TimelineView: React.FC<TimelineViewProps> = ({
  breaches,
  onCheckEmail,
  onToggleResolve,
  loading,
  statusMessage
}) => {
  const [emailInput, setEmailInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      onCheckEmail(emailInput.trim());
    }
  };

  // Group by breachYear descending
  const sortedBreaches = [...breaches].sort((a, b) => (b.breachYear || 0) - (a.breachYear || 0));

  const yearsGrouped = sortedBreaches.reduce((acc, b) => {
    const yr = b.breachYear ? b.breachYear.toString() : 'Undated';
    if (!acc[yr]) acc[yr] = [];
    acc[yr].push(b);
    return acc;
  }, {} as Record<string, BreachItem[]>);

  const yearKeys = Object.keys(yearsGrouped).sort((a, b) => {
    if (a === 'Undated') return 1;
    if (b === 'Undated') return -1;
    return parseInt(b, 10) - parseInt(a, 10);
  });

  const criticalCount = breaches.filter(b => b.severity === 'critical').length;
  const unresolvedCount = breaches.filter(b => !b.resolved).length;
  const verifiedCount = breaches.filter(b => b.verified).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Check your breach history</h1>
        <p className="text-ink-soft max-w-2xl">
          Enter an email address to query public breach databases. The search runs securely from your device — no accounts are created, and your data stays private to your browser.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <input
            type="email"
            value={emailInput}
            onChange={(e) => setEmailInput(e.target.value)}
            placeholder="you@example.com"
            required
            className="flex-1 px-3.5 py-2.5 bg-paper-card border border-line rounded font-sans text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Checking...' : 'Check exposure'}
          </button>
        </div>
        <p className="font-mono text-xs text-ink-faint">
          Checks public security databases securely without saving your email on any external server.
        </p>
      </form>

      {statusMessage && (
        <div className={`p-4 rounded border text-sm font-sans flex items-start gap-3 ${
          statusMessage.type === 'loading'
            ? 'bg-paper-alt text-ink-soft border-line'
            : statusMessage.type === 'error'
            ? 'bg-accent-tint text-accent-dark border-l-4 border-l-accent border-line'
            : 'bg-resolve-tint text-resolve border-l-4 border-l-resolve border-line'
        }`}>
          {statusMessage.type === 'loading' && <Search className="w-4 h-4 animate-spin text-ink-soft shrink-0 mt-0.5" />}
          {statusMessage.type === 'error' && <AlertTriangle className="w-4 h-4 text-accent shrink-0 mt-0.5" />}
          {statusMessage.type === 'ok' && <CheckCircle2 className="w-4 h-4 text-resolve shrink-0 mt-0.5" />}
          <div>{statusMessage.text}</div>
        </div>
      )}

      {breaches.length > 0 && (
        <>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-px bg-line border border-line rounded overflow-hidden">
            <div className="bg-paper-card p-4">
              <div className="font-serif text-2xl text-ink">{breaches.length}</div>
              <div className="text-xs text-ink-faint">total breaches</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-serif text-2xl text-accent">{criticalCount}</div>
              <div className="text-xs text-ink-faint">critical severity</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-serif text-2xl text-high">{unresolvedCount}</div>
              <div className="text-xs text-ink-faint">unresolved</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-serif text-2xl text-resolve">{verifiedCount}</div>
              <div className="text-xs text-ink-faint">verified breaches</div>
            </div>
          </div>

          <div className="space-y-8">
            {yearKeys.map(year => (
              <div key={year} className="space-y-3">
                <div className="font-mono text-xs font-medium text-ink-faint pt-4 border-t border-line">
                  {year}
                </div>
                <div className="space-y-3">
                  {yearsGrouped[year].map(b => (
                    <div key={b.id} className="bg-paper-card border border-line rounded-lg p-5 space-y-3 shadow-xs">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                              b.severity === 'critical' ? 'bg-accent' :
                              b.severity === 'high' ? 'bg-high' :
                              b.severity === 'medium' ? 'bg-medium' : 'bg-ink-faint'
                            }`} />
                            <h3 className="font-sans font-medium text-ink text-base">{b.source}</h3>
                          </div>
                          <div className="font-mono text-xs text-ink-faint mt-1">
                            {b.domain && <span>{b.domain}</span>}
                            {b.records && <span> · {b.records.toLocaleString()} records exposed</span>}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 shrink-0">
                          {b.isNew && (
                            <span className="font-mono text-[10px] uppercase font-semibold px-2 py-0.5 rounded bg-ink text-paper">
                              new
                            </span>
                          )}
                          {b.verified && (
                            <span className="font-mono text-[10px] px-2 py-0.5 rounded border border-line text-ink-faint bg-paper-alt">
                              verified
                            </span>
                          )}
                          <span className={`font-mono text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                            b.severity === 'critical' ? 'bg-accent-tint text-accent-dark' :
                            b.severity === 'high' ? 'bg-high-tint text-high' :
                            b.severity === 'medium' ? 'bg-medium-tint text-medium' : 'bg-paper-alt text-ink-faint'
                          }`}>
                            {b.severity}
                          </span>
                        </div>
                      </div>

                      {b.description && (
                        <p className="text-xs sm:text-sm text-ink-soft leading-relaxed border-l-2 border-line pl-3 py-0.5">
                          {b.description}
                        </p>
                      )}

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {b.dataClasses.map((dc, i) => (
                          <span key={i} className="font-mono text-[11px] px-2 py-0.5 rounded border border-line bg-paper-alt text-ink-soft">
                            {dc}
                          </span>
                        ))}
                      </div>

                      <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                        <label className="flex items-center gap-2 text-xs text-ink-soft cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={b.resolved}
                            onChange={(e) => onToggleResolve(b.id, e.target.checked)}
                            className="rounded border-line text-resolve focus:ring-resolve w-4 h-4 accent-resolve"
                          />
                          <span>Marked as resolved</span>
                        </label>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
};
