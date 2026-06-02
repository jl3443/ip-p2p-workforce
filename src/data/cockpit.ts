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

export type FleetAgent = {
  /** Links the row to its agent page and the catalog autonomy level. */
  id: AgentId;
  name: string;
  role: string;
  status: AgentStatus;
  /** Throughput stat shown on the right of the row. */
  stat: string;
  /** True for the orchestrator card, which is rendered with emphasis. */
  lead?: boolean;
};

export const fleetAgents: FleetAgent[] = [
  { id: "intake", name: "Intake", role: "Turns requests into clean requisitions", status: "running", stat: "142 today" },
  { id: "sourcing", name: "Sourcing & spot-buy", role: "Runs mini-tenders, finds savings", status: "running", stat: "38 tenders" },
  { id: "po", name: "Purchase order", role: "Drafts and issues compliant orders", status: "running", stat: "210 orders" },
  { id: "fulfillment", name: "Fulfillment", role: "Tracks delivery, chases late orders", status: "running", stat: "1,940 open lines" },
  { id: "invoice", name: "Invoice match", role: "Matches invoices, clears holds", status: "review", stat: "91% matched" },
  { id: "vendor", name: "Vendor master", role: "De-duplicates and verifies suppliers", status: "running", stat: "1,204 cleaned" },
  { id: "helpdesk", name: "Helpdesk", role: "Answers buyer and supplier questions", status: "running", stat: "523 chats" },
];

export const orchestrator: FleetAgent = {
  id: "orchestrator",
  name: "Process orchestrator",
  role: "Routes work, keeps shared context, escalates the exceptions that need a person",
  status: "running",
  stat: "82% touchless",
  lead: true,
};

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
    id: "PR-48188",
    type: "Contract renewal",
    site: "Procurement",
    urgency: "high",
    title: "Roll wrapping film — 12-month framework",
    sub: "Renewal 6% under last year · two suppliers compared · above your approval limit",
    dueLabel: "Due",
    dueWhen: "In 2 days",
    target: { kind: "workspace", flow: "belt" },
  },
  {
    id: "VM-90412",
    type: "New supplier",
    site: "Vendor master",
    urgency: "medium",
    title: "Verify replacement belt vendor — possible duplicate",
    sub: "Looks like an existing supplier from the DS Smith records · confirm before first order",
    dueLabel: "Due",
    dueWhen: "In 3 days",
    target: { kind: "workspace", flow: "belt" },
  },
];

export type LeakageRow = {
  source: string;
  amount: string;
  fix: string;
};

export const leakage = {
  headline: "20% of suppliers drive 80% of off-contract spend",
  rows: [
    { source: "Maverick maintenance buys", amount: "$6.1M off-contract", fix: "Route to framework suppliers" },
    { source: "Duplicate suppliers", amount: "30–40% of records", fix: "Merge after DS Smith integration" },
    { source: "Late freight invoices", amount: "$2.4M in disputes", fix: "Auto-match shipment documents" },
  ] as LeakageRow[],
  callout: "$1B cost-out program · $117M vendor-consolidation synergy in reach",
};
