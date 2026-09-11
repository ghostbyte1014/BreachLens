export type SeverityLevel = 'critical' | 'high' | 'medium' | 'low';

export interface SeverityReason {
  severity: SeverityLevel;
  label: string;
}

export interface BreachItem {
  id: string;
  email: string;
  source: string;
  domain: string;
  breachDate: string | null;
  breachYear: number | null;
  dataClasses: string[];
  description: string;
  passwordRisk: string;
  severity: SeverityLevel;
  severityReasons: SeverityReason[];
  verified: boolean;
  records: number | null;
  resolved: boolean;
  isNew: boolean;
}

export interface DomainBreachInfo {
  name: string;
  domain: string;
  breachDate: string | null;
  records: number | null;
  dataClasses: string[];
  description: string;
  verified: boolean;
  passwordRisk?: string;
}

export interface BreachNewsItem {
  id: string;
  name: string;
  domain: string;
  breachedDate: string;
  addedDate: string;
  industry: string;
  logo: string;
  records: number | null;
  dataClasses: string[];
  description: string;
  verified: boolean;
}

export interface PasteItem {
  id: string;
  email: string;
  title: string;
  source: string;
  pasteDate: string | null;
  records: number | null;
  dataClasses: string[];
}

export interface PasswordTag {
  breachId: string;
  tagLabel: string;
}

export interface CheckHistoryItem {
  email: string;
  lastCheckedAt: string;
  previousBreachIds: string[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  description: string;
  category: 'account' | 'password' | 'privacy' | 'financial' | 'device';
  completed: boolean;
}

export interface ActionItem {
  id: string;
  severity: SeverityLevel;
  title: string;
  detail: string;
  breachIds: string[];
  kind: 'password-group' | 'single';
}

export interface IpExposureInfo {
  ip?: string;
  org?: string;
  city?: string;
  region?: string;
  country_name?: string;
  timezone?: string;
  error?: string;
}

export interface PasswordCheckResult {
  count: number;
  length: number;
  hasDigit: boolean;
  hasLetter: boolean;
  hasSpecial: boolean;
}

export interface BrowserFingerprintData {
  userAgent: string;
  platform: string;
  language: string;
  languages: string[];
  screenResolution: string;
  colorDepth: number;
  timezone: string;
  cookiesEnabled: boolean;
  doNotTrack: string | null;
  hardwareConcurrency: number;
  deviceMemory: number | null;
  touchSupport: boolean;
  webglVendor: string;
  webglRenderer: string;
  canvasFingerprint: string;
  webrtcLeaked: boolean;
  webrtcLocalIPs: string[];
}

export interface PhishingCheckResult {
  url: string;
  safe: boolean;
  threats: string[];
  checkedAt: string;
}

export interface DatabaseExportPayload {
  exportedAt: string;
  breaches: BreachItem[];
  pastes?: PasteItem[];
  passwordTags: PasswordTag[];
  checkHistory: CheckHistoryItem[];
  checklist?: ChecklistItem[];
}
