import React from 'react';
import { BreachItem, ActionItem, PasteItem, CheckHistoryItem, ChecklistItem, PasswordTag } from '../types';
import { SecurityScoreGauge } from './SecurityScoreGauge';
import { BreachNewsFeed } from './BreachNewsFeed';
import { BreachTrendsChart } from './BreachTrendsChart';
import { calculateSecurityScore } from '../lib/scoring';
import {
  ShieldCheck, ShieldAlert, Clock, Globe2, ListTodo, FileText,
  KeyRound, Globe, ArrowRight, Sparkles, Search, CheckCircle2,
  AlertTriangle, Tag, ClipboardCheck, Fingerprint, Link2, Zap,
  Database, Info
} from 'lucide-react';
import { TabId } from './TabBar';

interface DashboardViewProps {
  breaches: BreachItem[];
  actionItems: ActionItem[];
  pastes: PasteItem[];
  checkHistory: CheckHistoryItem[];
  tags: PasswordTag[];
  checklist: ChecklistItem[];
  onNavigate: (tab: TabId) => void;
  onQuickCheck: (email: string) => void;
  onCheckDomain: (domain: string) => void;
}

/** Aggregate all dataClass strings across breaches and count occurrences */
function buildDataClassSummary(breaches: BreachItem[]): { label: string; count: number; isSensitive: boolean }[] {
  const counts: Record<string, number> = {};
  for (const b of breaches) {
    for (const dc of b.dataClasses) {
      const key = dc.trim();
      if (key) counts[key] = (counts[key] || 0) + 1;
    }
  }
  const sensitiveTerms = ['password', 'passwords', 'ssn', 'social security', 'credit card', 'bank', 'passport', 'national id', 'pin', 'biometric', 'medical'];
  return Object.entries(counts)
    .map(([label, count]) => ({
      label,
      count,
      isSensitive: sensitiveTerms.some(t => label.toLowerCase().includes(t))
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  breaches, actionItems, pastes, checkHistory, tags, checklist,
  onNavigate, onQuickCheck, onCheckDomain
}) => {
  const [quickEmail, setQuickEmail] = React.useState('');
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (quickEmail.trim()) onQuickCheck(quickEmail.trim());
  };

  const hasData = checkHistory.length > 0;
  const criticalActions = actionItems.filter(a => a.severity === 'critical');
  const topAction = actionItems[0] || null;
  const scoreData = calculateSecurityScore(breaches, actionItems, pastes, tags, checklist);
  const dataClasses = buildDataClassSummary(breaches);

  // Checklist progress
  const checklistDone = checklist.filter(c => c.completed).length;
  const checklistTotal = checklist.length;
  const checklistPct = checklistTotal > 0 ? Math.round((checklistDone / checklistTotal) * 100) : 0;

  // Recent breaches (last 5, sorted by breach date desc)
  const recentBreaches = [...breaches]
    .sort((a, b) => (b.breachYear || 0) - (a.breachYear || 0))
    .slice(0, 5);

  return (
    <div className="space-y-8">
      {/* Hero Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-paper-card via-paper-card to-paper-alt border border-line rounded-xl p-6 sm:p-8 shadow-xs">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 space-y-4 max-w-3xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-line bg-paper text-xs font-mono text-ink-faint">
            <Sparkles className="w-3.5 h-3.5 text-accent" />
            <span>Open Source &amp; Privacy-First Personal Security Shield</span>
          </div>
          <h1 className="font-serif text-3xl sm:text-4xl text-ink font-medium tracking-tight leading-tight">
            Understand &amp; fix your personal data breach exposure.
          </h1>
          <p className="text-ink-soft text-base leading-relaxed">
            BreachLens brings together your leak history across data breaches, websites, and dark-web dumps — giving you a clear action plan to lock down your digital life.
          </p>
          <form onSubmit={handleSearch} className="pt-2">
            <div className="flex flex-col sm:flex-row gap-2.5 max-w-xl">
              <input type="email" value={quickEmail} onChange={(e) => setQuickEmail(e.target.value)}
                placeholder="Enter email address to check..."
                required
                className="flex-1 px-4 py-3 bg-white border border-line rounded-lg font-sans text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-xs" />
              <button type="submit"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors cursor-pointer shadow-xs">
                <Search className="w-4 h-4" /><span>Check Exposure</span>
              </button>
            </div>
            <p className="font-mono text-xs text-ink-faint mt-2">
              Free lookup — no passwords or personal data ever leave your device.
            </p>
          </form>
        </div>
      </div>

      {/* === EMPTY STATE: No data yet === */}
      {!hasData && (
        <div className="bg-paper-card border border-line rounded-xl p-6 sm:p-8 flex flex-col sm:flex-row items-start gap-6 shadow-xs">
          <div className="w-12 h-12 rounded-xl bg-accent-tint flex items-center justify-center shrink-0">
            <Info className="w-6 h-6 text-accent" />
          </div>
          <div className="space-y-3">
            <h2 className="font-serif text-xl text-ink font-medium">You haven't checked any email addresses yet</h2>
            <p className="text-ink-soft text-sm leading-relaxed max-w-2xl">
              Your security score and all stats below will populate once you run your first email check. Type your email in the search bar above to instantly find out if your data has been exposed in known breaches.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <button onClick={() => onNavigate('timeline')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-accent hover:bg-accent-dark text-white text-sm font-medium rounded-lg transition-colors cursor-pointer">
                <Clock className="w-4 h-4" /> Check Email Breaches
              </button>
              <button onClick={() => onNavigate('checklist')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-paper-alt hover:bg-line border border-line text-ink text-sm font-medium rounded-lg transition-colors cursor-pointer">
                <ClipboardCheck className="w-4 h-4" /> Start Security Checklist
              </button>
            </div>
          </div>
        </div>
      )}

      {/* === Security Score Gauge === */}
      <SecurityScoreGauge score={scoreData.score} grade={scoreData.grade} color={scoreData.color} factors={scoreData.factors} />

      {/* === Priority Alert: Top Action === */}
      {topAction && (
        <div className={`border rounded-lg p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs ${
          topAction.severity === 'critical'
            ? 'bg-accent-tint/70 border-accent/40'
            : 'bg-high-tint/60 border-high/30'
        }`}>
          <div className="flex items-start gap-3">
            <ShieldAlert className={`w-5 h-5 shrink-0 mt-0.5 ${topAction.severity === 'critical' ? 'text-accent' : 'text-high'}`} />
            <div>
              <h3 className={`font-sans font-medium text-base ${topAction.severity === 'critical' ? 'text-accent-dark' : 'text-high'}`}>
                Most Urgent: {topAction.title}
              </h3>
              <p className={`text-xs mt-0.5 ${topAction.severity === 'critical' ? 'text-accent-dark/80' : 'text-high/80'}`}>
                {topAction.detail}
                {actionItems.length > 1 && ` · ${actionItems.length - 1} more action${actionItems.length > 2 ? 's' : ''} pending.`}
              </p>
            </div>
          </div>
          <button onClick={() => onNavigate('actions')}
            className="px-4 py-2 bg-accent hover:bg-accent-dark text-white rounded text-xs font-medium transition-colors shrink-0 cursor-pointer">
            Fix Now →
          </button>
        </div>
      )}

      {/* === Stat Cards === */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div onClick={() => onNavigate('timeline')} className="bg-paper-card border border-line rounded-lg p-5 space-y-2 hover:border-ink/30 transition-all cursor-pointer group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-faint uppercase">Checked Emails</span>
            <Clock className="w-4 h-4 text-ink-faint group-hover:text-accent transition-colors" />
          </div>
          <div className="font-serif text-3xl text-ink font-medium">{checkHistory.length}</div>
          <div className="text-xs text-ink-soft flex items-center justify-between pt-1">
            <span>{breaches.length} breach{breaches.length === 1 ? '' : 'es'} found</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div onClick={() => onNavigate('actions')} className="bg-paper-card border border-line rounded-lg p-5 space-y-2 hover:border-ink/30 transition-all cursor-pointer group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-faint uppercase">Open Actions</span>
            <ListTodo className="w-4 h-4 text-ink-faint group-hover:text-accent transition-colors" />
          </div>
          <div className={`font-serif text-3xl font-medium ${actionItems.length > 0 ? 'text-accent' : 'text-resolve'}`}>{actionItems.length}</div>
          <div className="text-xs text-ink-soft flex items-center justify-between pt-1">
            <span>{criticalActions.length > 0 ? `${criticalActions.length} critical` : actionItems.length === 0 ? 'All clear' : 'Needs attention'}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div onClick={() => onNavigate('pastes')} className="bg-paper-card border border-line rounded-lg p-5 space-y-2 hover:border-ink/30 transition-all cursor-pointer group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-faint uppercase">Dark Web Dumps</span>
            <FileText className="w-4 h-4 text-ink-faint group-hover:text-accent transition-colors" />
          </div>
          <div className={`font-serif text-3xl font-medium ${pastes.length > 0 ? 'text-high' : 'text-ink'}`}>{pastes.length}</div>
          <div className="text-xs text-ink-soft flex items-center justify-between pt-1">
            <span>{pastes.length > 0 ? 'Paste site records found' : 'No pastes found'}</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
        <div onClick={() => onNavigate('checklist')} className="bg-paper-card border border-line rounded-lg p-5 space-y-2 hover:border-ink/30 transition-all cursor-pointer group shadow-xs">
          <div className="flex items-center justify-between">
            <span className="font-mono text-xs text-ink-faint uppercase">Checklist</span>
            <ClipboardCheck className="w-4 h-4 text-ink-faint group-hover:text-accent transition-colors" />
          </div>
          <div className={`font-serif text-3xl font-medium ${checklistPct >= 80 ? 'text-resolve' : checklistPct >= 40 ? 'text-medium' : 'text-accent'}`}>
            {checklistPct}%
          </div>
          <div className="text-xs text-ink-soft flex items-center justify-between pt-1">
            <span>{checklistDone}/{checklistTotal} steps done</span>
            <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
        </div>
      </div>

      {/* === Two-column: Checklist Mini + Top Unresolved Action === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Checklist Progress Card */}
        <div className="bg-paper-card border border-line rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-medium text-ink text-sm flex items-center gap-2">
              <ClipboardCheck className="w-4 h-4 text-resolve" /> Security Hardening Progress
            </h3>
            <button onClick={() => onNavigate('checklist')}
              className="text-xs text-accent hover:underline cursor-pointer font-mono">
              View all →
            </button>
          </div>
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-mono text-ink-faint">
              <span>{checklistDone} completed</span>
              <span>{checklistTotal - checklistDone} remaining</span>
            </div>
            <div className="w-full h-2.5 bg-paper-alt rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${checklistPct}%`,
                  backgroundColor: checklistPct >= 80 ? '#2E6E63' : checklistPct >= 40 ? '#6B6338' : '#B3271D'
                }} />
            </div>
          </div>
          {/* Show next 3 incomplete items */}
          <div className="space-y-2">
            {checklist.filter(c => !c.completed).slice(0, 3).map(item => (
              <div key={item.id} className="flex items-start gap-2 text-xs text-ink-soft">
                <div className="w-4 h-4 rounded-full border-2 border-line shrink-0 mt-0.5" />
                <span className="leading-relaxed">{item.label}</span>
              </div>
            ))}
            {checklistDone === checklistTotal && checklistTotal > 0 && (
              <div className="flex items-center gap-2 text-xs text-resolve">
                <CheckCircle2 className="w-4 h-4" />
                <span>All steps completed — excellent security posture!</span>
              </div>
            )}
          </div>
        </div>

        {/* Most Exposed Data Types */}
        <div className="bg-paper-card border border-line rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-medium text-ink text-sm flex items-center gap-2">
              <Tag className="w-4 h-4 text-high" /> Your Most Exposed Data
            </h3>
            <button onClick={() => onNavigate('timeline')}
              className="text-xs text-accent hover:underline cursor-pointer font-mono">
              View breaches →
            </button>
          </div>
          {dataClasses.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {dataClasses.map(dc => (
                <span key={dc.label}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-mono border ${
                    dc.isSensitive
                      ? 'bg-accent-tint text-accent-dark border-accent/20 font-medium'
                      : 'bg-paper-alt text-ink-soft border-line'
                  }`}>
                  {dc.isSensitive && <AlertTriangle className="w-3 h-3" />}
                  {dc.label}
                  <span className="ml-1 opacity-60">×{dc.count}</span>
                </span>
              ))}
            </div>
          ) : (
            <div className="text-xs text-ink-faint leading-relaxed">
              No breach data yet. Check an email address to see which types of personal data have been exposed in known leaks.
            </div>
          )}
          {dataClasses.some(d => d.isSensitive) && (
            <p className="text-xs text-accent-dark/80 flex items-start gap-1.5 pt-1 border-t border-line">
              <AlertTriangle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
              <span>Red tags are high-sensitivity data types. Prioritise changing passwords and enabling 2FA on any affected accounts.</span>
            </p>
          )}
        </div>
      </div>

      {/* === Recent Breaches Strip === */}
      {recentBreaches.length > 0 && (
        <div className="bg-paper-card border border-line rounded-xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-sans font-medium text-ink text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-accent" /> Your Most Recent Breaches
            </h3>
            <button onClick={() => onNavigate('timeline')}
              className="text-xs text-accent hover:underline cursor-pointer font-mono">
              See all →
            </button>
          </div>
          <div className="space-y-2">
            {recentBreaches.map(b => (
              <div key={b.id} className="flex items-center justify-between gap-3 py-2 border-b border-line last:border-0">
                <div className="flex items-center gap-3 min-w-0">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${
                    b.severity === 'critical' ? 'bg-accent' :
                    b.severity === 'high' ? 'bg-high' :
                    b.severity === 'medium' ? 'bg-medium' : 'bg-line'
                  }`} />
                  <div className="min-w-0">
                    <span className="font-sans text-sm text-ink font-medium truncate block">{b.source}</span>
                    <span className="font-mono text-[11px] text-ink-faint">{b.email}</span>
                  </div>
                </div>
                <div className="shrink-0 flex items-center gap-2">
                  {b.resolved && <span className="text-[11px] font-mono text-resolve">Resolved</span>}
                  <span className="font-mono text-[11px] text-ink-faint">{b.breachYear || '—'}</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                    b.severity === 'critical' ? 'bg-accent-tint text-accent-dark' :
                    b.severity === 'high' ? 'bg-high-tint text-high' :
                    b.severity === 'medium' ? 'bg-medium-tint text-medium' :
                    'bg-paper-alt text-ink-faint'
                  }`}>
                    {b.severity}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* === Breach Trends Chart === */}
      <BreachTrendsChart breaches={breaches} />

      {/* === Breach News Feed === */}
      <BreachNewsFeed onCheckDomain={onCheckDomain} />

      {/* === Feature Tools Grid === */}
      <div className="space-y-4">
        <h2 className="font-serif text-xl text-ink font-medium">All Security Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { id: 'timeline' as TabId, icon: <Clock className="w-5 h-5" />, title: 'Email Breach Check', desc: 'Find all known data leaks tied to your email addresses, ranked by the sensitivity of data exposed.' },
            { id: 'domain' as TabId, icon: <Globe2 className="w-5 h-5" />, title: 'Website Breach Check', desc: 'Search any app or website to see if it was breached and which user data was compromised.' },
            { id: 'actions' as TabId, icon: <ListTodo className="w-5 h-5" />, title: 'Action List', desc: 'Step-by-step remediation guide ranked by real risk — change passwords, enable 2FA, and more.' },
            { id: 'pastes' as TabId, icon: <FileText className="w-5 h-5" />, title: 'Dark Web Pastes', desc: 'Checks hacker paste sites and dark-web dumps for raw email records from your address.' },
            { id: 'password' as TabId, icon: <KeyRound className="w-5 h-5" />, title: 'Password Checker', desc: 'Test any password using cryptographic hashing — your actual password never leaves the browser.' },
            { id: 'ip' as TabId, icon: <Globe className="w-5 h-5" />, title: 'IP Footprint', desc: 'See what websites instantly learn about your location, ISP, and connection when you visit.' },
            { id: 'blast' as TabId, icon: <Zap className="w-5 h-5" />, title: 'Password Reuse Detector', desc: 'Tag and group accounts that share the same password so you can see your full blast radius.' },
            { id: 'checklist' as TabId, icon: <ClipboardCheck className="w-5 h-5" />, title: 'Security Checklist', desc: 'A practical hardening guide with 12 steps to significantly reduce your personal attack surface.' },
            { id: 'fingerprint' as TabId, icon: <Fingerprint className="w-5 h-5" />, title: 'Browser Fingerprint', desc: 'Discover what your browser reveals — WebRTC IP leaks, canvas fingerprint, screen info, and more.' },
            { id: 'linkcheck' as TabId, icon: <Link2 className="w-5 h-5" />, title: 'Phishing Link Scanner', desc: 'Paste a suspicious URL to run 9 phishing heuristic checks — brand spoofing, lookalike domains, and more.' },
            { id: 'data' as TabId, icon: <Database className="w-5 h-5" />, title: 'My Data', desc: 'Export, import or clear all your locally stored breach history, tags, and check records.' },
          ].map(tool => (
            <div key={tool.id} onClick={() => onNavigate(tool.id)}
              className="bg-paper-card border border-line rounded-lg p-5 space-y-3 hover:border-accent transition-all cursor-pointer group shadow-xs">
              <div className="w-10 h-10 rounded-lg bg-paper-alt border border-line flex items-center justify-center text-ink group-hover:bg-accent-tint group-hover:text-accent-dark transition-colors">
                {tool.icon}
              </div>
              <div>
                <h3 className="font-sans font-medium text-ink text-base">{tool.title}</h3>
                <p className="text-xs text-ink-soft mt-1 leading-relaxed">{tool.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* === Privacy Guarantees === */}
      <div className="bg-paper-card border border-line rounded-xl p-6 sm:p-8 space-y-4">
        <h2 className="font-serif text-xl text-ink font-medium flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-resolve" />
          <span>Privacy &amp; Architectural Commitments</span>
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-2">
          {[
            { title: '100% Free Forever', desc: 'No subscriptions, no hidden fees, no ads. Built on open public security databases available to everyone.' },
            { title: 'No Accounts or Servers', desc: 'Zero cloud storage. All search history, breach records, and tags are stored strictly in your browser\'s IndexedDB.' },
            { title: 'Full Data Ownership', desc: 'Export your entire breach history and settings as a JSON file. Import it back any time to move between devices.' },
          ].map((g, i) => (
            <div key={i} className="space-y-1.5">
              <div className="font-sans font-medium text-ink text-sm flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-resolve shrink-0" /><span>{g.title}</span>
              </div>
              <p className="text-xs text-ink-faint leading-relaxed pl-6">{g.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
