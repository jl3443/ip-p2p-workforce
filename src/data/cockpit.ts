/**
 * Cockpit (hub) data — the orchestrator's view of the P2P workforce.
 * Numbers are seeded for the demo and tie out across the cockpit panels.
 */

import type { View } from "@/state";
import type { AgentId } from "@/data/agents";
import type { KPI } from "@/components/blocks/KPIStrip";

/** Top KPI strip — all framed so "up" is good (green tone). */
export const cockpitKpis: KPI[] = [
  {
    label: "Touchless rate",
    value: 82,
    suffix: "%",
    trend: { delta: "+9 pts", direction: "up" },
    spark: [61, 64, 68, 70, 73, 77, 80, 82],
  },
  {
    label: "Roles redeployed",
    value: 86,
    suffix: " of 139",
    trend: { delta: "+18", direction: "up" },
    spark: [40, 48, 55, 61, 68, 74, 81, 86],
  },
  {
    label: "On-contract spend",
    value: 94,
    suffix: "%",
    trend: { delta: "+11 pts", direction: "up" },
    spark: [80, 82, 84, 86, 88, 90, 92, 94],
  },
  {
    label: "Exceptions auto-resolved",
    value: 78,
    suffix: "%",
    trend: { delta: "+14 pts", direction: "up" },
    spark: [55, 58, 62, 66, 69, 72, 75, 78],
  },
];

export type AgentStatus = "running" | "review" | "idle";

/** One stage of the procure-to-pay value chain, in flow order PR → payment. */
export type PipelineStage = {
  /** Position in the flow (1–6) — drawn as the rail node. */
  n: number;
  name: string;
  /** Owning agent for the deep-link — null where work hands off to Treasury. */
  agent: AgentId | null;
  /** Primary throughput count. */
  volume: string;
  /** Secondary read on the stage's health. */
  detail: string;
  status: AgentStatus;
};

/** The live pipeline — requisition all the way through to payment-ready. */
export const pipelineStages: PipelineStage[] = [
  { n: 1, name: "Requisitions", agent: "intake", volume: "142 today", detail: "118 auto-submitted", status: "running" },
  { n: 2, name: "Sourcing & RFQ", agent: "sourcing", volume: "38 tenders", detail: "6 need sign-off", status: "review" },
  { n: 3, name: "Purchase orders", agent: "po", volume: "210 issued", detail: "94% on-contract", status: "running" },
  { n: 4, name: "Expediting", agent: "fulfillment", volume: "1,940 open", detail: "47 chased today", status: "running" },
  { n: 5, name: "Invoice match", agent: "invoice", volume: "1,610 matched", detail: "22 on hold", status: "review" },
  { n: 6, name: "Payment ready", agent: null, volume: "188 scheduled", detail: "$4.6M to Treasury", status: "idle" },
];

export const pipelineFooter = "Requisition-to-order median 4.2 h · 82% touchless end-to-end";

export type PendingDecision = {
  id: string;
  type: string;
  site: string;
  urgency: "critical" | "high" | "medium";
  title: string;
  sub: string;
  dueLabel: string;
  dueWhen: string;
  target: View;
};

export const pendingDecisions: PendingDecision[] = [
  {
    id: "PR-48201",
    type: "Spot-buy · maintenance",
    site: "Containerboard mill",
    urgency: "critical",
    title: "Corrugator No.2 double-backer belt — $48,200",
    sub: "Production-critical · on-contract supplier recommended · above your touchless limit",
    dueLabel: "Needed",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "belt" },
  },
  {
    id: "PR-48630",
    type: "Off-contract spot-buy",
    site: "Power House",
    urgency: "high",
    title: "Boiler feed pump — $96,400",
    sub: "Off-contract · single compliant bid · 24% over benchmark · front-office review",
    dueLabel: "Due",
    dueWhen: "Today",
    target: { kind: "workspace", flow: "pump" },
  },
  {
    id: "INV-ADS-4419",
    type: "Payment exception",
    site: "Containerboard mill",
    urgency: "critical",
    title: "Drive gearbox invoice — bank detail changed",
    sub: "New bank account + short receipt · payment held for fraud review · back-office",
    dueLabel: "Hold",
    dueWhen: "Now",
    target: { kind: "workspace", flow: "gearbox" },
  },
];

/** A live expedite / follow-up — the chase stage made concrete. */
export type ChaseRow = {
  id: string;
  /** What is being chased. */
  subject: string;
  /** What the agent has already done on its own. */
  action: string;
  /** How overdue, e.g. "4 days late". */
  lateLabel: string;
  /** Value at risk on the line. */
  amount: string;
  /** Drives the urgency colour on the days-late figure. */
  tone: "critical" | "high" | "medium";
  /** Optional deep-link into the run that owns this line. */
  target?: View;
};

export const expediting = {
  rows: [
    { id: "PO-77310", subject: "Corrugator belt", action: "Sent expedite note #2 to supplier", lateLabel: "4 days late", amount: "$48.2K", tone: "critical", target: { kind: "workspace", flow: "belt" } },
    { id: "PO-76980", subject: "Roll wrapping film", action: "Chasing supplier acknowledgement", lateLabel: "2 days late", amount: "$128K", tone: "high" },
    { id: "INV-55012", subject: "Late freight invoice", action: "Requested proof of delivery", lateLabel: "6 days open", amount: "$31K", tone: "high" },
    { id: "PO-75540", subject: "MRO bearings", action: "Short 12 units · flagged to buyer", lateLabel: "3 days late", amount: "$9.4K", tone: "medium" },
  ] as ChaseRow[],
  footer: "$216K at risk being worked · 47 chases auto-sent today · 9 cleared",
};
