/**
 * The hero OCC settlement run — five gated agent steps in process order.
 *
 * Each step is one specialist agent doing its job on the same inbound OCC live
 * load (lane CHI→RIV, carrier Summit Carriers, invoice INV-SUM-5567): it reads
 * upstream evidence (clickable source files), streams its reasoning, produces a
 * freight artifact, and pauses for a human decision. Approve hands the output to
 * the next agent. The Settlement step runs the three-way check (Invoice ×
 * Shipment × Contract), clears the in-tolerance lines and drafts a carrier
 * dispute for the three flagged lines — the AI drafts it, the human sends it.
 *
 * Process order — Lane Intake → Rate & Surcharge → Carrier Tender → Load Capture
 * → Freight Settlement. Every figure ties out: billed $15,480 · clears $13,664 ·
 * disputed $1,816.
 */

import * as React from "react";
import type { AgentId } from "@/mro/data/agents";
import {
  LaneIntakePacket,
  LaneMasterDoc,
  RateValidationDoc,
  CarrierTenderDoc,
  LoadPacketDoc,
  ThreeWayMatchDoc,
  CarrierInvoiceDoc,
  RateCardDoc,
  GateLogDoc,
  WeighTicketDoc,
} from "@/mro/components/docs/freight/FreightDocs";
import { EmailDoc } from "@/mro/components/docs/sources";
import type { BudgetApproval } from "@/mro/components/workspace/BudgetApprovalSignable";

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
  /**
   * The reply round-trip. OMIT for a one-way email (a notification/confirmation):
   * "send" just fires it and the run proceeds immediately — no 3s wait, no receipt.
   * Keep it ONLY where a genuine human reply gates the step (e.g. a signed approval).
   */
  reply?: EmailReply;
  /** Toast shown once the email is sent (one-way) or its reply lands. */
  toastTitle?: string;
  toastBody?: string;
  /** The produced doc, re-rendered (with a spring) once the email resolves the open item
   *  (on the reply for a round-trip email, or on send for a one-way email). */
  resolvedDocument?: React.ReactNode;
  /** When set, "send" first opens a signable budget approval — the human signs it, then the email sends. */
  signable?: { approval: BudgetApproval };
  /** Optional attachment rendered in the draft pop-up (e.g. a renewed contract). */
  attachment?: React.ReactNode;
  attachmentLabel?: string;
};

/** One evaluated control in the settlement envelope. */
export type ControlGate = {
  name: string;
  result: string;
  state: "clear" | "tripped";
};

export type ExceptionResolution = {
  title: string;
  gates: ControlGate[];
  evidence: { label: string; detail: string }[];
  handoff: { to: string; sla: string; nextStep: string };
  audit: { id: string; logged: string; note: string };
  draft?: {
    to: string;
    subject: string;
    lines: string[];
    sendLabel: string;
    sentLabel: string;
  };
};

export type ExtractStage = {
  /** Must match one of the step's sources[].id — rendered on the right. */
  sourceId: string;
  /** The reasoning line for this stage (spins until Proceed). */
  reasoning: string;
  /** The form-box section title. */
  title: string;
  /**
   * A short AI rationale written out (typed) above the fields — used on a
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
  /** Renders an option CHOICE (cards + an AI recommendation) instead of an
   *  immediate auto-fill: the reviewer picks a supplier (the recommended one is
   *  highlighted), and only THEN do that option's fields auto-fill. Omit fields. */
  choice?: ChoiceStage;
};

/** One supplier/option card in a choice stage. */
export type ChoiceOption = {
  id: string;
  name: string;
  /** One-line context under the name, e.g. "Distributor · on SA-MRO-07". */
  meta: string;
  /** Small status pills, e.g. ["Approved", "Preferred", "On-contract"]. */
  badges?: string[];
  /** Comparison stats shown on the card (price · lead · contract · vs OEM). */
  stats: { label: string; value: string }[];
  /** The fields that auto-fill once THIS option is selected. A field with
   *  `options` renders as a dropdown; `type: "date"` a date picker; else text. */
  fields: { label: string; value: string; options?: string[]; type?: "date" }[];
};

