import { BellRing } from "lucide-react";
import { TopRow } from "@/mro/components/blocks/TopRow";
import { HeroBanner } from "@/mro/components/blocks/HeroBanner";
import { KPIStrip } from "@/mro/components/blocks/KPIStrip";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/mro/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/mro/components/blocks/PipelinePanel";
import { OverduePaymentsPanel } from "@/mro/components/blocks/OverduePaymentsPanel";
import { cockpitKpis, pendingDecisions } from "@/mro/data/cockpit";
import { useApp } from "@/mro/state";

/**
 * Top-right notification bell — the orchestrator's open findings across the four
 * worked flows (rebalancing, predictive risk, compliance, intake). Each row is a
 * one-line agent finding that deep-links straight into its workspace. Hover to
 * open; the badge shows how many findings need a person.
 */
type AlertNote = {
  flow: "gearbox" | "risk" | "compliance" | "pump";
  tone: "critical" | "high";
  lead: string;
  finding: string;
  meta: string;
};

const alertNotes: AlertNote[] = [
  { flow: "pump", tone: "critical", lead: "Conveyor-belt request", finding: "line down — spec needs confirmation", meta: "PR-48630 · Sorting Line 2" },
  { flow: "risk", tone: "high", lead: "Drive-gearbox seal kit", finding: "stock-out predicted in 9 days", meta: "RISK-49001 · pre-empt" },
  { flow: "compliance", tone: "high", lead: "Gearbox rebuild kit", finding: "off-contract — PR→PO gate", meta: "PR-48690 · $42,000" },
  { flow: "gearbox", tone: "high", lead: "MRO-CONV-ROLLER-IDLER-STD", finding: "rebalancing need found", meta: "PR-48655 · 6 EA surplus at Eastbrook" },
];

const toneDot: Record<AlertNote["tone"], string> = {
  critical: "bg-mark-red",
  high: "bg-[#b45309]",
};

function SavingsAlert() {
  const { go } = useApp();
  return (
    <div className="group relative shrink-0">
      <button
        type="button"
        aria-label={`Agent notifications — ${alertNotes.length} findings need you`}
        className="ui-pill relative inline-flex items-center justify-center w-9 h-9 rounded-full border border-divider bg-white hover:bg-surface-rose/40"
      >
        <BellRing size={16} className="text-mark-red" strokeWidth={2} />
        <span className="absolute -top-1 -right-1 grid h-[15px] min-w-[15px] place-items-center rounded-full bg-mark-red px-1 text-[9px] font-bold text-ink-inverse ring-2 ring-white">
          {alertNotes.length}
        </span>
      </button>

      {/* Hover panel — the four worked flows as one-line agent findings; each opens its workspace */}
      <div className="absolute right-0 top-full z-50 w-[330px] pt-2 opacity-0 invisible translate-y-1 transition-all duration-150 group-hover:opacity-100 group-hover:visible group-hover:translate-y-0">
        <div className="overflow-hidden rounded-lg border border-divider bg-white shadow-xl">
          <div className="flex items-center justify-between border-b border-divider bg-surface-fog/60 px-3.5 py-2.5">
            <span className="text-[10.5px] uppercase tracking-[0.07em] font-bold text-ink">Agent notifications</span>
            <span className="text-[10.5px] text-mute">{alertNotes.length} need you</span>
          </div>
          <div className="divide-y divide-divider">
            {alertNotes.map((n) => (
              <button
                key={n.flow}
                type="button"
                onClick={() => go({ kind: "workspace", flow: n.flow })}
                className="ui-pill flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors hover:bg-surface-mint/30"
              >
                <span className={`mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full ${toneDot[n.tone]}`} />
                <span className="min-w-0 flex-1">
                  <span className="block text-[12px] leading-snug text-ink">
                    <strong className="font-bold">{n.lead}</strong> — {n.finding}
                  </span>
                  <span className="mt-0.5 block text-[10.5px] text-mute">{n.meta}</span>
                </span>
                <span className="mt-[1px] shrink-0 whitespace-nowrap text-[10.5px] font-bold text-surface-deep">Open ↗</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Cockpit() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <TopRow breadcrumb={{ label: "MRO procurement", chip: "Orchestrator" }} />
        </div>
        <SavingsAlert />
      </div>

      <HeroBanner
        eyebrow="Autonomous MRO procurement"
        summary={`$312K off-contract and $148K duplicate spend caught, $2.8M of downtime risk pre-empted this quarter · 68% of requisitions released touchless · ${pendingDecisions.length} decisions need you today.`}
        cta={<PillButton variant="deep" size="sm">+ New requisition</PillButton>}
        meta="Updated 1 min ago"
      />

      <KPIStrip items={cockpitKpis} />

      <PendingDecisionsPanel />

      <div className="grid grid-cols-2 gap-3 items-stretch">
        <OverduePaymentsPanel />
        <PipelinePanel />
      </div>
    </div>
  );
}
