/**
 * MRO PR Intake & Validation flow — two worked examples.
 *
 * A plant engineer raises a messy free-text purchase requisition; the workforce
 * structures and codes it, then validates it across master data & duplicates,
 * warranty & coverage, vendor / contract / price, and approval & routing — the
 * checklist a buyer runs today by hand. Each example surfaces a different headline
 * exception:
 *   · Conveyor belt  → incomplete PR · spec ambiguity / wrong-part risk
 *   · Idler roller   → duplicate demand · stock at a sister plant · warranty cover
 *
 * Step actor names are overridden (agentName) to the procurement roles even though
 * the underlying agent ids are inherited from the base. Vendors are anonymised
 * (Apex Industrial Supply = preferred distributor; ConveyorCore = OEM).
 */

import type { RunStep } from "@/mro/data/runSteps";
import { StructuredPrDoc, ValidationDoc } from "@/mro/components/docs/pr/PrDocs";
import {
  MaterialMasterDoc,
  StockOverviewDoc,
  WarrantyRecordDoc,
  OutlineAgreementDoc,
  VendorRecordDoc,
  ApprovalRoutingDoc,
  StockTransportOrderDoc,
  PurchaseOrderDoc,
} from "@/mro/components/docs/pr/SapDocs";
import { EmailDoc } from "@/mro/components/docs/sources";

const COST_CENTER = "10034 · Recycling Plant Maintenance";
const GL = "600450 · Repairs & Maintenance";

/* ════════════════════════════════════════════════════════════════════════
 * Example 1 — Conveyor belt · incomplete PR · spec ambiguity
 * ════════════════════════════════════════════════════════════════════════ */

const beltStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: "PR-48630",
      status: "Structured · spec confirmation needed",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 10:46",
      materialCode: "MRO-CONV-BELT-36IN-HD",
      description: "Conveyor Belt 36\" Heavy Duty Rubber — Sorting Line",
      plant: "Recycling facility · Sorting Line 2",
      costCenter: COST_CENTER,
      glAccount: GL,
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
    }}
  />
);

const beltFreeText = (
  <EmailDoc
    from="Plant engineer · Sorting Line 2"
    fromAddr="engineer@northgatepaper.com"
    to="Procurement intake"
    sent="2026-06-20 · 10:40"
    subject="New conveyor belt — recycling line 2"
    lines={[
      "Requesting a new conveyor belt for recycling line 2. The existing belt is damaged and causing material jams.",
      "Specs: around 35–36 inch wide, rubber, heavy duty. Previously sourced from Apex but not sure of the part number.",
      "Need ASAP to avoid production impact.",
    ]}
  />
);

const beltMasterDataDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-MD",
      status: "1 flag",
      docType: "Master data · duplicate · inventory",
      system: "Material master · inventory",
      createdBy: "Master Data agent",
      createdOn: "2026-06-20 · 10:48",
      sections: [
        {
          band: "Master data & duplicate",
          rows: [
            { label: "Material code", expected: "Mapped SKU", found: "MRO-CONV-BELT-36IN-HD", ok: true },
            { label: "Duplicate request", expected: "None open", found: "No open PR for this SKU", ok: true },
            { label: "Spec completeness", expected: "Single width + part no.", found: "Width range · no part no.", ok: false },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand stock", expected: "Check before buy", found: "0 EA · no stock", ok: true },
            { label: "Interplant availability", expected: "Check sister plants", found: "None · belt is line-specific", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "Buy is justified, but the width is ambiguous — confirm 36 in face width for Sorting Line 2 before release." },
    }}
  />
);

const beltWarrantyDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-WTY",
      status: "Not covered",
      docType: "Warranty & coverage check",
      system: "Equipment register",
      createdBy: "Warranty & coverage desk",
      createdOn: "2026-06-20 · 10:50",
      sections: [
        {
          band: "Warranty & coverage",
          rows: [
            { label: "Equipment in OEM warranty", expected: "Within 12 mo parts", found: "No · belt is a wear part", ok: true },
            { label: "Failure type", expected: "Defect vs wear", found: "Wear & tear · jams from damage", ok: true },
            { label: "Coverage", expected: "Parts / labor / full", found: "Buy new · parts only", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Wear-and-tear failure, not a covered defect — proceed with a new-buy on parts." },
    }}
  />
);

const beltVendorDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-VEN",
      status: "On-contract",
      docType: "Vendor · contract · price",
      system: "Vendor master · sourcing agreement",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-20 · 10:52",
      sections: [
        {
          band: "Vendor & contract",
          rows: [
            { label: "Vendor approved", expected: "Approved & preferred", found: "Apex Industrial Supply · preferred", ok: true },
            { label: "OEM vs distributor", expected: "Lower-cost compliant", found: "Distributor · −19% vs OEM", ok: true },
            { label: "Sourcing agreement", expected: "Price + vendor match", found: "On agreement SA-MRO-07", ok: true },
            { label: "HSE / insurance", expected: "Parts only · n/a", found: "No on-site work · n/a", ok: true },
          ],
        },
        {
          band: "Price & terms",
          rows: [
            { label: "Price vs contract", expected: "Match contract", found: "$4,180 · matches SA-MRO-07", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 30 · compliant", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Vendor approved, on-contract and price-matched — no leakage." },
    }}
  />
);

const beltApprovalDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48630-APR",
      status: "Ready · 1 open item",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 10:54",
      sections: [
        {
          band: "Cost center & approval",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "On-contract · not required", ok: true },
            { label: "DOA approval", expected: "Plant-level", found: "Plant maintenance · in limit", ok: true },
            { label: "Spec sign-off", expected: "Engineer confirms width", found: "Pending · 36 in to confirm", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Everything clears except the width — confirm 36 in with the engineer, then release the PR." },
    }}
  />
);

const beltApprovalDocResolved = (
  <ValidationDoc
    report={{
      number: "VAL-48630-APR",
      status: "Released",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 11:03",
      sections: [
        {
          band: "Cost center & approval",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "On-contract · not required", ok: true },
            { label: "DOA approval", expected: "Plant-level", found: "Plant maintenance · in limit", ok: true },
            { label: "Spec sign-off", expected: "Engineer confirms width", found: "Confirmed · 36 in", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Width confirmed by the engineer — all controls clear. PR-48630 released to Apex on-contract at $4,180." },
    }}
  />
);

/* Real SAP source files the belt-flow agents read (clickable evidence). */

const beltMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: "MRO-CONV-BELT-36IN-HD",
      description: "Conveyor Belt 36\" Heavy Duty Rubber — Sorting Line",
      status: "Active",
      createdOn: "2024-03-11 · 09:20",
      createdBy: "Master data steward",
      basic: [
        { label: "Material type", value: "ERSA · Spare part" },
        { label: "Industry sector", value: "Mill products" },
        { label: "Material group", value: "MRO · Conveyor & belting" },
        { label: "Base UoM", value: "EA (roll)" },
        { label: "Gross weight", value: "84 kg" },
        { label: "Old material no.", value: "CB-36HD-APX" },
      ],
      purchasing: [
        { label: "Order unit", value: "EA" },
        { label: "Purchasing group", value: "200 · MRO" },
        { label: "Planned deliv. time", value: "7 days" },
        { label: "Info record", value: "5300004180 · exists" },
        { label: "Source list", value: "Apex · SA-MRO-07" },
        { label: "Std PO text", value: "36 in face · HD rubber" },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · MRO spares" },
        { label: "Price control", value: "V · moving average" },
        { label: "Moving avg price", value: "$4,180.00 / EA" },
        { label: "Currency", value: "USD" },
      ],
    }}
  />
);

const beltStockOverview = (
  <StockOverviewDoc
    s={{
      number: "MRO-CONV-BELT-36IN-HD",
      description: "Conveyor Belt 36\" Heavy Duty Rubber",
      createdOn: "2026-06-20 · 10:48",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Northgate · Recycling", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA", tone: "short" },
        { plant: "Eastbrook mill", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
        { plant: "Westport", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
      ],
      note: "Belt is line-specific (36 in face width) — no on-hand and no interplant stock to transfer; a new buy is justified.",
    }}
  />
);

const beltWarrantyRecord = (
  <WarrantyRecordDoc
    w={{
      number: "WTY-CHK-48630",
      status: "Not covered",
      createdOn: "2026-06-20 · 10:50",
      createdBy: "Warranty & coverage desk",
      object: [
        { label: "Equipment", value: "Sorting Line 2 conveyor" },
        { label: "Functional loc.", value: "NGT-REC-SL2" },
        { label: "Component", value: "Drive belt (wear part)" },
        { label: "Commissioned", value: "2021-08-04" },
      ],
      coverage: [
        { label: "OEM warranty", value: "Expired · > 12 mo" },
        { label: "Service contract", value: "None on belt" },
        { label: "Coverage scope", value: "Parts only · n/a" },
      ],
      failure: [
        { label: "Failure type", value: "Wear & tear · jams" },
        { label: "Covered defect", value: "No" },
        { label: "Claimable", value: "No · consumable" },
      ],
      determination: { ok: true, text: "Belt is a consumable wear part — failure is wear & tear, not a covered defect. Proceed as a new buy." },
    }}
  />
);

const beltOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-07",
      status: "Active",
      createdOn: "2026-01-02 · valid to 2026-12-31",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Vendor code", value: "0001000207" },
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Valid from", value: "2026-01-01" },
        { label: "Valid to", value: "2026-12-31" },
        { label: "Target value", value: "$420,000" },
      ],
      items: [
        { item: "40", material: "MRO-CONV-BELT-36IN-HD", description: "Conveyor belt 36\" HD rubber", targetQty: "20 EA / yr", netPrice: "$4,180.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Price basis", value: "Distributor · −19% vs OEM" },
      ],
    }}
  />
);

