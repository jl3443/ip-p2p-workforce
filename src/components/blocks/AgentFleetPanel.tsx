import { cn } from "@/lib/utils";
import { useApp } from "@/state";
import { fleetAgents, orchestrator, type FleetAgent } from "@/data/cockpit";
import { agentsById } from "@/data/agents";
import { AIDot } from "@/components/ai/AIDot";
import { AutonomyChip } from "@/components/agents/AutonomyChip";

const statusLabel: Record<FleetAgent["status"], string> = {
  running: "Running",
  review: "Needs a look",
  idle: "Idle",
};

const statusTone: Record<FleetAgent["status"], "green" | "red" | "mute"> = {
  running: "green",
  review: "red",
  idle: "mute",
};

function AgentRow({ agent }: { agent: FleetAgent }) {
  const { go } = useApp();
  const spec = agentsById[agent.id];
  const Icon = spec.icon;
  return (
    <button
      type="button"
      onClick={() => go({ kind: "agent", id: agent.id })}
      className={cn(
        "ui-pill w-full text-left flex items-center gap-4 px-4 py-3",
        agent.lead ? "bg-surface-mint hover:bg-surface-mint/80" : "bg-white hover:bg-surface-mint/35",
      )}
    >
      <div
        className={cn(
          "w-9 h-9 rounded-lg flex items-center justify-center shrink-0",
          agent.lead ? "bg-surface-deep" : "bg-surface-fog",
        )}
      >
        <Icon
          size={17}
          strokeWidth={1.9}
          color={agent.lead ? "var(--ink-inverse)" : "var(--accent-green-deep)"}
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-bold text-ink leading-tight">{agent.name}</span>
          <AutonomyChip agent={spec} />
        </div>
        <div className="text-[12px] text-mute leading-snug">{agent.role}</div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-[13px] font-medium text-ink">{agent.stat}</div>
        <div className="flex items-center justify-end gap-1.5 mt-0.5">
          <AIDot size={6} tone={statusTone[agent.status]} pulse={agent.status === "running"} />
          <span className="text-[11px] text-mute">{statusLabel[agent.status]}</span>
        </div>
      </div>
      <span aria-hidden className="text-mute text-[13px] shrink-0">
        ↗
      </span>
    </button>
  );
}

export function AgentFleetPanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "bg-white border border-divider rounded-md overflow-hidden flex flex-col",
        className,
      )}
    >
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-3">
          <AIDot size={6} tone="deep" pulse />
          <span className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Agent workforce
          </span>
        </div>
        <span className="text-[11px] text-mute">7 specialists + 1 orchestrator</span>
      </header>
      <div className="divide-y divide-divider flex-1">
        <AgentRow agent={orchestrator} />
        {fleetAgents.map((a) => (
          <AgentRow key={a.name} agent={a} />
        ))}
      </div>
    </section>
  );
}
