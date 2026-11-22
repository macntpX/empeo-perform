# empeo Perform — Fair Performance Review & Talent Calibration System

> **Live Demo:** https://empeo-delta.vercel.app  
> **Gofive Product Engineer Exam Submission**  
> Built as a working end-to-end Performance Management & Talent Calibration prototype for **empeo**, answering the core organizational challenge:  
> **"How do we make annual performance reviews fair across an entire organization, and genuinely surface who the high performers and low performers are?"**

---

## 1. Product Vision & Core Problem Solved

Organizations moving off spreadsheets and email hit four structural failures every review cycle:

1. **Manager Rater Bias (Strict vs. Lenient Graders):** A top performer under a strict manager (`3.9–4.0`) scores lower on paper than a bottom performer under a lenient manager (`3.75–4.1`), causing unfair bonuses, misdirected promotions, and attrition of real high performers.
2. **Messy Operational Reality:** Real review cycles are never clean — managers miss deadlines, employees forget self-reviews, KPI weights don't sum to 100%, new hires are on probation, and self-ratings diverge wildly from manager ratings.
3. **Lack of Transparency & Governance:** Employees can't track their goals year-round, scores leak before calibration finishes, and HR adjustments happen in offline spreadsheets without an audit trail.
4. **Disconnected Talent Outcomes:** Ratings stop at a number instead of driving structured talent decisions (9-Box Matrix, Promotion Track, Merit Bonus, Coaching, or PIP).

---

## 2. Key Product & Fairness Decisions ("Why We Built It This Way")

### Why Z-Score Normalization + Human Governance (instead of Forced Bell Curve or Black-Box AI)?
- **Real-Time Deterministic Math — No AI Training Required:** Calibration runs automatically in real time via a pure statistical engine (`src/engine/fairnessEngine.ts`) the moment managers submit or edit ratings. We deliberately chose deterministic statistics over a black-box ML model so every score is **100% explainable and defensible** during employee 1-on-1 conversations.
- **Why not Forced Ranking (Bell Curve)?** Forced ranking (e.g., top 10% / bottom 10%) punishes high-performing teams by forcing managers to label strong contributors as "Low Performers."
- **Z-Score Team Calibration** (`Z = (Raw - TeamMean) / TeamSD`, mapped to company benchmark `Fair = 3.50 + Z × 0.75`, clamped `[1.0, 5.0]`):
  - Removes systematic grader bias across managers while preserving **100% of within-team rank order**.
  - **Live Proof Built Into the App:**
    - **Nadia Srisai (Engineering, Strict Manager Ken Tanaka — Avg 3.09):** `Raw 4.00 → Fair 4.41 (+1.21σ)` → Surfaces as **High Performer (Promotion Track)**.
    - **Kanya M. (Sales, Lenient Manager Sarah Lin — Avg 4.35):** `Raw 3.75 → Fair 2.50 (-1.33σ)` → Surfaces as **Low Performer (PIP / Coaching)**.
- **Human-in-the-Loop Governance (Final Step):** Statistics set a fair baseline automatically, but never dictate the final decision. HR & Calibration Committees can toggle Z-Score ON/OFF, or apply a **Manual Override** in the Calibration Drawer, which **requires a written justification (min. 8 chars)** and permanently records the change in the **Audit Trail**.