const beltVendorRecord = (
  <VendorRecordDoc
    v={{
      number: "0001000207",
      name: "Apex Industrial Supply",
      status: "Approved",
      createdOn: "2022-05-18 · last review 2026-02",
      createdBy: "Supplier management",
      general: [
        { label: "BP role", value: "Vendor · distributor" },
        { label: "Country", value: "US" },
        { label: "Tax / reg.", value: "Compliant · on file" },
      ],
      purchasing: [
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Order currency", value: "USD" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Preferred", value: "Yes · MRO belting" },
      ],
      approval: { ok: true, text: "Approved & preferred distributor for MRO conveyor & belting — on sourcing agreement SA-MRO-07." },
    }}
  />
);

const beltApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48630-REL",
      status: "Awaiting release",
      createdOn: "2026-06-20 · 10:54",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48630 · conveyor belt" },
        { label: "Requestor", value: "Plant engineer · SL2" },
        { label: "Category", value: "MRO · on-contract" },
        { label: "Amount", value: "$4,180.00" },
        { label: "Cost center / GL", value: "10034 / 600450" },
        { label: "Vendor", value: "Apex · SA-MRO-07" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · on-contract, in limit" },
        { level: "L2", approver: "—", role: "Procurement Manager", limit: "$50,000", status: "not-reached", when: "" },
      ],
      validation: { ok: true, text: "$4,180 within the plant-maintenance DOA limit ($10,000); on-contract — competitive bidding not required." },
      action: "One open item before release: engineer to confirm the 36 in face width for Sorting Line 2.",
    }}
  />
);

/* ════════════════════════════════════════════════════════════════════════
 * Example 2 — Idler roller · duplicate demand · stock · warranty cover
 * ════════════════════════════════════════════════════════════════════════ */

const rollerStructuredDoc = (
  <StructuredPrDoc
    pr={{
      number: "PR-48655",
      status: "Structured · cheaper alternative found",
      createdBy: "PR Processing agent",
      createdOn: "2026-06-20 · 11:10",
      materialCode: "MRO-CONV-ROLLER-IDLER-STD",
      description: "Conveyor Idler Roller — 600 mm — Steel — Heavy Duty",
      plant: "Recycling facility · Sorting Line 1",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Size", value: "600 mm · steel · heavy duty" },
        { label: "Quantity", value: "8 EA (from \"6–8\")" },
        { label: "UoM", value: "EACH" },
        { label: "Same as", value: "OCC feed conveyor rollers" },
        { label: "Delivery", value: "Urgent · belt misalignment" },
        { label: "Requisitioner", value: "Plant engineer · Sorting Line 1" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Conveyor & rollers" },
        { label: "Suggested vendor", value: "Apex Industrial Supply (preferred)" },
      ],
      confidence: "94%",
      flags: [
        "Requested 8 EA, but inventory and warranty checks below change the recommended buy quantity — see the validation report.",
      ],
      prType: "NB · Standard requisition",
      requestor: "Plant engineer · Sorting Line 1",
      purchOrg: "1000 · Northgate Procurement",
      purchGroup: "200 · MRO / Maintenance",
      valuation: [
        { label: "Unit price", value: "$118.00 / EA" },
        { label: "Total value", value: "$944.00 (8 EA)" },
        { label: "Currency", value: "USD" },
      ],
      sourceOfSupply: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Outline agreement", value: "SA-MRO-07 · item 50" },
        { label: "Info record", value: "5300004118" },
      ],
      deliveryTerms: [
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Deliv. date", value: "Urgent · 2026-06-22" },
      ],
    }}
  />
);

const rollerFreeText = (
  <EmailDoc
    from="Plant engineer · Sorting Line 1"
    fromAddr="engineer@northgatepaper.com"
    to="Procurement intake"
    sent="2026-06-20 · 11:04"
    subject="Replacement conveyor rollers — sorting line 1"
    lines={[
      "Need replacement conveyor rollers for sorting line 1. Multiple rollers seized and causing belt misalignment.",
      "Approx 6–8 rollers required. Same as currently installed on the OCC feed conveyor.",
      "Urgent to avoid further breakdown.",
    ]}
  />
);

const rollerMasterDataDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-MD",
      status: "2 flags",
      docType: "Master data · duplicate · inventory",
      system: "Material master · inventory",
      createdBy: "Master Data agent",
      createdOn: "2026-06-20 · 11:12",
      sections: [
        {
          band: "Master data & duplicate",
          rows: [
            { label: "Material code", expected: "Mapped SKU", found: "MRO-CONV-ROLLER-IDLER-STD", ok: true },
            { label: "Duplicate request", expected: "None open", found: "PR-48641 · same SKU · 4 days ago", ok: false },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand stock", expected: "Check before buy", found: "0 EA at this plant", ok: true },
            { label: "Interplant availability", expected: "Check sister plants", found: "6 EA at Eastbrook mill store", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Duplicate open PR and 6 EA available at a sister plant — transfer before buying, and cancel PR-48641." },
    }}
  />
);

const rollerWarrantyDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-WTY",
      status: "Partly covered",
      docType: "Warranty & coverage check",
      system: "Equipment register",
      createdBy: "Warranty & coverage desk",
      createdOn: "2026-06-20 · 11:14",
      sections: [
        {
          band: "Warranty & coverage",
          rows: [
            { label: "Equipment in OEM warranty", expected: "Within 12 mo parts", found: "Yes · commissioned 2026-01-15", ok: false },
            { label: "Failure type", expected: "Defect vs wear", found: "Premature seizure · possible defect", ok: false },
            { label: "Coverage", expected: "Parts / labor / full", found: "12 mo parts · ConveyorCore OEM", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "OCC feed conveyor is inside its 12-month parts warranty — raise a claim on the seized units rather than buying them." },
    }}
  />
);

const rollerVendorDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-VEN",
      status: "On-contract",
      docType: "Vendor · contract · price",
      system: "Vendor master · sourcing agreement",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-20 · 11:16",
      sections: [
        {
          band: "Vendor & contract",
          rows: [
            { label: "Vendor approved", expected: "Approved & preferred", found: "Apex Industrial Supply · preferred", ok: true },
            { label: "OEM vs distributor", expected: "Lower-cost compliant", found: "Distributor · −22% vs OEM", ok: true },
            { label: "Sourcing agreement", expected: "Price + vendor match", found: "On agreement SA-MRO-07", ok: true },
          ],
        },
        {
          band: "Price & terms",
          rows: [
            { label: "Price vs contract", expected: "Match contract", found: "$118 / EA · matches SA-MRO-07", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 30 · compliant", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "If any units are bought, Apex is approved and on-contract — but most of this demand should not be bought at all." },
    }}
  />
);

const rollerApprovalDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48655-APR",
      status: "Re-scoped buy",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 11:18",
      sections: [
        {
          band: "Recommended action",
          rows: [
            { label: "Interplant transfer", expected: "Use available stock", found: "6 EA from Eastbrook mill", ok: true },
            { label: "Warranty claim", expected: "Claim covered defects", found: "Seized units · ConveyorCore", ok: true },
            { label: "Residual buy", expected: "Only the shortfall", found: "2 EA · Apex · $236", ok: true },
            { label: "Cancel duplicate", expected: "Close PR-48641", found: "Cancellation drafted", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Re-scoped from an 8-unit buy to a 6-unit transfer + warranty claim + 2-unit buy — duplicate PR cancelled." },
    }}
  />
);

const rollerApprovalDocResolved = (
  <ValidationDoc
    report={{
      number: "VAL-48655-APR",
      status: "Routed",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-20 · 11:33",
      sections: [
        {
          band: "Recommended action",
          rows: [
            { label: "Interplant transfer", expected: "Use available stock", found: "Routed · 6 EA from Eastbrook", ok: true },
            { label: "Warranty claim", expected: "Claim covered defects", found: "Raised · ConveyorCore", ok: true },
            { label: "Residual buy", expected: "Only the shortfall", found: "Released · 2 EA · $236", ok: true },
            { label: "Cancel duplicate", expected: "Close PR-48641", found: "Cancelled", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Engineer approved — routed the 6-EA transfer (STO-48655), raised the ConveyorCore warranty claim, and released the 2-EA buy ($236). Duplicate PR-48641 cancelled." },
    }}
  />
);

/* Real SAP source files the idler-roller (inter-plant) flow agents read. */

const rollerMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: "MRO-CONV-ROLLER-IDLER-STD",
      description: "Conveyor Idler Roller — 600 mm — Steel — Heavy Duty",
      status: "Active",
      createdOn: "2025-09-02 · 14:10",
      createdBy: "Master data steward",
      basic: [
        { label: "Material type", value: "ERSA · Spare part" },
        { label: "Industry sector", value: "Mill products" },
        { label: "Material group", value: "MRO · Conveyor & rollers" },
        { label: "Base UoM", value: "EA" },
        { label: "Gross weight", value: "11 kg" },
        { label: "Old material no.", value: "IR-600-STD" },
      ],
      purchasing: [
        { label: "Order unit", value: "EA" },
        { label: "Purchasing group", value: "200 · MRO" },
        { label: "Planned deliv. time", value: "5 days" },
        { label: "Info record", value: "5300004118 · exists" },
        { label: "Source list", value: "Apex · SA-MRO-07" },
        { label: "Std PO text", value: "600 mm steel idler" },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · MRO spares" },
        { label: "Price control", value: "V · moving average" },
        { label: "Moving avg price", value: "$118.00 / EA" },
        { label: "Currency", value: "USD" },
      ],
    }}
  />
);

const rollerStockOverview = (
  <StockOverviewDoc
    s={{
      number: "MRO-CONV-ROLLER-IDLER-STD",
      description: "Conveyor Idler Roller — 600 mm — Steel",
      createdOn: "2026-06-20 · 11:12",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Northgate · Recycling", storageLoc: "MRO-01", onHand: "0", safety: "2", uom: "EA", tone: "short" },
        { plant: "Eastbrook mill", storageLoc: "MRO-01", onHand: "6", safety: "2", uom: "EA", tone: "surplus" },
        { plant: "Westport", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
      ],
      note: "6 EA surplus at the Eastbrook mill store — transfer before buying. The network already holds what Sorting Line 1 needs.",
    }}
  />
);

const rollerStockTransfer = (
  <StockTransportOrderDoc
    o={{
      number: "STO-48655",
      status: "Drafted · needs you",
      createdOn: "2026-06-20 · 11:18",
      createdBy: "Approval & routing",
      header: [
        { label: "Supplying plant", value: "Eastbrook mill · MRO-01" },
        { label: "Receiving plant", value: "Northgate · Sorting Line 1" },
        { label: "Movement type", value: "351 · interplant transfer" },
        { label: "Doc type", value: "UB · stock transport order" },
        { label: "Value redirected", value: "$708 (6 EA)" },
        { label: "Lead time", value: "In-network · this week" },
      ],
      items: [
        { item: "10", material: "MRO-CONV-ROLLER-IDLER-STD", description: "Idler roller 600 mm steel", qty: "6 EA", from: "Eastbrook", to: "Northgate" },
      ],
      note: "Transfers the 6 EA surplus from Eastbrook instead of a fresh buy — avoids $708 of duplicate spend.",
    }}
  />
);

const rollerWarrantyRecord = (
  <WarrantyRecordDoc
    w={{
      number: "WTY-CHK-48655",
      status: "Inside warranty",
      createdOn: "2026-06-20 · 11:14",
      createdBy: "Warranty & coverage desk",
      object: [
        { label: "Equipment", value: "OCC feed conveyor" },
        { label: "Functional loc.", value: "NGT-REC-SL1" },
        { label: "Component", value: "Idler rollers" },
        { label: "Commissioned", value: "2026-01-15" },
      ],
      coverage: [
        { label: "OEM warranty", value: "Yes · 12-mo parts" },
        { label: "OEM", value: "ConveyorCore" },
        { label: "Coverage scope", value: "Parts · claimable" },
      ],
      failure: [
        { label: "Failure type", value: "Premature seizure" },
        { label: "Covered defect", value: "Likely · within 12 mo" },
        { label: "Claimable", value: "Yes · raise a claim" },
      ],
      determination: { ok: false, text: "Inside the 12-month parts warranty — raise a claim on the seized units with ConveyorCore rather than buying them." },
    }}
  />
);

const rollerOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-07",
      status: "Active",
      createdOn: "2026-01-02 · valid to 2026-12-31",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "Apex Industrial Supply" },
        { label: "Vendor code", value: "0001000207" },
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Valid from", value: "2026-01-01" },
        { label: "Valid to", value: "2026-12-31" },
        { label: "Target value", value: "$420,000" },
      ],
      items: [
        { item: "50", material: "MRO-CONV-ROLLER-IDLER-STD", description: "Idler roller 600 mm steel", targetQty: "60 EA / yr", netPrice: "$118.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 30" },
        { label: "Incoterms", value: "FCA · Apex DC" },
        { label: "Price basis", value: "Distributor · −22% vs OEM" },
      ],
    }}
  />
);

