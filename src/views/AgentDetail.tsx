import { Inbox } from "lucide-react";
import { useApp } from "@/state";
import { AUTONOMY_LABEL, agentsById, type AgentId, type AgentSpec } from "@/data/agents";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { SpringIn } from "@/components/ai/SpringIn";
import { StatusPill } from "@/components/blocks/StatusPill";
import { PillButton } from "@/components/blocks/PillButton";
import { TopRow } from "@/components/blocks/TopRow";
import { AutonomyControl } from "@/components/agents/AutonomyControl";
import { AgentFlowDiagram } from "@/components/agents/AgentFlowDiagram";

const statusMeta: Record<AgentSpec["status"], { label: string; kind: "active" | "critical" | "neutral" }> = {
  running: { label: "Running", kind: "active" },
  review: { label: "Needs a look", kind: "critical" },
  idle: { label: "Idle", kind: "neutral" },
};

/* Where each agent shows up in the live belt run, so the page links there. */
const runRole: Record<AgentId, string> = {
  intake: "Structures the mill's maintenance note into requisition PR-48201.",
  sourcing: "Runs the three-bid spot tender and recommends the on-contract supplier.",
  po: "Drafts purchase order PO-77310, bound to the framework contract.",
  fulfillment: "Issues the order, confirms the supplier and books goods receipt GR-77310.",
  invoice: "Three-way matches invoice INV-BPI-5567 — variance $0.",
  vendor: "Merges a duplicate supplier before the tender opens.",
  helpdesk: "Answers buyer and supplier questions alongside the run.",
  orchestrator: "Sequences all seven agents and routes the one decision to you.",
};

/* Each agent's upstream neighbour and the artifact that hands off to it. When
 * the predecessor's output is approved, an inbound card appears here. */
const HANDOFF: Partial<Record<AgentId, { from: AgentId; fromLabel: string; artifact: string }>> = {
  sourcing: { from: "intake", fromLabel: "Intake agent", artifact: "Purchase requisition · PR-48201" },
  po: { from: "sourcing", fromLabel: "Sourcing agent", artifact: "Supplier recommendation · BeltPro Industrial" },
  fulfillment: { from: "po", fromLabel: "PO agent", artifact: "Purchase order · PO-77310" },
  invoice: { from: "fulfillment", fromLabel: "Fulfillment agent", artifact: "Goods receipt · GR-77310" },
};

function InboundHandoff({ id }: { id: AgentId }) {
  const { agentOutputs, go } = useApp();
  const h = HANDOFF[id];
  if (!h || agentOutputs[h.from] !== "approved") return null;
  return (
    <SpringIn>
      <div className="flex items-center gap-3 rounded-md bg-surface-mint border border-surface-deep/25 px-4 py-3">
        <span className="w-9 h-9 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
          <Inbox size={17} strokeWidth={1.9} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="text-[11px] tracking-[0.06em] uppercase text-surface-deep font-bold">
            Inbound from {h.fromLabel}
          </div>
          <div className="text-[13px] font-bold text-ink mt-0.5">{h.artifact}</div>
          <div className="text-[12px] text-mute leading-snug">Approved upstream · waiting in this agent's queue.</div>
        </div>
        <PillButton variant="deep" size="sm" arrow onClick={() => go({ kind: "workspace", flow: "belt" })}>
          Open in the run
        </PillButton>
      </div>
    </SpringIn>
  );
}

function CardHeader({ label }: { label: string }) {
  return (
    <header className="flex items-center gap-2">
      <AIDot size={6} tone="deep" pulse />
      <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-medium">
        {label}
      </span>
    </header>
  );
}

function MarkerRow({ kind, text }: { kind: "in" | "out" | "esc"; text: string }) {
  const glyph = kind === "out" ? "✓" : "→";
  const box =
    kind === "out"
      ? "bg-surface-deep text-ink-inverse"
      : kind === "esc"
        ? "bg-surface-rose text-mark-red"
        : "bg-surface-fog text-surface-deep border border-divider";
  return (
    <div className="flex items-start gap-2.5">
      <span
        className={cn(
          "w-4.5 h-4.5 rounded flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5",
          box,
        )}
        style={{ width: 18, height: 18 }}
      >
        {glyph}
      </span>
      <span className="text-[12.5px] text-ink leading-snug">{text}</span>
    </div>
  );
}

/* The orchestrator coordinates rather than executes — no autonomy dial. */
function CoordinatorCard({ agent }: { agent: AgentSpec }) {
  return (
    <article className="bg-white border border-divider rounded-md p-6 space-y-4">
      <CardHeader label="How it coordinates" />
      <p className="text-[13px] text-ink leading-relaxed">{agent.autonomyRule}</p>
      <div className="rounded-md bg-surface-mint/40 border border-surface-deep/15 p-4">
        <div className="text-[13px] font-bold text-ink">One unified escalation interface</div>
        <p className="text-[12px] text-ink leading-snug mt-1">
          The orchestrator never buys on its own. It keeps shared context across the seven agents,
          sequences the handoffs, and surfaces the few exceptions that genuinely need a person.
        </p>
      </div>
    </article>
  );
}

