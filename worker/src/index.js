const headers = {
  'Content-Type': 'application/json; charset=utf-8',
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type'
};

const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers });
const unavailable = (note) => ({ available: false, note });

function domainFrom(value) {
  const domain = new URL(value.includes('://') ? value : `https://${value}`).hostname.toLowerCase().replace(/\.$/, '');
  if (!domain || domain.length > 253 || !/^[a-z0-9.-]+$/i.test(domain) || !domain.includes('.')) throw new Error('Please enter a valid website address.');
  return domain;
}

function safeUrl(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Please use a normal website address starting with http or https.');
  return url;
}

async function jsonFrom(response) {
  if (!response.ok) throw new Error(`The service returned ${response.status}.`);
  return response.json();
}

async function dns(name, type) {
  const data = await fetch(`https://cloudflare-dns.com/dns-query?name=${encodeURIComponent(name)}&type=${type}`, { headers: { Accept: 'application/dns-json' } }).then(jsonFrom);
  return { values: (data.Answer || []).map((record) => record.data).filter(Boolean), dnssec: Boolean(data.AD) };
}

async function domainIntel(domain) {
  const [spf, dmarc, mx, mtaSts, tlsRpt, rdap, certificates] = await Promise.all([
    dns(domain, 'TXT'), dns(`_dmarc.${domain}`, 'TXT'), dns(domain, 'MX'), dns(`_mta-sts.${domain}`, 'TXT'), dns(`_smtp._tls.${domain}`, 'TXT'),
    fetch(`https://rdap.org/domain/${encodeURIComponent(domain)}`).then(jsonFrom).catch(() => null),
    fetch(`https://crt.sh/?q=${encodeURIComponent(domain)}&output=json`).then(jsonFrom).catch(() => [])
  ]);
  const eventDate = (action) => rdap?.events?.find((event) => event.eventAction === action)?.eventDate;
  const registrarEntity = rdap?.entities?.find((entity) => entity.roles?.includes('registrar'));
  const registrar = registrarEntity?.vcardArray?.[1]?.find((entry) => entry[0] === 'fn')?.[3];
  const names = [...new Set(certificates.flatMap((certificate) => String(certificate.name_value || '').split('\n')).filter((name) => name === domain || name.endsWith(`.${domain}`)))].slice(0, 12);
  const latest = certificates.map((certificate) => certificate.not_before).filter(Boolean).sort().at(-1);
  return { domain, records: { spf: spf.values, dmarc: dmarc.values, mx: mx.values, mtaSts: mtaSts.values, tlsRpt: tlsRpt.values, dnssec: [spf, dmarc, mx].some((result) => result.dnssec) }, registration: { registrar, created: eventDate('registration'), expires: eventDate('expiration') }, certificates: { count: certificates.length, latest, names } };
}

async function openPhish(url) {
  try {
    const response = await fetch('https://raw.githubusercontent.com/openphish/public_feed/main/feed.txt', { cf: { cacheTtl: 900, cacheEverything: true } });
    if (!response.ok) throw new Error();
    return { available: true, found: (await response.text()).split('\n').some((item) => item.trim() === url.trim()), note: 'Checked against the free community phishing list.' };
  } catch {
    return unavailable('The free phishing list is not available right now.');
  }
}

async function virusTotal(url, env) {
  if (!env.VIRUSTOTAL_API_KEY) return unavailable('This optional free check has not been set up yet.');
  try {
    const id = btoa(url).replaceAll('+', '-').replaceAll('/', '_').replaceAll('=', '');
    const data = await fetch(`https://www.virustotal.com/api/v3/urls/${id}`, { headers: { 'x-apikey': env.VIRUSTOTAL_API_KEY } }).then(jsonFrom);
    const stats = data.data.attributes.last_analysis_stats || {};
    return { available: true, malicious: stats.malicious || 0, suspicious: stats.suspicious || 0, harmless: stats.harmless || 0 };
  } catch {
    return { available: true, note: 'No finished report was found for this address.' };
  }
}