const rollerVendorRecord = (
  <VendorRecordDoc
    v={{
      number: "0001000207",
      name: "Apex Industrial Supply",
      status: "Approved",
      createdOn: "2022-05-18 · last review 2026-02",
      createdBy: "Supplier management",
      general: [
        { label: "BP role", value: "Vendor · distributor" },
        { label: "Country", value: "US" },
        { label: "Tax / reg.", value: "Compliant · on file" },
      ],
      purchasing: [
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Order currency", value: "USD" },
        { label: "Payment terms", value: "Net 30" },
        { label: "Preferred", value: "Yes · MRO rollers" },
      ],
      approval: { ok: true, text: "Approved & preferred distributor — but transfer + warranty cover most of this demand, so price only the 2 EA residual." },
    }}
  />
);

const rollerApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48655-REL",
      status: "Re-scoped · needs you",
      createdOn: "2026-06-20 · 11:18",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48655 · idler roller" },
        { label: "Requestor", value: "Plant engineer · SL1" },
        { label: "Original", value: "8 EA · $944" },
        { label: "Re-scoped", value: "2 EA buy · $236" },
        { label: "Cost center / GL", value: "10034 / 600450" },
        { label: "Vendor", value: "Apex · SA-MRO-07" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · residual in limit" },
        { level: "L2", approver: "—", role: "Procurement Manager", limit: "$50,000", status: "not-reached", when: "" },
      ],
      validation: { ok: true, text: "Re-scoped to a 6-EA interplant transfer + a warranty claim + a 2-EA on-contract buy ($236); duplicate PR-48641 cancelled." },
      action: "Approve the re-scoped plan — route the transfer (STO-48655), raise the ConveyorCore warranty claim, and release the 2-EA buy.",
    }}
  />
);

/* ── Step builder ─────────────────────────────────────────────────────────── */

type StepSpec = {
  id: RunStep["id"];
  agentName: string;
  n: number;
  title: string;
  sub: string;
  reasoning: string[];
  docLabel: string;
  document: React.ReactNode;
  sources: RunStep["sources"];
  recommendation: string;
  stages?: RunStep["stages"];
  email?: RunStep["email"];
};

const step = (s: StepSpec): RunStep => s;

/* ── Example 1 · conveyor belt — 5 steps ───────────────────────────────────── */

export const beltPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the free-text note into a coded PR",
    reasoning: [
      "Reading the engineer's free-text note from Sorting Line 2",
      "Extracting specs — ~35–36 in, rubber, heavy duty",
      "Mapping to material code MRO-CONV-BELT-36IN-HD",
      "Coding cost center 10034 · GL 600450",
      "Flagging the width range and missing part number",
    ],
    docLabel: "PR-48630 · structured requisition",
    document: beltStructuredDoc,
    sources: [
      { id: "belt-freetext", label: "Free-text PR", meta: "Intake portal · 10:40", kind: "email", body: beltFreeText },
    ],
    recommendation:
      "Structured and coded to MRO-CONV-BELT-36IN-HD. One open item — the engineer gave a 35–36 in range with no part number, so the width is unconfirmed. Drafted clean, routed for the checks.",
    stages: [
      {
        sourceId: "belt-freetext",
        reasoning: "Extracting specs from the free-text note",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: "Conveyor belt · rubber · HD" },
          { label: "Face width", value: "36 in (from \"35–36 in\")" },
          { label: "Quantity", value: "1 EA · 18 m roll" },
          { label: "Plant", value: "Recycling · Sorting Line 2" },
        ],
      },
      {
        sourceId: "belt-freetext",
        reasoning: "Coding the account assignment",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: "MRO-CONV-BELT-36IN-HD" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
          { label: "Confidence", value: "86% · confirm width" },
        ],
      },
    ],
  }),
  step({
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Master data, duplicate & inventory",
    sub: "Checks the SKU, duplicates and stock",
    reasoning: [
      "Reading structured PR-48630",
      "Confirming the mapped material code",
      "Scanning open PRs for a duplicate — none found",
      "Checking on-hand and interplant stock — none",
      "Flagging the ambiguous width for sign-off",
    ],
    docLabel: "VAL-48630-MD · master data",
    document: beltMasterDataDoc,
    sources: [
      { id: "belt-pr-handoff", label: "PR-48630", meta: "from PR Processing", kind: "sap", handoff: true, body: beltStructuredDoc },
      { id: "belt-matmaster", label: "MM03 · material master", meta: "MRO-CONV-BELT-36IN-HD", kind: "master", body: beltMaterialMaster },
      { id: "belt-stock", label: "MB52 · stock overview", meta: "on-hand + interplant", kind: "master", body: beltStockOverview },
    ],
    recommendation:
      "Code is clean, no duplicate, no stock to draw from — the buy is justified. The only flag is the width range; confirm 36 in before release.",
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Confirms it's a buy, not a claim",
    reasoning: [
      "Checking the conveyor's OEM warranty status",
      "Belt is a wear part — not covered equipment",
      "Failure is wear & tear, not a covered defect",
      "Coverage — parts only, buy new",
    ],
    docLabel: "VAL-48630-WTY · warranty",
    document: beltWarrantyDoc,
    sources: [
      { id: "belt-md-handoff", label: "VAL-48630-MD", meta: "from Master Data", kind: "sap", handoff: true, body: beltMasterDataDoc },
      { id: "belt-warranty-rec", label: "Warranty record", meta: "Sorting Line 2 conveyor", kind: "kb", body: beltWarrantyRecord },
    ],
    recommendation: "Wear-and-tear on a wear part — no warranty claim applies. Proceed as a new-buy.",
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Vendor, contract & price",
    sub: "Validates vendor, agreement and price",
    reasoning: [
      "Confirming Apex Industrial Supply is approved & preferred",
      "Distributor route −19% vs the OEM",
      "Checking sourcing agreement SA-MRO-07",
      "Price $4,180 matches the contract · Net 30",
    ],
    docLabel: "VAL-48630-VEN · vendor & price",
    document: beltVendorDoc,
    sources: [
      { id: "belt-wty-handoff", label: "VAL-48630-WTY", meta: "from Warranty desk", kind: "sap", handoff: true, body: beltWarrantyDoc },
      { id: "belt-agreement", label: "ME33K · SA-MRO-07", meta: "outline agreement", kind: "contract", body: beltOutlineAgreement },
      { id: "belt-vendor-rec", label: "Vendor master · Apex", meta: "approved supplier", kind: "master", body: beltVendorRecord },
    ],
    recommendation: "Vendor approved, on-contract, price-matched at $4,180 — no off-contract leakage.",
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approval & routing",
    sub: "Cost center, DOA and the open spec item",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "On-contract — competitive bidding not required",
      "Within the plant-maintenance approval limit",
      "Holding for the engineer's width confirmation",
    ],
    docLabel: "VAL-48630-APR · approval",
    document: beltApprovalDoc,
    sources: [
      { id: "belt-ven-handoff", label: "VAL-48630-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: beltVendorDoc },
      { id: "belt-doa", label: "DOA release routing", meta: "WF-48630-REL", kind: "policy", body: beltApprovalRouting },
    ],
    email: {
      cta: "Send the spec confirmation",
      to: "Plant engineer · Sorting Line 2",
      subject: "PR-48630 — confirm belt face width before release",
      lines: [
        "I've structured and coded your request to MRO-CONV-BELT-36IN-HD, on-contract via Apex at $4,180, Net 30 — everything checks out except one item.",
        "You gave a 35–36 in width with no part number. I've coded it to a 36 in face width for Sorting Line 2; please confirm so we don't ship a wrong-fit belt that fails on install.",
        "Reply to confirm and I'll release the PR immediately.",
      ],
      toastTitle: "Width confirmed",
      toastBody: "The engineer confirmed 36 in for Sorting Line 2 — reply added to your sources.",
      resolvedDocument: beltApprovalDocResolved,
      reply: {
        from: "Plant engineer · Sorting Line 2",
        receivedMeta: "Outlook · 11:02",
        subject: "RE: PR-48630 — confirm belt face width",
        lines: ["Confirmed — 36 in face width is correct for Sorting Line 2. Please release."],
        source: {
          id: "belt-spec-ack",
          label: "Engineer confirmation",
          meta: "Outlook · 11:02",
          kind: "email",
          body: (
            <EmailDoc
              from="Plant engineer · Sorting Line 2"
              fromAddr="engineer@northgatepaper.com"
              to="Approval & routing"
              sent="2026-06-20 · 11:02"
              subject="RE: PR-48630 — confirm belt face width"
              tone="inbound"
              lines={["Confirmed — 36 in face width is correct for Sorting Line 2. Please release."]}
            />
          ),
        },
      },
    },
    recommendation:
      "Everything clears except the width. Send the engineer the spec confirmation; on their reply, release PR-48630 to Apex on-contract at $4,180.",
  }),
];