/** A decision stage — the agent recommends one option; the human picks, then it fills. */
export type ChoiceStage = {
  /** The AI recommendation summary, typed out above the cards (the "why"). */
  recommendation: string;
  /** id of the recommended option — highlighted with a "Recommended" tag. */
  recommendedId: string;
  options: ChoiceOption[];
  /**
   * When set, a centered "searching…" modal spins before the option cards appear
   * — e.g. the agent scanning the supplier master + active outline agreements for
   * an on-contract source before it offers the on-contract vs RFQ decision.
   */
  searchModal?: { title: string; sub: string };
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
  agentName?: string;
  n: number;
  title: string;
  sub: string;
  /** A one-line natural-language "agent thought" shown at the top of the step —
   *  the agent interpreting the request in plain English (the NLP read). */
  aiThought?: string;
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  /** An alternate produced document used when the off-contract branch is active
   *  (e.g. the PR doc with vendor, price & source of supply hidden because they're
   *  pending the competitive RFQ). Falls back to `document` when unset. */
  altDocument?: React.ReactNode;
  sources: SourceArtifact[];
  email?: EmailAction;
  recommendation: string;
  exception?: ExceptionResolution;
  stages?: ExtractStage[];
  /** The step carries an unresolved flag — its primary action becomes the amber
   *  "continue with the flag" instead of a clean green approve (see FlowRun.holdContinue). */
  flagged?: boolean;
  /** The produced report surfaced red exceptions (a failing verdict / red checks).
   *  The approve action turns AMBER ("Approve with flags & hand off") so it doesn't
   *  read as a clean green approve — but the human can still approve and continue. */
  hasExceptions?: boolean;
  /** An inbound email that pops up the moment the step opens (e.g. a manager reply). */
  inbound?: { source: SourceArtifact };
  /** An inbound email WITH a previewable attachment (e.g. the vendor's invoice
   *  arriving before a match step) — pops as a received-email modal on step open. */
  inboundEmail?: InboundEmail;
  /** Runs the RFQ / request-for-quote flow (auto-fill → web search for suppliers →
   *  generate RFQ → send two vendor RFQ emails → wait for quotes) before revealing. */
  rfq?: RfqSpec;
  /** Renders the signal-fusion view (a list of previewable evidence rows + a fused
   *  AI analysis) instead of the extraction wizard — used by the predictive risk step. */
  signals?: SignalSpec;
};

/** One fused risk signal — a previewable evidence email plus the agent's one-line read.
 *  Extends SourceArtifact so the row opens in the shared SourceArtifactModal. */
export type RiskSignal = SourceArtifact & {
  /** The one-line read shown on the signal row. */
  summary: string;
};

/** The signal-fusion spec: the agent reads N evidence signals (previewable rows),
 *  then types a fused analysis before the step reveals its prediction. */
export type SignalSpec = {
  signals: RiskSignal[];
  /** The fused AI analysis, typed out once all signals are read. */
  analysis: string;
};

/** One vendor solicited in the RFQ flow. */
export type RfqVendor = {
  id: string;
  name: string;
  /** How the vendor was found, e.g. "web · distributor" / "OEM site". */
  via: string;
  /** The outbound RFQ email draft the human sends. */
  draft: { subject: string; lines: string[] };
  /** When true this vendor negotiates — a "negotiation in progress" spinner runs
   *  before its quote lands (vs an instant quote). */
  negotiating?: boolean;
  /** The quote that comes back. */
  quote: { headline: string; lines: string[] };
  /** The vendor's reply email + a previewable quotation PDF — opened by clicking
   *  the landed quote card. */
  reply?: InboundEmail;
};

/** The RFQ flow spec — solicit competitive quotes before the vendor decision. */
export type RfqSpec = {
  /** Auto-filled RFQ header fields. */
  fields: { label: string; value: string }[];
  /** The "search for suppliers" beat — a query + the suppliers it surfaces. */
  search: { query: string; results: { name: string; via: string; note: string }[] };
  /** The generated RFQ document, shown once the search lands. */
  rfqDoc: React.ReactNode;
  /** The two vendors the RFQ goes to. */
  vendors: RfqVendor[];
};

