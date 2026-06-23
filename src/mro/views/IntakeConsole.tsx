import * as React from "react";
import { Flag, Check, Clock, AlertTriangle, X, FileText, ChevronRight, Bot, ArrowRight } from "lucide-react";
import { useApp } from "@/mro/state";
import { agentsById } from "@/mro/data/agents";
import { cn } from "@/mro/lib/utils";
import { AIDot } from "@/mro/components/ai/AIDot";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { Spinner } from "@/mro/components/ai/Spinner";
import { StatusPill } from "@/mro/components/blocks/StatusPill";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { TopRow } from "@/mro/components/blocks/TopRow";
import { DataTable, CellTag, DocPreviewModal } from "@/mro/components/blocks/DataTable";
import { AutonomyControl } from "@/mro/components/agents/AutonomyControl";
import { AgentChat, type ChatTurn } from "@/mro/components/agents/AgentChat";
import { StructuredPrDoc, type StructuredPr } from "@/mro/components/docs/pr/PrDocs";

/* ──────────────────────────────────────────────────────────────────────────
 * PR Processing agent console — the reference build.
 *
 * Left column: slim hero · autonomy dial+gear · output/handoff status ·
 * free-text intake queue · material-catalog + coding-rule panels. Right rail:
 * the scripted AgentChat. Clicking the flagged request opens the centre modal
 * whose ceremony reads → "Run AI structuring" → stepped animation → structured
 * ME51N PR reveal → Approve / Pending / Escalate / Reject. Approving hands
 * PR-48630 to Master Data and jumps into the live run (pump flow).
 * ────────────────────────────────────────────────────────────────────────── */

/** The structured ME51N PR the agent produces from the free-text request. */
const conveyorBeltPr: StructuredPr = {
  number: "PR-48630",
  status: "Structured · spec confirmation needed",
  createdBy: "PR Processing agent",
  createdOn: "2026-06-20 · 10:46",
  materialCode: "MRO-CONV-BELT-36IN-HD",
  description: "Conveyor Belt 36\" Heavy Duty Rubber — Sorting Line",
  plant: "Recycling facility · Sorting Line 2",
  costCenter: "10034 · Recycling Plant Maintenance",
  glAccount: "600450 · Repairs & Maintenance",
  item: [
    { label: "Face width", value: "36 in (from \"35–36 in\")" },
    { label: "Material", value: "Rubber · heavy duty" },
    { label: "Quantity", value: "1 EA · 18 m roll" },
    { label: "UoM", value: "EA (roll)" },
    { label: "Delivery", value: "ASAP · production at risk" },
    { label: "Requisitioner", value: "Plant engineer · Sorting Line 2" },
  ],
  assignment: [
    { label: "Material group", value: "MRO · Conveyor & belting" },
    { label: "Suggested vendor", value: "Apex Industrial Supply (preferred)" },
  ],
  confidence: "86% · spec confirmation needed",
  flags: [
    "Free text gave a width range (35–36 in) and no part number — coded to 36 in face width; confirm against Sorting Line 2 before release to avoid a wrong-fit belt.",
    "Requester said \"previously Apex but not sure\" — vendor and part unconfirmed.",
  ],
  prType: "NB · Standard requisition",
  requestor: "Plant engineer · Sorting Line 2",
  purchOrg: "1000 · Northgate Procurement",
  purchGroup: "200 · MRO / Maintenance",
  valuation: [
    { label: "Unit price", value: "$4,180.00 / EA" },
    { label: "Total value", value: "$4,180.00" },
    { label: "Currency", value: "USD" },
  ],
  sourceOfSupply: [
    { label: "Vendor", value: "Apex Industrial Supply" },
    { label: "Outline agreement", value: "SA-MRO-07 · item 40" },
    { label: "Info record", value: "5300004180" },
  ],
  deliveryTerms: [
    { label: "Incoterms", value: "FCA · Apex DC" },
    { label: "Payment terms", value: "Net 30" },
    { label: "Deliv. date", value: "ASAP · 2026-06-23" },
  ],
};

const StructuredPrPreview = () => <StructuredPrDoc pr={conveyorBeltPr} />;

/* ── Free-text intake queue — the inbox this console reads ─────────────────── */

