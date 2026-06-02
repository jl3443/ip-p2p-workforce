import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { HelpdeskTicket } from "@/components/docs/servicenow/HelpdeskTicket";
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
 * Procurement Helpdesk Agent console.
 *
 * Resolves first-line buyer and supplier questions inside the workflow. Data
 * surface: a ticket inbox · knowledge-base retrieval with relevance · linked
 * PR/PO/vendor context · classification & routing · SLA and deflection metrics.
 * The ceremony cites KB-PROC-0148 and auto-closes PRC-3322 within SLA.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "prc-3322",
    primary: "PRC-3322 · Dale Whitfield",
    secondary: "“When does the No.2 double-backer belt arrive?” · order status",
    meta: "08:15",
    readyTag: "Ready to resolve",
    actionable: true,
  },
  {
    id: "prc-3318",
    primary: "PRC-3318 · A. Romero",
    secondary: "How do I add a punch-out catalog supplier? · auto-resolved",
    meta: "1h",
    handledTag: "Auto-resolved",
  },
  {
    id: "prc-3304",
    primary: "PRC-3304 · BeltPro Industrial",
    secondary: "Remittance advice for INV-BPI-5520 · drafted for the analyst",
    meta: "3h",
    handledTag: "Draft sent",
  },
];

type Kb = { id: string; title: string; rel: number; cited?: boolean };
const kbHits: Kb[] = [
  { id: "KB-PROC-0148", title: "Checking the status of an MRO purchase order", rel: 0.97, cited: true },
  { id: "KB-PROC-0090", title: "Delivery dates and framework lead times", rel: 0.82 },
  { id: "KB-PROC-0203", title: "Who tracks an order after it is placed", rel: 0.74 },
];

type Ctx = { record: string; detail: string };
const linked: Ctx[] = [
  { record: "PR-48201", detail: "Approved · raised by R. Alvarez" },
  { record: "PO-77310", detail: "Confirmed · delivery 2026-06-10" },
  { record: "Vendor 100482", detail: "BeltPro Industrial · on contract 4600001207" },
];

type Cls = { label: string; value: string };
const classification: Cls[] = [
  { label: "Category", value: "Order status · MRO" },
  { label: "Intent", value: "Delivery-date enquiry" },
  { label: "Priority", value: "P3 · Normal" },
  { label: "Routing", value: "Auto-resolve · cite policy" },
  { label: "Confidence", value: "0.97 · above 0.90 threshold" },
];

type Metric = { label: string; value: string; sub: string };
const metrics: Metric[] = [
  { label: "First response", value: "2m", sub: "SLA 4h · met" },
  { label: "Deflection rate", value: "71%", sub: "known queries auto-closed" },
  { label: "Open tickets", value: "34", sub: "0 breaching SLA" },
  { label: "CSAT", value: "4.6", sub: "rolling 30 days" },
];

const outputMeta: OutputMeta = {
  none: { label: "Not resolved yet", kind: "neutral", note: "Open the ticket to retrieve policy and draft the resolution." },
  pending: { label: "On pending", kind: "neutral", note: "PRC-3322 parked — resume from the inbox." },
  approved: {
    label: "Resolved · auto-closed",
    kind: "active",
    note: "PRC-3322 answered with KB-PROC-0148 and closed within SLA.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Draft rejected — reassigned for a manual reply." },
  escalated: { label: "Escalated", kind: "critical", note: "Routed to the owning buyer — beyond helpdesk authority." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Procurement Helpdesk Agent — I answer first-line buyer and supplier questions with the cited policy and close the known ones. Ask me about the inbox.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· What's PRC-3322 asking</li>
              <li>· Can you auto-resolve it</li>
              <li>· How's the SLA</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["What's PRC-3322 asking?", "Can you auto-resolve it?", "How's the SLA?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Dale Whitfield is chasing the delivery date for the No.2 double-backer belt for his maintenance window. I matched it to order-status policy KB-PROC-0148 at 0.97 relevance.",
      },
    ],
    chips: ["Can you auto-resolve it?", "How's the SLA?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Yes — it's a known query above my 0.90 threshold. PO-77310 is confirmed for 2026-06-10, so I cite KB-PROC-0148, confirm the date and the goods-receipt plan, and close it. The Fulfillment agent stays on the order.",
      },
    ],
    chips: ["How's the SLA?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "First response landed in 2 minutes against a 4-hour SLA. I'm deflecting about 71% of known queries this way — 34 open tickets right now, none breaching.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "helpdesk",
  statLabel: "Resolved today",
  artifactLabel: "Helpdesk case · PRC-3322",
  outputMeta,
  chatName: "Helpdesk agent",
  chatScript,
  runRole: "Retrieves the policy, drafts the answer and auto-closes the known query with the cited knowledge article.",
  openRunLabel: "Open the ticket",
};

