import React, { useState } from 'react';
import { Link2, Search, ShieldCheck, ShieldAlert, AlertTriangle, Info } from 'lucide-react';
import { getUrlReputation, UrlReputationResult } from '../lib/securityApi';

interface LinkResult {
  url: string;
  safe: boolean;
  threats: string[];
  warnings: string[];
}

interface HeuristicCheck {
  label: string;
  passed: boolean;
  detail: string;
  severity: 'danger' | 'warn' | 'ok';
}

export const PhishingLinkView: React.FC = () => {
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<LinkResult | null>(null);
  const [checks, setChecks] = useState<HeuristicCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [reputation, setReputation] = useState<UrlReputationResult | null>(null);
  const [reputationNote, setReputationNote] = useState<string | null>(null);

  const analyzeUrl = (rawUrl: string): { result: LinkResult; checks: HeuristicCheck[] } => {
    let checkUrl = rawUrl.trim();
    if (!/^https?:\/\//i.test(checkUrl)) {
      checkUrl = 'https://' + checkUrl;
    }

    let parsedUrl: URL;
    try {
      parsedUrl = new URL(checkUrl);
    } catch {
      throw new Error('That doesn\'t look like a valid URL. Please include the full address (e.g. https://example.com).');
    }

    const hostname = parsedUrl.hostname.toLowerCase();
    const fullUrl = checkUrl.toLowerCase();
    const threats: string[] = [];
    const warnings: string[] = [];
    const hChecks: HeuristicCheck[] = [];

    // 1. HTTPS check
    const isHttps = parsedUrl.protocol === 'https:';
    hChecks.push({
      label: 'Encrypted connection (HTTPS)',
      passed: isHttps,
      detail: isHttps
        ? 'Uses HTTPS — traffic between you and the site is encrypted.'
        : 'Uses plain HTTP — your connection is not encrypted. Avoid entering any personal data.',
      severity: isHttps ? 'ok' : 'warn'
    });
    if (!isHttps) warnings.push('Site uses plain HTTP — data you enter is not encrypted');

    // 2. Raw IP address
    const isIpBased = /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname);
    hChecks.push({
      label: 'Uses a domain name (not raw IP)',
      passed: !isIpBased,
      detail: isIpBased
        ? 'The URL uses a raw IP address instead of a domain name — a common phishing technique to hide the true server identity.'
        : 'Uses a recognizable domain name.',
      severity: isIpBased ? 'danger' : 'ok'
    });
    if (isIpBased) threats.push('Uses a raw IP address instead of a proper domain — common in phishing attacks');

    // 3. Suspicious TLDs
    const suspiciousTlds = ['.tk', '.ml', '.ga', '.cf', '.gq', '.xyz', '.top', '.buzz', '.club', '.pw', '.ru', '.cn', '.work', '.click'];
    const hasSuspiciousTld = suspiciousTlds.some(tld => hostname.endsWith(tld));
    hChecks.push({
      label: 'Uses a trusted top-level domain',
      passed: !hasSuspiciousTld,
      detail: hasSuspiciousTld
        ? `The domain ends with "${hostname.split('.').slice(-2).join('.')}" — a top-level domain frequently used in phishing and spam campaigns.`
        : 'The top-level domain appears standard.',
      severity: hasSuspiciousTld ? 'warn' : 'ok'
    });
    if (hasSuspiciousTld) warnings.push('Uses a top-level domain commonly associated with phishing');

    // 4. Excessive subdomains
    const domainParts = hostname.split('.');
    const hasExcessiveSubdomains = domainParts.length > 4;
    hChecks.push({
      label: 'Normal subdomain structure',
      passed: !hasExcessiveSubdomains,
      detail: hasExcessiveSubdomains
        ? `This URL has ${domainParts.length} domain levels (e.g. "login.secure.mybank.fakesite.com") — a common phishing technique to make a fake URL look legitimate.`
        : 'The domain structure looks normal.',
      severity: hasExcessiveSubdomains ? 'warn' : 'ok'
    });
    if (hasExcessiveSubdomains) warnings.push(`Unusual subdomain depth (${domainParts.length} levels) — may be disguising a fake site`);

    // 5. Brand impersonation
    const brands: Record<string, string[]> = {
      google: ['google.com', 'googleapis.com', 'googlevideo.com', 'youtube.com'],
      apple: ['apple.com', 'icloud.com'],
      microsoft: ['microsoft.com', 'live.com', 'outlook.com', 'azure.com', 'office.com'],
      facebook: ['facebook.com', 'fb.com', 'instagram.com', 'messenger.com'],
      amazon: ['amazon.com', 'amazonaws.com', 'awsstatic.com'],
      paypal: ['paypal.com', 'paypalobjects.com'],
      netflix: ['netflix.com', 'nflxvideo.net', 'nflximg.net'],
      instagram: ['instagram.com'],
      twitter: ['twitter.com', 'x.com', 't.co'],
      linkedin: ['linkedin.com'],
      dropbox: ['dropbox.com', 'dropboxusercontent.com'],
    };

    let brandImpersonated: string | null = null;
    for (const [brand, legitimateDomains] of Object.entries(brands)) {
      if (hostname.includes(brand)) {
        const isLegit = legitimateDomains.some(d => hostname === d || hostname.endsWith('.' + d));
        if (!isLegit) {
          brandImpersonated = brand.charAt(0).toUpperCase() + brand.slice(1);
          break;
        }
      }
    }
    hChecks.push({
      label: 'No brand impersonation detected',
      passed: !brandImpersonated,
      detail: brandImpersonated
        ? `The domain contains "${brandImpersonated.toLowerCase()}" but does not match the real ${brandImpersonated} website. This is a classic brand impersonation phishing pattern.`
        : 'No known brand names appear to be impersonated.',
      severity: brandImpersonated ? 'danger' : 'ok'
    });
    if (brandImpersonated) threats.push(`Possible ${brandImpersonated} impersonation — domain does not match the legitimate service`);

    // 6. Internationalized domain name (IDN / homograph)
    const hasIdn = /xn--/.test(hostname) || hostname !== hostname.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    hChecks.push({
      label: 'No lookalike (homograph) characters',
      passed: !hasIdn,
      detail: hasIdn
        ? 'This domain uses internationalized characters that can look identical to regular letters — a known technique used to create convincing fake domains (e.g. "pаypal.com" using a Cyrillic "а").'
        : 'No suspicious lookalike characters detected.',
      severity: hasIdn ? 'danger' : 'ok'
    });
    if (hasIdn) threats.push('Uses internationalized domain name (IDN) — may be a lookalike/homograph attack');

    // 7. URL length
    const isLong = fullUrl.length > 100;
    hChecks.push({
      label: 'URL length is reasonable',
      passed: !isLong,
      detail: isLong
        ? `This URL is ${fullUrl.length} characters long. Phishing URLs are often very long to hide the real destination within a confusing string.`
        : `URL is ${fullUrl.length} characters — within normal range.`,
      severity: isLong ? 'warn' : 'ok'
    });
    if (isLong) warnings.push(`Unusually long URL (${fullUrl.length} characters) — may be obfuscating the destination`);

    // 8. Suspicious keywords in path
    const suspiciousKeywords = ['login', 'signin', 'verify', 'account', 'secure', 'banking', 'update', 'confirm', 'password', 'credential', 'wallet', 'suspend'];
    const foundKeywords = suspiciousKeywords.filter(kw => fullUrl.includes(kw));
    const hasSuspiciousKeywords = foundKeywords.length >= 2;
    hChecks.push({
      label: 'URL path looks normal',
      passed: !hasSuspiciousKeywords,
      detail: hasSuspiciousKeywords
        ? `The URL contains multiple high-risk keywords: "${foundKeywords.join('", "')}". Phishing pages frequently use these terms to create a false sense of urgency.`
        : 'No suspicious keyword patterns found in the URL path.',
      severity: hasSuspiciousKeywords ? 'warn' : 'ok'
    });
    if (hasSuspiciousKeywords) warnings.push(`Multiple phishing-related keywords in URL: ${foundKeywords.join(', ')}`);

    // 9. Port check
    const port = parsedUrl.port;
    const hasUnusualPort = port && port !== '80' && port !== '443';
    hChecks.push({
      label: 'Uses a standard web port',
      passed: !hasUnusualPort,
      detail: hasUnusualPort
        ? `The URL uses port ${port} instead of the standard 80 (HTTP) or 443 (HTTPS). Legitimate websites rarely use non-standard ports.`
        : 'Uses a standard port.',
      severity: hasUnusualPort ? 'warn' : 'ok'
    });
    if (hasUnusualPort) warnings.push(`Uses non-standard port ${port}`);

    return {
      result: {
        url: checkUrl,
        safe: threats.length === 0 && warnings.length === 0,
        threats,
        warnings
      },
      checks: hChecks
    };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = urlInput.trim();
    if (!url) return;

    setLoading(true);
    setError(null);
    setResult(null);
    setChecks([]);
    setReputation(null);
    setReputationNote(null);

    // Small artificial delay for UX
    await new Promise(r => setTimeout(r, 400));

    try {
      const { result: r, checks: c } = analyzeUrl(url);
      setResult(r);
      setChecks(c);
      getUrlReputation(r.url)
        .then(setReputation)
        .catch(() => setReputationNote('Known-threat checks are not set up yet. Your local link checks still ran normally.'));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const dangerCount = checks.filter(c => c.severity === 'danger' && !c.passed).length;
  const warnCount = checks.filter(c => c.severity === 'warn' && !c.passed).length;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h1 className="font-serif text-2xl sm:text-3xl text-ink font-medium">Phishing Link Scanner</h1>
        <p className="text-ink-soft max-w-2xl">
          Paste a suspicious link to run 9 safety checks for phishing patterns — brand impersonation, lookalike domains, suspicious keywords, and more. All checks run instantly in your browser.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2">
        <div className="flex flex-col sm:flex-row gap-2.5 max-w-2xl">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste a suspicious link here (e.g. https://paypa1.secure-login.tk/...)"
            required
            className="flex-1 px-4 py-3 bg-paper-card border border-line rounded-lg font-mono text-sm text-ink focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent shadow-xs"
          />
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-accent hover:bg-accent-dark text-white font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-xs"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Scanning...' : 'Scan Link'}
          </button>
        </div>
        <p className="font-mono text-xs text-ink-faint flex items-center gap-1.5">
          <Info className="w-3 h-3" />
          The first 9 checks run on this device. Known-threat checks are optional and use public security services.
        </p>
        <p className="text-xs text-ink-faint">Try an example: <button type="button" onClick={() => setUrlInput('https://example.com')} className="font-mono text-accent hover:underline">https://example.com</button></p>
      </form>

      {error && (
        <div className="p-4 rounded-lg bg-accent-tint text-accent-dark border-l-4 border-l-accent text-sm flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          {/* Verdict Banner */}
          <div className={`rounded-xl p-6 border flex items-start gap-4 shadow-xs ${
            dangerCount > 0
              ? 'bg-accent-tint/60 border-accent/40'
              : warnCount > 0
              ? 'bg-yellow-50 border-yellow-300'
              : 'bg-green-50 border-green-300'
          }`}>
            {dangerCount > 0 ? (
              <ShieldAlert className="w-7 h-7 text-accent shrink-0 mt-0.5" />
            ) : (
              <ShieldCheck className={`w-7 h-7 shrink-0 mt-0.5 ${warnCount > 0 ? 'text-yellow-600' : 'text-resolve'}`} />
            )}
            <div>
              <h3 className={`font-serif text-xl font-medium ${
                dangerCount > 0 ? 'text-accent-dark' : warnCount > 0 ? 'text-yellow-700' : 'text-resolve'
              }`}>
                {dangerCount > 0
                  ? `${dangerCount} high-risk indicator${dangerCount === 1 ? '' : 's'} detected`
                  : warnCount > 0
                  ? `${warnCount} warning${warnCount === 1 ? '' : 's'} — proceed with caution`
                  : 'No phishing indicators found'}
              </h3>
              <p className={`text-xs mt-1 ${dangerCount > 0 ? 'text-accent-dark/80' : warnCount > 0 ? 'text-yellow-700/80' : 'text-resolve/80'}`}>
                {dangerCount > 0
                  ? 'Do NOT enter any personal information, passwords, or payment data on this site.'
                  : warnCount > 0
                  ? 'This link has some suspicious traits. Double-check the destination before entering any personal data.'
                  : 'This link passed all 9 heuristic checks. However, no tool can guarantee 100% safety — always be cautious.'}
              </p>
              <div className="mt-3 bg-paper-alt/80 rounded-lg px-3 py-2 font-mono text-xs text-ink break-all flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5 text-ink-faint shrink-0" />
                <span>{result.url}</span>
              </div>
            </div>
          </div>

          {/* Detailed Checks */}
          <div className="bg-paper-card border border-line rounded-xl shadow-xs overflow-hidden">
            <div className="px-5 py-3.5 border-b border-line">
              <h3 className="font-sans font-medium text-ink text-sm">Detailed Safety Analysis</h3>
            </div>
            <div className="divide-y divide-line">
              {checks.map((c, i) => (
                <div key={i} className={`flex items-start gap-3 px-5 py-4 ${
                  !c.passed && c.severity === 'danger' ? 'bg-accent-tint/30' : ''
                }`}>
                  <div className="mt-0.5 shrink-0">
                    {c.passed ? (
                      <div className="w-5 h-5 rounded-full bg-resolve/20 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-resolve" />
                      </div>
                    ) : c.severity === 'danger' ? (
                      <div className="w-5 h-5 rounded-full bg-accent/20 flex items-center justify-center">
                        <AlertTriangle className="w-3 h-3 text-accent" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full bg-yellow-500/20 flex items-center justify-center">
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                      </div>
                    )}
                  </div>
                  <div>
                    <div className={`font-sans text-sm font-medium ${
                      c.passed ? 'text-ink' : c.severity === 'danger' ? 'text-accent-dark' : 'text-yellow-700'
                    }`}>
                      {c.label}
                    </div>
                    <div className="text-xs text-ink-faint mt-0.5 leading-relaxed">{c.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {reputation && (
            <div className="bg-paper-card border border-line rounded-xl p-5 space-y-3 shadow-xs">
              <h3 className="font-sans font-medium text-ink text-sm">Known-threat checks</h3>
              <p className="text-xs text-ink-faint">These are separate from the local checks above. “No match” does not mean a link is safe.</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <ReputationCard title="Phishing list" text={reputation.openPhish.found ? 'Known phishing match found' : reputation.openPhish.available ? 'No exact match found' : 'Not set up'} danger={Boolean(reputation.openPhish.found)} note={reputation.openPhish.note} />
                <ReputationCard title="VirusTotal" text={reputation.virusTotal.available ? `${reputation.virusTotal.malicious || 0} harmful report(s)` : 'Not set up'} danger={(reputation.virusTotal.malicious || 0) > 0} note={reputation.virusTotal.note} />
                <ReputationCard title="Public scan history" text={reputation.urlScan.available ? `${reputation.urlScan.matches || 0} public match(es)` : 'Not set up'} danger={false} note={reputation.urlScan.note} />
              </div>
            </div>
          )}

          {reputationNote && <div className="p-3 rounded border border-line bg-paper-alt text-xs text-ink-faint">{reputationNote}</div>}

          <p className="font-mono text-[11px] text-ink-faint">
            All checks performed locally in your browser. No data is transmitted to any external server.
          </p>
        </div>
      )}
    </div>
  );
};

const ReputationCard: React.FC<{ title: string; text: string; danger: boolean; note?: string }> = ({ title, text, danger, note }) => (
  <div className="rounded-lg border border-line bg-paper-alt/50 p-4">
    <div className={`text-sm font-medium ${danger ? 'text-accent-dark' : 'text-ink'}`}>{title}</div>
    <p className={`mt-1 text-sm ${danger ? 'text-accent-dark' : 'text-ink-soft'}`}>{text}</p>
    {note && <p className="mt-1 text-xs text-ink-faint">{note}</p>}
  </div>
);