type IntakeRequest = {
  id: string;
  from: string;
  fromRole: string;
  subject: string;
  preview: string;
  body: string[];
  time: string;
  unread: boolean;
  flagged?: boolean;
  priority?: "high" | "normal";
  /** Tag shown on already-structured requests (released, routed, etc.). */
  handledTag?: string;
  /** Only the live request runs the structuring → PR ceremony. */
  actionable?: boolean;
};

const intakeQueue: IntakeRequest[] = [
  {
    id: "pr-conv-belt",
    from: "Plant engineer · Sorting Line 2",
    fromRole: "Recycling · maintenance",
    subject: "New conveyor belt — recycling line 2 (free text)",
    preview:
      "The existing belt is damaged and causing jams — needs ~35–36 in wide rubber heavy duty, previously Apex but not sure of the part number…",
    body: [
      "Requesting a new conveyor belt for recycling line 2. The existing belt is damaged and causing material jams.",
      "Specs: around 35–36 inch wide, rubber, heavy duty. Previously sourced from Apex but not sure of the part number.",
      "Need ASAP to avoid production impact. — Plant engineer, Sorting Line 2",
    ],
    time: "10:40",
    unread: true,
    flagged: true,
    priority: "high",
    actionable: true,
  },
  {
    id: "pr-idler-roller",
    from: "Plant engineer · Sorting Line 1",
    fromRole: "Recycling · maintenance",
    subject: "Re: Replacement idler rollers — re-scoped",
    preview:
      "Your 8-unit idler-roller request was structured, then re-scoped — 6 in stock at a sister plant + warranty cover most. 2-unit buy only…",
    body: [
      "The 8-unit idler-roller request from Sorting Line 1 was structured to MRO-CONV-ROLLER-IDLER-STD.",
      "Master Data found a duplicate PR + 6 EA at the Eastbrook mill store + warranty cover — re-scoped to a 2-unit buy. No action needed.",
    ],
    time: "09:55",
    unread: false,
    handledTag: "Structured · re-scoped",
  },
  {
    id: "pr-hyd-oil",
    from: "Maintenance · Boiler house",
    fromRole: "Utilities",
    subject: "Hydraulic oil — grade incomplete",
    preview:
      "Free-text hydraulic-oil request with no ISO grade — routed back to the requester for the grade before coding…",
    body: [
      "Free-text request for hydraulic oil with no ISO viscosity grade specified.",
      "Structured to a partial PR and routed back to the requester for the grade before it can be coded and released.",
    ],
    time: "Yesterday",
    unread: true,
    handledTag: "Routed · spec query",
  },
  {
    id: "pr-bearing",
    from: "Reliability · CMMS",
    fromRole: "Condition monitoring",
    subject: "Bearing 6204 — duplicate suspected",
    preview:
      "A 6204 bearing request matched an open PR for the same SKU — filed to Master Data for the duplicate check…",
    body: [
      "A bearing 6204-2RS request came in from condition monitoring.",
      "Matched an open PR for the same SKU — filed to Master Data for the duplicate check before any buy.",
    ],
    time: "Mon",
    unread: false,
    handledTag: "Filed · duplicate check",
  },
];

function CardHeader({ label, right }: { label: string; right?: React.ReactNode }) {
  return (
    <header className="flex items-center gap-2">
      <AIDot size={6} tone="deep" pulse />
      <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
        {label}
      </span>
      {right && <span className="ml-auto">{right}</span>}
    </header>
  );
}

function SlimHero() {
  const agent = agentsById.intake;
  const Icon = agent.icon;
  return (
    <SpringIn>
      <section className="bg-white border border-divider rounded-md p-5">
        <div className="flex items-start gap-4">
          <div className="w-11 h-11 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
            <Icon size={20} strokeWidth={1.9} color="var(--ink-inverse)" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-[19px] font-bold text-ink leading-tight">{agent.name}</h1>
              <StatusPill label="Running" kind="active" pulse />
            </div>
            <p className="text-[13px] text-mute leading-snug mt-1 max-w-2xl">{agent.purpose}</p>
          </div>
          <div className="text-right shrink-0 pl-3">
            <div className="text-[18px] font-bold text-surface-deep leading-none">{agent.stat}</div>
            <div className="text-[10px] tracking-[0.06em] uppercase text-mute mt-1">PR intake</div>
          </div>
        </div>
      </section>
    </SpringIn>
  );
}

