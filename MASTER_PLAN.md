# RAISE: Master Plan
### *Report • Amplify • Inform • Solve • Escalate*

*Official Name: RAISE. Version 1.1, 7 Oct 2026.*

---

## 0. Assumptions in this plan

| Item | Assumption | Why it matters |
|---|---|---|
| Builder | Solo developer | Scope is cut hard; phases are small |
| Time available | ~10 hours/week | Realistic timelines; double the hours roughly halves them |
| Pilot area | One ward or village cluster in or near Pimpri-Chinchwad / Pune | Hyperlocal focus before statewide scaling |
| Organisation | Non-profit, fully independent of government and parties | Shapes funding, trust and legal setup |
| Government data | The platform does **not** paste or import government data. Authorities create their own accounts and publish their own reports and responses | Core design rule |
| Legal | Built and tested locally first; legal setup completed **before the first real public user** | Crucial liability and intermediary protection |

---

## 1. Vision and Principles

**Vision:** A neutral, transparent channel through which any citizen, from a village to a metro, can raise a problem, show how many others share it, and see whether the responsible authority responds.

**The RAISE Framework:**
- **R — Report:** Citizens report civic grievances with photos, GPS, or voice notes in under 60 seconds.
- **A — Amplify:** Community members and neighbors back the issue, proving collective demand and urgency.
- **I — Inform:** Designated public offices and the wider locality are transparently notified.
- **S — Solve:** Responsible administrative offices acknowledge, take action, and resolve issues with public timelines.
- **E — Escalate:** If authorities fail to act, 1-tap statutory escalations (CPGRAMS complaints, RTI drafts, higher offices) trigger automatically.

**Purpose:** Better governance, transparency and accountability, so that every citizen's basic needs (roads, water, schools, health, fair wages, fair prices) get attention.

**Principles:**
1. **Neutral:** No party, no ideology. The platform carries voices; it does not take sides.
2. **Independent:** It works even if no authority cooperates.
3. **Evidence over noise:** Issues need evidence (photo, location, date); claims are checked and labelled.
4. **Offices, not individuals:** Issues target an office or department, not a named person.
5. **Safe for citizens:** Raising an issue must never expose a person to retaliation.
6. **Simple for everyone:** Usable by a first-time smartphone user in a regional language.
7. **Transparent about itself:** Publish our own funding, moderation rules and takedown decisions.

---

## 2. Users and Roles

| Role | Who | Main actions |
|---|---|---|
| **Citizen** | Everyone: villagers, farmers, students, workers, urban residents | Raise issues, "raise" (support) others' issues, confirm or dispute, follow status |
| **Verified Official** | Account of an **office** (gram panchayat, ward office, department, ministry) | Claim office profile, respond, update status, publish reports |
| **Moderator** | Trained volunteers / small paid team later | Review reports and flagged content, label claims |
| **Admin** | Initial platform maintainer | Verify officials, handle legal requests, system settings |
| **Political Party / Candidate (Phase 4)** | Verified party and candidate accounts | Publish manifestos, post progress |

---

## 3. Core Product Mechanics

### 3.1 Issue Lifecycle
`Draft → Submitted → Under review (moderation) → Published → Acknowledged (office has seen it) → In progress → Resolved / Rejected (with reason) → Citizen confirmation`

- An issue can be reopened if citizens dispute the resolution.
- Every status change is timestamped and shown on a public timeline.

### 3.2 Raising an Issue (target: under 60 seconds)
- Photo/video (optional but encouraged), auto-detected location (editable), category, short text or **voice note**.
- The platform suggests the responsible office using the location and category.
- Duplicate detection: if a similar issue exists nearby, offer to "raise" it instead of creating a new one.

### 3.3 "Raise" (Support) Mechanic
- One person, one raise per issue; requires phone-verified account.
- Ranking uses raise count, recency, and number of **distinct localities/people**, not just totals, to resist brigading.
- Raises from a user's own area count for more than far-away raises (configurable weighting).

### 3.4 Jurisdiction Hierarchy
`Gram Panchayat / Ward → Taluka / Zone → District / Municipal Corporation → State → Centre`, plus department tags (Roads, Water, Education, Health, Agriculture, Labour, Consumer, etc.). Modelled as structured data from day one.

