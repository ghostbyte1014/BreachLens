import React, { useState, useEffect } from 'react';
import { ChecklistItem } from '../types';
import { DEFAULT_CHECKLIST } from '../lib/checklist';
import { getAllChecklist, putChecklistItems, putChecklistItem } from '../lib/db';
import { ClipboardCheck, CheckCircle2, Circle, Shield, KeyRound, Eye, DollarSign, Smartphone } from 'lucide-react';

export const SecurityChecklistView: React.FC<{ onChecklistChange: () => void }> = ({ onChecklistChange }) => {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadChecklist();
  }, []);

  const loadChecklist = async () => {
    let stored = await getAllChecklist();
    if (stored.length === 0) {
      const defaults: ChecklistItem[] = DEFAULT_CHECKLIST.map(c => ({ ...c, completed: false }));
      await putChecklistItems(defaults);
      stored = defaults;
    }
    setItems(stored);
    setLoading(false);
  };

  const toggleItem = async (id: string) => {
    const item = items.find(i => i.id === id);
    if (!item) return;
    const updated = { ...item, completed: !item.completed };
    await putChecklistItem(updated);
    setItems(prev => prev.map(i => i.id === id ? updated : i));
    onChecklistChange();
  };

  const completedCount = items.filter(i => i.completed).length;
  const totalCount = items.length;
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const categoryIcon = (cat: string) => {
    switch (cat) {
      case 'account': return <Shield className="w-4 h-4 text-accent" />;
      case 'password': return <KeyRound className="w-4 h-4 text-high" />;
      case 'privacy': return <Eye className="w-4 h-4 text-medium" />;
      case 'financial': return <DollarSign className="w-4 h-4 text-resolve" />;
      case 'device': return <Smartphone className="w-4 h-4 text-ink-soft" />;
      default: return <Shield className="w-4 h-4 text-ink-faint" />;
    }
  };

  const categoryLabel = (cat: string) => {
    switch (cat) {
      case 'account': return 'Account Security';
      case 'password': return 'Password Hygiene';
      case 'privacy': return 'Privacy Protection';
      case 'financial': return 'Financial Safety';
      case 'device': return 'Device Hardening';
      default: return cat;
    }
  };

  const categories = ['account', 'password', 'privacy', 'financial', 'device'];

  if (loading) {
    return <div className="text-sm text-ink-faint animate-pulse p-6">Loading security checklist...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Security Checklist</h1>
        <p className="text-ink-soft max-w-2xl">
          A step-by-step guide to hardening your personal security posture. Complete each step and track your progress — all saved privately in your browser.
        </p>
      </div>

      {/* Progress Bar */}
      <div className="bg-paper-card border border-line rounded-lg p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="w-5 h-5 text-resolve" />
            <span className="font-sans font-medium text-ink text-base">
              {completedCount} of {totalCount} completed
            </span>
          </div>
          <span className="font-mono text-sm font-semibold" style={{
            color: progressPct >= 80 ? '#2E6E63' : progressPct >= 50 ? '#6B6338' : '#93531A'
          }}>
            {progressPct}%
          </span>
        </div>
        <div className="w-full h-2.5 bg-paper-alt rounded-full overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${progressPct}%`,
              backgroundColor: progressPct >= 80 ? '#2E6E63' : progressPct >= 50 ? '#6B6338' : '#93531A'
            }}
          />
        </div>
      </div>

      {/* Checklist by Category */}
      <div className="space-y-6">
        {categories.map(cat => {
          const catItems = items.filter(i => i.category === cat);
          if (catItems.length === 0) return null;
          const catDone = catItems.filter(i => i.completed).length;

          return (
            <div key={cat} className="space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {categoryIcon(cat)}
                  <h3 className="font-sans font-medium text-ink text-sm">{categoryLabel(cat)}</h3>
                </div>
                <span className="font-mono text-xs text-ink-faint">{catDone}/{catItems.length}</span>
              </div>

              <div className="space-y-2">
                {catItems.map(item => (
                  <button
                    key={item.id}
                    onClick={() => toggleItem(item.id)}
                    className={`w-full text-left bg-paper-card border rounded-lg p-4 transition-all cursor-pointer group ${
                      item.completed
                        ? 'border-resolve/30 bg-resolve-done'
                        : 'border-line hover:border-ink/20'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="mt-0.5 shrink-0">
                        {item.completed ? (
                          <CheckCircle2 className="w-5 h-5 text-resolve" />
                        ) : (
                          <Circle className="w-5 h-5 text-line group-hover:text-ink-faint transition-colors" />
                        )}
                      </div>
                      <div>
                        <div className={`font-sans text-sm font-medium ${item.completed ? 'text-resolve line-through' : 'text-ink'}`}>
                          {item.label}
                        </div>
                        <div className="text-xs text-ink-faint mt-1 leading-relaxed">
                          {item.description}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
