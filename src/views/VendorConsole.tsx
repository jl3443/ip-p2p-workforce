import * as React from "react";
import { Check } from "lucide-react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { VendorMaster } from "@/components/docs/sap/VendorMaster";
import {
  AgentConsole,
  CardHeader,
  QueuePanel,
  CeremonyModal,
  type ConsoleConfig,
  type OutputMeta,
  type QueueItem,
} from "@/components/agents/ConsoleKit";
import type { ChatTurn } from "@/components/agents/AgentChat";

/* ──────────────────────────────────────────────────────────────────────────
 * Vendor Master & Records Agent console.
 *
 * Keeps vendor-master quality high — detecting duplicates, enriching against
 * external data and proposing merges. Data surface: master-data quality dial ·
 * external enrichment (D&B · sanctions · tax · credit) · the duplicate's
 * transaction history · onboarding requests. The ceremony merges 100731 into
 * golden record 100482 before the tender opens (the DS Smith problem).
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "dm-100482-100731",
    primary: "Duplicate · BeltPro Industrial",
    secondary: "100482 & 100731 · matching EIN, DUNS, bank · conf 0.991",
    meta: "09:58",
    readyTag: "Ready to merge",
    actionable: true,
  },
  {
    id: "ob-apex-mx",
    primary: "Onboarding · Apex Drives de México",
    secondary: "New legal entity · D&B and sanctions cleared",
    meta: "1h",
    handledTag: "Approved",
  },
  {
    id: "dm-101355-101402",
    primary: "Duplicate · Midwest Belting",
    secondary: "101355 & 101402 · conf 0.88 · open items on both",
    meta: "2h",
    handledTag: "Escalated",
  },
];

type Quality = { label: string; pct: number; tone: "ok" | "warn" };
const quality: Quality[] = [
  { label: "Completeness", pct: 0.97, tone: "ok" },
  { label: "Accuracy", pct: 0.94, tone: "ok" },
  { label: "Freshness · ≤ 90 days", pct: 0.89, tone: "ok" },
  { label: "Duplicate-free", pct: 0.71, tone: "warn" },
];

type Ext = { source: string; result: string };
const external: Ext[] = [
  { source: "Dun & Bradstreet", result: "DUNS 07-114-8829 · active · matches both records" },
  { source: "Sanctions · OFAC / EU", result: "No match" },
  { source: "Tax · US EIN", result: "47-1839220 · valid · single entity" },
  { source: "Credit", result: "D&B rating 2A2 · low risk" },
];

type Txn = { label: string; value: string };
const txnHistory: Txn[] = [
  { label: "Spend · 24 months", value: "$0 — never transacted on 100731" },
  { label: "Open POs", value: "0" },
  { label: "Open invoices", value: "0" },
  { label: "Disputes", value: "None on either record" },
  { label: "Last activity", value: "Created 2025-11 · no postings since" },
];

type Onb = { vendor: string; status: string; done: boolean };
const onboarding: Onb[] = [
  { vendor: "Apex Drives de México · MX", status: "Approved", done: true },
  { vendor: "Heartland Rubber LLC · US", status: "W-9 requested", done: false },
  { vendor: "Nordic Belting AS · NO", status: "Approved", done: true },
];

const outputMeta: OutputMeta = {
  none: { label: "Not merged yet", kind: "neutral", note: "Open the candidate to review and merge the duplicate." },
  pending: { label: "On pending", kind: "neutral", note: "DM-100482-100731 parked — resume from the worklist." },
  approved: {
    label: "Merged · master cleaned",
    kind: "active",
    note: "100731 retired into golden record 100482 · info records re-pointed.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Merge rejected — records kept separate and flagged." },
  escalated: { label: "Escalated", kind: "critical", note: "Sent to a data steward — possible distinct entities." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Vendor Master & Records Agent — I keep the vendor master clean and merge duplicates before they reach a tender or a payment run. Ask me about the worklist.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Why is this a duplicate</li>
              <li>· Is it safe to merge</li>
              <li>· How bad is the master</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Why is this a duplicate?", "Is it safe to merge?", "How bad is the master?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "100482 and 100731 share an EIN (47-1839220), DUNS, bank key and Memphis address — only the name and street suffix differ. Match confidence 0.991, so it's one legal entity entered twice.",
      },
    ],
    chips: ["Is it safe to merge?", "How bad is the master?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Yes — 100731 has zero open POs, zero open invoices and no spend in 24 months. I keep 100482 as golden, re-point its info records and source-list entries, then retire 100731.",
      },
    ],
    chips: ["How bad is the master?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "On the DS Smith side roughly 30–40% of vendors are duplicates. Clearing them is part of unlocking IP's $117M slice of the $514M synergy target — I catch them before they hit a tender or a payment.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "vendor",
  statLabel: "Records cleaned",
  artifactLabel: "Merge proposal · DM-100482-100731",
  outputMeta,
  chatName: "Vendor agent",
  chatScript,
  runRole: "Detects the duplicate, confirms one legal entity and merges 100731 into golden record 100482 before the tender opens.",
  openRunLabel: "Open the merge candidate",
};

function QualityPanel() {
  const barTone = { ok: "bg-surface-deep", warn: "bg-surface-sage" };
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Master-data quality" right={<span className="text-[11px] text-mute">1,204 cleaned</span>} />
      <div className="mt-4 space-y-3 flex-1">
        {quality.map((q) => (
          <div key={q.label}>
            <div className="flex items-center justify-between text-[11.5px] mb-1">
              <span className={cn(q.tone === "warn" ? "text-surface-deep font-medium" : "text-ink")}>{q.label}</span>
              <span className="tabular-nums text-mute">{Math.round(q.pct * 100)}%</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-fog overflow-hidden">
              <div className={cn("h-full rounded-full", barTone[q.tone])} style={{ width: `${q.pct * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-mute leading-snug mt-3 pt-3 border-t border-divider">
        DS Smith integration runs ~30–40% duplicate vendors — clearing them unlocks part of IP's $117M synergy slice.
      </p>
    </article>
  );
}

function ExternalPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="External enrichment" right={<span className="text-[11px] text-mute">vendor 100482</span>} />
      <div className="mt-3 divide-y divide-divider flex-1">
        {external.map((e) => (
          <div key={e.source} className="flex items-start gap-3 py-2.5">
            <span className="w-4 h-4 rounded-full bg-surface-mint text-surface-deep flex items-center justify-center shrink-0 mt-0.5">
              <Check size={10} strokeWidth={3} />
            </span>
            <span className="text-[11.5px] text-mute w-28 shrink-0">{e.source}</span>
            <span className="text-[12px] text-ink flex-1 min-w-0">{e.result}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function HistoryPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Transaction history · 100731" right={<span className="text-[11px] text-mute">the duplicate</span>} />
      <div className="mt-3 divide-y divide-divider flex-1">
        {txnHistory.map((t) => (
          <div key={t.label} className="flex items-center gap-3 py-2.5">
            <span className="text-[11.5px] text-mute w-32 shrink-0">{t.label}</span>
            <span className="text-[12.5px] text-ink flex-1 min-w-0">{t.value}</span>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-mute leading-snug mt-3 pt-3 border-t border-divider">
        No open items on 100731 — safe to retire into the golden record.
      </p>
    </article>
  );
}

function OnboardingPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Onboarding requests" right={<span className="text-[11px] text-mute">this week</span>} />
      <div className="mt-3 divide-y divide-divider flex-1">
        {onboarding.map((o) => (
          <div key={o.vendor} className="flex items-center gap-3 py-2.5">
            <span className="text-[12.5px] text-ink flex-1 min-w-0 truncate">{o.vendor}</span>
            <span
              className={cn(
                "text-[10px] tracking-[0.04em] uppercase font-bold px-2 py-0.5 rounded shrink-0",
                o.done ? "bg-surface-mint text-surface-deep" : "bg-surface-fog text-mute border border-divider",
              )}
            >
              {o.status}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function VendorContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Duplicate candidate</div>
      <div className="text-[13px] font-bold text-ink mt-1">100482 BeltPro Industrial · 100731 Belt-Pro Industrial Inc.</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Matching EIN 47-1839220, DUNS, bank key and Memphis address · only the name and street suffix differ ·
        confidence 0.991 · zero open items on 100731. Ready to confirm one legal entity and merge.
      </p>
    </div>
  );
}

export function VendorConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("vendor", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel title="Vendor worklist · duplicates & onboarding" badge="1 to merge" items={queue} onOpen={() => setOpen(true)} />
        <div className="grid grid-cols-2 gap-3 items-stretch">
          <QualityPanel />
          <ExternalPanel />
        </div>
        <div className="grid grid-cols-2 gap-3 items-stretch">
          <HistoryPanel />
          <OnboardingPanel />
        </div>
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="DM-100482-100731 · merge duplicate vendor"
          subtitle="BeltPro Industrial · two records · confidence 0.991"
          context={<VendorContext />}
          ceremony={{
            agentLabel: "Vendor agent · merging the record",
            steps: [
              "Comparing master fields across 100482 and 100731",
              "Confirming EIN, DUNS, bank key and address",
              "Checking open items and transaction history",
              "Enriching against D&B and sanctions lists",
              "Merging into golden record 100482",
            ],
            doneSummary: (
              <>
                One legal entity confirmed at <span className="font-bold">0.991</span> confidence · 100731 carries no
                open items. Retired into golden record 100482 and info records re-pointed.
              </>
            ),
            document: <VendorMaster />,
            footerIntro: "The agent will compare the records, verify external identifiers, confirm zero open items and merge.",
            approveLabel: "Approve & merge record",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
