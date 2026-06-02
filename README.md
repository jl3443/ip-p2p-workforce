# HR Concierge — demo

Agentic-AI HR demo for a global multinational. CXO audience. Built on the
DSM-Firmenich design system (mint #C3E6E1, DM Sans, pill CTAs, sentence case)
with an extended set of AI-motion primitives.

## Run locally

```bash
npm install
npm run dev
```

Open <http://localhost:5173>. The demo starts on the HR Dashboard.

## Stack

- Vite 8 + React 19 + TypeScript
- Tailwind v4 with the DSM-F token foundation (`src/index.css`)
- `lucide-react` icons, `clsx` + `tailwind-merge` for class composition
- No backend, no router — view state is a discriminated union in
  `src/state.tsx` (same pattern as the Predictive-Risk-Agent2 reference)

## Demo script

The demo follows four flows the client lock-in'd on. Each flow is reachable
from the HR Dashboard. Persona switching uses a logout-and-back-in ceremony
on purpose so the chrome reset has narrative weight.

### Flow 1 — UC2 Compliance Radar ★ (the hero)

1. Dashboard → click **"German workweek update"** (top case row, or the
   **"Open workspace"** CTA on the first pending decision).
2. Workspace auto-advances through 4 agent steps (detect law change →
   compute impact → draft documents → human review).
3. Pause at step 4: decision card spring-in with 4 metrics, 90-day rollout,
   and 4 document chips (Source law / Handbook redline / Employee
   announcement DE+EN / Works council notice).
4. Click any document chip to preview the artifact, then back.
5. Click **"Approve and execute"**: auto-actions tick through one-by-one,
   activity log streams, decision card becomes "Roll-out under way".

### Flow 2 — UC1 Offboarding

1. Dashboard → click **"Senior R&D · Heidelberg offboarding"**.
2. Same workspace shell. Decision card has three sub-blocks: knowledge
   transfer plan, 23 system accesses (a grid that staggers in), exit
   package with prorated Christmas bonus.
3. Termination letter PDF available from the "Letter" field.

### Flow 3 — UC3 Compensation

1. Dashboard → click **"Senior Engineer retention case"**.
2. Decision card shows three scenarios (Conservative · Mid · Retention).
3. **Click any scenario** — the internal-equity bar chart below updates:
   Marcus's bar morphs to the new salary, affected peers turn rose when
   the Retention option flags them.
4. Confirm → Comp deliverables (3-up: salary update form / manager talking
   points / Finance rationale).

### Flow 4 — UC4 Employee self-service

1. From Dashboard → bottom of sidebar → **"Switch role · Sign out"**.
2. Ceremony: black fade → login form auto-types `employee@company.com` →
   button "presses itself" → Employee Landing.
3. The Ultimatix-style tile grid has an active **"Open chat →"** mint
   banner up top (the proactive AI nudge).
4. Click into the chat. The scripted conversation runs through letter
   request → field confirmation → PDF preview → proactive wellness nudge →
   coverage-plan PDF.

## Files

```
src/
  state.tsx                  view-state machine + context
  index.css                  DSM-F tokens + AI motion contracts
  data/                      cases, scenarios, UC3 peers, etc.
  components/
    ds/                      DSM-Firmenich design-system components (copied
                             from /design-system, "use client" stripped)
    ai/                      AI-motion primitives:
                               AIDot · StreamingText · SpringIn
                               CountUp · StaggerList
    blocks/                  dashboard building blocks
    workspace/               timeline · alert · decision cards (UC1/2/3) ·
                             auto-actions · activity log
    docs/                    8 document preview pages + DocChrome shell
    layout/Sidebar.tsx       grouped HRBP sidebar with agents card + footer
  views/
    Dashboard.tsx
    ComplianceRadar.tsx
    WorkspaceUC1.tsx · WorkspaceUC2.tsx · WorkspaceUC3.tsx
    DocPreview.tsx           routes by DocId
    Logout.tsx · EmployeeLanding.tsx · EmployeeChat.tsx
```

## Design system

All DSM-F UI components were copied verbatim from
`/Users/kyle/Desktop/dsm-firmenich/design-system/src/components/`
(only 3 `"use client"` directives removed for Vite). Tokens come from the
DS's `globals.css` and live in `src/index.css` with three extra AI-motion
contracts on top:

- `--motion-duration-stream: 80ms` — per-row stagger on activity logs
- `--motion-duration-spring: 420ms` — decision-card scale-in
- `--motion-duration-pulse: 1800ms` — agent "thinking" dot

`tailwind-merge` + `cn()` follow the same composition pattern the DS uses.

## Standing rules

1. **No HR or ops jargon** in user-visible copy. Use plain professional
   words: "HR record", not "HRIS"; "market range", not "salary band";
   "remove access", not "revoke".
2. **No big-then-small text stacks.** One eyebrow per card max. Body
   text ≥ 14 px. Avoid stacking a 36 px metric on top of a 12 px tertiary
   sub-caption.
3. **CXO audience.** Editorial whitespace, story-first, no system-trace
   detail surfaced by default.