### 3.5 Office Profiles and Claiming
- The platform creates **unclaimed office profiles** (name, level, jurisdiction only; no scraped government data).
- Citizens tag issues to them; each profile shows: issues raised, citizens supporting, days without response, "Office not yet on the platform".
- An office **claims** its profile through verification and responds directly.
- Unclaimed offices get notified (email/letter) when issue counts cross thresholds.

### 3.6 Official Verification
- Official email domain (`.gov.in` / `.nic.in`) plus an official designation letter, reviewed manually at first.
- Accounts belong to the **office**, not the person, so staff changes do not break continuity.
- "Verified official" badge only after approval; audit-logged.

### 3.7 Official Reports and Citizen Cross-check
- Authorities publish periodic reports (work done, spending, scheme status) on their profiles.
- Citizens can **confirm** or **dispute** specific claims with evidence. Community response appears alongside.

### 3.8 Escalation (works even if offices ignore the platform)
- "Response clock" on every issue.
- One-tap tools to escalate through existing channels: pre-filled CPGRAMS complaint text, RTI application draft, formal email to the officer, consumer complaint draft.
- Escalation ladder: ward → higher office → department head → state.

### 3.9 Scorecards (Phase 2+)
Per office: response rate, median time to acknowledge, median time to resolve, citizen satisfaction. Factual, published methodology.

---

## 4. Feature Roadmap by Phase

| Feature | MVP (Ph 1) | Ph 2 | Ph 3 | Ph 4 |
|---|---|---|---|---|
| Phone OTP login, pseudonymous profile | ✔ | | | |
| Raise issue (photo, geo, voice, text) | ✔ | | | |
| Unclaimed office profiles (pilot area) | ✔ | | | |
| "Raise" support, ranking | ✔ | | | |
| Public issue page + WhatsApp share | ✔ | | | |
| Report button + moderation queue | ✔ | | | |
| Multi-language (EN/HI/MR) | ✔ | | | |
| Official claim & verification | | ✔ | | |
| Official responses, status updates | | ✔ | | |
| Escalation tools (CPGRAMS/RTI/email) | | ✔ | | |
| Office scorecards | | ✔ | | |
| Official reports + citizen cross-check | | | ✔ | |
| Notifications (SMS/WhatsApp/push) | | ✔ | | |
| Consumer complaints module | | | ✔ | |
| Farmer/worker/student issue categories & groups | | | ✔ | |
| Manifestos + promise tracker | | | | ✔ |
| Party/candidate verified accounts | | | | ✔ |
| Data dashboards from published office data | | | ✔ | ✔ |

---

## 5. Trust, Safety and Moderation

**Never allowed:** violence/incitement, sexual content, hate speech, doxxing/naming private individuals, fake or manipulated media, spam, propaganda and coordinated disinformation.

**Pipeline:**
1. **Pre-publish automated checks:** image/video nudity/violence classifier, text toxicity/hate screening, link and spam checks.
2. **Evidence requirement:** location + date; media metadata checked where available.
3. **Community verification:** nearby users can "confirm this issue".
4. **Report button:** flagged items route to moderation queue.
5. **Labels:** `Verified by citizens`, `Unverified claim`, `Disputed`, `Resolved`.
6. **Human review:** trained local volunteers; transparent rules and takedown logs.
7. **Rules for officials:** public, office-signed replies with tamper-proof edit histories.

---

## 6. Security and Privacy

- **Data minimisation:** Phone number (OTP), approximate location. **No Aadhaar or government ID.**
- **Protection of citizens:** Optional anonymous posting (identity visible only to tiny set of admins, logged); EXIF/GPS stripped from public media; officials never see citizens' phone numbers.
- **Technical controls:** HTTPS, HSTS, secure cookies, CSRF/XSS protection, rate-limiting, encrypted phone numbers with hashed lookup, object storage with signed URLs, regular backups.
- **Compliance:** DPDP Act principles (consent, purpose limitation, deletion), CERT-In reporting readiness.

---

## 7. Technical Architecture & Project Structure

### 7.1 Architecture Principle
**Modular Monorepo / Multi-Folder Architecture:** Keeping backend, frontend application, and public marketing website distinct for clean development, testing, and independent deployment.