export function AgentDetail({ id }: { id: AgentId }) {
  const { go } = useApp();
  const agent = agentsById[id];
  const Icon = agent.icon;
  const status = statusMeta[agent.status];

  return (
    <div className="pl-5 pr-6 pt-4 pb-10 space-y-3 min-h-screen bg-[color-mix(in_srgb,var(--surface-mint)_18%,var(--surface-fog))]">
      <TopRow breadcrumb={{ label: "Agent workforce", chip: agent.menuLabel }} />

      {/* Hero */}
      <SpringIn>
        <section className="bg-white border border-divider rounded-md p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-surface-deep flex items-center justify-center shrink-0">
              <Icon size={22} strokeWidth={1.9} color="var(--ink-inverse)" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-[22px] font-bold text-ink leading-tight">{agent.name}</h1>
                <StatusPill label={status.label} kind={status.kind} pulse={agent.status !== "idle"} />
              </div>
              <p className="text-[14px] text-mute leading-relaxed mt-1.5 max-w-3xl">{agent.purpose}</p>
            </div>
            <div className="text-right shrink-0 pl-4">
              <div className="text-[20px] font-bold text-surface-deep leading-none">{agent.stat}</div>
              <div className="text-[11px] tracking-[0.06em] uppercase text-mute mt-1">
                {agent.coordinator
                  ? "Touchless"
                  : `Ships at L${agent.autonomy} · ${AUTONOMY_LABEL[agent.autonomy]}`}
              </div>
            </div>
          </div>
        </section>
      </SpringIn>

      {/* Inbound artifact handed off from the upstream agent (when approved) */}
      <InboundHandoff id={id} />

      {/* The orchestrator gets the live agent-flow map; specialists get the dial */}
      {agent.coordinator && <AgentFlowDiagram />}

      {/* Autonomy guardrail — the interactive control */}
      {agent.coordinator ? <CoordinatorCard agent={agent} /> : <AutonomyControl agent={agent} />}

      {/* Inputs / Outputs + Tech / Escalation */}
      <div className="grid grid-cols-2 gap-3 items-stretch">
        <article className="bg-white border border-divider rounded-md p-6 flex flex-col gap-4">
          <div className="space-y-3">
            <CardHeader label="What it reads" />
            <div className="space-y-2">
              {agent.inputs.map((t) => (
                <MarkerRow key={t} kind="in" text={t} />
              ))}
            </div>
          </div>
          <div className="h-px bg-divider" />
          <div className="space-y-3 flex-1">
            <CardHeader label="What it produces" />
            <div className="space-y-2">
              {agent.outputs.map((t) => (
                <MarkerRow key={t} kind="out" text={t} />
              ))}
            </div>
          </div>
        </article>

        <article className="bg-white border border-divider rounded-md p-6 flex flex-col gap-4">
          <div className="space-y-3">
            <CardHeader label="Underlying technology" />
            <div className="flex flex-wrap gap-2">
              {agent.tech.map((t) => (
                <span
                  key={t}
                  className="inline-flex items-center rounded-md bg-surface-fog border border-divider px-2.5 py-1 text-[12px] font-medium text-surface-deep"
                >
                  {t}
                </span>
              ))}
            </div>
          </div>
          <div className="h-px bg-divider" />
          <div className="space-y-3 flex-1">
            <CardHeader label="Escalates to a person when" />
            <div className="space-y-2">
              {agent.escalation.map((t) => (
                <MarkerRow key={t} kind="esc" text={t} />
              ))}
            </div>
          </div>
        </article>
      </div>

      {/* IP-specific context */}
      {agent.note && (
        <div className="flex items-start gap-3 rounded-md bg-surface-mint border border-surface-deep/20 px-4 py-3">
          <span className="text-[11px] tracking-[0.08em] uppercase text-surface-deep font-bold shrink-0 mt-0.5">
            For IP
          </span>
          <p className="text-[13px] text-ink leading-snug">{agent.note}</p>
        </div>
      )}

      {/* Cross-link into the live run */}
      <div className="flex items-center justify-between gap-4 rounded-md bg-white border border-divider px-5 py-4">
        <div className="min-w-0">
          <div className="text-[13px] font-bold text-ink">See this agent in the live run</div>
          <p className="text-[12px] text-mute leading-snug mt-0.5">{runRole[id]}</p>
        </div>
        <PillButton
          variant="deep"
          size="sm"
          arrow
          onClick={() => go({ kind: "workspace", flow: "belt" })}
        >
          Open the belt run
        </PillButton>
      </div>
    </div>
  );
}
