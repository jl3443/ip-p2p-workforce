/**
 * The belt run — five gated agent steps in process order.
 *
 * Each step is one specialist agent doing its job on the same double-backer-belt
 * transaction: it reads upstream evidence (clickable source files), streams its
 * reasoning, produces a faithful SAP artifact, and pauses for a human decision
 * (approve · pending · escalate · reject). Approve hands the output to the next
 * agent. Two steps run an email round-trip (Sourcing's RFQ, Fulfillment's status
 * chase) whose reply lands as a new source card.
 *
 * Process order — Intake → Sourcing → PO → Fulfillment → Invoice. Data is lifted
 * from the agents' own console ceremonies so the run and the desks stay in
 * lockstep.
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
  EdiAsnDoc,
  DeliveryNoteDoc,
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

export type RunStep = {
  id: AgentId;
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
          fromAddr="dwhitfield@ipaper.com"
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
            fromAddr="dwhitfield@ipaper.com"
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
      "Please quote your best delivered price and lead time for 1 EA of material 88-DBX — double-backer belt for Corrugator No.2, ship-to International Paper M042.",
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
    subject: "PO-77310 issued — 1 EA 88-DBX to International Paper M042",
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
};

/* ── Step 4 · Fulfillment — GR-77310 ─────────────────────────────────────── */

const fulfillmentStep: RunStep = {
  id: "fulfillment",
  n: 4,
  title: "Fulfillment & expediting",
  sub: "Tracks to delivery and posts the goods receipt",
  reasoning: [
    "Tracking PO-77310 against the contracted date 2026-06-10",
    "Chasing the supplier for a ship confirmation",
    "Receiving the ASN — shipped 06-08, ETA 06-09",
    "Prompting the requestor to confirm receipt",
    "Posting goods receipt GR-77310 (movement 101) to the Maintenance store",
  ],
  docLabel: "GR-77310 · Goods receipt",
  document: <GoodsReceipt />,
  sources: [
    {
      id: "po-handoff",
      label: "PO-77310",
      meta: "from PO agent · SAP ME23N",
      kind: "sap",
      handoff: true,
      body: <PurchaseOrder />,
    },
    {
      id: "delivery-note",
      label: "Delivery note",
      meta: "BPI-DN-5567",
      kind: "sap",
      body: <DeliveryNoteDoc />,
    },
  ],
  email: {
    cta: "Send a status chase to BeltPro",
    to: "BeltPro Industrial · dispatch@beltpro.com",
    subject: "PO-77310 — ship confirmation for 88-DBX",
    lines: [
      "Confirming the ship date for PO-77310 (1 EA 88-DBX), contracted delivery 2026-06-10 to International Paper M042.",
      "Please send the ASN and tracking so we can stage the maintenance window. Thanks.",
    ],
    toastTitle: "ASN received",
    toastBody: "BeltPro confirmed shipment — EDI 856 added to your sources.",
    reply: {
      from: "BeltPro Industrial",
      receivedMeta: "EDI 856 · 11:42",
      subject: "ASN — PO-77310 shipped",
      lines: [
        "Shipped 2026-06-08 via FedEx Freight (PRO 4471), BOL MEMPHIS-4471-2026. ETA 2026-06-09 — one day ahead of contract.",
        "Advance ship notice transmitted as EDI 856.",
      ],
      source: {
        id: "asn-edi",
        label: "ASN · EDI 856",
        meta: "received 11:42",
        kind: "edi",
        body: <EdiAsnDoc />,
      },
    },
  },
  recommendation:
    "Belt received and inspected OK, posted to unrestricted-use stock at MNT1. On time, ahead of the maintenance window.",
};

/* ── Step 5 · Invoice — INV-BPI-5567 ─────────────────────────────────────── */

const invoiceStep: RunStep = {
  id: "invoice",
  n: 5,
  title: "Invoice match & release",
  sub: "Four-way matches and releases to AP",
  reasoning: [
    "Extracting invoice BPI-5567 — vendor, amount, terms, tax",
    "Running the four-way match — contract ↔ PO ↔ goods receipt ↔ invoice",
    "Checking price and quantity — $48,200 · 1 EA · all agree",
    "Scoring fraud — 0.02, low",
    "Posting to SAP and releasing to AP — balance $0.00",
  ],
  docLabel: "INV-BPI-5567 · Four-way match",
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
      meta: "from Fulfillment · MIGO",
      kind: "sap",
      handoff: true,
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
    "Four-way match clean, $0 variance, fraud score 0.02, under the threshold. Auto-posted and released to AP.",
};

export const runSteps: RunStep[] = [
  intakeStep,
  sourcingStep,
  poStep,
  fulfillmentStep,
  invoiceStep,
];
