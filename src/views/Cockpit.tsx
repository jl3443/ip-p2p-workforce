import { TopRow } from "@/components/blocks/TopRow";
import { HeroBanner } from "@/components/blocks/HeroBanner";
import { KPIStrip } from "@/components/blocks/KPIStrip";
import { PillButton } from "@/components/blocks/PillButton";
import { PendingDecisionsPanel } from "@/components/blocks/PendingDecisionsPanel";
import { PipelinePanel } from "@/components/blocks/PipelinePanel";
import { ExpeditingPanel } from "@/components/blocks/ExpeditingPanel";
import { cockpitKpis } from "@/data/cockpit";

export function Cockpit() {
  return (
    <div className="pl-5 pr-6 pt-4 pb-8 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Procure-to-pay", chip: "Orchestrator" }} />

      <HeroBanner
        eyebrow="Autonomous procure-to-pay"
        summary="This quarter the workforce kept $1.24M of maverick spend on-contract and blocked a $72,000 payment-redirection fraud this week — while running 82% of orders touchless and cutting requisition-to-order from 11 days to 4.2 hours. 3 decisions need you today."
        cta={<PillButton variant="deep" size="sm">+ New request</PillButton>}
        meta="Updated 1 min ago"
      />

      <KPIStrip items={cockpitKpis} />

      <PendingDecisionsPanel />

      <div className="grid grid-cols-2 gap-3 items-stretch">
        <PipelinePanel />
        <ExpeditingPanel />
      </div>
    </div>
  );
}
