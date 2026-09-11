import React, { useState, useEffect } from 'react';
import { BreachNewsItem } from '../types';
import { Newspaper, AlertCircle, Globe, ChevronRight } from 'lucide-react';

interface BreachNewsFeedProps {
  onCheckDomain: (domain: string) => void;
}

export const BreachNewsFeed: React.FC<BreachNewsFeedProps> = ({ onCheckDomain }) => {
  const [news, setNews] = useState<BreachNewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchLatestBreaches();
  }, []);

  const fetchLatestBreaches = async () => {
    try {
      const res = await fetch('https://api.xposedornot.com/v1/breaches');
      if (!res.ok) throw new Error('Could not load breach news.');
      const data = await res.json();
      const all = data?.exposedBreaches || [];

      const sorted = [...all].sort((a: any, b: any) => {
        const dateA = new Date(a.addedDate || '2000-01-01').getTime();
        const dateB = new Date(b.addedDate || '2000-01-01').getTime();
        return dateB - dateA;
      });

      const latest = sorted.slice(0, 12).map((d: any) => ({
        id: d.breachID || d.BreachID,
        name: d.breachID || d.BreachID,
        domain: d.domain || d.Domain || '',
        breachedDate: (d.breachedDate || d.BreachDate || '').slice(0, 10),
        addedDate: (d.addedDate || d.AddedDate || '').slice(0, 10),
        industry: d.industry || '',
        logo: d.logo || '',
        records: d.exposedRecords || d.ExposedRecords || null,
        dataClasses: Array.isArray(d.exposedData || d.ExposedData)
          ? (d.exposedData || d.ExposedData)
          : (d.exposedData || d.ExposedData || '').split(';').map((s: string) => s.trim()).filter(Boolean),
        description: d.exposureDescription || d.Description || '',
        verified: d.verified === true
      }));

      setNews(latest);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatRecords = (n: number | null) => {
    if (!n) return '—';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(0)}K`;
    return n.toLocaleString();
  };

  const timeAgo = (dateStr: string) => {
    const d = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} week${Math.floor(diffDays / 7) === 1 ? '' : 's'} ago`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} month${Math.floor(diffDays / 30) === 1 ? '' : 's'} ago`;
    return d.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="bg-paper-card border border-line rounded-xl p-6 space-y-3">
        <h3 className="font-sans font-medium text-ink text-base flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-accent" /> Latest Breach News
        </h3>
        <div className="text-xs text-ink-faint animate-pulse">Loading latest breach news...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-paper-card border border-line rounded-xl p-6 space-y-3">
        <h3 className="font-sans font-medium text-ink text-base flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-accent" /> Latest Breach News
        </h3>
        <div className="text-xs text-ink-faint flex items-center gap-1.5">
          <AlertCircle className="w-3.5 h-3.5" /> {error}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-paper-card border border-line rounded-xl p-6 shadow-xs space-y-4">
      <h3 className="font-sans font-medium text-ink text-base flex items-center gap-2">
        <Newspaper className="w-4 h-4 text-accent" /> Latest Breach News
      </h3>
      <p className="text-xs text-ink-faint">
        Recent major breaches reported globally. Click any entry to check that service in the Website checker.
      </p>

      <div className="divide-y divide-line">
        {news.map(item => (
          <button
            key={item.id}
            onClick={() => onCheckDomain(item.domain)}
            className="w-full flex items-center justify-between gap-3 py-3 text-left hover:bg-paper-alt/60 -mx-2 px-2 rounded transition-colors cursor-pointer group"
          >
            <div className="flex items-start gap-3 min-w-0">
              {item.logo ? (
                <img src={item.logo} alt="" className="w-8 h-8 rounded object-contain bg-paper-alt shrink-0 mt-0.5" />
              ) : (
                <div className="w-8 h-8 rounded bg-paper-alt border border-line flex items-center justify-center shrink-0 mt-0.5">
                  <Globe className="w-4 h-4 text-ink-faint" />
                </div>
              )}
              <div className="min-w-0">
                <div className="font-sans text-sm font-medium text-ink truncate">{item.name}</div>
                <div className="font-mono text-[11px] text-ink-faint mt-0.5 flex items-center gap-1.5 flex-wrap">
                  <span>{item.domain}</span>
                  {item.industry && <span className="hidden sm:inline">· {item.industry}</span>}
                  <span>· {formatRecords(item.records)} accounts</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="font-mono text-[11px] text-ink-faint hidden sm:inline">{timeAgo(item.addedDate)}</span>
              <ChevronRight className="w-4 h-4 text-ink-faint opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};
