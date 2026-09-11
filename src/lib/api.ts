import { BreachItem, PasteItem, PasswordCheckResult, IpExposureInfo, DomainBreachInfo } from '../types';
import { classifyBreach } from './prioritization';

/**
 * Safely parse a 4-digit year from date strings
 */
export function extractYear(dateStr: string | undefined | null): number | null {
  if (!dateStr) return null;
  const match = dateStr.match(/\b(19|20)\d{2}\b/);
  return match ? parseInt(match[0], 10) : null;
}

/**
 * Breach Lookup for Email
 */
export async function fetchBreachesForEmail(email: string): Promise<BreachItem[]> {
  const url = `https://api.xposedornot.com/v1/breach-analytics?email=${encodeURIComponent(email)}`;
  const res = await fetch(url);

  if (res.status === 404) {
    return [];
  }

  if (!res.ok) {
    throw new Error(`Lookup service returned status ${res.status}`);
  }

  const data = await res.json();
  const details = data?.ExposedBreaches?.breaches_details || data?.exposedBreaches?.breaches_details;

  if (!Array.isArray(details)) return [];

  return details.map((d: any) => {
    const rawData = d.xposed_data || d.exposedData || '';
    const dataClasses = Array.isArray(rawData)
      ? rawData
      : (typeof rawData === 'string' ? rawData.split(';').map((s: string) => s.trim()).filter(Boolean) : []);
    const classification = classifyBreach(dataClasses, d.password_risk || d.passwordRisk);
    const year = extractYear(d.xposed_date || d.breachedDate || d.breachDate);

    return {
      id: `${email.toLowerCase()}::${d.breach || d.breachID}`,
      email: email.toLowerCase(),
      source: d.breach || d.breachID || 'Unknown Service',
      domain: d.domain || '',
      breachDate: year ? `${year}-01-01` : null,
      breachYear: year,
      dataClasses,
      description: d.details || d.exposureDescription || '',
      passwordRisk: d.password_risk || d.passwordRisk || 'unknown',
      severity: classification.severity,
      severityReasons: classification.reasons,
      verified: String(d.verified).toLowerCase() === 'yes' || d.verified === true,
      records: d.xposed_records ? (parseInt(d.xposed_records, 10) || null) : (d.exposedRecords || null),
      resolved: false,
      isNew: false
    };
  });
}

/**
 * Service Domain Exposure Lookup
 * Searches known public breach repositories for a target service domain (e.g. adobe.com, canva.com, dropbox.com)
 */
export async function fetchDomainBreaches(domainInput: string): Promise<DomainBreachInfo[]> {
  const cleanDomain = domainInput.toLowerCase().trim().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const brandName = cleanDomain.replace(/\.[^.]+$/, '');

  const url = 'https://api.xposedornot.com/v1/breaches';
  const res = await fetch(url);

  if (!res.ok) {
    throw new Error(`Domain lookup service returned status ${res.status}`);
  }

  const data = await res.json();
  const allBreaches = data?.exposedBreaches || data?.ExposedBreaches || [];

  if (!Array.isArray(allBreaches)) return [];

  const matches = allBreaches.filter((b: any) => {
    const bDomain = (b.domain || b.Domain || '').toLowerCase();
    const bID = (b.breachID || b.BreachID || '').toLowerCase();

    return (
      (bDomain && (bDomain.includes(cleanDomain) || cleanDomain.includes(bDomain))) ||
      (bID && (bID.includes(cleanDomain) || bID.includes(brandName) || brandName.includes(bID)))
    );
  });

  return matches.map((d: any) => {
    const rawData = d.exposedData || d.ExposedData || '';
    const dataClasses: string[] = Array.isArray(rawData)
      ? rawData
      : (typeof rawData === 'string' ? rawData.split(';').map((s: string) => s.trim()).filter(Boolean) : []);

    const rawDate = d.breachedDate || d.BreachDate || d.addedDate;
    const year = extractYear(rawDate);

    return {
      name: d.breachID || d.BreachID || cleanDomain,
      domain: d.domain || d.Domain || cleanDomain,
      breachDate: rawDate ? rawDate.slice(0, 10) : (year ? `${year}` : 'Unknown date'),
      records: d.exposedRecords || d.ExposedRecords || null,
      dataClasses,
      description: d.exposureDescription || d.Description || '',
      verified: d.verified === true || String(d.verified).toLowerCase() === 'yes',
      passwordRisk: d.passwordRisk || d.PasswordRisk || 'unknown'
    };
  });
}

/**
 * Dark Web Paste Lookup
 */
export async function fetchPastesForEmail(email: string): Promise<PasteItem[]> {
  const url = `https://api.xposedornot.com/v1/paste-analytics?email=${encodeURIComponent(email)}`;
  const res = await fetch(url);

  if (res.status === 404 || !res.ok) {
    return [];
  }

  const data = await res.json();
  const pasteList = data?.PastesSummary?.pastes_details || data?.pastes || [];

  if (!Array.isArray(pasteList)) return [];

  return pasteList.map((p: any) => {
    const year = extractYear(p.paste_date || p.date);
    return {
      id: `${email.toLowerCase()}::paste::${p.paste_id || p.title || Math.random().toString(36).slice(2)}`,
      email: email.toLowerCase(),
      title: p.title || 'Untitled Paste Dump',
      source: p.paste_id || 'Dark Web Dump',
      pasteDate: year ? `${year}-01-01` : null,
      records: p.records ? parseInt(p.records, 10) || null : null,
      dataClasses: p.exposed_data ? p.exposed_data.split(';').map((s: string) => s.trim()) : ['Paste Entry']
    };
  });
}

/**
 * Password Exposure Check (SHA-1 prefix lookup)
 */
export async function sha1Hex(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text);
  const digest = await crypto.subtle.digest('SHA-1', enc);
  return Array.from(new Uint8Array(digest))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .toUpperCase();
}

export async function checkPwnedPassword(password: string): Promise<PasswordCheckResult> {
  const hash = await sha1Hex(password);
  const prefix = hash.slice(0, 5);
  const suffix = hash.slice(5);

  const res = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`);
  if (!res.ok) {
    throw new Error(`Password check service returned status ${res.status}`);
  }

  const text = await res.text();
  const lines = text.split('\n');
  let count = 0;

  for (const line of lines) {
    const [lineSuffix, lineCount] = line.trim().split(':');
    if (lineSuffix === suffix) {
      count = parseInt(lineCount, 10) || 0;
      break;
    }
  }

  return {
    count,
    length: password.length,
    hasDigit: /[0-9]/.test(password),
    hasLetter: /[a-zA-Z]/.test(password),
    hasSpecial: /[^a-zA-Z0-9]/.test(password)
  };
}

/**
 * Public IP Exposure Check
 */
export async function checkIpExposure(): Promise<IpExposureInfo> {
  const res = await fetch('https://ipapi.co/json/');
  if (!res.ok) {
    throw new Error(`Connection lookup service returned status ${res.status}`);
  }
  return res.json();
}
