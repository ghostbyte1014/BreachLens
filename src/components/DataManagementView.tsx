import React from 'react';
import { CheckHistoryItem } from '../types';
import { Download, Upload, Trash2, RefreshCw } from 'lucide-react';

interface DataManagementViewProps {
  checkHistory: CheckHistoryItem[];
  onRecheckEmail: (email: string) => void;
  onExportJSON: () => void;
  onImportJSON: (file: File) => void;
  onClearAllData: () => void;
}

export const DataManagementView: React.FC<DataManagementViewProps> = ({
  checkHistory,
  onRecheckEmail,
  onExportJSON,
  onImportJSON,
  onClearAllData
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onImportJSON(file);
      e.target.value = '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Your data</h1>
        <p className="text-ink-soft max-w-2xl">
          Everything below lives exclusively in your browser's IndexedDB storage. Nothing syncs to any remote server. Export your data to transfer devices or clear it entirely anytime.
        </p>
      </div>

      <div className="bg-paper-card border border-line rounded-lg p-5 space-y-4 shadow-xs">
        <h3 className="font-sans font-medium text-ink text-base">Checked emails</h3>
        {checkHistory.length === 0 ? (
          <div className="text-sm text-ink-faint py-4 text-center">
            No emails checked yet.
          </div>
        ) : (
          <div className="divide-y divide-line">
            {checkHistory.map(h => (
              <div key={h.email} className="py-3 flex items-center justify-between gap-4">
                <div>
                  <div className="font-mono text-sm text-ink font-medium">{h.email}</div>
                  <div className="font-mono text-xs text-ink-faint mt-0.5">
                    last checked {new Date(h.lastCheckedAt).toLocaleString()} · {h.previousBreachIds.length} breach{h.previousBreachIds.length === 1 ? '' : 'es'}
                  </div>
                </div>
                <button
                  onClick={() => onRecheckEmail(h.email)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-paper-alt hover:bg-line border border-line rounded text-xs font-medium text-ink transition-colors cursor-pointer"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Re-check now</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-paper-card border border-line rounded-lg p-5 space-y-3 shadow-xs">
        <h3 className="font-sans font-medium text-ink text-base">Export &amp; Import</h3>
        <p className="text-xs text-ink-faint leading-relaxed">
          Export saves every breach record, resolved status, blast-radius tag, and check history as a single JSON file. Import merges a previously exported file back in.
        </p>
        <div className="flex flex-wrap gap-2 pt-2">
          <button
            onClick={onExportJSON}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-paper-alt hover:bg-line border border-line rounded text-xs font-medium text-ink transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export as JSON</span>
          </button>
          <label className="inline-flex items-center gap-1.5 px-4 py-2 bg-paper-alt hover:bg-line border border-line rounded text-xs font-medium text-ink transition-colors cursor-pointer">
            <Upload className="w-3.5 h-3.5" />
            <span>Import JSON</span>
            <input
              type="file"
              accept="application/json"
              onChange={handleFileChange}
              className="sr-only"
            />
          </label>
        </div>
      </div>

      <div className="bg-accent-tint/60 border border-accent/40 rounded-lg p-5 space-y-3">
        <h3 className="font-sans font-medium text-accent-dark text-base">Clear all local data</h3>
        <p className="text-xs text-accent-dark/80 leading-relaxed">
          Removes every breach record, tag, and check history from this browser. This action cannot be undone.
        </p>
        <button
          onClick={onClearAllData}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded text-xs font-medium transition-colors cursor-pointer"
        >
          <Trash2 className="w-3.5 h-3.5" />
          <span>Clear all data</span>
        </button>
      </div>
    </div>
  );
};
