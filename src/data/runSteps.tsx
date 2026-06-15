/**
 * The belt run — four gated agent steps in process order.
 *
 * Each step is one specialist agent doing its job on the same double-backer-belt
 * transaction: it reads upstream evidence (clickable source files), streams its
 * reasoning, produces a faithful SAP artifact, and pauses for a human decision
 * (approve · pending · escalate · reject). Approve hands the output to the next
 * agent. Two steps run an email round-trip (Sourcing's RFQ, Invoice's remittance
 * advice) whose reply lands as a new source card.
 *
 * Process order — PR Processing → Sourcing → PO management → Invoice. PO
 * management owns expediting, and the goods receipt is plant-posted evidence the
 * Invoice agent matches against. Data is lifted from the agents' own console
 * ceremonies so the run and the desks stay in lockstep.
 */

import * as React from "react";
import type { AgentId } from "@/data/agents";
import { PurchaseRequisition } from "@/components/docs/sap/PurchaseRequisition";
import { RfqComparison } from "@/components/docs/sap/RfqComparison";
import { PurchaseOrder } from "@/components/docs/sap/PurchaseOrder";
import { GoodsReceipt } from "@/components/docs/sap/GoodsReceipt";
import { InvoiceMatch } from "@/components/docs/sap/InvoiceMatch";
import {
  EmailDoc,
  OutlineAgreementDoc,
  SpendingPolicyDoc,
  BudgetDoc,
  SupplierPoolDoc,
  VendorRecordDoc,
  VendorInvoiceDoc,
} from "@/components/docs/sources";

export type SourceKind =
  | "sap"
  | "email"
  | "contract"
  | "policy"
  | "budget"
  | "master"
  | "external"
  | "edi"
  | "kb"
  | "invoice";

export type SourceArtifact = {
  id: string;
  label: string;
  meta: string;
  kind: SourceKind;
  /** Marks the previous agent's output handed into this step. */
  handoff?: boolean;
  body: React.ReactNode;
};

export type EmailReply = {
  from: string;
  receivedMeta: string;
  subject: string;
  lines: string[];
  /** Appended to the step's source panel once the reply lands. */
  source: SourceArtifact;
};

export type EmailAction = {
  cta: string;
  to: string;
  subject: string;
  lines: string[];
  reply: EmailReply;
  toastTitle: string;
  toastBody: string;
};

/** One evaluated control in the do-not-execute / do-not-pay envelope. */
export type ControlGate = {
  name: string;
  result: string;
  /** "clear" = passed · "tripped" = this control caught the exception. */
  state: "clear" | "tripped";
};

/**
 * The resolution surface a step shows once it halts on an exception. It turns a
 * one-line "run halted" into the audit-grade payoff a Controller acts on:
 * which control tripped, the evidence bundled, where it routes, and the
 * immutable audit record.
 */
export type ExceptionResolution = {
  /** Headline for the resolution card (e.g. "Payment held · do-not-pay envelope"). */
  title: string;
  /** Every control evaluated — tripped ones render red, clear ones deep. */
  gates: ControlGate[];
  /** The evidence the agent bundled for the human reviewer. */
  evidence: { label: string; detail: string }[];
  /** The controlled handoff — who receives it, the SLA, and the next action. */
  handoff: { to: string; sla: string; nextStep: string };
  /** The immutable audit record written when the run halted. */
  audit: { id: string; logged: string; note: string };
  /** The controlled response the agent drafted — review and send, no reply. */
  draft?: {
    to: string;
    subject: string;
    lines: string[];
    sendLabel: string;
    sentLabel: string;
  };
};

/**
 * One stage of the staged-extraction wizard. The agent reads a single source
 * file (sourceId), shows the reasoning line for it (spinner while active), and
 * fills one section of the produced document as an editable form box. When a
 * step carries `stages`, the workspace plays this wizard one source at a time
 * before revealing the complete document.
 */
