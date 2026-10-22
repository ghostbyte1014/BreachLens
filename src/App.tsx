import React, { useState, useEffect, useCallback } from 'react';
import { TabId, TabBar } from './components/TabBar';
import { Navbar } from './components/Navbar';
import { DashboardView } from './components/DashboardView';
import { TimelineView } from './components/TimelineView';
import { DomainCheckView } from './components/DomainCheckView';
import { ActionListView } from './components/ActionListView';
import { PasteMonitoringView } from './components/PasteMonitoringView';
import { PasswordCheckView } from './components/PasswordCheckView';
import { IpExposureView } from './components/IpExposureView';
import { BlastRadiusView } from './components/BlastRadiusView';
import { DataManagementView } from './components/DataManagementView';
import { SecurityChecklistView } from './components/SecurityChecklistView';
import { BrowserFingerprintView } from './components/BrowserFingerprintView';
import { PhishingLinkView } from './components/PhishingLinkView';
import { Footer } from './components/Footer';
import { ThreatIntelView } from './components/ThreatIntelView';

import {
  BreachItem,
  PasteItem,
  PasswordTag,
  CheckHistoryItem,
  ChecklistItem
} from './types';

import {
  fetchBreachesForEmail,
  fetchPastesForEmail
} from './lib/api';

import {
  getDB,
  getAllBreaches,
  putBreaches,
  putBreach,
  getAllPastes,
  putPastes,
  getAllPasswordTags,
  putPasswordTag,
  deletePasswordTag,
  getAllCheckHistory,
  getCheckHistoryForEmail,
  putCheckHistory,
  getAllChecklist,
  putChecklistItems,
  clearAllData,
  exportDatabaseJSON,
  importDatabaseJSON
} from './lib/db';

import { DEFAULT_CHECKLIST } from './lib/checklist';