/* ── Example 2 · idler roller — 5 steps ────────────────────────────────────── */

export const rollerPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "PR Processing agent",
    n: 1,
    title: "Structure & code the request",
    sub: "Turns the free-text note into a coded PR",
    reasoning: [
      "Reading the engineer's free-text note from Sorting Line 1",
      "Extracting — 600 mm steel idler rollers, ~6–8 EA",
      "Mapping to material code MRO-CONV-ROLLER-IDLER-STD",
      "Coding cost center 10034 · GL 600450",
      "Noting it matches the OCC feed conveyor rollers",
    ],
    docLabel: "PR-48655 · structured requisition",
    document: rollerStructuredDoc,
    sources: [
      { id: "roller-freetext", label: "Free-text PR", meta: "Intake portal · 11:04", kind: "email", body: rollerFreeText },
    ],
    recommendation:
      "Structured and coded to MRO-CONV-ROLLER-IDLER-STD at 8 EA. Matches the OCC feed conveyor — the downstream checks will test whether all 8 should actually be bought.",
    stages: [
      {
        sourceId: "roller-freetext",
        reasoning: "Extracting specs from the free-text note",
        title: "Item — what's needed",
        fields: [
          { label: "Material", value: "Idler roller · 600 mm · steel" },
          { label: "Quantity", value: "8 EA (from \"6–8\")" },
          { label: "Plant", value: "Recycling · Sorting Line 1" },
          { label: "Same as", value: "OCC feed conveyor rollers" },
        ],
      },
      {
        sourceId: "roller-freetext",
        reasoning: "Coding the account assignment",
        title: "Account assignment",
        fields: [
          { label: "Material code", value: "MRO-CONV-ROLLER-IDLER-STD" },
          { label: "Cost center", value: COST_CENTER },
          { label: "G/L account", value: GL },
          { label: "Confidence", value: "94%" },
        ],
      },
    ],
  }),
  step({
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Master data, duplicate & inventory",
    sub: "Finds a duplicate and sister-plant stock",
    reasoning: [
      "Reading structured PR-48655",
      "Scanning open PRs — found PR-48641 for the same SKU",
      "Checking on-hand stock — none at this plant",
      "Checking interplant — 6 EA at the Eastbrook mill store",
      "Flagging duplicate demand and available stock",
    ],
    docLabel: "VAL-48655-MD · master data",
    document: rollerMasterDataDoc,
    sources: [
      { id: "roller-pr-handoff", label: "PR-48655", meta: "from PR Processing", kind: "sap", handoff: true, body: rollerStructuredDoc },
      { id: "roller-matmaster", label: "MM03 · material master", meta: "MRO-CONV-ROLLER-IDLER-STD", kind: "master", body: rollerMaterialMaster },
      { id: "roller-stock", label: "MB52 · stock overview", meta: "6 EA at Eastbrook", kind: "master", body: rollerStockOverview },
      { id: "roller-sto", label: "ME23N · stock transfer", meta: "STO-48655 · 6 EA", kind: "sap", body: rollerStockTransfer },
    ],
    recommendation:
      "Two flags — a duplicate open PR (PR-48641) and 6 EA available at the Eastbrook mill store. Don't buy 8: transfer the 6 and cancel the duplicate.",
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Warranty & coverage",
    sub: "Checks if the seizures are covered",
    reasoning: [
      "Reading the OCC feed conveyor's commissioning date",
      "Commissioned 2026-01-15 — inside the 12-month parts warranty",
      "Premature seizure — possible covered defect",
      "Coverage — parts, ConveyorCore OEM",
    ],
    docLabel: "VAL-48655-WTY · warranty",
    document: rollerWarrantyDoc,
    sources: [
      { id: "roller-md-handoff", label: "VAL-48655-MD", meta: "from Master Data", kind: "sap", handoff: true, body: rollerMasterDataDoc },
      { id: "roller-warranty-rec", label: "Warranty record", meta: "OCC feed conveyor · in warranty", kind: "kb", body: rollerWarrantyRecord },
    ],
    recommendation:
      "The OCC feed conveyor is inside its 12-month parts warranty and the seizures look like a defect — raise a warranty claim on the covered units rather than buying them.",
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Vendor, contract & price",
    sub: "Prices only the residual buy",
    reasoning: [
      "Confirming Apex Industrial Supply is approved & preferred",
      "Distributor route −22% vs the OEM",
      "Checking sourcing agreement SA-MRO-07",
      "Pricing only the shortfall — $118 / EA · Net 30",
    ],
    docLabel: "VAL-48655-VEN · vendor & price",
    document: rollerVendorDoc,
    sources: [
      { id: "roller-wty-handoff", label: "VAL-48655-WTY", meta: "from Warranty desk", kind: "sap", handoff: true, body: rollerWarrantyDoc },
      { id: "roller-agreement", label: "ME33K · SA-MRO-07", meta: "outline agreement", kind: "contract", body: rollerOutlineAgreement },
      { id: "roller-vendor-rec", label: "Vendor master · Apex", meta: "approved supplier", kind: "master", body: rollerVendorRecord },
    ],
    recommendation:
      "If any units are bought, Apex is approved and on-contract at $118/EA — but transfer and warranty cover most of the demand, so price only the residual.",
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approval & routing",
    sub: "Re-scopes the buy and cancels the duplicate",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "Routing 6 EA as an interplant transfer from Northgate",
      "Raising a warranty claim on the seized units",
      "Re-scoping the buy to the 2 EA shortfall · cancelling PR-48641",
    ],
    docLabel: "VAL-48655-APR · approval",
    document: rollerApprovalDoc,
    sources: [
      { id: "roller-ven-handoff", label: "VAL-48655-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: rollerVendorDoc },
      { id: "roller-doa", label: "DOA release routing", meta: "WF-48655-REL", kind: "policy", body: rollerApprovalRouting },
    ],
    email: {
      cta: "Send the re-scoped plan",
      to: "Plant engineer · Sorting Line 1",
      subject: "PR-48655 — re-scoped: transfer + warranty claim + 2-unit buy",
      lines: [
        "Before raising an 8-unit buy: 6 of these rollers are in stock at the Eastbrook mill store, and the OCC feed conveyor is inside its 12-month parts warranty — so the seizures should be a warranty claim, not a purchase.",
        "Plan: transfer 6 EA by interplant movement (here this week), raise a warranty claim with ConveyorCore on the seized units, and buy only the 2 EA shortfall from Apex on-contract ($236). I've also drafted a cancellation for the duplicate PR-48641.",
        "Reply to approve and I'll route the transfer, the claim and the 2-unit PR.",
      ],
      toastTitle: "Re-scoped plan approved",
      toastBody: "The engineer approved the transfer + claim + 2-unit buy — reply added to your sources.",
      resolvedDocument: rollerApprovalDocResolved,
      reply: {
        from: "Plant engineer · Sorting Line 1",
        receivedMeta: "Outlook · 11:31",
        subject: "RE: PR-48655 — re-scoped plan",
        lines: ["Approved — transfer the 6, raise the claim, buy the 2. Thanks for catching the duplicate."],
        source: {
          id: "roller-plan-ack",
          label: "Engineer approval",
          meta: "Outlook · 11:31",
          kind: "email",
          body: (
            <EmailDoc
              from="Plant engineer · Sorting Line 1"
              fromAddr="engineer@northgatepaper.com"
              to="Approval & routing"
              sent="2026-06-20 · 11:31"
              subject="RE: PR-48655 — re-scoped plan"
              tone="inbound"
              lines={["Approved — transfer the 6, raise the claim, buy the 2. Thanks for catching the duplicate."]}
            />
          ),
        },
      },
    },
    recommendation:
      "Re-scope from an 8-unit buy to a 6-unit interplant transfer + a warranty claim + a 2-unit on-contract buy ($236), and cancel the duplicate PR-48641. Send the plan; on approval, route all three.",
  }),
];

