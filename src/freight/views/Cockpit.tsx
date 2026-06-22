import { BellRing } from "lucide-react";
import { TopRow } from "@/freight/components/blocks/TopRow";
import { HeroBanner } from "@/freight/components/blocks/HeroBanner";
import { KPIStrip } from "@/freight/components/blocks/KPIStrip";
import { PillButton } from "@/freight/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/freight/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/freight/components/blocks/PipelinePanel";
import { OverduePaymentsPanel } from "@/freight/components/blocks/OverduePaymentsPanel";
import { cockpitKpis, overduePayments } from "@/freight/data/cockpit";
import { useApp } from "@/freight/state";

/**
 * Top-right notification — the Payment & Collections agent flags overdue
 * receivables. Deliberately just a small bell with a live red dot (no label):
 * the detail lives in the tooltip and the Overdue payments panel, so the
 * breadcrumb row stays clean. Deep-links into the collections run.
 */
function PaymentAlert() {
  const { go } = useApp();
  const a = overduePayments.alert;
  return (
    <button
      type="button"
      onClick={() => go({ kind: "workspace", flow: "collect" })}
      title={`${a.count} payments overdue · ${a.amount} — ${a.lead}`}
      aria-label={`${a.count} payments overdue, ${a.amount}`}
      className="ui-pill relative shrink-0 inline-flex items-center justify-center w-9 h-9 rounded-full border border-divider bg-white hover:bg-surface-rose/40"
    >
      <BellRing size={16} className="text-mark-red" strokeWidth={2} />
      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-mark-red animate-ping" />
      <span className="absolute top-1.5 right-2 w-2 h-2 rounded-full bg-mark-red ring-2 ring-white" />
    </button>
  );
}

export function Cockpit() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <TopRow breadcrumb={{ label: "Freight settlement", chip: "Router" }} />
        </div>
        <PaymentAlert />
      </div>

      <HeroBanner
        eyebrow="Autonomous freight settlement"
        summary="$1.18M overcharge recovered and $214K demurrage avoided this quarter · 71% of shipments settled touchless · 3 decisions need you today."
        cta={<PillButton variant="deep" size="sm">+ New lane</PillButton>}
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