const OUTPUT_META: Record<
  string,
  { label: string; kind: "active" | "critical" | "neutral"; note: string }
> = {
  none: {
    label: "No output yet",
    kind: "neutral",
    note: "Open the flagged free-text request to structure a coded PR.",
  },
  pending: {
    label: "On pending",
    kind: "neutral",
    note: "PR-48630 is parked — resume it from the queue when ready.",
  },
  approved: {
    label: "Approved · handed off",
    kind: "active",
    note: "PR-48630 handed to Master Data — queued for the master-data, duplicate and inventory checks.",
  },
  rejected: {
    label: "Rejected",
    kind: "critical",
    note: "PR-48630 was rejected — nothing handed downstream.",
  },
  escalated: {
    label: "Escalated",
    kind: "critical",
    note: "Routed to a buyer with the structured PR attached.",
  },
};

function OutputStatusCard() {
  const { agentOutputs, go } = useApp();
  const status = agentOutputs.intake;
  const meta = OUTPUT_META[status];
  // The PR number is only assigned once the agent has structured the request.
  // Before that the handoff slot is empty — naming PR-48630 would be wrong.
  const hasDraft = status !== "none";
  const [docOpen, setDocOpen] = React.useState(false);

  return (
    <article className="bg-white border border-divider rounded-md p-5 space-y-3">
      <CardHeader label="Current output · handoff to Master Data" right={<StatusPill label={meta.label} kind={meta.kind} pulse={status === "approved"} />} />
      <div
        className={cn(
          "flex items-center gap-3 rounded-md bg-surface-fog px-3 py-3",
          hasDraft && "cursor-pointer transition-colors hover:bg-surface-mint/40",
        )}
        onClick={hasDraft ? () => setDocOpen(true) : undefined}
      >
        <span
          className={cn(
            "w-9 h-9 rounded-md flex items-center justify-center shrink-0",
            status === "approved" ? "bg-surface-deep text-ink-inverse" : "bg-white border border-divider text-surface-deep",
          )}
        >
          <FileText size={17} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[13px] font-bold text-ink inline-flex items-center gap-1.5">
            {hasDraft ? "Structured PR · PR-48630" : "Structured PR · not drafted yet"}
            {hasDraft && <ChevronRight size={13} className="text-surface-deep/60 shrink-0" />}
          </div>
          <div className="text-[12px] text-mute leading-snug mt-0.5">{meta.note}</div>
        </div>
        {status === "approved" && (
          <PillButton
            variant="deep"
            size="sm"
            arrow
            onClick={(e) => {
              e.stopPropagation();
              go({ kind: "workspace", flow: "pump" });
            }}
          >
            Open the run
          </PillButton>
        )}
      </div>

      {docOpen && (
        <DocPreviewModal title="Structured PR · PR-48630" onClose={() => setDocOpen(false)}>
          <StructuredPrPreview />
        </DocPreviewModal>
      )}
    </article>
  );
}

