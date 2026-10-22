import React, { useState } from 'react';
import { AlertTriangle, Bug, CheckCircle2, Globe2, Info, Search } from 'lucide-react';
import { DomainIntelResult, getDomainIntel, getVulnerabilities, VulnerabilityResult } from '../lib/securityApi';

type ScanKind = 'domain' | 'vulnerability';
const normaliseDomain = (value: string) => value.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');

export const ThreatIntelView: React.FC = () => {
  const [kind, setKind] = useState<ScanKind>('domain');
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [domainResult, setDomainResult] = useState<DomainIntelResult | null>(null);
  const [vulnerabilities, setVulnerabilities] = useState<VulnerabilityResult[] | null>(null);

  const config = {
    domain: { label: 'Website security', placeholder: 'example.com', example: 'example.com', help: 'See whether a website has key email-protection settings, how long it has existed, and its public certificates.', icon: <Globe2 className="w-4 h-4" /> },
    vulnerability: { label: 'Software issues', placeholder: 'OpenSSL 3.0.0', example: 'OpenSSL 3.0.0', help: 'Look for publicly reported security problems in a piece of software or a specific version.', icon: <Bug className="w-4 h-4" /> }
  } as const;

  const handleScan = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim()) return;
    setLoading(true); setError(null); setDomainResult(null); setVulnerabilities(null);
    try {
      if (kind === 'domain') setDomainResult(await getDomainIntel(normaliseDomain(input)));
      if (kind === 'vulnerability') setVulnerabilities((await getVulnerabilities(input.trim())).results);
    } catch (err: any) {
      setError(err.message || 'The check could not be completed.');
    } finally { setLoading(false); }
  };

  const recordState = (values: string[], label: string) => <div className="bg-paper-card p-4"><div className="font-mono text-xs text-ink-faint uppercase">{label}</div><div className={`mt-1 text-sm font-medium ${values.length ? 'text-resolve' : 'text-accent-dark'}`}>{values.length ? 'Found' : 'Not found'}</div>{values.length > 0 && <div className="mt-2 break-all font-mono text-[11px] text-ink-faint">{values.join(' · ')}</div>}</div>;

  return <div className="space-y-6">
    <div className="space-y-2"><h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Advanced security checks</h1><p className="text-ink-soft max-w-3xl">Use these extra tools to check a website’s email protection or look up known problems in software. Link and IP reputation checks are now in their own tools.</p></div>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">{(Object.keys(config) as ScanKind[]).map((item) => <button key={item} type="button" onClick={() => { setKind(item); setInput(''); setError(null); }} className={`flex items-center gap-2 rounded-lg border px-4 py-3 text-left text-sm transition-colors ${kind === item ? 'border-accent bg-accent-tint text-accent-dark' : 'border-line bg-paper-card text-ink-soft hover:border-ink/30'}`}>{config[item].icon}<span>{config[item].label}</span></button>)}</div>
    <form onSubmit={handleScan} className="rounded-xl border border-line bg-paper-card p-5 shadow-xs space-y-3"><div className="flex flex-col sm:flex-row gap-2.5"><input value={input} onChange={(event) => setInput(event.target.value)} placeholder={config[kind].placeholder} required className="flex-1 px-4 py-3 bg-white border border-line rounded-lg font-mono text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent" /><button type="submit" disabled={loading} className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-6 py-3 font-medium text-white hover:bg-accent-dark disabled:opacity-50"><Search className="w-4 h-4" />{loading ? 'Checking…' : 'Check now'}</button></div><p className="flex items-start gap-1.5 text-xs text-ink-faint"><Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />{config[kind].help}</p><p className="text-xs text-ink-faint">Try an example: <button type="button" onClick={() => setInput(config[kind].example)} className="font-mono text-accent hover:underline">{config[kind].example}</button></p></form>
    {error && <div role="alert" className="flex items-center gap-2 border border-accent/40 border-l-4 border-l-accent bg-accent-tint p-4 text-sm text-accent-dark rounded"><AlertTriangle className="w-4 h-4 shrink-0" />{error}</div>}
    {domainResult && <div className="space-y-4"><h2 className="font-serif text-xl text-ink">Website security: <span className="font-mono text-base">{domainResult.domain}</span></h2><div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px border border-line rounded-lg overflow-hidden bg-line shadow-xs">{recordState(domainResult.records.spf, 'SPF')}{recordState(domainResult.records.dmarc, 'DMARC')}{recordState(domainResult.records.mtaSts, 'MTA-STS')}{recordState(domainResult.records.tlsRpt, 'TLS-RPT')}{recordState(domainResult.records.mx, 'Mail servers')}<div className="bg-paper-card p-4"><div className="font-mono text-xs text-ink-faint uppercase">DNSSEC</div><div className={`mt-1 text-sm font-medium ${domainResult.records.dnssec ? 'text-resolve' : 'text-high'}`}>{domainResult.records.dnssec ? 'Found' : 'Not found'}</div></div></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div className="rounded-lg border border-line bg-paper-card p-5 space-y-2"><h3 className="font-medium text-ink">Website details</h3><p className="text-sm text-ink-soft">Company: {domainResult.registration.registrar || 'Unavailable'}</p><p className="text-sm text-ink-soft">Created: {domainResult.registration.created || 'Unavailable'}</p><p className="text-sm text-ink-soft">Expires: {domainResult.registration.expires || 'Unavailable'}</p></div><div className="rounded-lg border border-line bg-paper-card p-5 space-y-2"><h3 className="font-medium text-ink">Public certificates</h3><p className="text-sm text-ink-soft">{domainResult.certificates.count} records found.</p><p className="text-sm text-ink-soft">Most recent: {domainResult.certificates.latest || 'Unavailable'}</p>{domainResult.certificates.names.length > 0 && <p className="break-all font-mono text-[11px] text-ink-faint">{domainResult.certificates.names.join(' · ')}</p>}</div></div></div>}
    {vulnerabilities && <div className="space-y-3"><h2 className="font-serif text-xl text-ink">Known software issues</h2>{vulnerabilities.length === 0 ? <div className="rounded-lg border border-resolve/30 bg-resolve-tint p-5 text-sm text-resolve">No matching issues were found. This does not prove the software is safe.</div> : vulnerabilities.map((item) => <div key={item.id} className="rounded-lg border border-line bg-paper-card p-5 space-y-2 shadow-xs"><div className="flex flex-wrap items-center gap-2"><span className="font-mono text-sm font-medium text-ink">{item.id}</span><span className={`rounded px-2 py-0.5 font-mono text-[10px] ${item.severity === 'CRITICAL' || item.severity === 'HIGH' ? 'bg-accent-tint text-accent-dark' : 'bg-paper-alt text-ink-soft'}`}>{item.severity}{item.score ? ` · ${item.score}` : ''}</span></div><p className="text-sm text-ink-soft">{item.description}</p><p className="font-mono text-xs text-ink-faint">Published: {item.published ? new Date(item.published).toLocaleDateString() : '—'}</p></div>)}</div>}
    <div className="rounded-lg border border-line bg-paper-alt/60 p-4 text-xs text-ink-faint flex gap-2"><CheckCircle2 className="w-4 h-4 text-resolve shrink-0" />These checks use free public information. They can help you spot a concern, but they cannot promise a website or piece of software is safe.</div>
  </div>;
};
