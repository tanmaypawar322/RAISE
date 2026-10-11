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

The platform separates access into dedicated user tracks with role-based routing and a strict access gate:

| Role | Panel Route | Demo Email | Password | What You Can Test |
|---|---|---|---|---|
| **🛡️ Admin** | `/admin` | `admin@raise.org` | `Admin@123` | KPI Dashboard, Review official claim requests, Moderation queue, Automated CPGRAMS & RTI draft generator |
| **🏛️ Official** | `/office-portal` | `officer.water@pcmc.gov.in` | `Officer@123` | Office SLA response clock, Acknowledge/Resolve issues, Publish official work & budget reports |
| **👤 Citizen** | `/dashboard` | `citizen@example.com` | `Citizen@123` | Track raised issues, View backed issues, Confirm resolution ✓ or Dispute incomplete work |

---

## 🔐 Access Gate & Authentication Configuration

RAISE operates behind a strict access gate ensuring zero exposure of civic feeds, maps, or issue details to unauthenticated visitors prior to sign-in.

### Environment Flags

| Flag | Default | Description |
|---|---|---|
| `APP_REQUIRE_LOGIN` | `true` | When `true`, every app route (feed, map, dashboards) requires an active session. Unauthenticated requests are intercepted at the server/edge level (`proxy.ts` / Next.js Proxy) and redirected to `/sign-in?next=<path>`. Deep links to `/office-portal` redirect directly to `/office/sign-in?next=/office-portal`. The API also returns `401 Unauthorized` for gated endpoints. If set to `false`, the platform rolls back seamlessly to the open public feed mode. |
| `PUBLIC_ISSUE_PAGES` | `false` | When `false` (default), shared issue links (e.g. WhatsApp / social share previews) require visitors to sign in before viewing. Before the public pilot, setting `PUBLIC_ISSUE_PAGES=true` allows read-only access to `/issues/[id]` while keeping all other routes gated. |
| `NEXT_PUBLIC_MARKETING_URL` | `http://localhost:3001` | URL of the public marketing website (`marketing/`). Auth pages link here for "Learn more about RAISE". |
| `NEXT_PUBLIC_APP_URL` | `http://localhost:3000` | URL of the web app (`frontend/`). The marketing site links its action buttons directly to `${NEXT_PUBLIC_APP_URL}/sign-in`, `/sign-up`, and `/office/request-access`. |

### Security & UX Principles
- **Zero Content Flash:** Edge request interception via Next.js `proxy.ts` verifies session cookies with `GET /api/auth/me` before rendering protected markup.
- **Open-Redirect Protection:** `?next=` parameters are strictly sanitized: protocol-relative URLs (`//evil.com`), backslashes, and external schemes are rejected; valid relative paths are preserved.
- **Noindex Protection:** All gated pages serve `X-Robots-Tag: noindex, nofollow` to prevent search engine crawler leakage.
- **Role Isolation:** Citizens opening `/office-portal` or `/admin` receive a clean 403 Forbidden screen (`/unauthorized`) explaining their role permissions, not a blank page.


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

---

## 💳 Subscription Plans, Citizen Donations & Financial Transparency

RAISE is an independent, non-profit civic grievance platform for India. Its credibility depends on uncompromising neutrality: **money must never influence what citizens can do or what the public sees.**

### Non-Negotiable Civic Neutrality Rules
1. **Citizens never pay for core features:** Reporting grievances, raising/supporting issues, tracking SLA clocks, CPGRAMS/RTI escalation drafts, commenting, and citizen dashboards are 100% free forever.
2. **Money never alters public outcomes:** Paid plans and donations have **zero** effect on issue ranking, issue visibility, moderation decisions, office scorecards, SLA clocks, or response records. Paid and unpaid offices render identical public pages and scorecards.
3. **Office Basic is free and always works:** Claiming an office profile, responding to issues, updating statuses, adding public notes, and publishing monthly reports are permanently free. Paid plans add internal workflow and analytics tools only.
4. **Safe lapse guarantee:** When an office subscription ends or payment fails, the office downgrades safely to Basic. Public records and past responses remain visible and unchanged. The office can always export its own data.
5. **Zero ads and zero tracking:** No commercial advertising, tracking SDKs, or sale of personal data.
6. **Donors receive zero civic power:** Donors receive no trust score boosts, no raise weighting increases (1 citizen = 1 raise), and zero moderation exemptions.
7. **Zero card credentials stored:** Hosted checkout only (Razorpay Checkout / Payment Pages). No card numbers, CVVs, or UPI PINs ever touch platform servers.
8. **Air-gapped feature flags:** All billing and donation features are disabled by default (`BILLING_ENABLED=false`, `DONATIONS_ENABLED=false`). When disabled, payment endpoints return 404 and payment UI is completely hidden.
9. **Integer paise only:** All currency values are strictly stored as integer paise (`amountPaise: number`) in Indian Rupees (INR) to eliminate floating-point rounding errors.
10. **Statutory audit trail:** Every subscription change, invoice creation, payment capture, refund, and ledger entry is permanently recorded to `AuditLog`.

---

### Subscription Plans & Entitlements