export type ExtractStage = {
  /** Must match one of the step's sources[].id — rendered on the right. */
  sourceId: string;
  /** The reasoning line for this stage (spins until Proceed). */
  reasoning: string;
  /** The form-box section title (a section of the produced doc). */
  title: string;
  /**
   * A short AI rationale written out (typed) above the fields — used on the
   * recommendation stage so the agent explains its pick in prose, not just
   * form cells. Omit on the plain extraction stages.
   */
  narrative?: string;
  /**
   * Auto-filled, editable fields extracted from the source. A field with
   * `options` renders as a dropdown (e.g. payment terms — Net 30 / 60 / 90) so
   * the reviewer can override the agent's pick; a field with `type: "date"`
   * renders a date input with a native calendar picker; otherwise text.
   * Omit on match-grid stages.
   */
  fields?: { label: string; value: string; options?: string[]; type?: "date" }[];
  /**
   * Renders the cumulative four-way-match grid instead of a form box. The grid
   * persists across the match stages: each stage reveals one more column
   * (`reveal` is the cumulative set), so the checked values from the previous
   * file stay on screen and the next file's column fills in beside them — a
   * live side-by-side comparison. Same model is shared by every match stage.
   */
  matchGrid?: MatchGrid;
};

/** One cell of the four-way-match grid — a value and whether it agrees. */
export type MatchCell = { value: string; ok: boolean };

/** The shared four-way-match comparison grid (contract · PO · GR · invoice). */
export type MatchGrid = {
  columns: { key: string; label: string }[];
  rows: { dimension: string; cells: Record<string, MatchCell> }[];
  /** Cumulative columns visible by the end of THIS stage (left → right fill). */
  reveal: string[];
  /** Summary line shown under the grid once every column is in. */
  verdict?: string;
};

export type RunStep = {
  id: AgentId;
  /** Optional display name override (e.g. "Payment & Collections Agent"). */
  agentName?: string;
  n: number;
  title: string;
  sub: string;
  /** Streamed reasoning lines shown in the AI workspace. */
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  sources: SourceArtifact[];
  email?: EmailAction;
  /** One-line AI verdict shown above the decision buttons. */
  recommendation: string;
  /** Resolution surface shown when this step halts the run (escalate / reject). */
  exception?: ExceptionResolution;
  /** Staged auto-fill wizard — one stage per source. Omit for auto-reveal steps. */
  stages?: ExtractStage[];
};

/* ── Step 1 · Intake — PR-48201 ──────────────────────────────────────────── */

