import { ChecklistItem } from '../types';

export const DEFAULT_CHECKLIST: Omit<ChecklistItem, 'completed'>[] = [
  {
    id: 'enable-2fa-email',
    label: 'Enable two-factor authentication on your primary email',
    description: 'Your email is the master key to all your other accounts. If someone gains access, they can reset passwords everywhere. Add an authenticator app or hardware key.',
    category: 'account'
  },
  {
    id: 'enable-2fa-banking',
    label: 'Enable two-factor authentication on bank & financial accounts',
    description: 'Protect your financial accounts with an extra layer of security beyond just a password.',
    category: 'financial'
  },
  {
    id: 'use-password-manager',
    label: 'Start using a password manager',
    description: 'A password manager generates and stores unique, strong passwords for every account so you never need to reuse passwords again. Popular free options include Bitwarden and KeePass.',
    category: 'password'
  },
  {
    id: 'unique-passwords',
    label: 'Ensure every important account has a unique password',
    description: 'Never reuse the same password across different services. If one gets breached, attackers will try it on all your other accounts automatically.',
    category: 'password'
  },
  {
    id: 'change-breached-passwords',
    label: 'Change passwords exposed in known breaches',
    description: 'If any of your passwords appeared in a data breach, change them immediately — especially on accounts where you reused that same password.',
    category: 'password'
  },
  {
    id: 'review-app-permissions',
    label: 'Review app permissions on your phone and browser',
    description: 'Check which apps have access to your location, contacts, camera, and microphone. Remove permissions from apps that don\'t genuinely need them.',
    category: 'privacy'
  },
  {
    id: 'check-recovery-options',
    label: 'Verify account recovery options are up to date',
    description: 'Make sure your recovery email and phone number are current on important accounts like Google, Apple, and Microsoft — so you can regain access if locked out.',
    category: 'account'
  },
  {
    id: 'freeze-credit',
    label: 'Consider a credit freeze or fraud alert',
    description: 'If your government ID or Social Security Number was leaked, place a freeze on your credit reports with the major bureaus to prevent identity theft.',
    category: 'financial'
  },
  {
    id: 'review-connected-apps',
    label: 'Remove old third-party app connections',
    description: 'Review and revoke access from apps and services you no longer use that are connected to your Google, Facebook, Twitter, or GitHub accounts.',
    category: 'privacy'
  },
  {
    id: 'update-os-browser',
    label: 'Keep your operating system and browser updated',
    description: 'Security patches fix known vulnerabilities. Enable automatic updates on your devices and browser to stay protected against the latest threats.',
    category: 'device'
  },
  {
    id: 'secure-wifi',
    label: 'Secure your home WiFi network',
    description: 'Change the default router password, use WPA3 or WPA2 encryption, and consider hiding your network name (SSID) from public visibility.',
    category: 'device'
  },
  {
    id: 'phishing-awareness',
    label: 'Learn to recognize phishing emails and messages',
    description: 'Be suspicious of unexpected emails asking you to click links or enter passwords. Check sender addresses carefully and never enter credentials on unfamiliar websites.',
    category: 'privacy'
  }
];
