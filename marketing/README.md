# RAISE Public Marketing Website (`marketing/`)

The public-facing marketing and information website for **लोकआवाज RAISE** (*Report • Amplify • Inform • Solve • Escalate*). 

Because the primary civic application (`frontend/`) is gated behind authentication (`APP_REQUIRE_LOGIN=true`), this marketing website serves as the single public entry point where citizens, community leaders, and municipal authorities discover what RAISE is, inspect its non-partisan principles, and enter the platform.

---

## 🏛️ Architecture & Pages

The site is built with Next.js (App Router, Tailwind CSS, TypeScript) and generates full static HTML pre-rendered across three regional languages: **English (`en`)**, **मराठी (`mr`)**, and **हिंदी (`hi`)**.

| Route | Purpose & Description |
|---|---|
| `/[lang]` | **Home:** The core promise, 5-stage R-A-I-S-E overview, dual Citizen/Office track splits, non-partisan charter, labelled sample screenshots, and FAQ teaser. |
| `/[lang]/how-it-works` | **How It Works:** In-depth breakdown of ground evidence (photo, GPS, audio), 1-person 1-raise rule, SLA response clocks, after-photo proof requirement, and statutory CPGRAMS/RTI escalation. |
| `/[lang]/for-citizens` | **For Citizens:** Citizen capabilities, 100% free guarantee, pseudonymous/anonymous protections, and plain-language community guidelines. |
| `/[lang]/for-offices` | **For Offices & Agencies:** Benefits of a verifiable public record, automated routing, free official response guarantee, identity verification steps, and authorized contractor agency roles. |
| `/[lang]/privacy-and-safety` | **Privacy & Safety:** Data minimization, zero PII public disclosure, automatic device EXIF metadata scrubbing, right to erasure, and claim-gated statutory statements. |
| `/[lang]/faq` | **FAQ:** 14 accessible, keyboard-navigable WAI-ARIA accordion Q&As addressing common questions on cost, anonymity, escalation, and governance. |
| `/[lang]/about` | **About:** Mission statement, non-partisan governance charter, and operational commitments. |
| `/[lang]/contact` | **Contact:** Support contact email and statutory grievance officer placeholder. |
| `/_not-found` | **404 Page:** Branded error screen directing visitors back home or to the app sign-in. |

---

## ⚖️ Non-Negotiable Claims System (`content/claims.ts`)

To ensure absolute credibility, **zero unverified factual claims, legal registrations, or partnership statements may appear on public marketing pages**.

All sensitive claims are registered in [`content/claims.ts`](./content/claims.ts) with `verified: false` by default:

```typescript
export const claims: Record<string, ClaimEntry> = {
  section8_registration: {
    id: 'section8_registration',
    verified: false, // Remains false until confirmed by project lead
    notes: 'Pending confirmation of Certificate of Incorporation under Section 8.',
    // ...
  },
  // ...
};
```

### The `<Claim />` Component
Use `<Claim id="..." fallback="..." />` in any page:
- If `verified: true`: Renders the approved localized claim text.
- If `verified: false`: Renders the neutral `fallback` node (or nothing).

### Verification Script (`npm run check:claims`)
Run the claims audit before deployments:
```bash
npm run check:claims
```
To fail the build if any unverified claim is used without a fallback, set:
```bash
CLAIMS_STRICT=true npm run check:claims
```

---

## 🌐 Editing Page Copy & Translations (`content/i18n/`)

All user-facing copy is decoupled from React components into strongly-typed language dictionaries:
- [`content/i18n/en.ts`](./content/i18n/en.ts) — English (Canonical)
- [`content/i18n/mr.ts`](./content/i18n/mr.ts) — Marathi (Native phrasing)
- [`content/i18n/hi.ts`](./content/i18n/hi.ts) — Hindi (Native phrasing)
- [`content/i18n/types.ts`](./content/i18n/types.ts) — TypeScript schema

### Checking Translation Completeness
Verify that all keys are synchronized across all 3 languages:
```bash
npm run check:i18n
```

---

## ⚙️ Environment Variables

Create or edit `.env.local`:

```env
# URL of the gated web application (REQUIRED; fails build if missing in production)
NEXT_PUBLIC_APP_URL=http://localhost:3000

# Base URL of this marketing site (used for sitemaps, robots.txt, and metadata)
NEXT_PUBLIC_MARKETING_URL=http://localhost:3001

# Public support contact email
NEXT_PUBLIC_CONTACT_EMAIL=support@lokawaaz-raise.org

# Optional Cookie-less Analytics (strictly disabled by default)
NEXT_PUBLIC_ANALYTICS_ENABLED=false

# Strict claims check in CI / pre-flight
CLAIMS_STRICT=false

# Optional Statutory Grievance Officer details (rendered on /contact when configured)
NEXT_PUBLIC_GRIEVANCE_OFFICER_NAME=
NEXT_PUBLIC_GRIEVANCE_OFFICER_EMAIL=
NEXT_PUBLIC_GRIEVANCE_OFFICER_ADDRESS=
```

---

## 🚀 Running and Testing

```bash
# 1. Install dependencies
npm install

# 2. Run unit and claims tests
npm test

# 3. Verify claims and i18n dictionaries
npm run check:claims
npm run check:i18n

# 4. Production build
npm run build

# 5. Start production server on port 3001
npm run start

# 6. Capture full desktop & mobile screenshot suite
npm run screenshots
```
