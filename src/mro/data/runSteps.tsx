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
  /** Auto-filled, editable fields extracted from the source. */
  fields: { label: string; value: string }[];
};

export type RunStep = {
  id: AgentId;
  agentName?: string;
  n: number;
  title: string;
  sub: string;
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  sources: SourceArtifact[];
  email?: EmailAction;
  recommendation: string;
  exception?: ExceptionResolution;
  stages?: ExtractStage[];
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
