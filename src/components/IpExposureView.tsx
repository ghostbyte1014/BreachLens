import React, { useState } from 'react';
import { IpExposureInfo } from '../types';
import { checkIpExposure } from '../lib/api';
import { getIpReputation, IpReputationResult } from '../lib/securityApi';
import { Globe, AlertCircle, Info } from 'lucide-react';

export const IpExposureView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [info, setInfo] = useState<IpExposureInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reputation, setReputation] = useState<IpReputationResult | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setReputation(null);
    try {
      const data = await checkIpExposure();
      setInfo(data);
      if (data.ip) {
        getIpReputation(data.ip)
          .then(setReputation)
          .catch(() => setReputation({ ip: data.ip!, available: false, note: 'Reputation checks are not set up yet.' }));
      }
    } catch (err: any) {
      setError(err.message || 'Couldn\'t complete IP check.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">What a website sees when you visit it</h1>
        <p className="text-ink-soft max-w-2xl">
          Your public IP address, approximate location, and network provider — the baseline information every site you visit receives by default.
        </p>
      </div>

      <button
        onClick={handleCheck}
        disabled={loading}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-accent hover:bg-accent-dark text-white rounded font-medium transition-colors disabled:opacity-50 cursor-pointer"
      >
        <Globe className="w-4 h-4" />
        {loading ? 'Checking connection...' : 'Check my exposure'}
      </button>
      <p className="text-xs text-ink-faint -mt-3">Example: click the button to check the internet address you are using right now.</p>

      {error && (
        <div className="p-4 rounded border bg-accent-tint text-accent-dark border-l-4 border-l-accent border-line text-sm flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {info && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-px bg-line border border-line rounded-lg overflow-hidden shadow-xs">
            <div className="bg-paper-card p-4">
              <div className="font-mono text-xs text-ink-faint uppercase">Public IP</div>
              <div className="font-mono text-base text-ink mt-1 font-medium">{info.ip || '—'}</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-mono text-xs text-ink-faint uppercase">ISP / Org</div>
              <div className="text-base text-ink mt-1">{info.org || '—'}</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-mono text-xs text-ink-faint uppercase">City</div>
              <div className="text-base text-ink mt-1">{info.city || '—'}</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-mono text-xs text-ink-faint uppercase">Region</div>
              <div className="text-base text-ink mt-1">{info.region || '—'}</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-mono text-xs text-ink-faint uppercase">Country</div>
              <div className="text-base text-ink mt-1">{info.country_name || '—'}</div>
            </div>
            <div className="bg-paper-card p-4">
              <div className="font-mono text-xs text-ink-faint uppercase">Timezone</div>
              <div className="text-base text-ink mt-1">{info.timezone || '—'}</div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-paper-alt border-l-2 border-l-ink-faint border-line text-xs sm:text-sm text-ink-soft flex items-start gap-2.5">
            <Info className="w-4 h-4 text-ink-faint shrink-0 mt-0.5" />
            <div>
              This is roughly what any website you visit can see about your connection by default — it doesn't require any special access. A VPN or proxy will mask the IP and location shown here.
            </div>
          </div>

          {reputation && (
            <div className="rounded-lg border border-line bg-paper-card p-5 space-y-3 shadow-xs">
              <h2 className="font-sans text-base font-medium text-ink">Known-abuse reports</h2>
              {reputation.available ? (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-px border border-line rounded-lg overflow-hidden bg-line">
                  <IpMetric label="Risk score" value={`${reputation.abuseConfidenceScore || 0}%`} danger={(reputation.abuseConfidenceScore || 0) >= 50} />
                  <IpMetric label="Reports" value={String(reputation.totalReports || 0)} />
                  <IpMetric label="Network provider" value={reputation.isp || '—'} />
                  <IpMetric label="Tor network" value={reputation.isTor ? 'Yes' : 'No'} danger={Boolean(reputation.isTor)} />
                </div>
              ) : <p className="text-sm text-ink-soft">{reputation.note || 'This optional check is not available.'}</p>}
              <p className="text-xs text-ink-faint">This is a public reputation signal, not proof that a connection is harmful.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const IpMetric: React.FC<{ label: string; value: string; danger?: boolean }> = ({ label, value, danger }) => (
  <div className="bg-paper-card p-4">
    <div className="font-mono text-[11px] uppercase text-ink-faint">{label}</div>
    <div className={`mt-1 text-sm font-medium ${danger ? 'text-accent-dark' : 'text-ink'}`}>{value}</div>
  </div>
);