### How We Handle "Messy Reality" (6 Real-World Edge Cases)
| Edge Case | How empeo Perform Handles It | Where to Test It |
| :--- | :--- | :--- |
| **1. Overdue Managers** | Past-deadline evaluations auto-lock. HR can click **Send Reminder** or **Unlock Grace Period** per manager without reopening the whole org. | HR → Executive Dashboard / Cycle & Policies |
| **2. Probation New Hires** | Employees marked `PROBATION` (e.g., Arthit J.) are flagged `Probation (Exempt)` and **excluded from team Mean/SD** so they never distort team calibration. | HR → Calibration / Manager → Evaluations |
| **3. Incomplete KPI Weights** | If a manager sets KPI weights summing to `≠ 100%` (e.g., 60%), the engine **auto-reweights proportionally** and displays a `WEIGHT_MISMATCH` warning badge instead of crashing or under-scoring. | Manager → Team Goals & OKRs |
| **4. Missing Self-Review** | If an employee skips self-assessment, managers can still evaluate them with a clear `Self-Review Missing` indicator. | Manager → Team Evaluations |
| **5. Large Self vs. Manager Gap** | When the gap between Self and Manager scores is `≥ 1.0`, the UI flags `SCORE_GAP` to prompt concrete examples before the 1-on-1 review conversation. | Manager → Ploypailin K. / HR → Calibration |
| **6. Premature Score Leak** | Employees can view goals and submit self-reviews, but **official calibrated scores remain hidden** until HR explicitly clicks **Publish Results**. | Switch to Nadia Srisai before & after HR Publish |
| **7. Mid-Cycle Criteria Changes** | HR can **Add / Edit / Delete Core Competencies** in **Cycle & Policies** (auto-synced across all forms & Audit Trail), with **Phase Guardrails**: open in `GOAL_SETTING`, warning banner during active reviews, and **locked** once `PUBLISHED`. | HR → Cycle & Policies → Evaluation Criteria |

---

## 3. 3-Minute Reviewer Walkthrough

Use the **Quick Demo Switcher** (`Switch Role (Demo)` at the bottom of the left sidebar) or the **Login Page** demo cards — no password typing required. You can also switch between **English (`EN`)** and **Thai (`TH`)** anytime via the top-right dropdown.

1. **Start as HR Admin (`Pimchanok S.`):**
   - Review the **Executive Dashboard** to see overdue manager alerts and data-health warnings.
   - Open **Calibration & Fairness** → inspect the 4-step **Fair Review Methodology**, compare Ken Tanaka (Strict) vs. Sarah Lin (Lenient), and toggle **Z-Score Normalization ON/OFF** to watch Nadia & Kanya flip tiers in real time.
   - Click **Calibrate** on any employee → test **HR Manual Override** (with mandatory rationale) and assign a **Promotion / PIP Action Plan**.
   - Open **9-Box Talent Matrix** and **Audit Trail** to verify full traceability, or click **Export CSV**.
2. **Switch to People Manager (`Ken Tanaka`):**
   - Open **Team Evaluations** → notice the active **HR Grace Period** banner, **Self vs. Manager Gap** alert on Ploypailin K., and **Probation Exempt** state on Arthit J.
   - Adjust KPI & Competency scores using the 1–5 rubric selector → **Save Draft** or **Submit Final Evaluation**.
   - Open **Team Goals & OKRs** → add/edit/delete a goal and see live weight validation.
3. **Switch to Employee (`Nadia Srisai`):**
   - Notice official scores are **locked/hidden** while the cycle is in `HR Calibration`.
   - Switch back to **HR Admin** → click **Publish Results** → switch back to **Nadia Srisai** to see the released official score, manager feedback, and **Acknowledge / Request Review** flow.
4. **Test Full Directory CRUD & Dynamic Login (HR → Employees & Org):**
   - **Manage People Managers:** Click **Add Manager**, **Edit**, or **Delete** in the People Managers Directory (deleting a manager with direct reports safely reassigns their team to another manager and logs it in the Audit Trail).
   - **Add New Employee or Manager → Sign In Immediately:** Every existing and newly created Employee and Manager automatically gets a live login account (`Email + Password`, default `password123`) and immediately appears in both the **Login Page** and **Quick Demo Switcher**.
5. **Reset anytime:** Click **Reset All Demo Data** inside the `Switch Role (Demo)` menu to restore the initial state cleanly.

---

## 4. Technical Architecture & Production Scaling Plan

- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Lucide Icons, bilingual `TH`/`EN` context, zero-layout-shift locked enterprise shell, portal-based modals/drawers/dropdowns.
- **Fairness Engine:** Pure, deterministic TypeScript module (`src/engine/fairnessEngine.ts`) covered by Vitest unit tests (`src/engine/fairnessEngine.test.ts`).
- **Dual Persistence Layer:**
  - **Local Development:** Custom Vite middleware (`vite-plugin-hrm-db.ts`) exposing REST endpoints (`/api/state`, `/api/reset`) backed by `data/empeo-db.json` for real file-backed CRUD persistence.
  - **Static Cloud Deployment (Vercel):** Graceful automatic fallback to `localStorage` so every CRUD operation, calibration override, and publish flow persists seamlessly in the reviewer's browser.
- **How this scales to Production on empeo (1,000+ orgs):**
  - **Multi-Tenant PostgreSQL:** `organizations`, `review_cycles`, `employees`, `goals`, `evaluations`, `calibration_overrides` (append-only), and `audit_logs` indexed by `(org_id, cycle_id)`.
  - **Auth & RBAC:** JWT/OAuth2 with strict row-level security (employees cannot query un-published `manager_score` or `normalized_score` columns at the API/DB level).
  - **Async Notifications:** Background job queue (e.g., BullMQ / Cloud Tasks) for deadline reminders, LINE/Email/Slack alerts, and scheduled cycle phase transitions.

---

## 5. Run Locally & Execute Tests

```bash
# Install dependencies
npm install

# Run unit tests (Fairness & Calibration Engine)
npm test

# Start local dev server (with file-backed JSON DB API at http://localhost:5173)
npm run dev

# Type-check & production build
npm run build
```

---

## 6. Part 2 — Questions

### 1. Technical decisions
I split the app into 3 simple parts: the **scoring engine** (`src/engine/fairnessEngine.ts` — calculates KPI + Competency scores and Z-Score fairness), the **shared app state** (`src/context/HRMContext.tsx` — stores review cycle settings, evaluation criteria, managers, employees, and audit logs), and **3 separate views** for HR, Managers, and Employees.

Key trade-offs I made:
- **Z-Score + HR Manual Override vs. Bell Curve / AI model:** Z-Score needs at least 2 people per team to compare fairly (small teams fall back to raw scores), but in return every score is calculated in real time, transparent, and easy to explain to employees in 1-on-1s.
- **Derived scores on the fly vs. storing pre-calculated scores:** Calculating scores dynamically with `useMemo` adds tiny render work, but guarantees scores never go out of sync whenever HR changes KPI/Competency weights, edits criteria, toggles Probation, or applies an override.
- **`localStorage` (with local JSON file API in dev) vs. a shared cloud DB:** For this live demo, `localStorage` gives every reviewer their own clean sandbox so people testing the link don't overwrite each other's data, while keeping the data layer separate so moving to PostgreSQL in production is straightforward.

### 2. The requirement changes
> *"Before results are opened to employees, every manager has to calibrate ratings together across teams first so the standard is aligned — and no employee can see their own result until calibration is locked."*

Our current design already handles the second half of this requirement — employees cannot see their official scores until HR clicks **Publish Results**.

To add joint calibration across managers before locking, I would only need 3 small updates:
1. Add a `calibrationSignOffs` list to the review cycle to track which managers have approved.
2. Let Managers view a shared Calibration screen during the `CALIBRATION` phase and click **"Approve Calibration"**.
3. Lock the **Publish Results** button until every manager has approved (with an HR override in case someone is on leave).

I'm confident this won't break other parts because the score calculation is completely separate from the workflow and lock rules, and we already have automated tests checking the scoring logic.

### 3. During development
One real issue I hit was when AI added a page animation and a locked header — after that, the **Language dropdown got cut off** by the header, and the **Calibration drawer didn't cover the full screen** (the sidebar and top bar stayed bright instead of dimmed).

I fixed it by adjusting the CSS animation so it doesn't trap popups inside the main content area, and moving all dropdowns, drawers, and modals to render at the top level of the page (`createPortal`).

To make sure everything actually works, I wrote 7 automated Vitest tests (`src/engine/fairnessEngine.test.ts`) for the scoring and fairness rules, ran a clean production build (`tsc -b && vite build`), and clicked through the full HR → Manager → Employee flow myself on both desktop and mobile on the live Vercel link (https://empeo-delta.vercel.app).


