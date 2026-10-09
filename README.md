# RAISE — Report • Amplify • Inform • Solve • Escalate
### लोकआवाज (Citizen Voice Platform)

> **Neutral, Transparent, and Non-Partisan Civic Accountability Platform**  
> **R**eport • **A**mplify • **I**nform • **S**olve • **E**scalate  
> *Pilot Region: Pimpri-Chinchwad & Pune, Maharashtra*

Read the full strategy, legal framework, and 4-phase rollout in [`MASTER_PLAN.md`](./MASTER_PLAN.md).

---

## 🏛️ Project Architecture

This repository is organized into three decoupled standalone directories:

```
RAISE/
├── MASTER_PLAN.md          # Complete Master Strategy, Principles & Roadmap
├── README.md               # Quickstart guide
├── backend/                # Node.js + Express + TypeScript REST API (Port 5000)
│   ├── src/
│   │   ├── config/         # Environment & MongoDB configuration
│   │   ├── models/         # Mongoose schemas (User, Issue, Office, Raise, Moderation)
│   │   ├── modules/        # Domain controllers & routes (auth, issues, offices, moderation)
│   │   ├── services/       # Pluggable OTP & EXIF-stripping Storage services
│   │   └── scripts/        # Database seed script for PCMC pilot offices
│   └── package.json
│
├── frontend/               # Next.js App Router + Tailwind CSS PWA (Port 3000)
│   ├── src/
│   │   ├── app/
│   │   │   ├── page.tsx            # Public Citizen Feed & Rapid Reporting
│   │   │   ├── dashboard/page.tsx  # 👤 Citizen Panel (My Raised & Backed Issues)
│   │   │   ├── office-portal/      # 🏛️ Public Office Portal (SLA Clock & Action Queue)
│   │   │   └── admin/page.tsx      # 🛡️ Platform Admin & Moderation Panel
│   │   ├── components/     # Header, IssueCard, RaiseModal (<60s flow), AuthModal
│   │   ├── context/        # Multilingual & Credentials Auth state
│   │   └── lib/            # Translations (मराठी, हिंदी, English)
│   └── package.json
│
└── marketing/              # Next.js Marketing & Public Trust Website (Port 3001)
    ├── src/
    │   └── app/            # Mission, Charter, DPDP/IT Act compliance, Volunteer signup
    └── package.json
```

---

## 👥 Three Dedicated Panels & Demo Accounts

The platform includes 1-click test login buttons or manual sign-in credentials for all three roles:

| Role | Panel Route | Demo Email | Password | What You Can Test |
|---|---|---|---|---|
| **🛡️ Admin** | `/admin` | `admin@raise.org` | `Admin@123` | KPI Dashboard, Review official claim requests, Moderation queue, Automated CPGRAMS & RTI draft generator |
| **🏛️ Official** | `/office-portal` | `officer.water@pcmc.gov.in` | `Officer@123` | Office SLA response clock, Acknowledge/Resolve issues, Publish official work & budget reports |
| **👤 Citizen** | `/dashboard` | `citizen@example.com` | `Citizen@123` | Track raised issues, View backed issues, Confirm resolution ✓ or Dispute incomplete work |

---

## 🚀 Quick Start Guide

### 1. Backend API (`backend/`)
```bash
cd backend
# 1. Ensure dependencies are installed
npm install

# 2. Build or start in dev mode (uses mock OTP 123456 for fast testing)
npm run dev
```
- API will be live at: `http://localhost:5000`
- Health check: `http://localhost:5000/api/health`
- Seed pilot offices: `npm run seed`

### 2. Citizen Web App & PWA (`frontend/`)
```bash
cd frontend
npm run dev
```
- Web App will run at: `http://localhost:3000`
- Supports Marathi, Hindi, and English with instant switching.
- Test login with any 10-digit number and mock OTP `123456`.

### 3. Public Marketing & Legal Trust Portal (`marketing/`)
```bash
cd marketing
npm run dev
```
- Marketing site will run at: `http://localhost:3001`

---

## 🔒 Core Non-Negotiables
1. **Neutral & Non-Partisan:** 100% independent; zero political party funding.
2. **Safe for Citizens:** Phone OTP with hashed storage, pseudonymous profiles, EXIF metadata scrubbed from photos.
3. **Evidence Over Noise:** Issues require geotagging, date, and photo or audio voice notes.
4. **Offices, Not Individuals:** Issues target administrative departments, not named individuals.

---

## 📍 Single-Ward Pilot: Pimpri-Chinchwad Ward 12 (Nigdi - Pradhikaran)

The first live pilot runs in **Ward 12 (Nigdi - Pradhikaran)** of Pimpri-Chinchwad Municipal Corporation (PCMC).

### Seed Pilot Ward Data
```bash
cd backend
npm run seed:pilot
```

### Seeded Offices & Contacts for Pilot:
1. **PCMC Ward 12 Field Office (Nigdi - Pradhikaran):**
   - Head/Inspector: `inspector.ward12@pcmc.gov.in` (Password: `Officer@123`, Phone: `+919876500012`)
   - Departments: Roads, Sanitation, General | SLA: 48 hours
2. **PCMC Water Supply Division (Zone A & Ward 12):**
   - Executive Engineer: `ee.water@pcmc.gov.in` (Password: `Officer@123`, Phone: `+919876500013`)
   - Department: Water | SLA: 48 hours