```
RAISE/
├── MASTER_PLAN.md               # Master Plan & Architecture Specification
├── backend/                     # Node.js/Express (or NestJS) REST API & Workers
│   ├── src/
│   │   ├── modules/             # auth, issues, offices, moderation, notifications
│   │   ├── models/              # MongoDB Schemas (users, issues, offices, etc.)
│   │   ├── services/            # OTP, storage, geo, duplicate detection
│   │   └── middlewares/         # RBAC, rate-limiting, error handling
│   ├── package.json
│   └── tsconfig.json
├── frontend/                    # Core Web App & PWA (Next.js / React)
│   ├── src/
│   │   ├── app/ (or pages/)     # Citizen feed, issue submission, office profiles
│   │   ├── components/          # UI, maps, voice recorder, image uploader
│   │   ├── locales/             # i18n (en, mr, hi)
│   │   └── hooks/               # Geolocation, offline sync, auth
│   ├── package.json
│   └── tailwind.config.js
└── marketing/                   # Marketing & Outreach Website (Next.js or Astro)
    ├── src/
    │   ├── pages/               # Landing page, Vision, FAQ, Volunteer signup, Trust/Legal
    │   └── components/          # Explainer graphics, impact counters, language switcher
    ├── package.json
    └── tailwind.config.js
```

### 7.2 Technology Stack
| Layer | Choice | Notes |
|---|---|---|
| **Frontend App** | Next.js (App Router) + Tailwind CSS | Mobile-first PWA, SSR for shareable issue cards, offline draft storage |
| **Marketing Site** | Next.js or Astro + Tailwind CSS | Fast, SEO-optimized, lightweight static landing and community portal |
| **Backend API** | Node.js + Express (or NestJS) (TypeScript) | Modular REST API; decoupled domains (auth, issues, offices, moderation) |
| **Database** | MongoDB (Atlas) | `2dsphere` index for geo queries, text index for search |
| **Cache & Queue** | Redis + BullMQ | Fast rate limiting, duplicate checking, background tasks for media/SMS |
| **Storage & CDN** | S3-compatible Object Storage | EXIF stripping, thumbnail generation, signed URLs |
| **Location** | Native Browser Geolocation + Ward Boundaries | Lightweight, privacy-first; no map libraries or external map API dependencies |
| **i18n** | next-intl / react-i18next | English (EN), Marathi (MR), Hindi (HI) |
| **Auth / SMS** | MSG91 / Fast2SMS (DLT registered) | Phone OTP + session/JWT |

---

## 8. UX and Accessibility Plan

- Mobile-first PWA, functional on low-end smartphones (Android 8+) and 3G/weak networks.
- Offline draft saving for rural areas with spotty connectivity.
- Home screen priority: "Raise an Issue" (ठळक बटण), "Issues Near Me", "Trending in My Ward".
- Native voice notes and multi-language support (English, Hindi, Marathi).
- Accessible typography, high contrast, WCAG 2.1 AA compliant.

---

## 9. Legal & Organisational Setup

- Section 8 non-profit company or Public Charitable Trust registration before public launch.
- IT Act Intermediary Compliance (Grievance Officer, 24-36h takedown mechanisms).
- DPDP Act Compliance (Consent, purpose limitation, account deletion).
- Defamation mitigation: Strict tagging of offices/departments, never individuals.

---

## 10. Funding & Sustainability

- Non-profit, donation & grant-funded (civic tech grants, foundations, ethical CSR).
- Strict red line: Zero funding from political parties or politically affiliated entities.
- Annual financial transparency reports published on the marketing website.

---

## 11. Phased Milestones & Roadmap

- **Phase 0 (Weeks 1-6):** Manual pilot in Pimpri-Chinchwad / Pune ward; citizen & official interviews; 20-30 real issues tracked manually.
- **Phase 1 (Weeks 7-22):** MVP build (separate frontend, backend, marketing); local testing in EN/HI/MR.
- **Gate (Weeks 23-28):** Legal entity registration, grievance setup, penetration testing, usability trial with 15 pilot citizens.
- **Phase 2 (Weeks 29-44):** Public launch in pilot area; official office claiming; escalation tools; scorecards.
- **Phase 3 (Months 12-18):** Expansion to neighboring wards/districts; consumer complaints; official reporting cross-check.
- **Phase 4 (Months 18+):** Promise trackers, manifesto verification, statewide scaling.

---

## 12. Next Immediate Steps (Next 30 Days)

1. Select the exact pilot ward/village in Pimpri-Chinchwad/Pune.
2. Initialize the project repository with `frontend/`, `backend/`, and `marketing/`.
3. Set up database schemas and foundational phone OTP authentication.
4. Prototype the issue creation flow (Voice + Image + Geo + Office tagging).