/* ════════════════════════════════════════════════════════════════════════
 * Example 3 — Drive-gearbox seal kit · predicted stock-out · proactive pre-buy
 * UC2 · Production Risk–Driven Auto Procurement. PREDICTIVE: no PR is raised —
 * the agent fuses SNOP + criticality + consumption + lead time + market to
 * predict a stock-out, overrides the deterministic reorder point, and proposes a
 * proactive pre-buy a human approves. GearTech = OEM single-source.
 * ════════════════════════════════════════════════════════════════════════ */

const SEAL_KIT = "MRO-PUMP-GEARBOX-SEALKIT-OEM";

const riskSnopSignal = (
  <EmailDoc
    from="S&OP Planning · demand desk"
    fromAddr="planning@northgatepaper.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:15"
    subject="Demand signal — recovery line ramp next quarter"
    tone="inbound"
    lines={[
      "Recovery line is scheduled to ramp +18% next quarter on the new OCC contract.",
      "Asset register flags the boiler-feed-pump drive gearbox as A1 critical — a single point of failure on the recovery line.",
      "Raising for spares-coverage review ahead of the ramp.",
    ]}
  />
);

const riskConsumptionFeed = (
  <EmailDoc
    from="Reliability · CMMS feed"
    fromAddr="cmms@northgatepaper.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:18"
    subject="Consumption & coverage — drive-gearbox seal kit"
    tone="inbound"
    lines={[
      "Seal/bearing kit on-hand: 1 EA · safety stock 2 EA — coverage at 0.5× safety.",
      "12-month consumption: 2 EA and rising (two recovery-line trips this quarter).",
      "Deterministic reorder point would only fire at on-hand 0.",
    ]}
  />
);

const riskSupplierLead = (
  <EmailDoc
    from="Supply · procurement market desk"
    fromAddr="market@northgatepaper.com"
    to="MRO risk sensing"
    sent="2026-06-24 · 07:20"
    subject="Lead time & market — GearTech OEM seal kit"
    tone="inbound"
    lines={[
      "GearTech is the single-source OEM for the seal/bearing kit · current lead time 9 weeks.",
      "Bearing-alloy market +7% with allocation tightening — price and availability risk rising.",
      "No alternate qualified source on file.",
    ]}
  />
);

const riskSignalDoc = (
  <StructuredPrDoc
    pr={{
      number: "RISK-49001",
      status: "Stock-out risk detected · no PR raised",
      createdBy: "Risk Sensing agent",
      createdOn: "2026-06-24 · 07:22",
      materialCode: SEAL_KIT,
      description: "Drive-Gearbox Mechanical Seal & Bearing Kit — GearTech OEM",
      plant: "Northgate · Recovery line",
      costCenter: COST_CENTER,
      glAccount: GL,
      item: [
        { label: "Asset", value: "Boiler feed pump · drive gearbox" },
        { label: "Criticality", value: "A1 · single point of failure" },
        { label: "On-hand vs safety", value: "1 EA vs 2 EA · 0.5× safety" },
        { label: "Consumption", value: "2 EA / 12 mo · rising" },
        { label: "Supplier lead time", value: "9 weeks · GearTech single-source" },
        { label: "Market", value: "Bearing alloy +7% · allocation tightening" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Pumps & drives" },
        { label: "Suggested vendor", value: "GearTech (OEM · single-source)" },
      ],
      confidence: "91% · pre-buy recommended",
      flags: [
        "No human PR raised — the risk was detected from SNOP, criticality, consumption and lead-time signals, not a request.",
        "Deterministic reorder point not yet tripped; with a 9-week lead time, firing at the reorder point would miss the ramp and risk a line-down.",
      ],
    }}
  />
);

const riskPredictionDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-RISK",
      status: "Reorder logic overridden",
      docType: "Stock-out prediction · reorder override",
      system: "Inventory · planning",
      createdBy: "Master Data agent",
      createdOn: "2026-06-24 · 07:24",
      sections: [
        {
          band: "Prediction",
          rows: [
            { label: "Deterministic reorder point", expected: "Fires in time", found: "Fires at on-hand 0 · too late", ok: false },
            { label: "Predicted stock-out", expected: "After next supply", found: "Day 9 · before the 9-wk lead clears", ok: false },
            { label: "Duplicate demand", expected: "None open", found: "No open PR · no duplicate", ok: true },
          ],
        },
        {
          band: "Inventory & interplant",
          rows: [
            { label: "On-hand this plant", expected: "≥ safety stock", found: "1 EA · below safety", ok: false },
            { label: "Eastbrook mill store", expected: "Check sister plant", found: "0 EA · no cover", ok: true },
            { label: "Westport store", expected: "Check sister plant", found: "0 EA · no cover", ok: true },
          ],
        },
      ],
      verdict: { ok: false, text: "A 9-week lead means the reorder point fires too late, and no sister plant can cover. Override the deterministic logic with a proactive pre-buy of the shortfall to safety + a ramp buffer." },
    }}
  />
);

const riskCoverageDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-COV",
      status: "Pre-buy justified",
      docType: "Coverage & working capital",
      system: "Equipment register · MRO carry policy",
      createdBy: "Warranty & coverage desk",
      createdOn: "2026-06-24 · 07:26",
      sections: [
        {
          band: "Coverage & working capital",
          rows: [
            { label: "OEM warranty / contract", expected: "Claimable?", found: "No · consumable spare", ok: true },
            { label: "Working-capital impact", expected: "Within MRO carry policy", found: "+$18.4K · inside policy", ok: true },
            { label: "Downtime exposure", expected: "Quantify the risk", found: "~$1.4M / day if the line trips", ok: false },
            { label: "Pre-buy buffer", expected: "To safety + ramp", found: "2 EA → safety 2 + 1 ramp", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Not a warranty event — a consumable critical spare. The $18.4K pre-buy is inside the MRO carrying-cost policy and trivial against a ~$1.4M/day trip exposure." },
    }}
  />
);

const riskVendorDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-VEN",
      status: "On-contract · pre-buy priced",
      docType: "Vendor · contract · price",
      system: "Vendor master · sourcing agreement",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-24 · 07:28",
      sections: [
        {
          band: "Vendor & contract",
          rows: [
            { label: "Vendor approved", expected: "Approved & preferred", found: "GearTech OEM · single-source", ok: true },
            { label: "Sourcing agreement", expected: "Price + vendor match", found: "On agreement SA-MRO-11", ok: true },
            { label: "Market timing", expected: "Pre-buy vs price rise", found: "Lock now · avoids +7% alloy", ok: true },
          ],
        },
        {
          band: "Price & terms",
          rows: [
            { label: "Unit price vs contract", expected: "Match contract", found: "$9,200 / EA · matches SA-MRO-11", ok: true },
            { label: "Pre-buy value", expected: "Shortfall + buffer", found: "2 EA · $18,400", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 60 · compliant", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Single-source OEM, on-contract at $9,200/EA on SA-MRO-11 — locking the 2-unit pre-buy now also beats a forecast +7% alloy increase." },
    }}
  />
);

const riskApprovalDoc = (
  <ValidationDoc
    report={{
      number: "VAL-49001-APR",
      status: "Ready · human approval",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-24 · 07:30",
      sections: [
        {
          band: "Approval & routing",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "Single-source OEM · waiver on file", ok: true },
            { label: "DOA approval", expected: "Plant-maintenance limit", found: "$18.4K · within limit", ok: true },
            { label: "Proactive-buy authorization", expected: "Human approves the pre-buy", found: "Pending · reorder override", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "Every control clears except the one a person owns — authorizing a proactive pre-buy ahead of the reorder point to protect the recovery line." },
    }}
  />
);

const riskApprovalDocResolved = (
  <ValidationDoc
    report={{
      number: "VAL-49001-APR",
      status: "Pre-buy routed",
      docType: "Approval & routing (DOA)",
      system: "Cost center · DOA",
      createdBy: "Approval & routing",
      createdOn: "2026-06-24 · 08:06",
      sections: [
        {
          band: "Approval & routing",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10034 / 600450 · correct", ok: true },
            { label: "Competitive bidding", expected: "3 quotes if > threshold", found: "Single-source OEM · waiver on file", ok: true },
            { label: "DOA approval", expected: "Plant-maintenance limit", found: "$18.4K · within limit", ok: true },
            { label: "Proactive-buy authorization", expected: "Human approves the pre-buy", found: "Approved · reliability lead", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Reliability lead approved the proactive pre-buy — 2-unit GearTech PR ($18,400) routed on-contract ahead of the 9-week lead, protecting the recovery line." },
    }}
  />
);

/* Real SAP source files the risk-flow agents read (clickable evidence). */

const riskMaterialMaster = (
  <MaterialMasterDoc
    m={{
      number: SEAL_KIT,
      description: "Drive-Gearbox Mechanical Seal & Bearing Kit — GearTech OEM",
      status: "Active",
      createdOn: "2021-11-04 · 08:40",
      createdBy: "Master data steward",
      basic: [
        { label: "Material type", value: "ERSA · Spare part" },
        { label: "Industry sector", value: "Mill products" },
        { label: "Material group", value: "MRO · Pumps & drives" },
        { label: "Base UoM", value: "EA (kit)" },
        { label: "Gross weight", value: "12 kg" },
        { label: "Old material no.", value: "GT-SK-DGB" },
      ],
      purchasing: [
        { label: "Order unit", value: "EA" },
        { label: "Purchasing group", value: "200 · MRO" },
        { label: "Planned deliv. time", value: "63 days · 9 wk" },
        { label: "MRP type", value: "VB · reorder-point" },
        { label: "Reorder point", value: "0 EA · fires at stock-out" },
        { label: "Source list", value: "GearTech · SA-MRO-11 (single)" },
      ],
      accounting: [
        { label: "Valuation class", value: "3040 · MRO spares" },
        { label: "Price control", value: "V · moving average" },
        { label: "Moving avg price", value: "$9,200.00 / EA" },
        { label: "Currency", value: "USD" },
      ],
    }}
  />
);

const riskStockOverview = (
  <StockOverviewDoc
    s={{
      number: SEAL_KIT,
      description: "Drive-Gearbox Mechanical Seal & Bearing Kit",
      createdOn: "2026-06-24 · 07:24",
      createdBy: "Master Data agent",
      rows: [
        { plant: "Northgate · Recovery line", storageLoc: "MRO-01", onHand: "1", safety: "2", uom: "EA", tone: "short" },
        { plant: "Eastbrook mill", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
        { plant: "Westport", storageLoc: "MRO-01", onHand: "0", safety: "0", uom: "EA" },
      ],
      note: "On-hand 1 EA is below the 2 EA safety stock (0.5× cover) and no sister plant carries the kit — no interplant transfer is possible. With a 9-week single-source lead, the reorder point fires too late; a proactive pre-buy is justified.",
    }}
  />
);

const riskWarrantyRecord = (
  <WarrantyRecordDoc
    w={{
      number: "WTY-CHK-49001",
      status: "Not covered · consumable",
      createdOn: "2026-06-24 · 07:26",
      createdBy: "Warranty & coverage desk",
      object: [
        { label: "Equipment", value: "Boiler feed pump · drive gearbox" },
        { label: "Functional loc.", value: "NGT-REC-BFP-01" },
        { label: "Component", value: "Mech seal & bearing kit" },
        { label: "Commissioned", value: "2021-11-02" },
      ],
      coverage: [
        { label: "OEM warranty", value: "Expired · > 12 mo" },
        { label: "Service contract", value: "None on consumables" },
        { label: "Coverage scope", value: "Parts only · n/a" },
      ],
      failure: [
        { label: "Failure type", value: "Wear · seal/bearing life" },
        { label: "Covered defect", value: "No" },
        { label: "Claimable", value: "No · consumable spare" },
      ],
      determination: { ok: true, text: "Seal & bearing kit is a consumable critical spare — not a warranty claim. Treat as a proactive replenishment buy." },
    }}
  />
);

const riskOutlineAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-11",
      status: "Active",
      createdOn: "2026-01-02 · valid to 2026-12-31",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Vendor code", value: "0001000341" },
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Valid from", value: "2026-01-01" },
        { label: "Valid to", value: "2026-12-31" },
        { label: "Target value", value: "$184,000" },
      ],
      items: [
        { item: "20", material: SEAL_KIT, description: "Drive-gearbox seal & bearing kit", targetQty: "8 EA / yr", netPrice: "$9,200.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 60" },
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Price basis", value: "OEM single-source · fixed to 2026-12-31" },
      ],
    }}
  />
);

const riskVendorRecord = (
  <VendorRecordDoc
    v={{
      number: "0001000341",
      name: "GearTech Drive Systems",
      status: "Approved · single-source OEM",
      createdOn: "2019-07-22 · last review 2026-03",
      createdBy: "Supplier management",
      general: [
        { label: "BP role", value: "Vendor · OEM manufacturer" },
        { label: "Country", value: "US" },
        { label: "Tax / reg.", value: "Compliant · on file" },
      ],
      purchasing: [
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Order currency", value: "USD" },
        { label: "Payment terms", value: "Net 60" },
        { label: "Preferred", value: "Yes · sole OEM source" },
      ],
      approval: { ok: true, text: "Approved OEM and the only qualified source for the drive-gearbox seal kit — on agreement SA-MRO-11. No alternate qualified source on file." },
    }}
  />
);

const riskApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-49001-REL",
      status: "Awaiting authorization",
      createdOn: "2026-06-24 · 07:30",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "RISK-49001 → proactive PR" },
        { label: "Requestor", value: "Risk Sensing agent · no human PR" },
        { label: "Category", value: "MRO · on-contract · pre-buy" },
        { label: "Amount", value: "$18,400.00" },
        { label: "Cost center / GL", value: "10034 / 600450" },
        { label: "Vendor", value: "GearTech · SA-MRO-11" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$25,000", status: "approved", when: "value within limit · on-contract" },
        { level: "L2", approver: "Reliability Lead", role: "Reliability · pre-buy owner", limit: "$50,000", status: "pending", when: "proactive override — needs sign-off" },
      ],
      validation: { ok: true, text: "$18,400 within the plant-maintenance DOA ($25,000) and on-contract — competitive bidding waived (single-source OEM)." },
      action: "One open item: this is a proactive pre-buy ahead of the deterministic reorder point — the reliability lead must authorize the override.",
    }}
  />
);