function QueueRow({ request, onOpen }: { request: IntakeRequest; onOpen: (r: IntakeRequest) => void }) {
  return (
    <button
      type="button"
      onClick={() => onOpen(request)}
      className={cn(
        "ui-pill w-full text-left flex gap-3 px-4 py-3 border-b border-divider last:border-b-0 hover:bg-surface-fog",
        request.unread && "bg-surface-mint/15",
      )}
    >
      <span className="pt-1 shrink-0">
        {request.unread ? (
          <span className="w-2 h-2 rounded-full bg-surface-deep block" />
        ) : (
          <span className="w-2 h-2 rounded-full border border-divider block" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className={cn("text-[13px] truncate", request.unread ? "font-bold text-ink" : "text-ink")}>
            {request.from}
          </span>
          <span className="text-[11px] text-mute truncate">· {request.fromRole}</span>
          {request.priority === "high" && (
            <span className="text-[9px] tracking-[0.06em] uppercase font-bold text-mark-red bg-surface-rose/40 px-1.5 py-0.5 rounded shrink-0">
              High
            </span>
          )}
          <span className="ml-auto text-[11px] text-mute shrink-0">{request.time}</span>
        </span>
        <span className="flex items-center gap-1.5 mt-0.5">
          {request.flagged && <Flag size={12} className="text-mark-red shrink-0" fill="currentColor" />}
          <span className={cn("text-[13px] truncate", request.unread ? "font-medium text-ink" : "text-ink")}>
            {request.subject}
          </span>
        </span>
        <span className="block text-[12px] text-mute leading-snug mt-0.5 line-clamp-1">{request.preview}</span>
        {request.handledTag && (
          <span className="inline-flex items-center gap-1 mt-1.5 text-[10px] tracking-[0.04em] uppercase font-medium text-surface-deep bg-surface-mint/40 px-2 py-0.5 rounded">
            <Check size={10} strokeWidth={3} /> {request.handledTag}
          </span>
        )}
      </span>
    </button>
  );
}

function IntakeQueuePanel({ onOpen }: { onOpen: (r: IntakeRequest) => void }) {
  const unread = intakeQueue.filter((r) => r.unread).length;
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <div className="px-4 py-3 border-b border-divider flex items-center gap-2">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
          Intake queue · awaiting structuring
        </span>
        <span className="ml-auto text-[11px] font-bold text-surface-deep bg-surface-mint px-2 py-0.5 rounded-full">
          {unread} new
        </span>
      </div>
      <div>
        {intakeQueue.map((r) => (
          <QueueRow key={r.id} request={r} onOpen={onOpen} />
        ))}
      </div>
    </article>
  );
}

/* ── Material catalog + coding rules — what the agent codes against ────────── */

type CatalogRow = {
  code: string;
  description: string;
  group: string;
  status: "On catalog" | "Catalog" | "Off-catalog";
  /** Highlight the SKU the live request maps to. */
  match?: boolean;
};

const materialCatalog: CatalogRow[] = [
  {
    code: "MRO-CONV-BELT-36IN-HD",
    description: "Conveyor belt 36\" HD rubber",
    group: "Conveyor & belting",
    status: "On catalog",
    match: true,
  },
  {
    code: "MRO-CONV-ROLLER-IDLER-STD",
    description: "Idler roller 600 mm steel",
    group: "Conveyor & rollers",
    status: "On catalog",
  },
  {
    code: "MRO-HYDOIL-ISO46",
    description: "Hydraulic oil ISO VG 46",
    group: "Lubricants",
    status: "Catalog",
  },
  {
    code: "MRO-BRG-6204-2RS",
    description: "Bearing 6204-2RS",
    group: "Bearings",
    status: "On catalog",
  },
  {
    code: "MRO-PUMP-SEAL-KIT-OEM",
    description: "Pump mechanical seal kit",
    group: "Pumps & drives",
    status: "Off-catalog",
  },
];

type CodingRule = {
  title: string;
  ref: string;
  rule: string;
  /** Highlight the rule that governs the live request. */
  match?: boolean;
};

const codingRules: CodingRule[] = [
  {
    title: "Free text → material code",
    ref: "PR-MAP-04",
    rule: "Banded specs (size · material · duty) auto-map to a catalog SKU when the description and dimensions match a known item.",
    match: true,
  },
  {
    title: "Account assignment",
    ref: "PR-ACC-02",
    rule: "Maintenance spares code to the plant cost center and the Repairs & Maintenance G/L by functional location.",
  },
  {
    title: "Spec incomplete → hold",
    ref: "PR-SPC-07",
    rule: "A missing critical spec (grade, width, part no.) holds the PR and routes a query back to the requester.",
  },
  {
    title: "Duplicate demand check",
    ref: "PR-DUP-03",
    rule: "A new request for an SKU with an open PR is filed to Master Data for a duplicate check before any buy.",
  },
  {
    title: "Off-catalog → new material",
    ref: "PR-NEW-09",
    rule: "An item with no catalog match opens a new-material request before it can be coded and sourced.",
  },
];

function MaterialCatalogPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Material catalog · approved codes" right={<MatchNote />} />
      <div className="mt-3">
        <DataTable
          rows={materialCatalog}
          rowKey={(c) => c.code}
          highlight={(c) => !!c.match}
          columns={[
            {
              header: "Material code",
              cell: (c) => (
                <span className={cn("font-bold tabular-nums", c.match ? "text-surface-deep" : "text-ink")}>{c.code}</span>
              ),
            },
            {
              header: "Status",
              className: "w-[112px]",
              cell: (c) => (
                <CellTag tone={c.status === "On catalog" ? "deep" : c.status === "Catalog" ? "sage" : "neutral"}>
                  {c.status}
                </CellTag>
              ),
            },
            { header: "Description", cell: (c) => c.description },
            { header: "Material group", cell: (c) => c.group },
          ]}
        />
      </div>
    </article>
  );
}

function CodingRulesPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Coding rules" right={<MatchNote />} />
      <div className="mt-3">
        <DataTable
          rows={codingRules}
          rowKey={(p) => p.ref}
          highlight={(p) => !!p.match}
          columns={[
            {
              header: "Rule",
              cell: (p) => <span className="font-bold text-ink">{p.title}</span>,
            },
            { header: "Reference", className: "w-[110px]", cell: (p) => <span className="tabular-nums">{p.ref}</span> },
            { header: "Detail", cell: (p) => p.rule },
          ]}
        />
      </div>
    </article>
  );
}

/** Tiny legend for the mint row — what the highlight means on these tables. */
function MatchNote() {
  return (
    <span className="inline-flex items-center gap-1.5 text-[11px] text-mute">
      <span className="w-3 h-3 rounded-sm bg-surface-mint border border-surface-deep/30" />
      Matches this request
    </span>
  );
}

/* ── Structuring ceremony ──────────────────────────────────────────────────── */

const ANALYSIS_STEPS = [
  "Reading the free-text request from Sorting Line 2",
  "Extracting specs — ~35–36 in, rubber, heavy duty",
  "Mapping to material code — MRO-CONV-BELT-36IN-HD",
  "Coding cost center 10034 · G/L 600450",
  "Flagging the width range for sign-off · drafting PR-48630",
];