| Plan Key | Tier | Target | Cost | Capabilities |
|---|---|---|---|---|
| `citizen` | Citizen | All citizens | Free forever | Unlimited reporting, raising, tracking, CPGRAMS/RTI drafts, comments, and citizen dashboard. |
| `office_basic` | Basic | Municipal & Ward Offices | Free forever | Claim profile, official responses, status updates, public notes, monthly report publishing, unmetered data export. |
| `office_pro` | Pro | Department HQ & Field Teams | ₹2,999/mo | All Basic features + 25 staff seats, internal ticket assignments, SLA automation bots, and response analytics. |
| `agency` | Partner | Contractors & Agencies | ₹4,999/mo | All Pro features + 50 staff seats, multi-contractor dispatch, SLA escalation webhooks, and executive KPI reports. |
| `institution` | Enterprise | Ministries & Research Bodies | Custom / PO | Unlimited seats, custom API data pipelines, cross-jurisdiction analysis, and dedicated training. |

#### Government Purchase Orders & Offline Invoicing
Government offices and municipal corporations requiring purchase order / offline payment workflows can be provisioned by platform administrators at `/admin/billing`. The platform automatically generates sequential GST tax invoices (`RAISE/INV/2026-27/000001`) with complete CGST, SGST, and IGST breakdowns.

---

### Citizen Donations & Monthly Recurring Supporters

Citizens can voluntarily support the platform at `/support`:
- **Preset options:** ₹50, ₹100, ₹500, ₹1,000, or custom amount (minimum ₹10, maximum online cap ₹10,00,000).
- **Contribution modes:** One-time contribution or monthly recurring supporter.
- **Mandatory statutory declarations:** Donors must declare that they are not donating on behalf of a political party/candidate, and confirm FCRA non-foreign funding compliance.
- **Indian PAN encryption:** When Section 80G tax receipts are requested, PAN numbers are encrypted at rest using AES-256-GCM (`panEnc`) and masked for display (`••••••1234`).
- **Sequential 80G receipts:** Webhook payment captures atomically issue sequential donation receipts (`RAISE/DON/2026-27/000001`) with print-ready HTML receipts.
- **Self-serve cancellation:** Monthly supporters can pause or cancel recurring contributions at any time at `/support/manage?token=...` without needing support intervention.

---

### Public Financial Transparency Ledger (`/transparency`)

In keeping with non-profit public accountability, RAISE publishes a live financial ledger at `/transparency`:
- **Automated Inflow Reconciliation:** Paid citizen donations and subscription invoices are aggregated in real time.
- **Audited Operational Outflow:** Server hosting, SMS gateways, legal compliance, and CA audit fees are publicly tracked.
- **12-Month Trailing Concentration Safeguard:** Automatically flags any single funder contributing > 25% of operating revenue. If no single funder exceeds 25%, displays verified decentralized grassroot funding status.
- **Data Export:** Complete public ledger downloadable as CSV (`/api/finance/public-ledger/export-csv`).
- **Administrative Ledger Management:** Administrators can record and audit operational expenses at `/admin/finance`.

---

### Payment Provider Configuration & Dev Mode

The payment integration is architected behind the `IPaymentProvider` interface:
- **`MockPaymentProvider`:** Enabled by default (`PAYMENT_PROVIDER=mock`). Simulates order creation, subscription tokens, and webhook payloads without external network calls.
- **`RazorpayProvider`:** Enabled for staging/production (`PAYMENT_PROVIDER=razorpay`). Interacts with Razorpay Orders and Subscriptions API using native fetch and HMAC-SHA256 signature verification.

#### Webhook Endpoint
The unified webhook receiver is mounted at:
`POST /api/payments/webhook`
- Requires raw request buffer for HMAC-SHA256 signature validation against `X-Razorpay-Signature`.
- Validates idempotency against `WebhookEvent` model via `providerEventId` to prevent duplicate processing.

---

### Go-Live Statutory & Trustee Checklist

Complete this checklist prior to enabling `BILLING_ENABLED=true` or `DONATIONS_ENABLED=true` in production:

1. [ ] **Legal Entity & Bank Account:** Confirm non-profit Section 8 Trust/Society incorporation and operational Indian bank account.
2. [ ] **PAN Cryptography Key:** Generate a unique 32-byte (64 hex characters) `PAN_ENC_KEY` in environment secrets.
3. [ ] **Section 80G & 12A Status:** Set `ORG_80G_ENABLED=true` only after receiving the official 80G registration certificate from the Income Tax Department; configure `ORG_80G_REG_NO` and `ORG_12A_REG_NO`.
4. [ ] **FCRA Compliance:** Confirm `FCRA_ENABLED=false` until MHA approval is obtained. Ensure foreign cards/currencies are disabled in payment gateway settings.
5. [ ] **Statutory CA Review:** Have platform legal counsel and chartered accountant review the print-ready invoice and donation receipt wording in `InvoiceService` and `DonationService`.
6. [ ] **Razorpay Webhook Configuration:** Register webhook URL `https://api.raise-india.org/api/payments/webhook` in Razorpay Dashboard for events `order.paid`, `payment.captured`, and `subscription.charged` with a strong secret key matching `RAZORPAY_WEBHOOK_SECRET`.
7. [ ] **Feature Flag Activation:** Set `BILLING_ENABLED=true` and `DONATIONS_ENABLED=true` in production environment variables.