async function urlScan(domain, env) {
  if (!env.URLSCAN_API_KEY) return unavailable('This optional free check has not been set up yet.');
  try {
    const data = await fetch(`https://urlscan.io/api/v1/search/?q=domain:${encodeURIComponent(domain)}`, { headers: { 'API-Key': env.URLSCAN_API_KEY } }).then(jsonFrom);
    return { available: true, matches: Array.isArray(data.results) ? data.results.length : 0, note: 'Shows existing public scans only. This check does not visit the address.' };
  } catch {
    return { available: true, note: 'This service could not return its public scan history.' };
  }
}

async function urlReputation(request, env) {
  const { url: value } = await request.json().catch(() => ({}));
  if (typeof value !== 'string') throw new Error('Please enter a website address.');
  const url = safeUrl(value);
  const [openPhishResult, virusTotalResult, urlScanResult] = await Promise.all([openPhish(value), virusTotal(value, env), urlScan(url.hostname, env)]);
  return { url: value, openPhish: openPhishResult, virusTotal: virusTotalResult, urlScan: urlScanResult };
}

async function ipReputation(ip, env) {
  if (!env.ABUSEIPDB_API_KEY) return { ip, ...unavailable('This optional free check has not been set up yet.') };
  if (!/^[0-9a-f:.]+$/i.test(ip)) throw new Error('Please enter a valid IP address.');
  const data = await fetch(`https://api.abuseipdb.com/api/v2/check?ipAddress=${encodeURIComponent(ip)}&maxAgeInDays=90`, { headers: { Key: env.ABUSEIPDB_API_KEY, Accept: 'application/json' } }).then(jsonFrom);
  const item = data.data;
  return { ip, available: true, abuseConfidenceScore: item.abuseConfidenceScore, totalReports: item.totalReports, countryCode: item.countryCode, isp: item.isp, domain: item.domain, isTor: item.isTor };
}

async function vulnerabilities(query, env) {
  const requestHeaders = env.NVD_API_KEY ? { apiKey: env.NVD_API_KEY } : {};
  const data = await fetch(`https://services.nvd.nist.gov/rest/json/cves/2.0?keywordSearch=${encodeURIComponent(query)}&resultsPerPage=10`, { headers: requestHeaders }).then(jsonFrom);
  const results = (data.vulnerabilities || []).map(({ cve }) => {
    const score = cve.metrics?.cvssMetricV31?.[0]?.cvssData || cve.metrics?.cvssMetricV30?.[0]?.cvssData || cve.metrics?.cvssMetricV2?.[0]?.cvssData;
    return { id: cve.id, published: cve.published, severity: score?.baseSeverity || 'UNRATED', score: score?.baseScore, description: cve.descriptions?.find((description) => description.lang === 'en')?.value || 'No details were provided.', references: (cve.references || []).slice(0, 3).map((reference) => reference.url) };
  });
  return { query, results };
}

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') return new Response(null, { headers });
    const url = new URL(request.url);
    try {
      if (url.pathname === '/api/health') return reply({ virusTotal: Boolean(env.VIRUSTOTAL_API_KEY), abuseIpDb: Boolean(env.ABUSEIPDB_API_KEY), urlScan: Boolean(env.URLSCAN_API_KEY), openPhish: true, nvd: true });
      if (url.pathname === '/api/domain-intel' && request.method === 'GET') return reply(await domainIntel(domainFrom(url.searchParams.get('domain') || '')));
      if (url.pathname === '/api/url-reputation' && request.method === 'POST') return reply(await urlReputation(request, env));
      if (url.pathname === '/api/ip-reputation' && request.method === 'GET') return reply(await ipReputation(url.searchParams.get('ip') || '', env));
      if (url.pathname === '/api/vulnerabilities' && request.method === 'GET') return reply(await vulnerabilities(url.searchParams.get('query') || '', env));
      return reply({ error: 'Not found.' }, 404);
    } catch (error) {
      return reply({ error: error instanceof Error ? error.message : 'The check could not be completed.' }, 400);
    }
  }
};