/* ── Example 3 · drive-gearbox seal kit — 5 steps ──────────────────────────── */

export const riskPrSteps: RunStep[] = [
  step({
    id: "intake",
    agentName: "Risk Sensing agent",
    n: 1,
    title: "Synthesise the risk signals",
    sub: "Fuses SNOP, criticality, consumption & lead time",
    reasoning: [
      "Reading the S&OP ramp signal for the recovery line",
      "Asset register — drive gearbox is A1, a single point of failure",
      "CMMS — on-hand 1 vs safety 2, consumption rising",
      "Market — GearTech single-source, 9-week lead, alloy +7%",
      "No PR raised — structuring the predicted demand for the checks",
    ],
    docLabel: "RISK-49001 · stock-out risk brief",
    document: riskSignalDoc,
    sources: [
      { id: "snop-signal", label: "S&OP demand signal", meta: "Planning · 07:15", kind: "kb", body: riskSnopSignal },
      { id: "consumption-feed", label: "CMMS consumption", meta: "Reliability · 07:18", kind: "master", body: riskConsumptionFeed },
      { id: "supplier-lead", label: "Supplier & market", meta: "Market desk · 07:20", kind: "external", body: riskSupplierLead },
    ],
    recommendation:
      "Fused the SNOP ramp, A1 criticality, rising consumption, a 9-week lead and a tightening market: the drive-gearbox seal kit is predicted to stock out before any replenishment can land. No PR exists — proactively structured RISK-49001 for the checks.",
    stages: [
      {
        sourceId: "snop-signal",
        reasoning: "Reading demand & criticality",
        title: "Demand & criticality",
        fields: [
          { label: "Asset", value: "Boiler feed pump · drive gearbox" },
          { label: "Criticality", value: "A1 · single point of failure" },
          { label: "SNOP signal", value: "Recovery line ramp +18% next qtr" },
          { label: "Plant", value: "Northgate · Recovery line" },
        ],
      },
      {
        sourceId: "consumption-feed",
        reasoning: "Reading consumption & coverage",
        title: "Consumption & coverage",
        fields: [
          { label: "On-hand", value: "1 EA" },
          { label: "Safety stock", value: "2 EA · coverage 0.5×" },
          { label: "12-mo consumption", value: "2 EA · rising" },
          { label: "Reorder point", value: "Fires at on-hand 0" },
        ],
      },
      {
        sourceId: "supplier-lead",
        reasoning: "Reading lead time & market",
        title: "Lead time & market",
        fields: [
          { label: "Supplier", value: "GearTech · OEM single-source" },
          { label: "Lead time", value: "9 weeks" },
          { label: "Market", value: "Bearing alloy +7% · tightening" },
          { label: "Confidence", value: "91% · pre-buy recommended" },
        ],
      },
    ],
  }),
  step({
    id: "vendor",
    agentName: "Master Data agent",
    n: 2,
    title: "Predict the stock-out & override reorder",
    sub: "Tests reorder logic and interplant cover",
    reasoning: [
      "Reading the RISK-49001 signal brief",
      "Deterministic reorder point fires at on-hand 0 — too late for a 9-week lead",
      "Predicting the stock-out at day 9, before any supply lands",
      "Checking interplant — 0 EA at Eastbrook and Westport",
      "Overriding the reorder logic toward a proactive pre-buy",
    ],
    docLabel: "VAL-49001-RISK · prediction",
    document: riskPredictionDoc,
    sources: [
      { id: "risk-handoff", label: "RISK-49001", meta: "from Risk Sensing", kind: "kb", handoff: true, body: riskSignalDoc },
      { id: "risk-matmaster", label: "MM03 · material master", meta: SEAL_KIT, kind: "master", body: riskMaterialMaster },
      { id: "risk-stock", label: "MB52 · stock overview", meta: "1 EA · below safety", kind: "master", body: riskStockOverview },
    ],
    recommendation:
      "The reorder point would fire too late for a 9-week lead, and no sister plant can cover. Overriding the deterministic logic with a proactive pre-buy of the shortfall to safety plus a ramp buffer.",
  }),
  step({
    id: "invoice",
    agentName: "Warranty & coverage desk",
    n: 3,
    title: "Coverage & working capital",
    sub: "Confirms it's a pre-buy, not a claim",
    reasoning: [
      "Checking OEM warranty / service contract — consumable spare, not claimable",
      "Working-capital impact +$18.4K — inside the MRO carry policy",
      "Quantifying downtime exposure — ~$1.4M / day if the line trips",
      "Sizing the pre-buy to safety + a ramp buffer",
    ],
    docLabel: "VAL-49001-COV · coverage",
    document: riskCoverageDoc,
    sources: [
      { id: "pred-handoff", label: "VAL-49001-RISK", meta: "from Master Data", kind: "sap", handoff: true, body: riskPredictionDoc },
      { id: "risk-warranty-rec", label: "Warranty record", meta: "drive gearbox · consumable", kind: "kb", body: riskWarrantyRecord },
    ],
    recommendation:
      "Not a warranty event — a consumable critical spare. The $18.4K pre-buy is inside the carrying-cost policy and trivial against a ~$1.4M/day trip exposure. The coverage gap is confirmed.",
  }),
  step({
    id: "sourcing",
    agentName: "Sourcing & contract agent",
    n: 4,
    title: "Source & price the pre-buy",
    sub: "Validates vendor, agreement and price",
    reasoning: [
      "Confirming GearTech is the on-contract single-source OEM",
      "Checking sourcing agreement SA-MRO-11",
      "Pricing the 2-unit pre-buy — $9,200 / EA · $18,400",
      "Locking now also beats a forecast +7% alloy increase",
    ],
    docLabel: "VAL-49001-VEN · vendor & price",
    document: riskVendorDoc,
    sources: [
      { id: "cov-handoff", label: "VAL-49001-COV", meta: "from Warranty desk", kind: "sap", handoff: true, body: riskCoverageDoc },
      { id: "risk-agreement", label: "ME33K · SA-MRO-11", meta: "outline agreement", kind: "contract", body: riskOutlineAgreement },
      { id: "risk-vendor-rec", label: "Vendor master · GearTech", meta: "single-source OEM", kind: "master", body: riskVendorRecord },
    ],
    recommendation:
      "GearTech is the on-contract single-source OEM at $9,200/EA on SA-MRO-11; a 2-unit pre-buy ($18,400) on Net 60 also locks the price ahead of the forecast alloy increase.",
  }),
  step({
    id: "orchestrator",
    agentName: "Approval & routing",
    n: 5,
    title: "Approve & route the pre-buy",
    sub: "Cost center, DOA and the human authorization",
    reasoning: [
      "Confirming cost center 10034 / GL 600450",
      "Single-source OEM — competitive bidding waived on file",
      "Within the plant-maintenance approval limit",
      "Holding for the reliability lead to authorize the proactive pre-buy",
    ],
    docLabel: "VAL-49001-APR · approval",
    document: riskApprovalDoc,
    sources: [
      { id: "ven-handoff", label: "VAL-49001-VEN", meta: "from Sourcing", kind: "sap", handoff: true, body: riskVendorDoc },
      { id: "risk-doa", label: "DOA release routing", meta: "WF-49001-REL", kind: "policy", body: riskApprovalRouting },
    ],
    email: {
      cta: "Send the pre-buy recommendation",
      to: "Reliability lead · Northgate Recovery line",
      subject: "RISK-49001 — drive-gearbox seal kit predicted to stock out in 9 days · approve pre-buy",
      lines: [
        "No PR was raised — I detected a stock-out risk on the A1-critical drive-gearbox seal kit by fusing the S&OP ramp, rising consumption, a 9-week single-source lead time and a tightening alloy market.",
        "The deterministic reorder point fires at on-hand 0, which is too late for a 9-week lead, and no sister plant can cover. I'm recommending a proactive 2-unit pre-buy from GearTech on-contract ($18,400, Net 60) — inside the carry policy and trivial against a ~$1.4M/day line-down.",
        "Reply to approve and I'll route the proactive PR on-contract ahead of the lead time.",
      ],
      toastTitle: "Pre-buy approved",
      toastBody: "The reliability lead approved the proactive pre-buy — reply added to your sources.",
      resolvedDocument: riskApprovalDocResolved,
      reply: {
        from: "Reliability lead · Northgate Recovery line",
        receivedMeta: "Outlook · 08:05",
        subject: "RE: RISK-49001 — approve pre-buy",
        lines: ["Approved — pre-buy the 2 kits and protect the recovery line. Good catch ahead of the ramp."],
        source: {
          id: "risk-approval-ack",
          label: "Reliability lead approval",
          meta: "Outlook · 08:05",
          kind: "email",
          body: (
            <EmailDoc
              from="Reliability lead · Northgate Recovery line"
              fromAddr="reliability@northgatepaper.com"
              to="Approval & routing"
              sent="2026-06-24 · 08:05"
              subject="RE: RISK-49001 — approve pre-buy"
              tone="inbound"
              lines={["Approved — pre-buy the 2 kits and protect the recovery line. Good catch ahead of the ramp."]}
            />
          ),
        },
      },
    },
    recommendation:
      "All controls pass; the only open item is the human authorization of a proactive pre-buy. Send the recommendation; on approval, route the 2-unit GearTech PR on-contract ($18,400) ahead of the 9-week lead.",
  }),
];