/** A received email shown as a pop-up, with a previewable PDF attachment. */
export type InboundEmail = {
  from: string;
  fromAddr?: string;
  receivedMeta: string;
  subject: string;
  lines: string[];
  /** The attachment rendered as a previewable PDF chip (e.g. the vendor invoice). */
  attachment: React.ReactNode;
  attachmentLabel: string;
  /** Modal headline (defaults to "{from} sent the invoice"). Set for non-invoice
   *  inbound mail, e.g. a vendor's quote: "Midwest Belting Co. sent their quote". */
  headline?: string;
  /** Attachment-chip subtitle (defaults to the invoice wording). */
  previewNote?: string;
  /** Label for the dismiss button (defaults to "Continue"). */
  cta?: string;
};

/* ── Step 1 · Lane intake — FRT-48201 ─────────────────────────────────────── */

const intakeStep: RunStep = {
  id: "intake",
  n: 1,
  title: "Lane intake — classify",
  sub: "Turns the pickup requirement into a tender-ready lane",
  reasoning: [
    "Reading the pickup requirement from the Chicago DC",
    "Classifying — OCC · live load · lane CHI→RIV",
    "Matching to an approved movement pattern · confidence 98%",
    "Checking the Riverside mill receiving window",
    "Drafting lane packet FRT-48201",
  ],
  docLabel: "FRT-48201 · Lane intake packet",
  document: <LaneIntakePacket />,
  sources: [
    {
      id: "pickup-req",
      label: "Pickup requirement",
      meta: "Intake portal · 09:00",
      kind: "email",
      body: (
        <EmailDoc
          from="Chicago DC · dispatch"
          fromAddr="dispatch@northgatepaper.com"
          to="Lane Intake"
          sent="2026-06-19 · 09:00"
          subject="OCC pickup — Chicago DC → Riverside mill"
          lines={[
            "We have ~20 t of baled OCC ready at the Chicago DC for the Riverside mill. Needs a live-load pickup today, receiving tomorrow morning.",
            "Run it on the contracted CHI→RIV lane. Reference the DC source.",
          ]}
        />
      ),
    },
    {
      id: "lane-master",
      label: "Lane master",
      meta: "CHI→RIV · approved",
      kind: "contract",
      body: <LaneMasterDoc />,
    },
  ],
  recommendation:
    "Approved OCC live-load pattern on a known lane · inside the mill receiving window. Met the auto-classify rule — lane packet drafted.",
  stages: [
    {
      sourceId: "pickup-req",
      reasoning: "Reading the pickup requirement from the Chicago DC",
      title: "Pickup — what's moving",
      fields: [
        { label: "Origin", value: "Chicago DC · retail/DC source" },
        { label: "Destination", value: "Riverside mill · M042" },
        { label: "Grade", value: "OCC · old corrugated containers" },
        { label: "Haul type", value: "Live load" },
      ],
    },
    {
      sourceId: "lane-master",
      reasoning: "Matching to an approved movement pattern · lane CHI→RIV",
      title: "Lane & window",
      fields: [
        { label: "Lane", value: "CHI → RIV" },
        { label: "Movement pattern", value: "Approved · OCC live load" },
        { label: "Receiving window", value: "2026-06-20 · 06:00–14:00" },
        { label: "Confidence", value: "98% · auto-classified" },
      ],
    },
  ],
};

/* ── Step 2 · Rate & surcharge — RATE-CHI-RIV ─────────────────────────────── */