const intakeStep: RunStep = {
  id: "intake",
  n: 1,
  title: "Intake — requisition",
  sub: "Turns the mill's note into a compliant PR",
  reasoning: [
    "Reading the maintenance note from the Containerboard mill",
    "Classifying — MRO · Conveyor & belting · material 88-DBX",
    "Matching to the BeltPro framework 4600001207 — −8% vs list",
    "Checking budget — cost center 0000041702 · headroom available",
    "Drafting requisition PR-48201",
  ],
  docLabel: "PR-48201 · Purchase requisition",
  document: <PurchaseRequisition />,
  sources: [
    {
      id: "maintenance-note",
      label: "Maintenance note",
      meta: "Outlook · 09:01",
      kind: "email",
      body: (
        <EmailDoc
          from="Dale Whitfield"
          fromAddr="dwhitfield@northgatepaper.com"
          to="Procurement Intake"
          sent="2026-06-03 · 09:01"
          subject="No.2 double-backer belt — wear beyond limit"
          lines={[
            "The double-backer belt on Corrugator No.2 is flagging wear beyond the limit. Reliability wants it replaced inside the week or we risk the line.",
            "It's the BeltPro 88-DBX we run on the MRO framework. Can you raise the requisition? Maintenance window is 2026-06-10.",
            "Charge it to Corrugating No.2 — cost center 41702. Thanks.",
          ]}
        />
      ),
    },
    {
      id: "policy-mro",
      label: "Spending policy",
      meta: "POL-MRO-04",
      kind: "policy",
      body: <SpendingPolicyDoc />,
    },
    {
      id: "framework-intake",
      label: "BeltPro framework",
      meta: "SAP ME33K · 4600001207",
      kind: "contract",
      body: <OutlineAgreementDoc />,
    },
    {
      id: "budget-intake",
      label: "Budget headroom",
      meta: "SAP CO · 0000041702",
      kind: "budget",
      body: <BudgetDoc />,
    },
  ],
  email: {
    cta: "Send the requisition confirmation",
    to: "Dale Whitfield · Reliability",
    subject: "PR-48201 raised — double-backer belt routed to sourcing",
    lines: [
      "Turned your note into requisition PR-48201 — matched the belt to catalog part 88-DBX on the BeltPro framework 4600001207, charged to cost center 41702.",
      "On-contract and under the $50k MRO ceiling, so it auto-submitted to sourcing. I'll keep this thread updated as the order moves.",
    ],
    toastTitle: "Requester confirmed",
    toastBody: "Dale Whitfield acknowledged the requisition — added to your sources.",
    reply: {
      from: "Dale Whitfield",
      receivedMeta: "Outlook · 09:14",
      subject: "RE: PR-48201 raised",
      lines: [
        "Thanks — that's the right part. We need it before the maintenance window on 2026-06-10.",
      ],
      source: {
        id: "intake-ack",
        label: "Requester reply",
        meta: "Outlook · 09:14",
        kind: "email",
        body: (
          <EmailDoc
            from="Dale Whitfield"
            fromAddr="dwhitfield@northgatepaper.com"
            to="Procurement Intake"
            sent="2026-06-03 · 09:14"
            subject="RE: PR-48201 raised"
            tone="inbound"
            lines={[
              "Thanks — that's the right part. We need it before the maintenance window on 2026-06-10.",
              "Appreciate the quick turn.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "On-contract · $48,200 under the $50k MRO ceiling · budget available. Met the L3 auto-submit rule — requisition drafted.",
  stages: [
    {
      sourceId: "maintenance-note",
      reasoning: "Reading the maintenance note from the Containerboard mill",
      title: "Item — what's needed",
      fields: [
        { label: "Material", value: "88-DBX" },
        { label: "Short text", value: "Belt, double-backer — Corrugator No.2" },
        { label: "Quantity", value: "1 EA" },
        { label: "Delivery date", value: "2026-06-10", type: "date" },
        { label: "Plant", value: "M042 · Containerboard mill" },
        { label: "Requisitioner", value: "R. Alvarez · Reliability" },
      ],
    },
    {
      sourceId: "policy-mro",
      reasoning: "Checking the spending policy — on-contract, under the $50k MRO ceiling",
      title: "Release strategy",
      fields: [
        { label: "Purchasing org", value: "NG01 · Northgate North America" },
        { label: "Purchasing group", value: "P12 · MRO & Spares" },
        { label: "Release strategy", value: "MRO1 — auto-released · under the L3 limit" },
        { label: "Policy", value: "POL-MRO-04 · maintenance-spend" },
      ],
    },
    {
      sourceId: "framework-intake",
      reasoning: "Matching to the BeltPro framework 4600001207 — −8% vs list",
      title: "Source of supply",
      fields: [
        { label: "Fixed vendor", value: "BeltPro Industrial · 100482" },
        { label: "Outline agreement", value: "4600001207 · item 10" },
        { label: "Net price", value: "$48,200.00 (−8% vs list)" },
        { label: "Info record", value: "5300008841" },
      ],
    },
    {
      sourceId: "budget-intake",
      reasoning: "Checking budget — cost center 0000041702 · headroom available",
      title: "Account assignment",
      fields: [
        { label: "Account category", value: "K · Cost center" },
        { label: "G/L account", value: "510000 · Repairs & maintenance" },
        { label: "Cost center", value: "0000041702 · Corrugating No.2" },
        { label: "Recipient", value: "R. Alvarez" },
      ],
    },
  ],
};

/* ── Step 2 · Sourcing — RFQ-6600-2241 ───────────────────────────────────── */

const sourcingStep: RunStep = {
  id: "sourcing",
  n: 2,
  title: "Sourcing — three-bid tender",
  sub: "Runs the RFQ and recommends the award",
  reasoning: [
    "Reading approved requisition PR-48201",
    "Building the three-bid shortlist from the approved pool",
    "Drafting RFQ-6600-2241 — specs, terms, evaluation criteria",
    "Scoring returned quotations on delivered cost, lead time, quality",
    "Recommending the award to BeltPro Industrial",
  ],
  docLabel: "RFQ-6600-2241 · Price comparison",
  document: <RfqComparison />,
  sources: [
    {
      id: "pr-48201-handoff",
      label: "PR-48201",
      meta: "from Intake · SAP ME53N",
      kind: "sap",
      handoff: true,
      body: <PurchaseRequisition />,
    },
    {
      id: "supplier-pool",
      label: "Supplier pool",
      meta: "3 qualified · MRO-CONV",
      kind: "master",
      body: <SupplierPoolDoc />,
    },
    {
      id: "framework-sourcing",
      label: "BeltPro framework",
      meta: "SAP ME33K · 4600001207",
      kind: "contract",
      body: <OutlineAgreementDoc />,
    },
  ],
  email: {
    cta: "Send the RFQ to the shortlist",
    to: "BeltPro · Heartland Rubber · Midwest Belting",
    subject: "RFQ-6600-2241 — Belt, double-backer 88-DBX (1 EA)",
    lines: [
      "Please quote your best delivered price and lead time for 1 EA of material 88-DBX — double-backer belt for Corrugator No.2, ship-to Northgate Paper M042.",
      "Evaluation is on delivered cost, lead time and quality/OTIF. Net 30 terms. Please respond by end of day.",
      "Reference RFQ-6600-2241 in your reply.",
    ],
    toastTitle: "Quotations received",
    toastBody: "BeltPro replied first with an on-contract quote — added to your sources.",
    reply: {
      from: "BeltPro Industrial",
      receivedMeta: "Outlook · 10:04",
      subject: "RE: RFQ-6600-2241 — quotation BPI-Q-8841",
      lines: [
        "Pleased to quote on the framework: 1 EA 88-DBX at $48,200.00 net (−8% vs list), freight included (FCA Memphis DC).",
        "Lead time 5 days from PO — delivery by 2026-06-09, comfortably inside your window. Net 30.",
        "Quotation BPI-Q-8841 attached, valid 30 days.",
      ],
      source: {
        id: "bid-beltpro",
        label: "BeltPro quotation",
        meta: "BPI-Q-8841 · 10:04",
        kind: "email",
        body: (
          <EmailDoc
            from="BeltPro Industrial"
            fromAddr="sales@beltpro.com"
            to="Tactical Sourcing"
            sent="2026-06-03 · 10:04"
            subject="RE: RFQ-6600-2241 — quotation BPI-Q-8841"
            tone="inbound"
            lines={[
              "Pleased to quote on framework 4600001207: 1 EA 88-DBX at $48,200.00 net (−8% vs list), freight included.",
              "Lead time 5 days from PO — delivery by 2026-06-09. Net 30. Quality A · 99.1% OTIF.",
              "Quotation BPI-Q-8841, valid 30 days.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "BeltPro Industrial wins — lowest delivered cost ($48,200), shortest lead (5 days), the only on-contract bid (−8% vs list). Recommended for award.",
  stages: [
    {
      sourceId: "pr-48201-handoff",
      reasoning: "Reading approved requisition PR-48201",
      title: "Tender header",
      fields: [
        { label: "RFQ", value: "RFQ-6600-2241" },
        { label: "Material", value: "88-DBX · double-backer belt" },
        { label: "Quantity", value: "1 EA" },
        { label: "Plant", value: "M042 · Containerboard mill" },
      ],
    },
    {
      sourceId: "supplier-pool",
      reasoning: "Building the three-bid shortlist from the approved pool",
      title: "Bidders & scope",
      fields: [
        { label: "Bidders", value: "BeltPro · Heartland Rubber · Midwest Belting" },
        { label: "Pool", value: "3 qualified · MRO-CONV" },
        { label: "Evaluation", value: "Delivered cost · lead time · quality/OTIF" },
        { label: "Terms", value: "Net 30" },
      ],
    },
    {
      sourceId: "framework-sourcing",
      reasoning: "Scoring quotations — BeltPro wins on delivered cost, lead and contract",
      title: "Recommended award",
      fields: [
        { label: "Award to", value: "BeltPro Industrial · 100482" },
        { label: "Delivered cost", value: "$48,200.00 (−8% vs list)" },
        { label: "Lead time", value: "5 days · delivery 2026-06-09" },
        { label: "On-contract", value: "Yes · framework 4600001207" },
      ],
    },
  ],
};

/* ── Step 3 · PO — PO-77310 ──────────────────────────────────────────────── */

const poStep: RunStep = {
  id: "po",
  n: 3,
  title: "Purchase order",
  sub: "Binds the award to contract and posts to SAP",
  reasoning: [
    "Reading the award — BeltPro for PR-48201",
    "Binding to framework 4600001207 · item 10 — net $48,200",
    "Populating header — terms NT30, Incoterms FCA Memphis DC, tax U1",
    "Compliance check — PO vs contract terms and budget",
    "Posting PO-77310 to SAP and transmitting to the supplier",
  ],
  docLabel: "PO-77310 · Purchase order",
  document: <PurchaseOrder />,
  sources: [
    {
      id: "rfq-handoff",
      label: "RFQ-6600-2241",
      meta: "from Sourcing · award",
      kind: "sap",
      handoff: true,
      body: <RfqComparison />,
    },
    {
      id: "vendor-clean",
      label: "Vendor 100482",
      meta: "golden · SAP XK03",
      kind: "master",
      body: <VendorRecordDoc variant="golden" />,
    },
    {
      id: "framework-po",
      label: "BeltPro framework",
      meta: "SAP ME33K · 4600001207",
      kind: "contract",
      body: <OutlineAgreementDoc />,
    },
    {
      id: "budget-po",
      label: "Budget headroom",
      meta: "SAP CO · 0000041702",
      kind: "budget",
      body: <BudgetDoc />,
    },
  ],
  email: {
    cta: "Transmit the PO to BeltPro",
    to: "BeltPro Industrial · orders@beltpro.com",
    subject: "PO-77310 issued — 1 EA 88-DBX to Northgate Paper M042",
    lines: [
      "Issuing PO-77310 against framework 4600001207 · item 10 — 1 EA of 88-DBX at $48,200.00 net, FCA Memphis DC, Net 30.",
      "Requested delivery 2026-06-10 to the Containerboard mill (M042). Please acknowledge and confirm the ship date.",
    ],
    toastTitle: "Order acknowledged",
    toastBody: "BeltPro confirmed PO-77310 — order acknowledgement added to your sources.",
    reply: {
      from: "BeltPro Industrial",
      receivedMeta: "Outlook · 14:22",
      subject: "RE: PO-77310 — order confirmed",
      lines: [
        "PO-77310 acknowledged. Confirmed to ship 2026-06-08, delivery 06-09 — one day ahead of contract.",
      ],
      source: {
        id: "po-ack",
        label: "Order acknowledgement",
        meta: "BPI-OC-8841 · 14:22",
        kind: "email",
        body: (
          <EmailDoc
            from="BeltPro Industrial"
            fromAddr="orders@beltpro.com"
            to="Purchase Order Agent"
            sent="2026-06-03 · 14:22"
            subject="RE: PO-77310 — order confirmed"
            tone="inbound"
            lines={[
              "PO-77310 acknowledged. Confirmed to ship 2026-06-08, delivery 06-09 — one day ahead of contract.",
              "Order confirmation BPI-OC-8841 attached. Net 30 as agreed.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Contract-bound, budget available, every required field populated. Under the threshold — ready to post and transmit.",
  stages: [
    {
      sourceId: "rfq-handoff",
      reasoning: "Reading the award — BeltPro for PR-48201",
      title: "Header & terms",
      fields: [
        { label: "Vendor", value: "BeltPro Industrial · 100482" },
        { label: "Company code", value: "1000 · Northgate Paper" },
        { label: "Payment terms", value: "NT30 · Net 30 days", options: ["NT30 · Net 30 days", "NT45 · Net 45 days", "NT60 · Net 60 days", "NT90 · Net 90 days"] },
        { label: "Incoterms", value: "FCA · Memphis DC" },
        { label: "Reference agreement", value: "4600001207 · item 10" },
        { label: "Tax code", value: "U1 · self-assessed use tax" },
      ],
    },
    {
      sourceId: "vendor-clean",
      reasoning: "Resolving the vendor master — 100482 golden, bank verified",
      title: "Vendor",
      fields: [
        { label: "Vendor", value: "100482 · BeltPro Industrial" },
        { label: "Record", value: "Golden · SAP XK03" },
        { label: "Bank", value: "Verified · account on file" },
        { label: "Status", value: "Active · no duplicate" },
      ],
    },
    {
      sourceId: "framework-po",
      reasoning: "Binding to framework 4600001207 — net $48,200",
      title: "Conditions — pricing",
      fields: [
        { label: "Gross price (list)", value: "$52,391.30 / 1 EA" },
        { label: "Framework discount", value: "−8.0%" },
        { label: "Freight (FCA)", value: "$0.00" },
        { label: "Net value", value: "$48,200.00" },
      ],
    },
    {
      sourceId: "budget-po",
      reasoning: "Compliance check — PO vs contract terms and budget",
      title: "Account assignment",
      fields: [
        { label: "G/L account", value: "510000 · Repairs & maintenance" },
        { label: "Cost center", value: "0000041702 · Corrugating No.2" },
        { label: "Budget after", value: "Headroom available" },
        { label: "Delivery date", value: "2026-06-10", type: "date" },
      ],
    },
  ],
};

/* ── Step 4 · Invoice — INV-BPI-5567 ─────────────────────────────────────── */

/**
 * The four-way-match comparison grid the Invoice agent builds up as it reads
 * each file. Columns fill left → right (invoice seeded, then PO, then GR, then
 * contract); a row's verdict tick lights once every column that carries the
 * dimension agrees. "—" means the dimension doesn't apply to that document.
 */
const beltMatchColumns = [
  { key: "invoice", label: "Invoice" },
  { key: "po", label: "PO" },
  { key: "gr", label: "GR" },
  { key: "contract", label: "Contract" },
];
const beltMatchRows = [
  {
    dimension: "Unit price (USD)",
    cells: {
      invoice: { value: "48,200.00", ok: true },
      po: { value: "48,200.00", ok: true },
      gr: { value: "—", ok: false },
      contract: { value: "48,200.00", ok: true },
    },
  },
  {
    dimension: "Quantity (EA)",
    cells: {
      invoice: { value: "1", ok: true },
      po: { value: "1", ok: true },
      gr: { value: "1", ok: true },
      contract: { value: "1", ok: true },
    },
  },
  {
    dimension: "Net value (USD)",
    cells: {
      invoice: { value: "48,200.00", ok: true },
      po: { value: "48,200.00", ok: true },
      gr: { value: "48,200.00", ok: true },
      contract: { value: "48,200.00", ok: true },
    },
  },
  {
    dimension: "Tax code",
    cells: {
      invoice: { value: "U1", ok: true },
      po: { value: "U1", ok: true },
      gr: { value: "—", ok: false },
      contract: { value: "U1", ok: true },
    },
  },
  {
    dimension: "Payment terms",
    cells: {
      invoice: { value: "Net 30", ok: true },
      po: { value: "Net 30", ok: true },
      gr: { value: "—", ok: false },
      contract: { value: "Net 30", ok: true },
    },
  },
];

const invoiceStep: RunStep = {
  id: "invoice",
  n: 4,
  title: "Invoice — match, post & pay",
  sub: "Four-way matches, posts the ledger, schedules payment",
  reasoning: [
    "Extracting invoice BPI-5567 — vendor, amount, terms, tax",
    "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    "Checking price and quantity — $48,200 · 1 EA · all agree",
    "Scoring fraud — 0.02, low",
    "Posting in MIRO — clearing GR/IR, booking the $48,200 AP liability",
    "Applying the contract terms — Net 30, payment scheduled for 2026-07-09",
  ],
  docLabel: "INV-BPI-5567 · Match · post · pay",
  document: <InvoiceMatch />,
  sources: [
    {
      id: "invoice-pdf",
      label: "Supplier invoice",
      meta: "BPI-5567 · PDF",
      kind: "invoice",
      body: <VendorInvoiceDoc />,
    },
    {
      id: "po-match",
      label: "PO-77310",
      meta: "SAP ME23N",
      kind: "sap",
      body: <PurchaseOrder />,
    },
    {
      id: "gr-match",
      label: "GR-77310",
      meta: "SAP MIGO · plant-posted",
      kind: "sap",
      body: <GoodsReceipt />,
    },
    {
      id: "framework-invoice",
      label: "BeltPro framework",
      meta: "SAP ME33K · 4600001207",
      kind: "contract",
      body: <OutlineAgreementDoc />,
    },
  ],
  email: {
    cta: "Send the remittance advice",
    to: "BeltPro Industrial · ar@beltpro.com",
    subject: "Remittance advice — invoice BPI-5567 cleared for payment",
    lines: [
      "Invoice BPI-5567 ($48,200.00) passed the four-way match with $0 variance and cleared the fraud check (score 0.02). Released to AP for payment on Net 30.",
      "Payment settles on the due date to the account on file. This is your remittance advice — no action needed.",
    ],
    toastTitle: "Remittance confirmed",
    toastBody: "BeltPro confirmed the remittance — added to your sources.",
    reply: {
      from: "BeltPro Industrial",
      receivedMeta: "Outlook · 15:02",
      subject: "RE: Remittance advice — BPI-5567",
      lines: [
        "Thank you — remittance received and matched to BPI-5567. Account on file confirmed.",
      ],
      source: {
        id: "inv-remit",
        label: "Remittance confirmation",
        meta: "Outlook · 15:02",
        kind: "email",
        body: (
          <EmailDoc
            from="BeltPro Industrial"
            fromAddr="ar@beltpro.com"
            to="Invoice Resolution Agent"
            sent="2026-06-03 · 15:02"
            subject="RE: Remittance advice — BPI-5567"
            tone="inbound"
            lines={[
              "Thank you — remittance received and matched to BPI-5567. Account on file confirmed.",
              "We'll mark the invoice paid on settlement.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Four-way match clean, $0 variance, fraud score 0.02, under the threshold. Auto-posted in MIRO — GR/IR cleared, AP booked — and scheduled for payment on the contract's Net 30 terms (due 2026-07-09).",
  stages: [
    {
      sourceId: "invoice-pdf",
      reasoning: "Reading the supplier invoice received by email — BPI-5567",
      title: "Invoice — extracted from email",
      fields: [
        { label: "Vendor", value: "100482 · BeltPro Industrial" },
        { label: "Invoice reference", value: "BPI-5567" },
        { label: "Invoice date", value: "2026-06-09", type: "date" },
        { label: "Gross amount", value: "USD 48,200.00" },
        { label: "Tax (U1)", value: "USD 0.00" },
        { label: "Stated terms", value: "Net 30", options: ["Net 30", "Net 45", "Net 60", "Net 90"] },
      ],
    },
    {
      sourceId: "po-match",
      reasoning: "Matching against PO-77310 — price, quantity, net value",
      title: "Four-way match — invoice vs PO",
      matchGrid: { columns: beltMatchColumns, rows: beltMatchRows, reveal: ["invoice", "po"] },
    },
    {
      sourceId: "gr-match",
      reasoning: "Matching against the goods receipt GR-77310 — received quantity",
      title: "Four-way match — adding the goods receipt",
      matchGrid: { columns: beltMatchColumns, rows: beltMatchRows, reveal: ["invoice", "po", "gr"] },
    },
    {
      sourceId: "framework-invoice",
      reasoning: "Confirming the contract price and the four-way verdict",
      title: "Four-way match — adding the contract · verdict",
      matchGrid: {
        columns: beltMatchColumns,
        rows: beltMatchRows,
        reveal: ["invoice", "po", "gr", "contract"],
        verdict: "All four agree · variance USD 0.00 · contract −8% vs list · clean",
      },
    },
    {
      sourceId: "invoice-pdf",
      reasoning: "Posting in MIRO — clearing GR/IR and booking the AP liability",
      title: "General ledger — invoice posting (MIRO)",
      fields: [
        { label: "Dr · 191100 GR/IR clearing", value: "USD 48,200.00" },
        { label: "Cr · 160000 Accounts payable", value: "USD 48,200.00" },
        { label: "Document type", value: "RE · invoice receipt" },
        { label: "Balance", value: "USD 0.00 · Dr = Cr" },
      ],
    },
    {
      sourceId: "framework-invoice",
      reasoning: "Recommending the payment terms — read from the contract",
      title: "AI recommendation — payment terms",
      narrative:
        "Contract 4600001207 fixes BeltPro at NT30 · Net 30 — not the Net 60/90 some suppliers push. I'm keeping Net 30: it honours the framework and there's no early-pay discount that would beat holding the cash. Baseline is the 2026-06-09 invoice date, so payment is due 2026-07-09; I've scheduled the F110 run for that date. Adjust any term or date below before you approve.",
      fields: [
        { label: "Recommended terms", value: "NT30 · Net 30", options: ["NT30 · Net 30", "NT45 · Net 45", "NT60 · Net 60", "NT90 · Net 90"] },
        { label: "Per contract", value: "4600001207 · not Net 60/90" },
        { label: "Baseline date", value: "2026-06-09", type: "date" },
        { label: "Net due date", value: "2026-07-09", type: "date" },
        { label: "Cash discount", value: "None · pay on the net date", options: ["None · pay on the net date", "2% 10 · net 30", "1% 15 · net 30"] },
        { label: "Payment run (F110)", value: "2026-07-09", type: "date" },
      ],
    },
  ],
};

export const runSteps: RunStep[] = [
  intakeStep,
  sourcingStep,
  poStep,
  invoiceStep,
];