/* ════════════════════════════════════════════════════════════════════════
 * Example 4 — Compliance & Commercial Orchestrator (UC4)
 * A validated PR (PR-48690 · pulping drive-gearbox rebuild kit · $42,000) is
 * ready for PO conversion. The orchestrator runs the final compliance &
 * commercial gate — contract compliance, HSE & insurance, GL/cost-center &
 * delivery feasibility, approval hierarchy & sourcing rules — then issues a
 * compliant PO and routes the over-DOA sign-off. GearTech = OEM single-source.
 * ════════════════════════════════════════════════════════════════════════ */

const CC = "10052 · Pulping Maintenance";

const complianceTriggerPr = (
  <StructuredPrDoc
    pr={{
      number: "PR-48690",
      status: "Validated · ready for PO conversion",
      createdBy: "Sourcing & contract agent",
      createdOn: "2026-06-22 · 14:05",
      materialCode: "MRO-GEARBOX-REBUILD-KIT-OEM",
      description: "Pulping Drive Gearbox — Rebuild Kit — GearTech OEM",
      plant: "Pulping facility · Drive line",
      costCenter: CC,
      glAccount: "600450 · Repairs & Maintenance",
      item: [
        { label: "Item", value: "Gearbox rebuild kit · OEM" },
        { label: "Quantity", value: "1 EA" },
        { label: "UoM", value: "EA (kit)" },
        { label: "Scope", value: "Parts + on-site rebuild" },
        { label: "Delivery", value: "Before the planned outage" },
        { label: "Requisitioner", value: "Reliability engineer · Pulping" },
      ],
      assignment: [
        { label: "Material group", value: "MRO · Pumps & drives" },
        { label: "Suggested vendor", value: "GearTech (OEM · single-source)" },
      ],
      confidence: "Validated · ready for PO",
      prType: "NB · Standard requisition",
      requestor: "Reliability engineer · Pulping",
      purchOrg: "1000 · Northgate Procurement",
      purchGroup: "200 · MRO / Maintenance",
      valuation: [
        { label: "Unit price", value: "$42,000.00 / EA" },
        { label: "Total value", value: "$42,000.00" },
        { label: "Currency", value: "USD" },
      ],
      sourceOfSupply: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Outline agreement", value: "SA-MRO-09 · item 20" },
        { label: "Info record", value: "5300004290" },
      ],
      deliveryTerms: [
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Payment terms", value: "Net 60" },
        { label: "Deliv. date", value: "Before outage · 2026-08-03" },
      ],
    }}
  />
);

const complianceAgreement = (
  <OutlineAgreementDoc
    a={{
      number: "SA-MRO-09",
      status: "Active · expiring",
      createdOn: "2025-07-20 · valid to 2026-07-20",
      createdBy: "Category buyer",
      header: [
        { label: "Vendor", value: "GearTech (OEM)" },
        { label: "Vendor code", value: "0001000341" },
        { label: "Purch. org", value: "1000 · Northgate" },
        { label: "Valid from", value: "2025-07-21" },
        { label: "Valid to", value: "2026-07-20 · 28 days" },
        { label: "Target value", value: "$600,000" },
      ],
      items: [
        { item: "20", material: "MRO-GEARBOX-REBUILD-KIT-OEM", description: "Drive-gearbox rebuild kit", targetQty: "8 EA / yr", netPrice: "$42,000.00", per: "1 EA" },
      ],
      conditions: [
        { label: "Payment terms", value: "Net 60" },
        { label: "Incoterms", value: "FCA · GearTech works" },
        { label: "Renewal", value: "Flag · expires in 28 days" },
      ],
    }}
  />
);

const complianceContractDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48690-CC",
      status: "1 flag",
      docType: "Contract & commercial compliance",
      system: "Purchasing · contracts",
      createdBy: "Compliance & Contract",
      createdOn: "2026-06-22 · 14:10",
      sections: [
        {
          band: "Contract & commercial",
          rows: [
            { label: "Vendor approved", expected: "On approved-supplier list", found: "GearTech OEM · approved", ok: true },
            { label: "Price vs contract", expected: "Match agreement", found: "$42,000 · matches SA-MRO-09", ok: true },
            { label: "Payment terms", expected: "Net 30 / 60", found: "Net 60 · compliant", ok: true },
            { label: "Contract validity", expected: "Covers delivery date", found: "Expires in 28 days · before delivery", ok: false },
          ],
        },
      ],
      verdict: { ok: false, text: "On-contract and price-compliant, but SA-MRO-09 expires in 28 days — lock this PO under the current agreement now and flag the contract for renewal." },
    }}
  />
);

const complianceHseDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48690-HSE",
      status: "Cleared",
      docType: "HSE & insurance clearance",
      system: "EHS · contractor management",
      createdBy: "HSE & Insurance desk",
      createdOn: "2026-06-22 · 14:13",
      sections: [
        {
          band: "On-site work clearance",
          rows: [
            { label: "On-site work", expected: "HSE review if on-site", found: "Yes · rebuild on the drive line", ok: true },
            { label: "Contractor HSE clearance", expected: "Valid clearance", found: "GearTech · cleared to 2026-12", ok: true },
            { label: "Insurance certificate", expected: "≥ $5M general liability", found: "$5M GL · on file", ok: true },
            { label: "Method statement / RAMS", expected: "Approved for the task", found: "Approved · lockout-tagout", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "Contractor HSE clearance, $5M insurance and an approved method statement are on file — the on-site rebuild is cleared to proceed." },
    }}
  />
);

const complianceDeliveryDoc = (
  <ValidationDoc
    report={{
      number: "VAL-48690-DEL",
      status: "Feasible",
      docType: "GL / cost-center & delivery",
      system: "Controlling · planning",
      createdBy: "Cost & Delivery desk",
      createdOn: "2026-06-22 · 14:16",
      sections: [
        {
          band: "Account assignment",
          rows: [
            { label: "Cost center / GL", expected: "Correct plant / class", found: "10052 / 600450 · correct", ok: true },
            { label: "Budget availability", expected: "Within maintenance budget", found: "Available · committed", ok: true },
          ],
        },
        {
          band: "Delivery feasibility",
          rows: [
            { label: "Lead time", expected: "Before the outage", found: "4 weeks · clears the window", ok: true },
            { label: "Planned outage", expected: "Install window", found: "6 weeks out · feasible", ok: true },
          ],
        },
      ],
      verdict: { ok: true, text: "GL/cost-center correct and in budget; the 4-week lead clears the 6-week planned outage — delivery is feasible." },
    }}
  />
);