const sourcingStep: RunStep = {
  id: "sourcing",
  n: 2,
  title: "Rate & surcharge — validate",
  sub: "Checks the rate and normalises the surcharge",
  reasoning: [
    "Reading lane packet FRT-48201",
    "Pulling the contracted rate card RC-OCC-2026",
    "Line haul $11,200 — on-contract, inside tolerance",
    "Normalising the fuel surcharge against the index",
    "Flag — surcharge billed as a flat fee vs the contracted percentage",
  ],
  docLabel: "RATE-CHI-RIV · Rate & surcharge",
  document: <RateValidationDoc />,
  sources: [
    {
      id: "lane-handoff",
      label: "FRT-48201",
      meta: "from Lane Intake",
      kind: "sap",
      handoff: true,
      body: <LaneIntakePacket />,
    },
    {
      id: "rate-card",
      label: "Rate card",
      meta: "RC-OCC-2026 · Excel",
      kind: "contract",
      body: <RateCardDoc />,
    },
  ],
  recommendation:
    "Line haul on-contract and in tolerance. Fuel surcharge billed flat ($2,900) vs the contracted 22% ($2,464) — $436 over · carried forward to settlement.",
  stages: [
    {
      sourceId: "rate-card",
      reasoning: "Validating the line haul against the contracted lane rate",
      title: "Line haul",
      fields: [
        { label: "Contract rate", value: "USD 11,200 / load" },
        { label: "Billed", value: "USD 11,200" },
        { label: "Tolerance", value: "±2% · within" },
        { label: "Verdict", value: "On-contract ✓" },
      ],
    },
    {
      sourceId: "rate-card",
      reasoning: "Normalising the fuel surcharge against the index",
      title: "Fuel surcharge",
      fields: [
        { label: "Contract basis", value: "22% of line haul" },
        { label: "Contract value", value: "USD 2,464" },
        { label: "Billed", value: "flat USD 2,900" },
        { label: "Verdict", value: "Out of tolerance · +436" },
      ],
    },
  ],
};

/* ── Step 3 · Carrier tender — TND-77310 ──────────────────────────────────── */

const poStep: RunStep = {
  id: "po",
  n: 3,
  title: "Carrier tender — confirm",
  sub: "Confirms the approved carrier and the load",
  reasoning: [
    "Reading the validated lane and expected-cost envelope",
    "Confirming the load tendered to Summit Carriers",
    "Checking the sourcing-agreement volume commitment",
    "Ranking the approved pool — lane economics, compliance, prior defects",
    "Reading the carrier scorecard — Summit best-fit (on-time 96%, defect 1.4%)",
    "Tender confirmed · pickup window set",
  ],
  docLabel: "TND-77310 · Carrier tender",
  document: <CarrierTenderDoc />,
  sources: [
    {
      id: "rate-handoff",
      label: "RATE-CHI-RIV",
      meta: "from Rate & Surcharge",
      kind: "sap",
      handoff: true,
      body: <RateValidationDoc />,
    },
    {
      id: "scorecard",
      label: "Carrier scorecard",
      meta: "Summit Carriers · SUMC",
      kind: "master",
      body: <CarrierTenderDoc />,
    },
  ],
  recommendation:
    "Summit Carriers is the best-fit approved carrier on this lane, within the volume commitment and clean on the scorecard. Tender confirmed.",
  stages: [
    {
      sourceId: "scorecard",
      reasoning: "Confirming the approved carrier on lane economics and compliance",
      title: "Award",
      fields: [
        { label: "Carrier", value: "Summit Carriers · SUMC" },
        { label: "Equipment", value: "53' dry van · live load" },
        { label: "Sourcing agreement", value: "Within volume commitment" },
        { label: "Scorecard", value: "On-time 96% · defect 1.4%" },
      ],
    },
  ],
};

/* ── Step 4 · Load capture — SHP-55012 ────────────────────────────────────── */

const vendorStep: RunStep = {
  id: "vendor",
  n: 4,
  title: "Load capture — reconcile",
  sub: "Builds the packet and reconciles the weight",
  reasoning: [
    "Collecting the BOL, pickup confirmation and receiving ticket",
    "Reading the weigh-bridge ticket at the Riverside mill",
    "Estimated 22.0 t vs scaled 20.0 t — cubed out light",
    "The weight-adjustment accessorial bills on the claimed weight",
    "Flag — cube-out weight variance above tolerance",
  ],
  docLabel: "SHP-55012 · Load packet",
  document: <LoadPacketDoc />,
  sources: [
    {
      id: "bol",
      label: "Bill of lading",
      meta: "BOL-SUMC-44812",
      kind: "edi",
      body: <CarrierInvoiceDoc />,
    },
    {
      id: "weigh-ticket",
      label: "Weigh-bridge ticket",
      meta: "WB-RIV-44812",
      kind: "sap",
      body: <WeighTicketDoc />,
    },
  ],
  recommendation:
    "Packet complete, but the load cubed out 2 t under the claimed weight. The carrier's weight-adjustment accessorial ($480) bills on 22 t vs the scaled 20 t — carried forward to settlement.",
  stages: [
    {
      sourceId: "weigh-ticket",
      reasoning: "Reconciling estimated vs scaled weight",
      title: "Weight reconciliation",
      fields: [
        { label: "Carrier claim", value: "22.0 t" },
        { label: "Scaled (weigh-bridge)", value: "20.0 t" },
        { label: "Variance", value: "−2.0 t · cubed out" },
        { label: "Accessorial at risk", value: "USD 480" },
      ],
    },
  ],
};

