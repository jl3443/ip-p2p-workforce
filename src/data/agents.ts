/**
 * Agent catalog — the authoritative spec for the 7 specialist agents and the
 * orchestrator, transcribed from the TCS → IP procure-to-pay workforce brief.
 * Every agent surface (work-menu pages, cockpit fleet, belt-run accountability)
 * reads from here so names, stats and autonomy levels stay consistent.
 */

import type { LucideIcon } from "lucide-react";
import {
  Inbox,
  Search,
  FileText,
  Truck,
  ReceiptText,
  Building2,
  MessagesSquare,
  Workflow,
} from "lucide-react";

export type AgentId =
  | "intake"
  | "sourcing"
  | "po"
  | "fulfillment"
  | "invoice"
  | "vendor"
  | "helpdesk"
  | "orchestrator";

export type AgentStatus = "running" | "review" | "idle";

/** L2 Assistant → L3 Supervised → L4 Autonomous (configurable guardrails). */
export type AutonomyLevel = 2 | 3 | 4;

export const AUTONOMY_LABEL: Record<AutonomyLevel, string> = {
  2: "Assistant",
  3: "Supervised",
  4: "Autonomous",
};

export type AgentSpec = {
  id: AgentId;
  /** Full name shown as the page title. */
  name: string;
  /** Short nav label — ≤ 3 words, no abbreviations. */
  menuLabel: string;
  icon: LucideIcon;
  purpose: string;
  inputs: string[];
  outputs: string[];
  tech: string[];
  /** Default autonomy level; the detail page lets the presenter dial it. */
  autonomy: AutonomyLevel;
  /** The L3 guardrail rule — the auto-execute condition for this agent. */
  autonomyRule: string;
  escalation: string[];
  /** Throughput stat shown on rows and the detail hero. */
  stat: string;
  status: AgentStatus;
  /** IP-specific context callout (e.g. DS Smith for the vendor agent). */
  note?: string;
  /** The orchestrator coordinates rather than executes — no autonomy dial. */
  coordinator?: boolean;
};