import { buildActionItems } from './lib/prioritization';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [dbStatus, setDbStatus] = useState<'ready' | 'initializing' | 'error'>('initializing');

  const [breaches, setBreaches] = useState<BreachItem[]>([]);
  const [pastes, setPastes] = useState<PasteItem[]>([]);
  const [tags, setTags] = useState<PasswordTag[]>([]);
  const [checkHistory, setCheckHistory] = useState<CheckHistoryItem[]>([]);
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);

  const [loading, setLoading] = useState(false);
  const [timelineStatus, setTimelineStatus] = useState<{ type: 'loading' | 'error' | 'ok'; text: string } | null>(null);

  // Initialize DB and load initial data
  const loadDataFromDB = useCallback(async () => {
    try {
      await getDB();
      setDbStatus('ready');
      const bList = await getAllBreaches();
      const pList = await getAllPastes();
      const tList = await getAllPasswordTags();
      const hList = await getAllCheckHistory();
      const cList = await getAllChecklist();

      // Auto-seed checklist defaults on very first run
      if (cList.length === 0) {
        const defaults = DEFAULT_CHECKLIST.map(c => ({ ...c, completed: false }));
        await putChecklistItems(defaults);
        setChecklist(defaults);
      } else {
        setChecklist(cList);
      }

      setBreaches(bList);
      setPastes(pList);
      setTags(tList);
      setCheckHistory(hList);
    } catch (err) {
      console.error('Failed to open database', err);
      setDbStatus('error');
    }
  }, []);

  useEffect(() => {
    loadDataFromDB();
  }, [loadDataFromDB]);

  // Handle email breach check
  const handleCheckEmail = async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) return;

    setLoading(true);
    setTimelineStatus({
      type: 'loading',
      text: `Querying breach databases for ${normalizedEmail}...`
    });

    try {
      const freshBreaches = await fetchBreachesForEmail(normalizedEmail);
      const priorHistory = await getCheckHistoryForEmail(normalizedEmail);
      const previousIds = new Set(priorHistory ? priorHistory.previousBreachIds : []);

      const existingMap = new Map(breaches.map(b => [b.id, b]));

      const updatedBreaches = freshBreaches.map(b => {
        const prior = existingMap.get(b.id);
        return {
          ...b,
          resolved: prior ? prior.resolved : false,
          isNew: priorHistory ? !previousIds.has(b.id) : false
        };
      });

      await putBreaches(updatedBreaches);

      const newHistoryItem: CheckHistoryItem = {
        email: normalizedEmail,
        lastCheckedAt: new Date().toISOString(),
        previousBreachIds: freshBreaches.map(b => b.id)
      };
      await putCheckHistory(newHistoryItem);

      if (freshBreaches.length === 0) {
        setTimelineStatus({
          type: 'ok',
          text: "No known breaches found for this address. That's a good sign — it isn't a guarantee, since free public databases have limited coverage compared to commercial alternatives."
        });
      } else {
        const newCount = updatedBreaches.filter(b => b.isNew).length;
        const msg = priorHistory && newCount > 0
          ? `Found ${freshBreaches.length} breach${freshBreaches.length === 1 ? '' : 'es'} — ${newCount} new since your last check.`
          : `Found ${freshBreaches.length} breach${freshBreaches.length === 1 ? '' : 'es'}.`;
        setTimelineStatus({ type: 'ok', text: msg });
      }

      await loadDataFromDB();
    } catch (err: any) {
      setTimelineStatus({
        type: 'error',
        text: `Couldn't complete lookup (${err.message}). The breach database may be temporarily unavailable.`
      });
    } finally {
      setLoading(false);
    }
  };

  // Handle dark web paste lookup
  const handleCheckPastes = async (email: string) => {
    const normalizedEmail = email.toLowerCase().trim();
    if (!normalizedEmail) return;

    setLoading(true);
    try {
      const freshPastes = await fetchPastesForEmail(normalizedEmail);
      if (freshPastes.length > 0) {
        await putPastes(freshPastes);
      }
      await loadDataFromDB();
    } catch (err) {
      console.error('Failed paste check', err);
    } finally {
      setLoading(false);
    }
  };

  // Handle resolve toggles
  const handleToggleResolve = async (id: string, resolved: boolean) => {
    const target = breaches.find(b => b.id === id);
    if (target) {
      const updated = { ...target, resolved };
      await putBreach(updated);
      await loadDataFromDB();
    }
  };

  const handleResolveActions = async (breachIds: string[], resolved: boolean) => {
    for (const id of breachIds) {
      const target = breaches.find(b => b.id === id);
      if (target) {
        await putBreach({ ...target, resolved });
      }
    }
    await loadDataFromDB();
  };

  // Handle password tags
  const handleSaveTag = async (breachId: string, label: string) => {
    if (label) {
      await putPasswordTag({ breachId, tagLabel: label });
    } else {
      await deletePasswordTag(breachId);
    }
    await loadDataFromDB();
  };

  // Data tab actions
  const handleExportJSON = async () => {
    const payload = await exportDatabaseJSON();
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `breachlens-export-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (file: File) => {
    try {
      const text = await file.text();
      const payload = JSON.parse(text);
      await importDatabaseJSON(payload);
      await loadDataFromDB();
      alert('Import complete.');
    } catch (err: any) {
      alert(`Couldn't read import file: ${err.message}`);
    }
  };

  const handleClearAllData = async () => {
    if (!confirm('This will permanently delete all breach records, tags, and check history from this browser. Continue?')) return;
    await clearAllData();
    await loadDataFromDB();
    setTimelineStatus(null);
  };

  // Handle domain check from news feed
  const handleCheckDomainFromDashboard = (_domain: string) => {
    setActiveTab('domain');
  };

  const actionItems = buildActionItems(breaches, tags);
  const unresolvedActionCount = actionItems.length;

  return (
    <div className="min-h-screen flex flex-col bg-paper text-ink-soft">
      <Navbar dbStatus={dbStatus} onGoToDashboard={() => setActiveTab('dashboard')} />
      <TabBar
        activeTab={activeTab}
        onTabChange={setActiveTab}
        unresolvedActionCount={unresolvedActionCount}
        pasteCount={pastes.length}
      />

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 py-8 pb-20">
        {activeTab === 'dashboard' && (
          <DashboardView
            breaches={breaches}
            actionItems={actionItems}
            pastes={pastes}
            checkHistory={checkHistory}
            tags={tags}
            checklist={checklist}
            onNavigate={(tab) => setActiveTab(tab)}
            onQuickCheck={(email) => {
              setActiveTab('timeline');
              handleCheckEmail(email);
            }}
            onCheckDomain={handleCheckDomainFromDashboard}
          />
        )}

        {activeTab === 'timeline' && (
          <TimelineView
            breaches={breaches}
            onCheckEmail={handleCheckEmail}
            onToggleResolve={handleToggleResolve}
            loading={loading}
            statusMessage={timelineStatus}
          />
        )}

        {activeTab === 'domain' && (
          <DomainCheckView />
        )}

        {activeTab === 'actions' && (
          <ActionListView
            actionItems={actionItems}
            onResolveActions={handleResolveActions}
          />
        )}

        {activeTab === 'pastes' && (
          <PasteMonitoringView
            pastes={pastes}
            onCheckPastes={handleCheckPastes}
            loading={loading}
          />
        )}

        {activeTab === 'password' && (
          <PasswordCheckView />
        )}

        {activeTab === 'ip' && (
          <IpExposureView />
        )}

        {activeTab === 'blast' && (
          <BlastRadiusView
            breaches={breaches}
            tags={tags}
            onSaveTag={handleSaveTag}
          />
        )}

        {activeTab === 'checklist' && (
          <SecurityChecklistView onChecklistChange={loadDataFromDB} />
        )}

        {activeTab === 'fingerprint' && (
          <BrowserFingerprintView />
        )}

        {activeTab === 'linkcheck' && (
          <PhishingLinkView />
        )}

        {activeTab === 'intel' && (
          <ThreatIntelView />
        )}

        {activeTab === 'data' && (
          <DataManagementView
            checkHistory={checkHistory}
            onRecheckEmail={(email) => {
              setActiveTab('timeline');
              handleCheckEmail(email);
            }}
            onExportJSON={handleExportJSON}
            onImportJSON={handleImportJSON}
            onClearAllData={handleClearAllData}
          />
        )}
      </main>
      <Footer />
    </div>
  );
};