3. **PCMC Central Grievance Redressal Cell (Corporation HQ):**
   - Grievance Officer: `grievance.hq@pcmc.gov.in` (Password: `Officer@123`, Phone: `+919876500014`)
   - Department: HQ Escalation | SLA: 72 hours

### Citizen Pilot Accounts:
1. `aditya.pawar@example.com` / `Citizen@123` (Phone: `+919876543210`) — Sector 24, Pradhikaran
2. `sunita.kamble@example.com` / `Citizen@123` (Phone: `+919876543211`) — Akurdi Station

---

## ✈️ Pilot Pre-Flight Checklist (Before Real Ward Launch)

Before deploying to production and onboarding real citizens and officials in Ward 12:

- [ ] **1. Authentication & Safeguards:**
  - [ ] Decide on `AUTH_REQUIRE_EMAIL_VERIFICATION` vs `AUTH_REQUIRE_PHONE_TO_RAISE` before public launch.
  - [ ] Verify `OTP_DEV_FIXED_CODE` is completely disabled / unset in production.
  - [ ] Verify `DEV_SKIP_OFFICIAL_SECOND_FACTOR` is disabled (backend fails startup if set in production).
  - [ ] Verify `DEV_MAILBOX` is disabled (backend fails startup if enabled in production).
  - [ ] Confirm Cloudflare Turnstile keys (`TURNSTILE_SECRET_KEY` and `NEXT_PUBLIC_TURNSTILE_SITE_KEY`) are active on register, login, and forgot-password endpoints.

- [ ] **2. Cryptographic Secrets & Environment:**
  - [ ] Strong `JWT_SECRET` configured (min 32 bytes).
  - [ ] Unique `PHONE_ENCRYPTION_KEY` and `EMAIL_ENCRYPTION_KEY` set (AES-256-GCM 32-byte hex/string).
  - [ ] Unique `PHONE_HASH_SECRET` and `EMAIL_HASH_SECRET` set (HMAC-SHA256 secrets).

- [ ] **3. DPDP Act 2023 & Privacy:**
  - [ ] Test self-serve data download (`GET /api/auth/export-data`) on citizen dashboard.
  - [ ] Verify self-serve account deletion (`POST /api/auth/delete-account`) purges PII, increments `tokenVersion`, and invalidates sessions.
  - [ ] Confirm EXIF metadata stripping is functional on uploaded issue and resolution photos.
  - [ ] Confirm designated Grievance Officer statutory disclosure is published at `/grievance-redressal`.

- [ ] **4. SLA Engine & Notifications:**
  - [ ] Cron schedule active for `EscalationService.runEscalationCheck()` (hourly SLA clock runner).
  - [ ] Verify IST Quiet Hours (`21:00` to `08:00` IST) suppress non-critical SMS alerts.
  - [ ] Verify SMS dispatch is strictly capped to the 3 high-value citizen events (`issue_acknowledged`, `issue_resolved_pending_confirmation`, `issue_disputed`).
  - [ ] Confirm SMS messages contain strictly ZERO PII.

- [ ] **5. Ward 12 Boundary & Routing:**
  - [ ] Confirm `WARD-12` GeoJSON polygon coordinates match the municipal boundary.
  - [ ] Verify test submissions at Akurdi Station and Pradhikaran accurately route to PCMC Ward 12 Field Office.

---

## 🌅 Pilot Morning Checklist (10 Items to Verify on Launch Day)

Complete this 10-point checklist at 08:30 AM IST before admitting live citizens and field officials:

1. [ ] **Database Connectivity:** Query `GET /ready` (or `GET /api/ready`) and confirm response status is `200 ready` with active MongoDB ping.
2. [ ] **SMS Gateway & Account Balance:** Check Twilio/SMS provider balance and verify sender ID registration for DLT compliance in India.
3. [ ] **Cloudflare Turnstile Protection:** Ensure Turnstile site key and secret key are valid and actively preventing bot spam on public endpoints.
4. [ ] **Dev Mailbox & Test Artifacts:** In non-prod testing environments, clear `/api/dev/mailbox`; ensure `DEV_MAILBOX` is strictly `false` for any production rollout.
5. [ ] **Fixed Codes Disabled:** Confirm `OTP_DEV_FIXED_CODE` and `DEV_SKIP_OFFICIAL_SECOND_FACTOR` are removed/unset so real authentication enforcement applies.
6. [ ] **Ward 12 Routing Accuracy:** Run a quick test location check (`POST /api/issues/suggest-office` with `[73.784, 18.652]`) ensuring Ward 12 Field Office is resolved.
7. [ ] **Escalation Engine Heartbeat:** Verify `EscalationService.startScheduler()` is ticking and can successfully trigger without unhandled rejections.
8. [ ] **PWA Offline Fallback & Assets:** Check that `/manifest.json`, `sw.js`, and `/offline.html` load with HTTP 200 and cache properly on mobile Chrome/Safari.
9. [ ] **Quiet Hours Clock:** Verify server time is synced with UTC and IST conversion accurately detects `21:00 - 08:00 IST` for quiet notification suppression.
10. [ ] **Standup CSV Export:** Confirm `GET /api/admin/metrics/export-csv` generates clean, downloadable metrics CSV for the 10:00 AM ward team standup.

