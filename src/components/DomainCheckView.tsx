import React, { useState } from 'react';
import { DomainBreachInfo } from '../types';
import { fetchDomainBreaches } from '../lib/api';
import { Globe, Search, AlertTriangle, CheckCircle2 } from 'lucide-react';

export const DomainCheckView: React.FC = () => {
  const [domainInput, setDomainInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<DomainBreachInfo[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchedDomain, setSearchedDomain] = useState('');

  const handleSearch = async (targetDomain: string) => {
    if (!targetDomain.trim()) return;
    setLoading(true);
    setError(null);
    setResults(null);
    setSearchedDomain(targetDomain.trim());

    try {
      const data = await fetchDomainBreaches(targetDomain.trim());
      setResults(data);
    } catch (err: any) {
      setError(err.message || 'Could not complete service lookup.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(domainInput);
  };

  const popularDomains = ['adobe.com', 'canva.com', 'dropbox.com', 'linkedin.com', 'zynga.com', 'myspace.com'];

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Check a website or service</h1>
        <p className="text-ink-soft max-w-2xl">
          Wondering if a website or app you use was hacked in the past? Enter the domain name (e.g. <span className="font-mono text-ink">adobe.com</span>) to see if it suffered a major data breach, when it happened, and what data was exposed.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
          <input
            type="text"
            value={domainInput}
            onChange={(e) => setDomainInput(e.target.value)}
            placeholder="e.g. adobe.com, canva.com"
            required
            className="flex-1 px-4 py-3 bg-paper-card border border-line rounded-lg font-sans text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Searching...' : 'Check Service'}
          </button>
        </div>

        {/* Quick Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-2 pt-1">
          <span className="text-xs text-ink-faint">Try popular services:</span>
          {popularDomains.map(d => (
            <button
              key={d}
              type="button"
              onClick={() => {
                setDomainInput(d);
                handleSearch(d);
              }}
              className="font-mono text-xs px-2.5 py-1 rounded-full border border-line bg-paper-card hover:bg-paper-alt hover:border-ink/40 text-ink-soft transition-colors cursor-pointer"
            >
              {d}
            </button>
          ))}
        </div>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-accent-tint text-accent-dark border-l-4 border-l-accent border-line text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {results !== null && (
        <div className="space-y-4 pt-2">
          {results.length === 0 ? (
            <div className="bg-resolve-tint/60 border border-resolve/30 rounded-lg p-6 text-center space-y-2">
              <CheckCircle2 className="w-8 h-8 text-resolve mx-auto" />
              <h3 className="font-serif text-lg font-medium text-resolve">
                No major breaches found for <span className="font-mono">{searchedDomain}</span>
              </h3>
              <p className="text-xs text-ink-soft max-w-md mx-auto">
                That's great news! This service does not have a recorded major incident in public security databases.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-ink-faint uppercase">
                  Found {results.length} recorded incident{results.length === 1 ? '' : 's'} for {searchedDomain}
                </span>
              </div>

              {results.map((b, idx) => (
                <div key={idx} className="bg-paper-card border border-line rounded-lg p-6 space-y-4 shadow-xs">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Globe className="w-5 h-5 text-accent" />
                        <h3 className="font-serif text-xl font-medium text-ink">{b.name}</h3>
                      </div>
                      <div className="font-mono text-xs text-ink-faint">
                        <span>Domain: {b.domain}</span>
                        <span> · Incident Date: {b.breachDate}</span>
                        {b.records && <span> · {b.records.toLocaleString()} accounts affected</span>}
                      </div>
                    </div>

                    <span className="font-mono text-xs font-medium px-2.5 py-1 rounded bg-accent-tint text-accent-dark border border-accent/20">
                      Service Breach
                    </span>
                  </div>

                  {b.description && (
                    <p
                      className="text-sm text-ink-soft leading-relaxed border-l-2 border-line pl-3.5 py-0.5"
                      dangerouslySetInnerHTML={{ __html: b.description }}
                    />
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-line/60">
                    <span className="font-mono text-xs text-ink-faint uppercase">Exposed Data:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {b.dataClasses.map((dc, i) => (
                        <span key={i} className="font-mono text-xs px-2.5 py-1 rounded border border-line bg-paper-alt text-ink">
                          {dc}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
