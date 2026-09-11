import React, { useState } from 'react';
import { BreachItem, PasswordTag } from '../types';
import { Zap, Tag, Save } from 'lucide-react';

interface BlastRadiusViewProps {
  breaches: BreachItem[];
  tags: PasswordTag[];
  onSaveTag: (breachId: string, label: string) => Promise<void>;
}

export const BlastRadiusView: React.FC<BlastRadiusViewProps> = ({
  breaches,
  tags,
  onSaveTag
}) => {
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({});

  const passwordBreaches = breaches.filter(b =>
    b.severityReasons.some(r => /password/.test(r.label))
  );

  const tagByBreach = new Map(tags.map(t => [t.breachId, t.tagLabel]));
  const uniqueLabels = Array.from(new Set(tags.map(t => t.tagLabel))).sort();

  const groups = new Map<string, BreachItem[]>();
  passwordBreaches.forEach(b => {
    const label = tagByBreach.get(b.id);
    if (label) {
      if (!groups.has(label)) groups.set(label, []);
      groups.get(label)!.push(b);
    }
  });

  const handleInputChange = (breachId: string, value: string) => {
    setTagInputs(prev => ({ ...prev, [breachId]: value }));
  };

  const handleSave = (breachId: string) => {
    const value = tagInputs[breachId] !== undefined
      ? tagInputs[breachId]
      : (tagByBreach.get(breachId) || '');
    onSaveTag(breachId, value.trim());
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Breach blast radius</h1>
        <p className="text-ink-soft max-w-2xl">
          If a password from one breach was reused elsewhere, tag it. BreachLens groups tagged breaches so you can see how far one compromised password actually reaches — no actual password strings are ever stored, only your custom labels.
        </p>
      </div>

      {passwordBreaches.length === 0 ? (
        <div className="border border-dashed border-line rounded-lg p-12 text-center text-ink-faint space-y-3">
          <Zap className="w-8 h-8 mx-auto opacity-50" />
          <p className="text-sm">
            No password exposures found yet. Check an email on the Timeline tab first.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {groups.size > 0 && (
            <div className="space-y-3">
              <h2 className="font-sans font-medium text-ink text-lg">Grouped by reuse tag</h2>
              <div className="space-y-3">
                {Array.from(groups.entries()).map(([label, list]) => (
                  <div key={label} className="bg-paper-card border border-line rounded-lg p-5 space-y-3 shadow-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Tag className="w-4 h-4 text-accent" />
                        <span className="font-sans font-medium text-ink text-base">{label}</span>
                      </div>
                      <span className="font-mono text-xs text-accent-dark bg-accent-tint px-2.5 py-0.5 rounded-full font-medium">
                        touches {list.length} account{list.length === 1 ? '' : 's'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {list.map(b => (
                        <span key={b.id} className="font-mono text-xs px-2.5 py-1 rounded border border-line bg-paper-alt text-ink">
                          {b.source}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-3">
            <h2 className="font-sans font-medium text-ink text-lg">All password exposures</h2>
            <datalist id="tagOptionsList">
              {uniqueLabels.map(l => (
                <option key={l} value={l} />
              ))}
            </datalist>

            <div className="space-y-3">
              {passwordBreaches.map(b => {
                const currentTag = tagInputs[b.id] !== undefined
                  ? tagInputs[b.id]
                  : (tagByBreach.get(b.id) || '');

                return (
                  <div key={b.id} className="bg-paper-card border border-line rounded-lg p-5 space-y-3 shadow-xs">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                            b.severity === 'critical' ? 'bg-accent' :
                            b.severity === 'high' ? 'bg-high' : 'bg-medium'
                          }`} />
                          <h3 className="font-sans font-medium text-ink text-base">{b.source}</h3>
                        </div>
                        <div className="font-mono text-xs text-ink-faint mt-1">
                          password risk: <span className="text-ink">{b.passwordRisk}</span>
                        </div>
                      </div>

                      <span className={`font-mono text-[10px] font-medium uppercase px-2 py-0.5 rounded ${
                        b.severity === 'critical' ? 'bg-accent-tint text-accent-dark' : 'bg-high-tint text-high'
                      }`}>
                        {b.severity}
                      </span>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-line/60">
                      <input
                        type="text"
                        list="tagOptionsList"
                        value={currentTag}
                        onChange={(e) => handleInputChange(b.id, e.target.value)}
                        placeholder="Label this password (e.g. main email pass)"
                        className="flex-1 px-3 py-1.5 bg-white border border-line rounded text-xs font-sans text-ink focus:outline-none focus:border-accent"
                      />
                      <button
                        onClick={() => handleSave(b.id)}
                        className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-paper-alt hover:bg-line border border-line rounded text-xs font-medium text-ink transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Save tag</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
