import * as React from "react";
import { useApp, type AgentOutputStatus } from "@/state";
import { cn } from "@/lib/utils";
import { GoodsReceipt } from "@/components/docs/sap/GoodsReceipt";
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
 * Fulfillment & Expediting Agent console.
 *
 * Tracks open orders to on-time delivery, expedites slips and posts goods
 * receipt on arrival. Data surface: expedite worklist · delivery & shipment
 * status · open-order ageing · service-completion prompts. The ceremony books
 * the belt receipt and reveals GR-77310, handed to the Invoice agent.
 * ────────────────────────────────────────────────────────────────────────── */

const queue: QueueItem[] = [
  {
    id: "po-77310",
    primary: "PO-77310 · double-backer belt",
    secondary: "BeltPro · delivered to M042 dock · delivery note BPI-DN-5567",
    meta: "07:30",
    readyTag: "Ready to receive",
    actionable: true,
  },
  {
    id: "po-77298",
    primary: "PO-77298 · drive bearing set",
    secondary: "Apex · in transit · ETA 2026-06-11 · on schedule",
    meta: "2d open",
    handledTag: "On track",
  },
  {
    id: "po-77251",
    primary: "PO-77251 · gearbox oil (bulk)",
    secondary: "Apex · supplier acknowledged · ships 2026-06-12",
    meta: "4d open",
    handledTag: "Chase sent",
  },
];

type Ship = { label: string; value: string; done?: boolean };
const shipment: Ship[] = [
  { label: "Supplier ack", value: "Confirmed 2026-06-03 · 24h SLA met", done: true },
  { label: "Shipped", value: "2026-06-08 · BOL MEMPHIS-4471-2026", done: true },
  { label: "Delivered", value: "2026-06-09 07:30 · No.2 corrugator dock", done: true },
  { label: "Goods receipt", value: "Pending — confirm to post GR" },
];

type Age = { bucket: string; count: number; tone: "ok" | "warn" | "risk" };
const ageing: Age[] = [
  { bucket: "0–3 days", count: 1180, tone: "ok" },
  { bucket: "4–7 days", count: 540, tone: "ok" },
  { bucket: "8–14 days", count: 162, tone: "warn" },
  { bucket: "15+ days · at risk", count: 58, tone: "risk" },
];

type SvcRow = { po: string; requestor: string; status: string; done: boolean };
const serviceCompletion: SvcRow[] = [
  { po: "PO-77310", requestor: "R. Alvarez · Reliability", status: "Prompt queued on receipt", done: false },
  { po: "PO-77280", requestor: "T. Nguyen · Maintenance", status: "Confirmed complete", done: true },
  { po: "PO-77244", requestor: "S. Patel · Operations", status: "Confirmed complete", done: true },
];

const outputMeta: OutputMeta = {
  none: { label: "Not received yet", kind: "neutral", note: "Open the delivered order to confirm and post goods receipt." },
  pending: { label: "On pending", kind: "neutral", note: "Receipt for PO-77310 parked — resume from the worklist." },
  approved: {
    label: "Received · handed off",
    kind: "active",
    note: "GR-77310 posted and handed to the Invoice agent for matching.",
  },
  rejected: { label: "Rejected", kind: "critical", note: "Receipt rejected — flag a delivery discrepancy." },
  escalated: { label: "Escalated", kind: "critical", note: "Quality hold raised — routed to the buyer and requestor." },
};

const chatScript: ChatTurn[] = [
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "I'm the Fulfillment & Expediting Agent — I chase open orders to on-time delivery and post the goods receipt. Ask me about the worklist.",
        children: (
          <div className="text-[12.5px] text-ink leading-[19px]">
            <div className="text-mute mb-1">For example —</div>
            <ul className="space-y-0.5">
              <li>· Is the belt order on time</li>
              <li>· What's at risk of slipping</li>
              <li>· When goods receipt posts</li>
            </ul>
          </div>
        ),
      },
    ],
    chips: ["Is PO-77310 on time?", "What's at risk?", "When does GR post?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "Yes — BeltPro acknowledged within the 24h SLA, shipped 2026-06-08 and delivered 07:30 today to the No.2 corrugator dock, a day ahead of the 2026-06-10 promise. Ready to receive.",
      },
    ],
    chips: ["What's at risk?", "When does GR post?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "fog",
        text: "58 lines sit in the 15-days-plus bucket. I've auto-sent status chases on the approved channel and surfaced the four with confirmed late delivery to the buyer — the rest are still inside terms.",
      },
    ],
    chips: ["When does GR post?"],
  },
  {
    reply: [
      {
        kind: "agent",
        tone: "mint",
        text: "As soon as you confirm receipt — I match the delivery note to PO-77310, book the EA to the Maintenance store under movement type 101, and post GR-77310. That releases the line to the Invoice agent for matching.",
      },
    ],
  },
];

const config: ConsoleConfig = {
  id: "fulfillment",
  statLabel: "Open lines",
  artifactLabel: "Goods receipt · GR-77310",
  outputMeta,
  chatName: "Fulfillment agent",
  chatScript,
  runRole: "Issues the order, confirms the supplier and books goods receipt GR-77310.",
  openRunLabel: "Open the delivered order",
};

function ShipmentPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Delivery & shipment · PO-77310" right={<span className="text-[11px] text-mute">due 2026-06-10</span>} />
      <div className="mt-3 space-y-2.5 flex-1">
        {shipment.map((s) => (
          <div key={s.label} className="flex items-start gap-3">
            <span
              className={cn(
                "w-5 h-5 rounded-md flex items-center justify-center shrink-0 mt-0.5 text-[10px] font-bold",
                s.done ? "bg-surface-deep text-ink-inverse" : "bg-surface-fog border border-divider text-mute",
              )}
            >
              {s.done ? "✓" : "•"}
            </span>
            <div className="min-w-0">
              <div className="text-[12.5px] font-bold text-ink">{s.label}</div>
              <div className="text-[11px] text-mute leading-snug">{s.value}</div>
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function AgeingPanel() {
  const max = Math.max(...ageing.map((a) => a.count));
  const barTone = { ok: "bg-surface-deep", warn: "bg-surface-sage", risk: "bg-mark-red" };
  return (
    <article className="bg-white border border-divider rounded-md p-5 flex flex-col h-full">
      <CardHeader label="Open-order ageing" right={<span className="text-[11px] text-mute">1,940 open lines</span>} />
      <div className="mt-4 space-y-3 flex-1">
        {ageing.map((a) => (
          <div key={a.bucket}>
            <div className="flex items-center justify-between text-[11.5px] mb-1">
              <span className={cn(a.tone === "risk" ? "text-mark-red font-medium" : "text-ink")}>{a.bucket}</span>
              <span className="tabular-nums text-mute">{a.count.toLocaleString("en-US")}</span>
            </div>
            <div className="h-2 w-full rounded-full bg-surface-fog overflow-hidden">
              <div className={cn("h-full rounded-full", barTone[a.tone])} style={{ width: `${(a.count / max) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>
    </article>
  );
}

function ServiceCompletionPanel() {
  return (
    <article className="bg-white border border-divider rounded-md p-5">
      <CardHeader label="Service-completion status" right={<span className="text-[11px] text-mute">so GR posts on time</span>} />
      <div className="mt-3 divide-y divide-divider">
        {serviceCompletion.map((r) => (
          <div key={r.po} className="flex items-center gap-3 py-2.5">
            <span className="text-[11.5px] tabular-nums text-surface-deep w-24 shrink-0">{r.po}</span>
            <span className="text-[12.5px] text-ink flex-1 min-w-0 truncate">{r.requestor}</span>
            <span
              className={cn(
                "text-[10px] tracking-[0.04em] uppercase font-bold px-2 py-0.5 rounded shrink-0",
                r.done ? "bg-surface-mint text-surface-deep" : "bg-surface-fog text-mute border border-divider",
              )}
            >
              {r.status}
            </span>
          </div>
        ))}
      </div>
    </article>
  );
}

function FulfillmentContext() {
  return (
    <div className="rounded-md border border-divider bg-surface-fog/60 px-4 py-3">
      <div className="text-[11px] tracking-[0.05em] uppercase text-surface-deep font-bold">Inbound delivery</div>
      <div className="text-[13px] font-bold text-ink mt-1">PO-77310 · double-backer belt · BeltPro Industrial</div>
      <p className="text-[12.5px] text-ink leading-snug mt-1">
        Delivered 2026-06-09 07:30 to the No.2 corrugator dock · delivery note BPI-DN-5567 · 1 EA · a day ahead of
        the contracted date. Ready to confirm and book the goods receipt.
      </p>
    </div>
  );
}

export function FulfillmentConsole() {
  const { setAgentOutput, go } = useApp();
  const [open, setOpen] = React.useState(false);

  const decide = (status: AgentOutputStatus) => {
    setAgentOutput("fulfillment", status);
    if (status === "approved") go({ kind: "workspace", flow: "belt" });
    else setOpen(false);
  };

  return (
    <>
      <AgentConsole config={config} onOpenRun={() => setOpen(true)}>
        <QueuePanel title="Open orders · expedite worklist" badge="1 to receive" items={queue} onOpen={() => setOpen(true)} />
        <div className="grid grid-cols-2 gap-3 items-stretch">
          <ShipmentPanel />
          <AgeingPanel />
        </div>
        <ServiceCompletionPanel />
      </AgentConsole>

      {open && (
        <CeremonyModal
          title="PO-77310 · confirm goods receipt"
          subtitle="BeltPro delivery arrived at the mill · 2026-06-09 07:30"
          context={<FulfillmentContext />}
          ceremony={{
            agentLabel: "Fulfillment agent · booking the receipt",
            steps: [
              "Matching delivery note BPI-DN-5567 to PO-77310",
              "Confirming quantity received — 1 EA",
              "Booking to Maintenance store MNT1 · movement type 101",
              "Prompting the requestor for service completion",
              "Posting goods receipt GR-77310",
            ],
            doneSummary: (
              <>
                Delivery matched to PO-77310 · <span className="font-bold">1 EA</span> received and booked to MNT1
                ahead of the maintenance window. GR-77310 posted and handed to the Invoice agent.
              </>
            ),
            document: <GoodsReceipt />,
            footerIntro: "The agent will match the delivery note, confirm quantity, book stock and post the receipt.",
            approveLabel: "Approve & post receipt",
          }}
          onClose={() => setOpen(false)}
          onDecide={decide}
        />
      )}
    </>
  );
}
