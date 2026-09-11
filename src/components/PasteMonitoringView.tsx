import React, { useState } from 'react';
import { PasteItem } from '../types';
import { FileText, Search } from 'lucide-react';

interface PasteMonitoringViewProps {
  pastes: PasteItem[];
  onCheckPastes: (email: string) => Promise<void>;
  loading: boolean;
}

export const PasteMonitoringView: React.FC<PasteMonitoringViewProps> = ({
  pastes,
  onCheckPastes,
  loading
}) => {
  const [emailInput, setEmailInput] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (emailInput.trim()) {
      onCheckPastes(emailInput.trim());
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Dark web paste monitoring</h1>
        <p className="text-ink-soft max-w-2xl">
          Paste sites (like Pastebin, Ghostbin, and dark-web forums) are frequently used by hackers to publish raw email &amp; password dumps. This checks if your email appears in known public and dark-web paste archives.
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
            {loading ? 'Checking...' : 'Check pastes'}
          </button>
        </div>
        <p className="font-mono text-xs text-ink-faint">
          Searches public dark-web text dump repositories directly from your browser without saving any logs.
        </p>
      </form>

      {pastes.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-12 text-center text-ink-faint space-y-3">
          <FileText className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm">
            No dark web pastes recorded for checked emails, or enter an email above to query paste dumps.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="text-xs font-mono text-ink-faint uppercase tracking-wider">
            Found {pastes.length} paste dump{pastes.length === 1 ? '' : 's'}
          </div>
          {pastes.map(p => (
            <div key={p.id} className="bg-paper-card border border-line rounded-lg p-5 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent shrink-0" />
                    <h3 className="font-sans font-medium text-ink text-base">{p.title}</h3>
                  </div>
                  <div className="font-mono text-xs text-ink-faint mt-1">
                    <span>Source ID: {p.source}</span>
                    {p.pasteDate && <span> · Date: {p.pasteDate}</span>}
                    {p.records && <span> · {p.records.toLocaleString()} records</span>}
                  </div>
                </div>
                <span className="font-mono text-xs px-2.5 py-0.5 rounded bg-accent-tint text-accent-dark border border-accent/20">
                  paste dump
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                {p.dataClasses.map((dc, i) => (
                  <span key={i} className="font-mono text-[11px] px-2 py-0.5 rounded border border-line bg-paper-alt text-ink-soft">
                    {dc}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
