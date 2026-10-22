import React from 'react';
import { Clock, Globe2, ListTodo, FileText, KeyRound, Globe, Zap, Database, ClipboardCheck, Fingerprint, Link2, Radar } from 'lucide-react';

export type TabId = 'dashboard' | 'timeline' | 'domain' | 'actions' | 'pastes' | 'password' | 'ip' | 'blast' | 'checklist' | 'fingerprint' | 'linkcheck' | 'intel' | 'data';

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
  const groups: { label: string; tabs: { id: TabId; label: string; icon: React.ReactNode; badge?: number }[] }[] = [
    { label: 'Exposure', tabs: [{ id: 'timeline', label: 'Email', icon: <Clock className="w-4 h-4" /> }, { id: 'domain', label: 'Website', icon: <Globe2 className="w-4 h-4" /> }, { id: 'pastes', label: 'Pastes', icon: <FileText className="w-4 h-4" />, badge: pasteCount }] },
    { label: 'Protect', tabs: [{ id: 'actions', label: 'Actions', icon: <ListTodo className="w-4 h-4" />, badge: unresolvedActionCount }, { id: 'password', label: 'Passwords', icon: <KeyRound className="w-4 h-4" /> }, { id: 'blast', label: 'Reuse', icon: <Zap className="w-4 h-4" /> }, { id: 'checklist', label: 'Checklist', icon: <ClipboardCheck className="w-4 h-4" /> }] },
    { label: 'Privacy', tabs: [{ id: 'ip', label: 'IP', icon: <Globe className="w-4 h-4" /> }, { id: 'fingerprint', label: 'Fingerprint', icon: <Fingerprint className="w-4 h-4" /> }, { id: 'linkcheck', label: 'Link Check', icon: <Link2 className="w-4 h-4" /> }] },
    { label: 'Advanced', tabs: [{ id: 'intel', label: 'Security checks', icon: <Radar className="w-4 h-4" /> }] },
    { label: 'Your Data', tabs: [{ id: 'data', label: 'Data', icon: <Database className="w-4 h-4" /> }] }
  ];
  const activeGroup = groups.find((group) => group.tabs.some((tab) => tab.id === activeTab)) || groups[0];

  return (
    <nav aria-label="Security tools" className="sticky top-[73px] z-40 bg-paper/95 backdrop-blur-md border-b border-line">
      <div className="border-b border-line/70 overflow-x-auto no-scrollbar">
        <div className="max-w-5xl mx-auto px-3 sm:px-6 flex min-w-max">
          {groups.map((group) => {
            const isActive = group === activeGroup;
            return <button key={group.label} type="button" onClick={() => onTabChange(group.tabs[0].id)} className={`px-3.5 sm:px-5 py-3 text-xs sm:text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${isActive ? 'border-accent text-ink' : 'border-transparent text-ink-faint hover:text-ink'}`}>{group.label}</button>;
          })}
        </div>
      </div>
      <div className="overflow-x-auto no-scrollbar">
      <div className="max-w-5xl mx-auto px-3 sm:px-6 flex gap-1 min-w-max">
        {activeGroup.tabs.map((t) => {
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => onTabChange(t.id)}
              className={`flex items-center gap-1.5 px-3 sm:px-4 py-3 border-b-2 font-sans text-xs sm:text-sm whitespace-nowrap transition-colors cursor-pointer ${
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
    </nav>
  );
};
