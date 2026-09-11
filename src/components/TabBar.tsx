import React from 'react';
import { Clock, Globe2, ListTodo, FileText, KeyRound, Globe, Zap, Database, ClipboardCheck, Fingerprint, Link2 } from 'lucide-react';

export type TabId = 'dashboard' | 'timeline' | 'domain' | 'actions' | 'pastes' | 'password' | 'ip' | 'blast' | 'checklist' | 'fingerprint' | 'linkcheck' | 'data';

interface TabBarProps {
  activeTab: TabId;
  onTabChange: (tab: TabId) => void;
  unresolvedActionCount: number;
  pasteCount: number;
}

export const TabBar: React.FC<TabBarProps> = ({
  activeTab,
  onTabChange,
  unresolvedActionCount,
  pasteCount
}) => {
  const tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] = [
    { id: 'timeline', label: 'Email', icon: <Clock className="w-4 h-4" /> },
    { id: 'domain', label: 'Website', icon: <Globe2 className="w-4 h-4" /> },
    { id: 'actions', label: 'Actions', icon: <ListTodo className="w-4 h-4" />, badge: unresolvedActionCount },
    { id: 'pastes', label: 'Pastes', icon: <FileText className="w-4 h-4" />, badge: pasteCount },
    { id: 'password', label: 'Passwords', icon: <KeyRound className="w-4 h-4" /> },
    { id: 'ip', label: 'IP', icon: <Globe className="w-4 h-4" /> },
    { id: 'blast', label: 'Reuse', icon: <Zap className="w-4 h-4" /> },
    { id: 'checklist', label: 'Checklist', icon: <ClipboardCheck className="w-4 h-4" /> },
    { id: 'fingerprint', label: 'Fingerprint', icon: <Fingerprint className="w-4 h-4" /> },
    { id: 'linkcheck', label: 'Link Check', icon: <Link2 className="w-4 h-4" /> },
    { id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> },
  ];

  return (
    <div className="sticky top-20 z-40 bg-paper border-b border-line overflow-x-auto no-scrollbar py-1">
      <div className="max-w-6xl mx-auto px-4 sm:px-8 flex gap-0.5">
        {tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-3.5 border-b-2 font-sans text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
                isActive
                  ? 'border-accent text-ink font-semibold'
                  : 'border-transparent text-ink-faint hover:text-ink hover:border-line'
              }`}
            >
              <span className={isActive ? 'text-accent' : 'text-ink-faint'}>{t.icon}</span>
              <span>{t.label}</span>
              {Boolean(t.badge && t.badge > 0) && (
                <span className={`font-mono text-[10px] px-1.5 py-0.5 rounded-full ${
                  isActive ? 'bg-accent text-white font-medium' : 'bg-paper-alt text-ink-soft border border-line'
                }`}>
                  {t.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
