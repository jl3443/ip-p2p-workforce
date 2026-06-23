import { BellRing } from "lucide-react";
import { TopRow } from "@/mro/components/blocks/TopRow";
import { HeroBanner } from "@/mro/components/blocks/HeroBanner";
import { KPIStrip } from "@/mro/components/blocks/KPIStrip";
import { PillButton } from "@/mro/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/mro/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/mro/components/blocks/PipelinePanel";
import { OverduePaymentsPanel } from "@/mro/components/blocks/OverduePaymentsPanel";
import { cockpitKpis, overduePayments, pendingDecisions } from "@/mro/data/cockpit";
import { useApp } from "@/mro/state";

/**
 * Top-right notification — the Master Data agent flags requisitions where the
 * network already has the part on order or in store. Deliberately just a small
 * bell with a live dot (no label): the detail lives in the tooltip and the
 * "Duplicate spend & interplant savings" panel, so the breadcrumb row stays
 * clean. Deep-links into the re-scoped idler-roller requisition.
 */
function SavingsAlert() {
  const { go } = useApp();
  const a = overduePayments.alert;
  return (
    <button
      type="button"
      onClick={() => go({ kind: "workspace", flow: "gearbox" })}
      title={`${a.count} requisitions can avoid spend · ${a.amount} caught — ${a.lead}`}
      aria-label={`${a.count} requisitions can avoid spend, ${a.amount} caught`}
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
          <TopRow breadcrumb={{ label: "MRO procurement", chip: "Orchestrator" }} />
        </div>
        <SavingsAlert />
      </div>

      <HeroBanner
        eyebrow="Autonomous MRO procurement"
        summary={`$312K off-contract spend avoided and $148K duplicate spend caught this quarter · 68% of requisitions released touchless · ${pendingDecisions.length} decisions need you today.`}
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
