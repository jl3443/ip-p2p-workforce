/**
 * ServiceNow-style procurement helpdesk ticket with an agent auto-resolution.
 *
 * Fields mirror a ServiceNow incident/case: number, caller, category, priority,
 * SLA, short description and the resolution with the cited knowledge article.
 * Reuses the shared SAP doc chrome so the helpdesk artifact reads as part of the
 * same family. The Helpdesk agent's output — a known query closed with policy.
 */

import { DocShell, DocTitleBand, SectionBand, Field } from "./../sap/parts";

export type HelpdeskCase = {
  number: string;
  status: string;
  createdOn: string;
  createdBy: string;
  caller: string;
  callerRole: string;
  channel: string;
  category: string;
  priority: string;
  sla: string;
  shortDescription: string;
  question: string;
  resolution: string;
  citedArticle: string;
  citedArticleTitle: string;
  linkedRecords: string[];
  confidence: string;
};

export const helpdeskBelt: HelpdeskCase = {
  number: "PRC-3322",
  status: "Resolved · auto-closed",
  createdOn: "2026-06-09 · 08:15",
  createdBy: "Procurement Helpdesk Agent",
  caller: "Dale Whitfield",
  callerRole: "Reliability Lead · Containerboard mill",
  channel: "Email → ServiceNow",
  category: "Order status · MRO",
  priority: "P3 · Normal",
  sla: "First response 4h · met in 2m",
  shortDescription: "When does the No.2 double-backer belt arrive?",
  question:
    "Following up on the belt I flagged for Corrugator No.2 — do we have a delivery date yet? I need it for the maintenance window.",
  resolution:
    "Order PO-77310 for the BeltPro 88-DBX belt is confirmed for delivery 2026-06-10, within the 5-day framework lead time and ahead of your maintenance window. Goods receipt will post to the Maintenance store (MNT1) on arrival. No action needed on your side — the Fulfillment agent is tracking it and will alert you if the date slips.",
  citedArticle: "KB-PROC-0148",
  citedArticleTitle: "Checking the status of an MRO purchase order",
  linkedRecords: ["PR-48201", "PO-77310", "Vendor 100482 · BeltPro Industrial"],
  confidence: "0.97",
};

export function HelpdeskTicket({ ticket = helpdeskBelt }: { ticket?: HelpdeskCase }) {
  return (
    <DocShell>
      <DocTitleBand
        number={ticket.number}
        status={ticket.status}
        docType="Procurement helpdesk case"
        system="ServiceNow · CSM"
        createdOn={ticket.createdOn}
        createdBy={ticket.createdBy}
      />

      {/* Case data */}
      <SectionBand>Case data</SectionBand>
      <div className="px-4 py-3 grid grid-cols-3 gap-x-4 gap-y-3">
        <Field label="Caller" value={ticket.caller} />
        <Field label="Role" value={ticket.callerRole} />
        <Field label="Channel" value={ticket.channel} />
        <Field label="Category" value={ticket.category} />
        <Field label="Priority" value={ticket.priority} mono />
        <Field label="SLA" value={ticket.sla} />
      </div>
      <div className="px-4 pb-3">
        <div className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium">Short description</div>
        <p className="text-[12.5px] text-ink leading-snug mt-1">{ticket.shortDescription}</p>
      </div>

      {/* Inbound */}
      <SectionBand>Inbound query</SectionBand>
      <div className="px-4 py-3">
        <p className="text-[12.5px] text-ink leading-relaxed italic">“{ticket.question}”</p>
      </div>

      {/* Resolution */}
      <SectionBand>Auto-resolution</SectionBand>
      <div className="px-4 py-3 space-y-3">
        <p className="text-[12.5px] text-ink leading-relaxed">{ticket.resolution}</p>
        <div className="flex items-start gap-3 rounded-md bg-[#eaf2fb] border border-[#cfe0f5] px-3 py-2.5">
          <span className="text-[11px] tracking-[0.06em] uppercase text-[#0a6ed1] font-bold shrink-0 mt-0.5">
            Cited KB
          </span>
          <p className="text-[12.5px] text-ink leading-snug">
            <span className="font-bold tabular-nums">{ticket.citedArticle}</span> — {ticket.citedArticleTitle}
            <span className="text-mute"> · resolution confidence {ticket.confidence}</span>
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] tracking-[0.05em] uppercase text-mute font-medium">Linked records</span>
          {ticket.linkedRecords.map((r) => (
            <span
              key={r}
              className="text-[11px] tabular-nums text-surface-deep bg-surface-fog border border-divider px-2 py-0.5 rounded"
            >
              {r}
            </span>
          ))}
        </div>
      </div>
    </DocShell>
  );
}