const complianceApprovalRouting = (
  <ApprovalRoutingDoc
    r={{
      number: "WF-48690-REL",
      status: "L2 required · needs you",
      createdOn: "2026-06-22 · 14:19",
      createdBy: "Approval & routing",
      summary: [
        { label: "Document", value: "PR-48690 → PO-77412" },
        { label: "Requestor", value: "Reliability eng · Pulping" },
        { label: "Category", value: "MRO · on-contract" },
        { label: "Amount", value: "$42,000.00" },
        { label: "Cost center / GL", value: "10052 / 600450" },
        { label: "Vendor", value: "GearTech · SA-MRO-09" },
      ],
      chain: [
        { level: "L1", approver: "Plant Maintenance Lead", role: "Maintenance", limit: "$10,000", status: "approved", when: "auto · on-contract, HSE cleared" },
        { level: "L2", approver: "Procurement Manager", role: "Procurement", limit: "$50,000", status: "pending", when: "$42K over the plant DOA" },
      ],
      validation: { ok: false, text: "$42,000 exceeds the plant-maintenance DOA ($10,000) — routes to the Procurement Manager (L2). Single-source OEM: competitive-bidding waiver on file." },
      action: "PR-48690 is over the plant DOA — route to the Procurement Manager for L2 sign-off before the PO releases.",
    }}
  />
);

const compliancePoFields = {
  header: [
    { label: "Vendor", value: "GearTech (OEM) · 0001000341" },
    { label: "Ship-to", value: "Pulping · Drive line dock" },
    { label: "Payment terms", value: "Net 60" },
    { label: "Incoterms", value: "FCA · GearTech works" },
    { label: "Currency", value: "USD" },
    { label: "Contract ref", value: "SA-MRO-09 · item 20" },
  ],
  items: [
    { item: "10", material: "MRO-GEARBOX-REBUILD-KIT-OEM", description: "Drive-gearbox rebuild kit", qty: "1 EA", netPrice: "$42,000.00", value: "$42,000.00", delivDate: "2026-08-03" },
  ],
  conditions: [
    { label: "Net value", value: "$42,000.00" },
    { label: "Freight", value: "$0 · FCA" },
    { label: "Tax", value: "Exempt · MRO" },
    { label: "Total value", value: "$42,000.00" },
  ],
};

const compliancePoDoc = (
  <PurchaseOrderDoc
    p={{
      number: "PO-77412",
      status: "Awaiting release",
      createdOn: "2026-06-22 · 14:21",
      createdBy: "Commercial Orchestrator",
      ...compliancePoFields,
      release: [
        { label: "L1 · Plant Maintenance", value: "Approved" },
        { label: "L2 · Procurement Manager", value: "Pending · $42K over DOA" },
      ],
    }}
  />
);

const compliancePoDocResolved = (
  <PurchaseOrderDoc
    p={{
      number: "PO-77412",
      status: "Released",
      createdOn: "2026-06-22 · 14:48",
      createdBy: "Commercial Orchestrator",
      ...compliancePoFields,
      release: [
        { label: "L1 · Plant Maintenance", value: "Approved" },
        { label: "L2 · Procurement Manager", value: "Approved · released to GearTech" },
      ],
    }}
  />
);

export const compliancePrSteps: RunStep[] = [
  step({
    id: "sourcing",
    agentName: "Compliance & Contract",
    n: 1,
    title: "Contract & commercial compliance",
    sub: "Validates the buy against the agreement",
    reasoning: [
      "Reading validated PR-48690 · ready for PO conversion",
      "Confirming GearTech is approved and on SA-MRO-09",
      "Price $42,000 matches the agreement · Net 60",
      "Checking contract validity — expires in 28 days",
      "Flagging the contract for renewal · lock the PO now",
    ],
    docLabel: "VAL-48690-CC · contract compliance",
    document: complianceContractDoc,
    sources: [
      { id: "cc-pr", label: "PR-48690", meta: "ready for PO conversion", kind: "sap", body: complianceTriggerPr },
      { id: "cc-agreement", label: "ME33K · SA-MRO-09", meta: "outline agreement · expiring", kind: "contract", body: complianceAgreement },
    ],
    recommendation:
      "On-contract and price-compliant. The only flag is that SA-MRO-09 expires in 28 days — I'd lock this PO under the current agreement now and raise a renewal for the contract.",
  }),
  step({
    id: "invoice",
    agentName: "HSE & Insurance desk",
    n: 2,
    title: "HSE & insurance clearance",
    sub: "Clears the on-site rebuild work",
    reasoning: [
      "Reading the contract-compliance handoff",
      "On-site rebuild on the drive line — HSE review required",
      "Contractor HSE clearance valid to 2026-12",
      "Insurance certificate — $5M general liability on file",
      "Method statement / RAMS approved · lockout-tagout",
    ],
    docLabel: "VAL-48690-HSE · HSE clearance",
    document: complianceHseDoc,
    sources: [
      { id: "cc-cc-handoff", label: "VAL-48690-CC", meta: "from Compliance & Contract", kind: "sap", handoff: true, body: complianceContractDoc },
    ],
    recommendation:
      "The rebuild is on-site, so it needs HSE clearance — and the contractor's clearance, $5M insurance and an approved method statement are all on file. Cleared to proceed.",
  }),
  step({
    id: "vendor",
    agentName: "Cost & Delivery desk",
    n: 3,
    title: "GL / cost-center & delivery",
    sub: "Confirms coding, budget and the outage window",
    reasoning: [
      "Confirming cost center 10052 / GL 600450",
      "Budget available and committed",
      "Lead time 4 weeks vs the planned outage in 6 weeks",
      "Delivery clears the install window",
    ],
    docLabel: "VAL-48690-DEL · GL & delivery",
    document: complianceDeliveryDoc,
    sources: [
      { id: "cc-hse-handoff", label: "VAL-48690-HSE", meta: "from HSE desk", kind: "sap", handoff: true, body: complianceHseDoc },
    ],
    recommendation:
      "Cost center and GL are correct and in budget, and the 4-week lead clears the 6-week planned outage — delivery is feasible.",
  }),
  step({
    id: "po",
    agentName: "Approval & routing",
    n: 4,
    title: "Approval hierarchy & sourcing rules",
    sub: "Routes the over-DOA sign-off",
    reasoning: [
      "Confirming approval hierarchy for $42,000",
      "L1 plant-maintenance approved · HSE cleared",
      "$42K exceeds the plant DOA ($10,000) — needs L2",
      "Single-source OEM · competitive-bidding waiver on file",
      "Routing to the Procurement Manager for L2 sign-off",
    ],
    docLabel: "WF-48690-REL · approval routing",
    document: complianceApprovalRouting,
    sources: [
      { id: "cc-del-handoff", label: "VAL-48690-DEL", meta: "from Cost & Delivery", kind: "sap", handoff: true, body: complianceDeliveryDoc },
    ],
    recommendation:
      "Everything is compliant; the one human decision is the L2 sign-off — $42K is over the plant DOA, so it routes to the Procurement Manager before the PO releases.",
  }),
  step({
    id: "orchestrator",
    agentName: "Commercial Orchestrator",
    n: 5,
    title: "Convert to a compliant PO",
    sub: "Issues PO-77412 and routes the release",
    reasoning: [
      "All compliance gates clear · contract, HSE, GL, delivery",
      "Converting PR-48690 to PO-77412 on SA-MRO-09",
      "Net 60 · $42,000 · FCA · GearTech OEM",
      "Holding for the Procurement Manager's L2 release",
    ],
    docLabel: "PO-77412 · purchase order",
    document: compliancePoDoc,
    sources: [
      { id: "cc-apr-handoff", label: "WF-48690-REL", meta: "from Approval & routing", kind: "sap", handoff: true, body: complianceApprovalRouting },
    ],
    email: {
      cta: "Send for L2 sign-off",
      to: "Procurement Manager",
      subject: "PO-77412 — $42,000 over plant DOA · approve to release",
      lines: [
        "PR-48690 (pulping drive-gearbox rebuild kit) has cleared every compliance gate — on-contract via GearTech on SA-MRO-09, HSE and insurance cleared for the on-site rebuild, GL/cost-center correct, and the 4-week lead clears the planned outage.",
        "I've converted it to PO-77412 ($42,000, Net 60). The only open item is the L2 sign-off: at $42K it's over the plant-maintenance DOA, and SA-MRO-09 expires in 28 days so I'd lock it now.",
        "Approve to release the PO to GearTech.",
      ],
      toastTitle: "PO released",
      toastBody: "The Procurement Manager approved the L2 sign-off — PO-77412 released to GearTech.",
      resolvedDocument: compliancePoDocResolved,
      reply: {
        from: "Procurement Manager",
        receivedMeta: "Outlook · 14:48",
        subject: "RE: PO-77412 — approve to release",
        lines: ["Approved — release PO-77412 to GearTech. Good call locking it before SA-MRO-09 expires; raise the renewal."],
        source: {
          id: "cc-po-ack",
          label: "Procurement Manager approval",
          meta: "Outlook · 14:48",
          kind: "email",
          body: (
            <EmailDoc
              from="Procurement Manager"
              fromAddr="procurement@northgatepaper.com"
              to="Commercial Orchestrator"
              sent="2026-06-22 · 14:48"
              subject="RE: PO-77412 — approve to release"
              tone="inbound"
              lines={["Approved — release PO-77412 to GearTech. Good call locking it before SA-MRO-09 expires; raise the renewal."]}
            />
          ),
        },
      },
    },
    recommendation:
      "Every compliance gate clears — I've converted PR-48690 to a compliant PO-77412 ($42,000 on SA-MRO-09). Send the L2 request; on the Procurement Manager's approval, the PO releases to GearTech.",
  }),
];
