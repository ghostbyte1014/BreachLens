export interface ScannerStatus {
  virusTotal: boolean;
  abuseIpDb: boolean;
  urlScan: boolean;
  openPhish: boolean;
  nvd: boolean;
}

export interface DomainIntelResult {
  domain: string;
  records: {
    spf: string[];
    dmarc: string[];
    mx: string[];
    mtaSts: string[];
    tlsRpt: string[];
    dnssec: boolean;
  };
  registration: { registrar?: string; created?: string; expires?: string };
  certificates: { count: number; latest?: string; names: string[] };
}

export interface UrlReputationResult {
  url: string;
  openPhish: { available: boolean; found?: boolean; note?: string };
  virusTotal: { available: boolean; malicious?: number; suspicious?: number; harmless?: number; note?: string };
  urlScan: { available: boolean; matches?: number; note?: string };
}

export interface IpReputationResult {
  ip: string;
  available: boolean;
  abuseConfidenceScore?: number;
  totalReports?: number;
  countryCode?: string;
  isp?: string;
  domain?: string;
  isTor?: boolean;
  note?: string;
}

export interface VulnerabilityResult {
  id: string;
  published?: string;
  severity: string;
  score?: number;
  description: string;
  references: string[];
}

const configuredSecurityApi = import.meta.env.VITE_SECURITY_API_BASE;
const baseUrl = (configuredSecurityApi || '/api').replace(/\/$/, '');

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) }
  });
  const contentType = response.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    throw new Error('The extra security-check service is not connected yet. You can still use the other tools.');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || `Scanner service returned ${response.status}`);
  return data as T;
}

export const getScannerStatus = () => request<ScannerStatus>('/health');

type DnsAnswer = { data?: string };
type DnsResponse = { Answer?: DnsAnswer[]; AD?: boolean };
type CertificateEntry = { name_value?: string; not_before?: string };

async function publicJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Public security source returned ${response.status}.`);
  return response.json() as Promise<T>;
}

async function directDns(name: string, type: string) {
  const data = await publicJson<DnsResponse>(`https://dns.google/resolve?name=${encodeURIComponent(name)}&type=${type}`);
  return { values: (data.Answer || []).map((answer) => answer.data).filter((value): value is string => Boolean(value)), dnssec: Boolean(data.AD) };
}

async function directDomainIntel(domain: string): Promise<DomainIntelResult> {
  const [spf, dmarc, mx, mtaSts, tlsRpt, registration, certificates] = await Promise.all([
    directDns(domain, 'TXT'), directDns(`_dmarc.${domain}`, 'TXT'), directDns(domain, 'MX'), directDns(`_mta-sts.${domain}`, 'TXT'), directDns(`_smtp._tls.${domain}`, 'TXT'),
    publicJson<any>(`https://rdap.org/domain/${encodeURIComponent(domain)}`).catch(() => null),
    publicJson<CertificateEntry[]>(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`).catch(() => [])
  ]);
  const created = registration?.events?.find((event: any) => event.eventAction === 'registration')?.eventDate;
  const expires = registration?.events?.find((event: any) => event.eventAction === 'expiration')?.eventDate;
  const registrarEntity = registration?.entities?.find((entity: any) => entity.roles?.includes('registrar'));
  const registrar = registrarEntity?.vcardArray?.[1]?.find((entry: any[]) => entry[0] === 'fn')?.[3];
  const names = [...new Set(certificates.flatMap((certificate) => String(certificate.name_value || '').split('\n')).filter((name) => name === domain || name.endsWith(`.${domain}`)))].slice(0, 12);
  const certificateDates = certificates.map((certificate) => certificate.not_before).filter((value): value is string => Boolean(value)).sort();
  const latest = certificateDates[certificateDates.length - 1];
  return { domain, records: { spf: spf.values, dmarc: dmarc.values, mx: mx.values, mtaSts: mtaSts.values, tlsRpt: tlsRpt.values, dnssec: [spf, dmarc, mx].some((result) => result.dnssec) }, registration: { registrar, created, expires }, certificates: { count: certificates.length, latest, names } };
}

async function directVulnerabilities(query: string): Promise<{ query: string; results: VulnerabilityResult[] }> {
  const data = await publicJson<{ vulnerabilities?: { cve: any }[] }>(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&resultsPerPage=10`);
  const results = (data.vulnerabilities || []).map(({ cve }) => {
    const score = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData || cve.metrics?.cvssMetricV2?.[0]?.cvssData;
    return { id: cve.id, published: cve.published, severity: score?.baseSeverity || 'UNRATED', score: score?.baseScore, description: cve.descriptions?.find((description: any) => description.lang === 'en')?.value || 'No details were provided.', references: (cve.references || []).slice(0, 3).map((reference: any) => reference.url) };
  });
  return { query, results };
}

export const getDomainIntel = async (domain: string) => {
  const data = configuredSecurityApi
    ? await request<DomainIntelResult>(`/domain-intel?domain=${encodeURIComponent(domain)}`)
    : await directDomainIntel(domain);
  if (!data.records || !Array.isArray(data.records.spf)) {
    throw new Error('The website-security check returned an incomplete result. Please try again later.');
  }
  return data;
};
export const getIpReputation = (ip: string) => request<IpReputationResult>(`/ip-reputation?ip=${encodeURIComponent(ip)}`);
export const getVulnerabilities = (query: string) => configuredSecurityApi
  ? request<{ query: string; results: VulnerabilityResult[] }>(`/vulnerabilities?query=${encodeURIComponent(query)}`)
  : directVulnerabilities(query);
export const getUrlReputation = (url: string) => request<UrlReputationResult>('/url-reputation', {
  method: 'POST',
  body: JSON.stringify({ url })
});
