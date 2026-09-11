import { BreachItem, SeverityLevel, SeverityReason, ActionItem, PasswordTag } from '../types';

export const SEVERITY_ORDER: SeverityLevel[] = ['low', 'medium', 'high', 'critical'];

function passwordSeverity(risk: string): SeverityLevel {
  const r = (risk || '').toLowerCase();
  if (r === 'plaintext' || r === 'easytocrack') return 'critical';
  if (r === 'hardtocrack') return 'medium';
  return 'medium';
}

const CLASS_RULES: { test: RegExp; severity: SeverityLevel; label: string }[] = [
  { test: /security question|security answer/i, severity: 'critical', label: 'security questions' },
  { test: /social security|ssn|government id|passport|national id|driver.?s licen[cs]e/i, severity: 'critical', label: 'government ID' },
  { test: /credit card|debit card|bank account|financial|payment card|iban|routing number/i, severity: 'high', label: 'financial details' },
  { test: /address|geographic location|phone number/i, severity: 'medium', label: 'address / phone' },
  { test: /date of birth/i, severity: 'medium', label: 'date of birth' },
  { test: /email address/i, severity: 'low', label: 'email address' },
  { test: /username/i, severity: 'low', label: 'username' },
];

export function classifyBreach(dataClasses: string[], passwordRisk: string): { severity: SeverityLevel; reasons: SeverityReason[] } {
  const reasons: SeverityReason[] = [];
  let top: SeverityLevel = 'low';

  const bump = (sev: SeverityLevel, label: string) => {
    reasons.push({ severity: sev, label });
    if (SEVERITY_ORDER.indexOf(sev) > SEVERITY_ORDER.indexOf(top)) {
      top = sev;
    }
  };

  (dataClasses || []).forEach(dc => {
    if (/password/i.test(dc)) {
      const sev = passwordSeverity(passwordRisk);
      bump(sev, `password (${passwordRisk || 'unknown'})`);
      return;
    }
    const rule = CLASS_RULES.find(r => r.test.test(dc));
    if (rule) {
      bump(rule.severity, rule.label);
    } else {
      bump('low', dc.toLowerCase());
    }
  });

  if (reasons.length === 0) {
    bump('low', 'unspecified data');
  }

  return { severity: top, reasons };
}

export function actionTitleFor(reason: SeverityReason, b: BreachItem): string {
  if (/password/.test(reason.label)) {
    return reason.severity === 'critical'
      ? `Change the password used on ${b.source}`
      : `Rotate the password used on ${b.source} (lower urgency)`;
  }
  if (reason.label === 'government ID') return `Consider a credit freeze or fraud alert — ID exposed via ${b.source}`;
  if (reason.label === 'security questions') return `Rotate security question answers reused elsewhere — exposed via ${b.source}`;
  if (reason.label === 'financial details') return `Review recent statements — financial details exposed via ${b.source}`;
  if (reason.label === 'address / phone' || reason.label === 'date of birth') return `Stay alert to phishing referencing ${b.source}`;
  return `Awareness only — ${b.source} exposed your ${reason.label}`;
}

export function buildActionItems(breaches: BreachItem[], tags: PasswordTag[]): ActionItem[] {
  const activeBreaches = breaches.filter(b => !b.resolved);
  const tagByBreach = new Map(tags.map(t => [t.breachId, t.tagLabel]));

  const groups = new Map<string, { severity: SeverityLevel; breachIds: string[]; sources: string[] }>();
  const solo: BreachItem[] = [];

  activeBreaches.forEach(b => {
    const tagLabel = tagByBreach.get(b.id);
    const isPasswordItem = b.severityReasons.some(r => /password/.test(r.label));

    if (tagLabel && isPasswordItem) {
      if (!groups.has(tagLabel)) {
        groups.set(tagLabel, { severity: 'low', breachIds: [], sources: [] });
      }
      const g = groups.get(tagLabel)!;
      g.breachIds.push(b.id);
      g.sources.push(b.source);
      if (SEVERITY_ORDER.indexOf(b.severity) > SEVERITY_ORDER.indexOf(g.severity)) {
        g.severity = b.severity;
      }
    } else {
      solo.push(b);
    }
  });

  const items: ActionItem[] = [];

  groups.forEach((g, label) => {
    items.push({
      id: `group::${label}`,
      severity: g.severity,
      title: `Change the password tagged \u201c${label}\u201d — used on ${g.sources.length} account${g.sources.length === 1 ? '' : 's'}`,
      detail: g.sources.join(', '),
      breachIds: g.breachIds,
      kind: 'password-group'
    });
  });

  solo.forEach(b => {
    const topReason = b.severityReasons.reduce(
      (a, c) => (SEVERITY_ORDER.indexOf(c.severity) > SEVERITY_ORDER.indexOf(a.severity) ? c : a),
      b.severityReasons[0] || { severity: 'low', label: 'unspecified data' }
    );

    items.push({
      id: `single::${b.id}`,
      severity: b.severity,
      title: actionTitleFor(topReason, b),
      detail: `${b.source}${b.breachYear ? ` · ${b.breachYear}` : ''}`,
      breachIds: [b.id],
      kind: 'single'
    });
  });

  items.sort((a, b) => SEVERITY_ORDER.indexOf(b.severity) - SEVERITY_ORDER.indexOf(a.severity));
  return items;
}
