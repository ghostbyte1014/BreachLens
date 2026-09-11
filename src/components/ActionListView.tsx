import React, { useState } from 'react';
import { ActionItem, SeverityLevel } from '../types';
import { ListTodo, CheckSquare } from 'lucide-react';

interface ActionListViewProps {
  actionItems: ActionItem[];
  onResolveActions: (breachIds: string[], resolved: boolean) => Promise<void>;
}

export const ActionListView: React.FC<ActionListViewProps> = ({
  actionItems,
  onResolveActions
}) => {
  const [filter, setFilter] = useState<SeverityLevel | 'all'>('all');

  const counts: Record<SeverityLevel | 'all', number> = {
    all: actionItems.length,
    critical: actionItems.filter(i => i.severity === 'critical').length,
    high: actionItems.filter(i => i.severity === 'high').length,
    medium: actionItems.filter(i => i.severity === 'medium').length,
    low: actionItems.filter(i => i.severity === 'low').length,
  };

  const filteredItems = filter === 'all'
    ? actionItems
    : actionItems.filter(i => i.severity === filter);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Your action list</h1>
        <p className="text-ink-soft max-w-2xl">
          Generated from every breach you've checked, ranked by how sensitive the exposed data actually is — not just by how many breaches turned up.
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(sev => (
          <button
            key={sev}
            onClick={() => setFilter(sev)}
            className={`font-mono text-xs px-3 py-1.5 rounded-full border transition-colors cursor-pointer ${
              filter === sev
                ? 'bg-paper-alt border-ink text-ink font-medium'
                : 'bg-paper-card border-line text-ink-faint hover:text-ink'
            }`}
          >
            {sev} <span className="opacity-70">({counts[sev]})</span>
          </button>
        ))}
      </div>

      {filteredItems.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-12 text-center text-ink-faint space-y-3">
          <ListTodo className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm">
            {actionItems.length === 0
              ? 'No open action items. Check an email on the Timeline tab to get started.'
              : 'Nothing at this severity level right now.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map(item => (
            <div key={item.id} className="bg-paper-card border border-line rounded-lg p-5 space-y-3 shadow-xs">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      item.severity === 'critical' ? 'bg-accent' :
                      item.severity === 'high' ? 'bg-high' :
                      item.severity === 'medium' ? 'bg-medium' : 'bg-ink-faint'
                    }`} />
                    <h3 className="font-sans font-medium text-ink text-base">{item.title}</h3>
                  </div>
                  <div className="font-mono text-xs text-ink-faint pl-4">
                    {item.detail}
                  </div>
                </div>

                <span className={`font-mono text-[10px] font-medium uppercase px-2 py-0.5 rounded shrink-0 ${
                  item.severity === 'critical' ? 'bg-accent-tint text-accent-dark' :
                  item.severity === 'high' ? 'bg-high-tint text-high' :
                  item.severity === 'medium' ? 'bg-medium-tint text-medium' : 'bg-paper-alt text-ink-faint'
                }`}>
                  {item.severity}
                </span>
              </div>

              <div className="pt-2 border-t border-line/60 flex items-center justify-between">
                <button
                  onClick={() => onResolveActions(item.breachIds, true)}
                  className="inline-flex items-center gap-1.5 text-xs text-ink-soft hover:text-resolve cursor-pointer"
                >
                  <CheckSquare className="w-4 h-4 text-resolve" />
                  <span>Mark resolved</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