export const agents: AgentSpec[] = [
  {
    id: "intake",
    name: "Intake Agent",
    menuLabel: "Intake",
    icon: Inbox,
    purpose:
      "Turns an employee's plain-language need into a structured, compliant purchase requisition routed through LevelPath.",
    inputs: [
      "Employee request (chat, email or LevelPath form)",
      "IP category tree and spending policy",
      "Active contracts and preferred-supplier list",
      "Budget mapping (employee → cost center → budget)",
      "Historical purchasing patterns for the department",
    ],
    outputs: [
      "Structured PR draft — category, quantity, spec, justification, suggested supplier",
      "Ranked supplier list (contracted → preferred → new)",
      "Compliance flags for off-contract spend or threshold breaches",
      "Approver routing recommendation",
      "Escalation to a category sourcing manager for novel requests",
    ],
    tech: ["Instruction-tuned LLM", "Viki LLM + graph relational DB", "LevelPath API", "SAP master data"],
    autonomy: 3,
    autonomyRule:
      "Auto-submits the requisition when it is under the threshold, on-contract and budget is available — anything else is drafted and routed to a human approver.",
    escalation: [
      "Novel category",
      "Off-contract over the threshold",
      "Budget over-run",
      "Compliance flag",
      "Ambiguous specification",
    ],
    stat: "142 today",
    status: "running",
  },
  {
    id: "sourcing",
    name: "Tactical Sourcing & Spot-Buy Agent",
    menuLabel: "Sourcing",
    icon: Search,
    purpose:
      "Runs operational tactical buying within thresholds — auto-RFQs, three-bid mini-tenders and spot buys — while strategic categories escalate to human sourcing managers.",
    inputs: [
      "Approved PR or category sourcing event",
      "Existing supplier pool (capability, performance, financial health)",
      "Active contracts and pricing terms",
      "Historical RFQ outcomes",
      "Supplier risk data (geopolitical, financial, ESG)",
    ],
    outputs: [
      "Auto-drafted RFQ with specs, terms and evaluation criteria",
      "Supplier shortlist with ranking rationale",
      "Negotiation brief (leverage points, BATNA, walk-away)",
      "Bid analysis comparison",
      "Full recommendation for human sign-off on strategic categories",
    ],
    tech: ["GenAI", "ML demand & price forecasting", "Viki LLM + graph relational DB", "e-Sourcing integration"],
    autonomy: 3,
    autonomyRule:
      "Auto-runs the RFQ and selects the supplier for routine categories under the threshold from the approved pool — strategic categories go to a sourcing manager.",
    escalation: [
      "Strategic category",
      "New supplier introduction",
      "Spend over the threshold",
      "Risk score above the threshold",
    ],
    stat: "38 tenders",
    status: "running",
    note: "Highest-cost, lowest-productivity bucket today (~600 mini-tenders per FTE per year) — a priority AI target.",
  },
  {
    id: "po",
    name: "Purchase Order Agent",
    menuLabel: "Purchase orders",
    icon: FileText,
    purpose:
      "Creates the purchase order from an approved requisition, binds it to contract terms, routes it for approval and posts it to SAP.",
    inputs: [
      "Approved PR",
      "Selected supplier and contract",
      "Contract terms (price, lead time, quality, payment, SLAs)",
      "Real-time budget headroom",
      "Historical PO patterns for the supplier",
    ],
    outputs: [
      "Contract-bound PO with every required field populated",
      "Compliance check — PO vs contract terms and budget",
      "Approval workflow routed to the right approvers",
      "Posted to SAP on final approval",
      "Supplier-facing PO transmission on the approved channel",
    ],
    tech: ["GenAI contract-PO alignment", "Structured workflow", "SAP API", "LevelPath orchestration"],
    autonomy: 2,
    autonomyRule:
      "Auto-creates and approves under the threshold when the order is contract-compliant and budget is available — otherwise it drafts and routes for approval.",
    escalation: [
      "Over the threshold",
      "Contract-term deviation",
      "Budget over-run",
      "Supplier not in the master",
      "Foreign-currency exposure",
    ],
    stat: "210 orders",
    status: "running",
  },
  {
    id: "fulfillment",
    name: "Fulfillment & Expediting Agent",
    menuLabel: "Fulfillment",
    icon: Truck,
    purpose:
      "Tracks open orders to on-time delivery, expedites slipping orders and prompts requestors to confirm service completion.",
    inputs: [
      "PO and contracted delivery schedule (SAP)",
      "Supplier acknowledgements and shipment status",
      "Open-order ageing",
      "Service-completion status from requestors",
    ],
    outputs: [
      "Prioritized expedite worklist (orders at risk of late delivery)",
      "Auto-drafted status-chase notes to suppliers",
      "Delivery-discrepancy flags routed to the right owner",
      "Service-completion prompts so goods receipt posts on time",
      "On-time-delivery and ageing signal to the orchestrator",
    ],
    tech: ["GenAI supplier comms", "ML delivery-risk prediction", "SAP MM / SRM APIs"],
    autonomy: 4,
    autonomyRule:
      "Auto-sends the status chase and logs it once an order passes its ship milestone with the supplier on an approved channel — otherwise it surfaces a recommended action to the buyer.",
    escalation: [
      "Confirmed late delivery beyond terms",
      "Quality hold",
      "Repeated supplier non-response",
      "Supply-risk on a critical line",
    ],
    stat: "1,940 open lines",
    status: "running",
  },
  {
    id: "invoice",
    name: "Invoice Resolution & Match Agent",
    menuLabel: "Invoices",
    icon: ReceiptText,
    purpose:
      "Resolves procurement-side invoice blocks and runs three- and four-way matching across contract, PO, goods receipt and invoice; clean items release to AP, exceptions get a classified fix.",
    inputs: [
      "Invoice (PDF, EDI, portal or scanned paper)",
      "Matching PO and goods receipt",
      "Underlying contract terms",
      "Supplier master (bank account, terms, tax)",
      "Historical invoice patterns (fraud baseline)",
    ],
    outputs: [
      "Extracted invoice data with confidence scores",
      "Four-way match result — contract, PO, goods receipt, invoice",
      "Clean invoices posted to SAP and scheduled for payment",
      "Exception root-cause + proposed resolution + draft note",
      "Fraud score and anomaly flags",
    ],
    tech: ["Document intelligence (IDP)", "GenAI for unstructured fields", "ML matching & fraud", "Viki LLM", "SAP API"],
    autonomy: 3,
    autonomyRule:
      "Auto-posts and releases to AP when the four-way match is clean, confidence is above 0.95, under the threshold and no fraud flag — otherwise it proposes a fix for approval.",
    escalation: [
      "Match failure",
      "Low extraction confidence",
      "Fraud signal",
      "Dispute history with the supplier",
      "Regulatory flag (sanctions, tax)",
    ],
    stat: "91% matched",
    status: "review",
    note: "Full AP invoice processing stays with the Capgemini-run finance & accounting tower — this agent owns the procurement-side match and resolution.",
  },
  {
    id: "vendor",
    name: "Vendor Master & Records Agent",
    menuLabel: "Vendor master",
    icon: Building2,
    purpose:
      "Continuously maintains vendor-master quality — detecting duplicates, flagging risk and proposing merges — and keeps purchasing-info records aligned on price, source lists and contracts.",
    inputs: [
      "Live vendor master (SAP)",
      "Vendor onboarding requests",
      "Per-vendor transaction history (spend, payments, disputes)",
      "External data (Dun & Bradstreet, sanctions, tax, credit)",
      "Vendor-portal self-service updates",
    ],
    outputs: [
      "Duplicate / near-duplicate detection with merge proposals",
      "Onboarding decision (approve, request info, reject) with reasoning",
      "Risk flags — financial distress, sanctions, fraud pattern",
      "Payment-hold recommendations",
      "Master-data quality dashboard (completeness, accuracy, freshness)",
    ],
    tech: ["ML fuzzy matching", "GenAI name & address normalization", "External data APIs", "SAP master-data write-back"],
    autonomy: 2,
    autonomyRule:
      "Auto-merges only when confidence is above 0.98 across multiple match dimensions and value-at-risk is low — everything else escalates.",
    escalation: [
      "New vendor",
      "High-value vendor",
      "Sanctions match",
      "Fraud pattern",
      "Conflicting external signals",
    ],
    stat: "1,204 cleaned",
    status: "running",
    note: "Directly attacks the DS Smith duplicate-vendor problem (TCS estimate: 30–40% duplicates) — part of unlocking $117M of IP's $514M DS Smith synergy target.",
  },
  {
    id: "helpdesk",
    name: "Procurement Helpdesk Agent",
    menuLabel: "Helpdesk",
    icon: MessagesSquare,
    purpose:
      "Resolves first-line buyer and supplier questions inside the workflow — deflecting repetitive tickets and cutting response time across the procurement helpdesk.",
    inputs: [
      "Inbound query (email, portal, ServiceNow, chat)",
      "PR / PO / invoice context (SAP, Ariba, LevelPath)",
      "Policy, SOP and FAQ knowledge base",
      "Supplier and contract records",
      "Open-ticket history and SLA targets",
    ],
    outputs: [
      "Auto-resolution for known queries with the cited policy",
      "Draft response for the analyst to approve on judgment calls",
      "Ticket classification, priority and routing",
      "Deflection and first-response-time metrics",
      "Knowledge-gap flags where the base needs updating",
    ],
    tech: ["GenAI + retrieval over the policy base", "Viki LLM + graph", "ServiceNow / SAP / Ariba"],
    autonomy: 4,
    autonomyRule:
      "Auto-resolves and closes known query types above 0.9 confidence with the cited policy — otherwise it drafts a response or routes to the owning agent.",
    escalation: [
      "Low confidence",
      "Policy exception",
      "Dispute",
      "VIP / strategic supplier",
      "Master-data or PO change beyond helpdesk authority",
    ],
    stat: "523 chats",
    status: "running",
  },
  {
    id: "orchestrator",
    name: "P2P Process Orchestrator",
    menuLabel: "Orchestrator",
    icon: Workflow,
    purpose:
      "Coordinates the seven agents end-to-end — managing handoffs, keeping shared context and routing exceptions — and owns reporting and continuous improvement.",
    inputs: [
      "Every agent's output and state",
      "Process-level policies and SLAs",
      "Cross-agent context for human resolution",
    ],
    outputs: [
      "Process dashboards (cycle time, touchless rate, exception rate)",
      "Proactive 80/20 leakage and opportunity insights",
      "Cross-agent handoff coordination",
      "One unified human-escalation interface",
      "A full audit log per transaction",
    ],
    tech: ["Agent orchestration platform", "Shared memory store", "Observability stack"],
    autonomy: 4,
    autonomyRule:
      "Coordinates the workforce rather than executing buys itself — it keeps shared context, sequences handoffs and routes the exceptions that need a person.",
    escalation: [
      "Cross-agent match failure",
      "SLA breach risk",
      "Repeated exception on one supplier or category",
    ],
    stat: "82% touchless",
    status: "running",
    coordinator: true,
  },
];

export const agentsById: Record<AgentId, AgentSpec> = agents.reduce(
  (acc, a) => ((acc[a.id] = a), acc),
  {} as Record<AgentId, AgentSpec>,
);

/** The seven specialists, in pipeline order (orchestrator excluded). */
export const specialistAgents: AgentSpec[] = agents.filter((a) => a.id !== "orchestrator");