/* ── Step 5 · Freight settlement — INV-SUM-5567 (HERO) ────────────────────── */

const invoiceStep: RunStep = {
  id: "invoice",
  n: 5,
  title: "Freight settlement — three-way check",
  sub: "Matches Invoice × Shipment × Contract and drafts the dispute",
  reasoning: [
    "Extracting the carrier invoice INV-SUM-5567 — line by line",
    "Matching each line to the shipment (SAP) and the contract (Excel)",
    "Running the 6-point freight failure-point checklist — all clear",
    "Clearing line haul — on-contract, in tolerance",
    "Flagging fuel surcharge, demurrage and the cube-out weight line",
    "Clearing $13,664 · drafting a $1,816 carrier dispute",
  ],
  docLabel: "INV-SUM-5567 · Three-way check",
  document: <ThreeWayMatchDoc />,
  sources: [
    {
      id: "invoice-pdf",
      label: "Carrier invoice",
      meta: "INV-SUM-5567 · PDF",
      kind: "invoice",
      body: <CarrierInvoiceDoc />,
    },
    {
      id: "load-handoff",
      label: "SHP-55012",
      meta: "from Load Capture",
      kind: "sap",
      handoff: true,
      body: <LoadPacketDoc />,
    },
    {
      id: "rate-card-match",
      label: "Rate card",
      meta: "RC-OCC-2026 · Excel",
      kind: "contract",
      body: <RateCardDoc />,
    },
    {
      id: "gate-log",
      label: "Yard gate log",
      meta: "GATE-RIV-0620",
      kind: "kb",
      body: <GateLogDoc />,
    },
  ],
  email: {
    cta: "Send the carrier dispute",
    to: "Summit Carriers · billing@summitcarriers.example",
    subject: "Dispute — INV-SUM-5567 · 3 lines · USD 1,816",
    lines: [
      "We've settled the in-tolerance lines on INV-SUM-5567 ($13,664) on net 30. Three lines are disputed against the contract:",
      "1) Fuel surcharge billed flat $2,900 vs the contracted 22% ($2,464) — $436 over. 2) Demurrage $900 — gate log shows 1.5 h on site vs 2.0 h free time, none owed. 3) Weight adjustment $480 — billed on 22 t vs the weigh-bridge scaled 20 t.",
      "Please issue a credit of $1,816. Rate card, gate log and weigh ticket attached.",
    ],
    toastTitle: "Credit acknowledged",
    toastBody: "Summit Carriers acknowledged the dispute and will credit $1,816 — reply added to your sources.",
    reply: {
      from: "Summit Carriers",
      receivedMeta: "Outlook · 11:18",
      subject: "RE: Dispute — INV-SUM-5567",
      lines: [
        "Reviewed — you're right on all three. We'll issue a credit memo for $1,816 against INV-SUM-5567.",
      ],
      source: {
        id: "dispute-ack",
        label: "Carrier credit reply",
        meta: "Outlook · 11:18",
        kind: "email",
        body: (
          <EmailDoc
            from="Summit Carriers"
            fromAddr="billing@summitcarriers.example"
            to="Freight Settlement"
            sent="2026-06-20 · 11:18"
            subject="RE: Dispute — INV-SUM-5567"
            tone="inbound"
            lines={[
              "Reviewed — you're right on all three. We'll issue a credit memo for $1,816 against INV-SUM-5567.",
              "Surcharge will move to the contracted percentage on future invoices.",
            ]}
          />
        ),
      },
    },
  },
  recommendation:
    "Two lines clear ($13,664, in tolerance). Three lines are above tolerance — surcharge +$436, demurrage $900 not owed, weight adjustment $480 on a cube-out. Settle the clean lines and send the drafted $1,816 dispute.",
};

export const runSteps: RunStep[] = [
  intakeStep,
  sourcingStep,
  poStep,
  vendorStep,
  invoiceStep,
];
