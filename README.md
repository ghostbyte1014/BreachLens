# BreachLens 🔍

> **Personal data breach intelligence dashboard** — check email exposure, scan websites, monitor dark web pastes, and get a prioritized action plan. 100% client-side, zero accounts, zero servers.

---

## What is BreachLens?

BreachLens is an open-source personal security dashboard that helps you understand and fix your digital exposure across known data breaches. It aggregates breach intelligence from public databases, calculates a real-time security score, and gives you a concrete, prioritized checklist to lock down your accounts — all without ever sending your personal data to a server.

Everything runs **entirely in your browser**. Your breach history, tags, and settings are stored in your browser's local IndexedDB — never uploaded anywhere.

---

## Features

### 🛡️ Security Score

A live 0–100 score calculated from your breach count and severity, unresolved actions, password reuse groups, dark web paste exposure, and checklist completion. Includes a visual gauge and breakdown of what's affecting your score.

### 📧 Email Breach Check

Search any email address against the XposedOrNot breach database. Results are ranked by severity (critical → low) based on what type of data was exposed. Previously checked emails are stored locally so you can track new breaches over time.

### 🌐 Website / Service Breach Check

Type any website or app name (e.g. `adobe.com`, `canva`) to instantly see all known breaches associated with that service, including the date, affected data types, and record count.

### ✅ Prioritized Action List

Automatically generated from your breach data — tells you exactly what to do first. Actions are ranked by real risk: exposed passwords and sensitive ID data take priority over lower-risk leaks.

### 📋 Security Hardening Checklist

A 12-step interactive guide covering account security, password hygiene, financial safety, privacy protection, and device hardening. Progress is saved locally and feeds into your Security Score.

### 🌑 Dark Web Paste Monitor

Checks hacker paste sites and dark-web text dumps for raw records tied to your email address via the XposedOrNot paste analytics API.

### 🔑 Password Checker

Checks whether a password has appeared in known breach dumps using the HIBP k-anonymity API (Pwned Passwords). SHA-1 hashing occurs entirely in the browser via the Web Crypto API — your actual password is **never sent** over the network.

### 🌍 IP Connection Footprint

Shows what any website can instantly learn about you from your IP address alone: ISP, city, region, country, and timezone — fetched from ipapi.co.

### ⚡ Password Reuse Detector

Tag breaches with password labels (e.g. "Work Password A") to group accounts that share the same password. Visualises your full blast radius — if one account is compromised, which others are at risk?

### 🔎 Browser Fingerprint Check

Reveals what tracking information your browser passively leaks: user agent, screen resolution, WebGL vendor/renderer, canvas fingerprint, hardware concurrency, device memory, touch support, and — critically — **WebRTC local IP leaks** that can bypass VPNs.

### 🎣 Phishing Link Scanner

Paste any suspicious URL to instantly run 9 heuristic checks:

- HTTPS enforcement
- Raw IP address detection
- Suspicious TLD detection (`.tk`, `.xyz`, `.buzz`, etc.)
- Excessive subdomain depth
- Brand impersonation (Google, Apple, PayPal, Microsoft, etc.)
- IDN homograph / lookalike character detection
- URL length analysis
- Phishing keyword patterns
- Non-standard port detection

All checks run locally — no external requests made.

### 📰 Breach News Feed

Live feed of the most recently reported breaches globally, pulled from the XposedOrNot breach database. Click any entry to immediately check whether that service's domain was involved.

### 📊 Breach History Chart

SVG bar chart showing your personal breach timeline by year, with critical breaches highlighted separately so you can see which years were the worst.

### 💾 Data Management

Export your entire local database (breaches, paste records, tags, history, checklist state) as a JSON file. Import it back on any device. Wipe all local data with one click.

---

## Privacy Guarantees

| What                                   | Detail                                                                             |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| **No accounts required**         | No sign-up, no login, no email verification                                        |
| **No backend server**            | The app is 100% static HTML/JS — nothing to hack                                  |
| **No tracking or analytics**     | No Google Analytics, no telemetry, no cookies                                      |
| **No raw password transmission** | Password checks use k-anonymity — only the first 5 chars of a SHA-1 hash are sent |
| **Local-only storage**           | All your data lives in your browser's IndexedDB                                    |
| **Full data portability**        | Export and delete your data whenever you want                                      |

---

## Tech Stack

| Layer         | Technology                                  |
| ------------- | ------------------------------------------- |
| Framework     | React 18 + TypeScript                       |
| Build tool    | Vite 6                                      |
| Styling       | Tailwind CSS v3                             |
| Local storage | IndexedDB via`idb`                        |
| Fonts         | IBM Plex Serif / Sans / Mono (Google Fonts) |
| Icons         | Lucide React                                |

### APIs Used (all free, no API key required)

| API                                                                     | Purpose                                  | Privacy                                      |
| ----------------------------------------------------------------------- | ---------------------------------------- | -------------------------------------------- |
| [XposedOrNot](https://xposedornot.com/api_doc)                           | Email breach lookup & paste monitoring   | Email hashed before lookup                   |
| [XposedOrNot Breaches](https://xposedornot.com/api_doc)                  | Website/domain breach search + news feed | Domain name only                             |
| [HIBP Pwned Passwords](https://haveibeenpwned.com/API/v3#PwnedPasswords) | Password exposure check                  | k-anonymity — only 5-char SHA-1 prefix sent |
| [ipapi.co](https://ipapi.co)                                             | IP geolocation footprint                 | Your IP (same as any website visit)          |

---

## Getting Started

### Prerequisites

- Node.js 18+
- npm 9+

### Install & Run

```bash
git clone https://github.com/ghostbyte1014/BreachLens.git
cd BreachLens
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
```

Output is in `dist/` — deploy to any static host (Netlify, Vercel, GitHub Pages, Cloudflare Pages).

---

---

### Free threat-intelligence checks

The Threat Intelligence page can use free security services to check suspicious links, IP addresses, website email settings, certificates, and known software issues. For the optional link and IP checks, set up the small free service described in [worker/README.md](worker/README.md). It keeps your free service keys private instead of placing them in the website.

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you'd like to change.

1. Fork the repo at [github.com/ghostbyte1014/BreachLens](https://github.com/ghostbyte1014/BreachLens)
2. Create your feature branch: `git checkout -b feature/your-feature`
3. Commit your changes: `git commit -m 'Add your feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Disclaimer

BreachLens is a personal security awareness tool. It relies on publicly available breach databases and cannot guarantee complete coverage of all breaches. A "no results" response does not mean an email address has never been compromised — it means no record was found in the indexed public databases. Always practice good security hygiene regardless of results.
