import { SpringIn } from "@/components/ai/SpringIn";
import { AIDot } from "@/components/ai/AIDot";
import { agentsById, type AgentId } from "@/data/agents";

/**
 * The visible baton-pass. When a step is approved, this overlays the workspace
 * for a beat: the finishing agent (left, done) hands its output along an animated
 * conveyor to the next agent (right, waking up), then the run advances. Turns a
 * silent state bump into the "the agent just triggered the next agent" moment.
 */
export function HandoffOverlay({ from, to }: { from: AgentId; to: AgentId }) {
  const A = agentsById[from];
  const B = agentsById[to];
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/75 backdrop-blur-[2px] rounded-md">
      <SpringIn>
        <div className="bg-white border border-divider rounded-xl shadow-xl px-7 py-6 flex flex-col items-center gap-3 min-w-[340px]">
          <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
            Handing off
          </div>
          <div className="flex items-center gap-3">
            {/* finishing agent — done */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="w-12 h-12 rounded-xl bg-surface-deep text-ink-inverse flex items-center justify-center">
                <A.icon size={22} />
              </span>
              <span className="text-[11px] text-mute max-w-[92px] text-center leading-tight">
                {A.menuLabel}
              </span>
            </div>

            {/* animated conveyor */}
            <svg width="96" height="24" viewBox="0 0 96 24" className="shrink-0 text-surface-deep">
              <line x1="2" y1="12" x2="82" y2="12" stroke="#d6ded6" strokeWidth="2" />
              <line
                x1="2"
                y1="12"
                x2="82"
                y2="12"
                stroke="currentColor"
                strokeWidth="2"
                className="hr-flow"
              />
              <path d="M82 6 L94 12 L82 18 Z" fill="currentColor" />
            </svg>

            {/* receiving agent — waking up */}
            <div className="flex flex-col items-center gap-1.5">
              <span className="relative w-12 h-12 rounded-xl bg-surface-mint text-surface-deep border-2 border-surface-deep flex items-center justify-center">
                <B.icon size={22} />
                <span className="absolute -top-1 -right-1">
                  <AIDot size={8} tone="deep" pulse />
                </span>
              </span>
              <span className="text-[11px] text-surface-deep font-medium max-w-[92px] text-center leading-tight">
                {B.menuLabel}
              </span>
            </div>
          </div>
          <div className="text-[12.5px] text-ink text-center">
            Output handed off · <span className="font-bold">{B.name}</span> is taking over
          </div>
        </div>
      </SpringIn>
    </div>
  );
}