function AnalysisSteps({ onComplete }: { onComplete: () => void }) {
  const [done, setDone] = React.useState(0);

  React.useEffect(() => {
    if (done >= ANALYSIS_STEPS.length) {
      const t = window.setTimeout(onComplete, 650);
      return () => window.clearTimeout(t);
    }
    const t = window.setTimeout(() => setDone((d) => d + 1), 820);
    return () => window.clearTimeout(t);
  }, [done, onComplete]);

  return (
    <div className="space-y-2.5">
      {ANALYSIS_STEPS.map((label, i) => {
        const isDone = i < done;
        const isActive = i === done;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="w-5 h-5 flex items-center justify-center shrink-0">
              {isDone ? (
                <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center">
                  <Check size={12} strokeWidth={3} />
                </span>
              ) : isActive ? (
                <Spinner size={16} />
              ) : (
                <span className="w-2 h-2 rounded-full bg-divider" />
              )}
            </span>
            <span
              className={cn(
                "text-[13px] leading-snug",
                isDone ? "text-ink" : isActive ? "text-ink font-medium" : "text-mute",
              )}
            >
              {label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

type Phase = "read" | "analyzing" | "done";

function ActionButton({
  icon,
  label,
  tone,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  tone: "approve" | "pending" | "escalate" | "reject";
  onClick: () => void;
}) {
  const cls = {
    approve: "bg-surface-deep text-ink-inverse hover:bg-accent-green",
    pending: "bg-white text-ink border border-ink/30 hover:bg-surface-fog",
    escalate: "bg-white text-mark-red border border-mark-red/40 hover:bg-surface-rose/30",
    reject: "bg-white text-mute border border-divider hover:bg-surface-fog",
  }[tone];
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "ui-pill flex-1 inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-2.5 text-[13px] font-bold whitespace-nowrap",
        cls,
      )}
    >
      {icon}
      {label}
    </button>
  );
}

function RequestModal({ request, onClose }: { request: IntakeRequest; onClose: () => void }) {
  const { go, setAgentOutput, setFlowProgress } = useApp();
  const [phase, setPhase] = React.useState<Phase>("read");

  const decide = (status: "approved" | "pending" | "escalated" | "rejected") => {
    setAgentOutput("intake", status);
    if (status === "approved") {
      setFlowProgress("pump", { activeStep: 1, approved: false });
      go({ kind: "workspace", flow: "pump" });
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Request header */}
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              {request.flagged && <Flag size={13} className="text-mark-red shrink-0" fill="currentColor" />}
              <h2 className="text-[15px] font-bold text-ink leading-tight truncate">{request.subject}</h2>
            </div>
            <div className="text-[12px] text-mute mt-1">
              {request.from} · {request.fromRole} · {request.time}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 space-y-4">
          {/* Request body */}
          <div className="space-y-2.5">
            {request.body.map((p, i) => (
              <p key={i} className="text-[13.5px] text-ink leading-relaxed">
                {p}
              </p>
            ))}
          </div>

          {!request.actionable && request.handledTag && (
            <div className="flex items-center gap-2 rounded-md bg-surface-fog px-3 py-2.5 text-[12.5px] text-mute">
              <Check size={14} className="text-surface-deep" strokeWidth={3} />
              {request.handledTag} — no action needed.
            </div>
          )}

          {/* Analyzing */}
          {phase === "analyzing" && (
            <SpringIn>
              <div className="rounded-md border border-[#e1e6ec] bg-[#f4f6f9] p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <AIDot size={6} tone="deep" pulse />
                  <span className="text-[11px] tracking-[0.08em] uppercase text-[#0a6ed1] font-bold">
                    PR Processing · structuring the request
                  </span>
                </div>
                <AnalysisSteps onComplete={() => setPhase("done")} />
              </div>
            </SpringIn>
          )}

          {/* Done — reveal the structured PR */}
          {phase === "done" && (
            <SpringIn>
              <div className="space-y-3">
                <div className="flex items-center gap-2 rounded-md bg-[#eaf2fb] border border-[#cfe0f5] px-3 py-2.5">
                  <span className="w-5 h-5 rounded-md bg-[#0a6ed1] text-white flex items-center justify-center shrink-0">
                    <Check size={12} strokeWidth={3} />
                  </span>
                  <p className="text-[12.5px] text-ink leading-snug">
                    Structured · <span className="font-bold">conveyor belt → MRO-CONV-BELT-36IN-HD</span> on contract via
                    Apex ($4,180). One open item — the 35–36 in width needs the engineer to confirm 36 in before release.
                  </p>
                </div>
                <StructuredPrPreview />
              </div>
            </SpringIn>
          )}
        </div>

        {/* Footer actions */}
        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0">
          {phase === "read" && request.actionable && (
            <div className="flex items-center justify-between gap-3">
              <span className="text-[12px] text-mute">
                The agent will extract the specs, map the material code, code the account assignment and draft the PR.
              </span>
              <PillButton variant="deep" arrow onClick={() => setPhase("analyzing")}>
                Run AI structuring
              </PillButton>
            </div>
          )}
          {phase === "read" && !request.actionable && (
            <div className="flex justify-end">
              <PillButton variant="secondary" onClick={onClose}>
                Close
              </PillButton>
            </div>
          )}
          {phase === "analyzing" && (
            <div className="flex items-center gap-2 text-[12px] text-mute">
              <Spinner size={14} /> Working through the checks…
            </div>
          )}
          {phase === "done" && (
            <div className="space-y-2">
              <div className="text-[11px] tracking-[0.06em] uppercase text-mute font-medium">
                Decide on the output
              </div>
              <div className="flex">
                <ActionButton
                  tone="approve"
                  icon={<Check size={15} strokeWidth={2.4} />}
                  label="Approve & hand off"
                  onClick={() => decide("approved")}
                />
              </div>
              <div className="flex items-stretch gap-2">
                <ActionButton
                  tone="pending"
                  icon={<Clock size={15} strokeWidth={2.2} />}
                  label="Pending"
                  onClick={() => decide("pending")}
                />
                <ActionButton
                  tone="escalate"
                  icon={<AlertTriangle size={15} strokeWidth={2.2} />}
                  label="Escalate"
                  onClick={() => decide("escalated")}
                />
                <ActionButton
                  tone="reject"
                  icon={<X size={15} strokeWidth={2.2} />}
                  label="Reject"
                  onClick={() => decide("rejected")}
                />
              </div>
            </div>
          )}
        </footer>
      </div>
    </div>
  );
}

/* ── Intake status — shown inline in the chat ──────────────────────────────── */

type IntakeState = "ready" | "watch" | "review";

const intakeLines: {
  item: string;
  ready: number;
  target: number;
  unit: string;
  state: IntakeState;
  note: string;
}[] = [
  {
    item: "Conveyor belt · Sorting Line 2",
    ready: 1,
    target: 1,
    unit: "PR",
    state: "ready",
    note: "Structured · on contract · width to confirm",
  },
  {
    item: "Idler roller · Sorting Line 1",
    ready: 2,
    target: 8,
    unit: "EA",
    state: "watch",
    note: "Re-scoped · stock + warranty cover",
  },
  {
    item: "Hydraulic oil · Boiler house",
    ready: 0,
    target: 1,
    unit: "PR",
    state: "watch",
    note: "Spec query · ISO grade missing",
  },
  {
    item: "Bearing 6204 · duplicate",
    ready: 0,
    target: 1,
    unit: "PR",
    state: "review",
    note: "Duplicate check · needs Master Data",
  },
];

const intakeTone: Record<IntakeState, { bar: string; chip: string; label: string }> = {
  review: { bar: "bg-mark-red", chip: "bg-surface-rose text-mark-red", label: "Needs review" },
  watch: { bar: "bg-mute", chip: "bg-surface-fog text-mute", label: "In progress" },
  ready: { bar: "bg-surface-deep", chip: "bg-surface-mint text-surface-deep", label: "Structured" },
};

function IntakeStatusBars() {
  return (
    <div className="space-y-2.5 pt-1">
      {intakeLines.map((l) => {
        const pct = Math.max(4, Math.min(100, Math.round((l.ready / l.target) * 100)));
        const tone = intakeTone[l.state];
        return (
          <div key={l.item}>
            <div className="flex items-center gap-2">
              <span className="text-[12px] font-medium text-ink truncate flex-1">{l.item}</span>
              <span className={cn("text-[9.5px] tracking-[0.04em] uppercase font-bold px-1.5 py-0.5 rounded shrink-0", tone.chip)}>
                {tone.label}
              </span>
            </div>
            <div className="mt-1 h-1.5 rounded-full bg-white/70 overflow-hidden">
              <div className={cn("h-full rounded-full", tone.bar)} style={{ width: `${pct}%` }} />
            </div>
            <div className="flex items-center justify-between text-[10.5px] text-mute mt-0.5 tabular-nums">
              <span>{l.note}</span>
              <span>
                {l.ready} / {l.target} {l.unit}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Chat script — queue scan → structure offer → draft ────────────────────── */

const intakeChatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the PR Processing agent. I turn free-text maintenance requests into clean, coded purchase requisitions — material code, specs, cost center and G/L. Want me to check the intake queue?",
      },
    ],
    chips: ["What's in the intake queue?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Here are the requests against their status. One's ready to structure now — Sorting Line 2 raised a free-text conveyor belt request, no part number and the width as a range.",
        children: <IntakeStatusBars />,
      },
    ],
    chips: ["Which one should we structure first?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "The conveyor belt request is the one to act on — I can map it to MRO-CONV-BELT-36IN-HD on contract via Apex at $4,180, but the 35–36 in width needs the engineer to confirm 36 in. The idler roller is already re-scoped, the hydraulic oil is waiting on a grade, and the bearing is a duplicate check. Shall I structure it into PR-48630?",
      },
    ],
    chips: ["Yes — structure the PR"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "Structuring PR-48630 now — extracting the specs, mapping to MRO-CONV-BELT-36IN-HD, coding cost center 10034 / G/L 600450 and flagging the width. Opening it for you.",
      },
    ],
  },
];

/** Turn index whose reply confirms the draft — fires the structured-PR modal. */
const PACKET_TRIGGER_TURN = 3;

/* ── Structured-PR modal — the chat's hand-off into the run ─────────────────── */

function StructuredPrModal({ onClose }: { onClose: () => void }) {
  const { go, setAgentOutput, setFlowProgress } = useApp();

  const enterWorkspace = () => {
    setAgentOutput("intake", "approved");
    setFlowProgress("pump", { activeStep: 1, approved: false });
    go({ kind: "workspace", flow: "pump" });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4" onClick={onClose}>
      <div
        className="ai-spring w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="px-5 py-4 border-b border-divider flex items-start justify-between gap-4 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[15px] font-bold text-ink leading-tight">Structured PR ready · PR-48630</h2>
            <div className="text-[12px] text-mute mt-1">
              Structured by the PR Processing agent from the Sorting Line 2 free-text request
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="ui-pill w-8 h-8 rounded-full text-mute hover:text-ink flex items-center justify-center shrink-0"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </header>

        <div className="overflow-y-auto px-5 py-5 space-y-3">
          <div className="flex items-center gap-2 rounded-md bg-surface-mint border border-surface-deep/20 px-3 py-2.5">
            <span className="w-5 h-5 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
              <Check size={12} strokeWidth={3} />
            </span>
            <p className="text-[12.5px] text-ink leading-snug">
              Structured · <span className="font-bold">conveyor belt → MRO-CONV-BELT-36IN-HD</span> on contract via Apex
              ($4,180). One open item — confirm the 36 in face width with the engineer before release.
            </p>
          </div>
          <StructuredPrPreview />
        </div>

        <footer className="px-5 py-4 border-t border-divider bg-surface-fog/50 shrink-0 flex items-center justify-between gap-4">
          <span className="text-[12px] text-mute min-w-0">
            Entering hands PR-48630 to Master Data and opens the five-agent run.
          </span>
          <PillButton variant="deep" onClick={enterWorkspace}>
            <span className="inline-flex items-center gap-1.5">
              Enter AI workspace <ArrowRight size={15} />
            </span>
          </PillButton>
        </footer>
      </div>
    </div>
  );
}

/* ── Console ───────────────────────────────────────────────────────────────── */

export function IntakeConsole() {
  const [openRequest, setOpenRequest] = React.useState<IntakeRequest | null>(null);
  const [chatHidden, setChatHidden] = React.useState(true);
  const [packetOpen, setPacketOpen] = React.useState(false);
  const agent = agentsById.intake;

  const handleReachTurn = React.useCallback((i: number) => {
    if (i === PACKET_TRIGGER_TURN) window.setTimeout(() => setPacketOpen(true), 900);
  }, []);

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      <div
        className={cn(
          "mt-3 grid grid-cols-1 gap-3 items-start",
          !chatHidden && "lg:grid-cols-[1fr_360px]",
        )}
      >
        {/* Left — work surface */}
        <div className="space-y-3 min-w-0">
          <SlimHero />
          <AutonomyControl agent={agent} />
          <OutputStatusCard />
          <IntakeQueuePanel onOpen={setOpenRequest} />
          <MaterialCatalogPanel />
          <CodingRulesPanel />
          <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
            <div className="min-w-0">
              <div className="text-[13px] font-bold text-ink">See the PR Processing agent in the live run</div>
              <p className="text-[12px] text-mute leading-snug mt-0.5">
                Structures the Sorting Line 2 free-text request into coded PR-48630.
              </p>
            </div>
            <PillButton variant="deep" size="sm" arrow onClick={() => setOpenRequest(intakeQueue[0])}>
              <span className="inline-flex items-center gap-1">
                Open the flagged request <ChevronRight size={14} />
              </span>
            </PillButton>
          </div>
        </div>

        {/* Right — conversation rail (hideable) */}
        {!chatHidden && (
          <aside className="lg:sticky lg:top-4">
            <div className="rounded-md border border-divider overflow-hidden h-[calc(100vh-2rem)]">
              <AgentChat
                agentName="PR Processing"
                script={intakeChatScript}
                onHide={() => setChatHidden(true)}
                onReachTurn={handleReachTurn}
              />
            </div>
          </aside>
        )}
      </div>

      {chatHidden && (
        <button
          type="button"
          onClick={() => setChatHidden(false)}
          className="ui-pill fixed bottom-6 right-6 z-40 inline-flex items-center gap-2 rounded-full bg-surface-deep text-ink-inverse px-4 py-2.5 text-[13px] font-bold shadow-lg hover:bg-accent-green"
        >
          <Bot size={16} strokeWidth={1.9} /> Chat with PR Processing
        </button>
      )}

      {openRequest && <RequestModal request={openRequest} onClose={() => setOpenRequest(null)} />}
      {packetOpen && <StructuredPrModal onClose={() => setPacketOpen(false)} />}
    </div>
  );
}