function knowledgeRelTone(rel: number) {
  if (rel >= 0.95) return "bg-surface-deep";
  if (rel >= 0.8) return "bg-surface-sage";
  return "bg-surface-rose";
}

function KnowledgePanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Knowledge base · retrieval" right={<span className="text-[11px] text-mute">top 3 of 1,420</span>} />
      <div className="mt-3 space-y-2.5 flex-1">
        {kbHits.map((k) => (
          <div
            key={k.id}
            className={cn(
              "rounded-md px-3 py-2.5",
              k.cited ? "bg-surface-mint/40 border border-surface-deep/15" : "bg-surface-fog/70",
            )}
          >
            <div className="flex items-center gap-2">
              <span className="text-[11px] tabular-nums font-bold text-surface-deep">{k.id}</span>
              {k.cited && (
                <span className="text-[9px] tracking-[0.05em] uppercase font-bold text-surface-deep bg-surface-mint px-1.5 py-0.5 rounded">
                  Cited
                </span>
              )}
              <span className="ml-auto flex items-center gap-1.5">
                <span className="h-1.5 w-12 rounded-full bg-white overflow-hidden border border-divider">
                  <span className={cn("block h-full rounded-full", knowledgeRelTone(k.rel))} style={{ width: `${k.rel * 100}%` }} />
                </span>
                <span className="text-[11px] tabular-nums text-surface-deep w-8 text-right">{k.rel.toFixed(2)}</span>
              </span>
            </div>
            <div className="text-[12px] text-ink leading-snug mt-1">{k.title}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ContextPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Linked records · context" right={<span className="text-[11px] text-mute">SAP · LevelPath</span>} />
      <div className="mt-3 divide-y divide-divider flex-1">
        {linked.map((l) => (
          <div key={l.record} className="flex items-start gap-3 py-2.5">
            <span className="text-[11.5px] tabular-nums text-surface-deep w-24 shrink-0">{l.record}</span>
            <span className="text-[12px] text-ink flex-1 min-w-0">{l.detail}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 pt-3 border-t border-divider">
        <div className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium mb-2">Classification & routing</div>
        <div className="space-y-1.5">
          {classification.map((c) => (
            <div key={c.label} className="flex items-center gap-3 text-[12px]">
              <span className="text-mute w-20 shrink-0">{c.label}</span>
              <span className="text-ink flex-1 min-w-0">{c.value}</span>
            </div>
          ))}
        </div>
      </div>
    </article>
  );
}

function SlaPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="SLA & deflection" right={<span className="text-[11px] text-mute">rolling 30 days</span>} />
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {metrics.map((m) => (
          <div key={m.label} className="rounded-md bg-surface-fog/70 px-3 py-3">
            <div className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium">{m.label}</div>
            <div className="text-[20px] font-bold text-surface-deep tabular-nums leading-none mt-1.5">{m.value}</div>
            <div className="text-[11px] text-mute leading-snug mt-1">{m.sub}</div>
          </div>
        ))}
      </div>
    </article>
  );
}

function HelpdeskContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Inbound ticket</div>
      <div className="text-[13px] font-bold text-ink mt-1">PRC-3322 · Dale Whitfield · Reliability Lead</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Email → ServiceNow · “Following up on the belt I flagged for Corrugator No.2 — do we have a delivery date yet?
        I need it for the maintenance window.” Known order-status query, ready to resolve.
      </p>
    </div>
  );
}

export function HelpdeskConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("helpdesk", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel title="Helpdesk inbox · open tickets" badge="1 to resolve" items={queue} onOpen={() => setOpen(true)} />
        <div className="grid grid-cols-2 gap-3 items-stretch">
          <KnowledgePanel />
          <ContextPanel />
        </div>
        <SlaPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="PRC-3322 · resolve helpdesk ticket"
          subtitle="Dale Whitfield · order-status query · P3 Normal"
          context={<HelpdeskContext />}
          ceremony={{
            agentLabel: "Helpdesk agent · drafting the resolution",
            steps: [
              "Classifying the query — order status · MRO",
              "Pulling PR-48201, PO-77310 and vendor 100482 context",
              "Retrieving policy from the knowledge base",
              "Drafting the answer with the cited article",
              "Closing PRC-3322 within SLA",
            ],
            doneSummary: (
              <>
                Known query resolved at <span className="font-bold">0.97</span> confidence with{" "}
                <span className="font-bold">KB-PROC-0148</span> · first response in 2 minutes, inside the 4-hour SLA.
              </>
            ),
            document: <HelpdeskTicket />,
            footerIntro: "The agent will classify the query, pull the order context, cite the policy and close the ticket.",
            approveLabel: "Approve & close ticket",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
