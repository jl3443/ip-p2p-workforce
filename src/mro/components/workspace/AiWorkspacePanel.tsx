import * as React from "react";
import { Check, ThumbsUp, PauseCircle, ArrowUpRight, X, Sparkles } from "lucide-react";
import { cn } from "@/mro/lib/utils";
import { AIDot } from "@/mro/components/ai/AIDot";
import { Spinner } from "@/mro/components/ai/Spinner";
import { SpringIn } from "@/mro/components/ai/SpringIn";
import { StreamingText } from "@/mro/components/ai/StreamingText";
import { EmailReplyModal } from "@/mro/components/workspace/EmailReplyModal";
import { AiDraftEmailCard } from "@/mro/components/workspace/AiDraftEmailCard";
import { ExceptionResolutionCard } from "@/mro/components/workspace/ExceptionResolutionCard";
import { ExtractionWizard } from "@/mro/components/workspace/ExtractionWizard";
import { StepProgress } from "@/mro/components/ai/StepProgress";
import { agentsById } from "@/mro/data/agents";
import type { AgentOutputStatus } from "@/mro/state";
import type { RunStep } from "@/mro/data/runSteps";

// The "AI is working" loaders run for a beat before any content lands.
const SPIN_MS = 2400; // spinner before the wizard / working content
const REVEAL_MS = 3000; // the ~3-second loader before the result reveal

/** A step plays as a gated sequence; the panel is keyed by step in the parent
 *  so this resets every time a step opens:
 *   loading    — the AI spinner runs (rail hidden for staged, so it sits on the
 *                working screen, then swaps to the wizard in place)
 *   working    — (staged only) the extraction wizard; user validates each stage
 *   finalizing — the loader runs again before the result lands
 *   revealed   — reasoning checks, then the produced output + typed recommendation */
type Phase = "loading" | "working" | "finalizing" | "revealed";

type Decision = Exclude<AgentOutputStatus, "none">;

const noteFor: Record<Decision, { label: string; cls: string }> = {
  approved: { label: "Approved · output handed to the next agent", cls: "text-surface-deep" },
  pending: { label: "On hold · parked for review, run can still continue", cls: "text-mute" },
  escalated: { label: "Escalated · routed to a human reviewer · run halted", cls: "text-mark-red" },
  rejected: { label: "Rejected · sent back with a flag · run halted", cls: "text-mark-red" },
};

export function AiWorkspacePanel({
  step,
  status,
  replied,
  isLast,
  completeNote = "Run complete · invoice released to AP, audit envelope closed",
  onReplyReceived,
  onDecision,
  onWizardActive,
  staged = false,
}: {
  step: RunStep;
  status: AgentOutputStatus;
  replied: boolean;
  isLast: boolean;
  /** Note shown when the final step is approved (happy-path close). */
  completeNote?: string;
  onReplyReceived: () => void;
  onDecision: (status: Decision) => void;
  /** Tells the workspace whether the staged wizard is running (to hide the rail). */
  onWizardActive?: (active: boolean) => void;
  /** True when this step plays the staged wizard (L2/L3); false reveals directly (L4). */
  staged?: boolean;
}) {
  const agent = agentsById[step.id];
  const hasWizard = staged && Boolean(step.stages);

  const [phase, setPhase] = React.useState<Phase>("loading");
  const [emailOpen, setEmailOpen] = React.useState(false);

  const revealed = phase === "revealed";
  const decided = status !== "none";

  // Run a loader for `ms`, then move to `next`. Hidden tabs freeze timers, so
  // when the tab isn't visible jump straight to `next` rather than hang.
  const advanceAfter = React.useCallback((ms: number, next: Phase) => {
    if (typeof document !== "undefined" && document.visibilityState === "hidden") {
      setPhase(next);
      return undefined;
    }
    const t = window.setTimeout(() => setPhase(next), ms);
    return () => window.clearTimeout(t);
  }, []);

  // loading spinner → wizard (staged) or straight to the reveal loader (L4)
  React.useEffect(() => {
    if (phase !== "loading") return;
    return hasWizard ? advanceAfter(SPIN_MS, "working") : advanceAfter(REVEAL_MS, "revealed");
  }, [phase, hasWizard, advanceAfter]);

  // finalizing loader → reveal
  React.useEffect(() => {
    if (phase !== "finalizing") return;
    return advanceAfter(REVEAL_MS, "revealed");
  }, [phase, advanceAfter]);

  // Keep the rail hidden for the whole staged sequence — the lead-in spinner and
  // the wizard share one wide layout, so the spinner reads as part of the
  // working screen rather than a separate page that then swaps in content.
  React.useEffect(() => {
    onWizardActive?.(hasWizard && (phase === "loading" || phase === "working"));
    return () => onWizardActive?.(false);
  }, [phase, hasWizard, onWizardActive]);

  // Reasoning checklist — for wizard steps it mirrors the stages; otherwise the
  // step's own reasoning. Shown as completed once we reach the reveal.
  const reasoningLines = hasWizard ? step.stages!.map((s) => s.reasoning) : step.reasoning;

  const sendEmail = () => {
    if (!replied) onReplyReceived();
  };
  const viewThread = () => setEmailOpen(true);

  return (
    <section className="bg-white border border-divider rounded-md overflow-hidden flex flex-col">
      <header className="px-5 pt-4 pb-3 border-b border-divider">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
            <agent.icon size={15} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium leading-none">
              Step {step.n} · Process run
            </div>
            <div className="text-[15px] font-bold text-ink leading-tight mt-0.5 truncate">
              {step.agentName ?? agent.name}
            </div>
          </div>
          <span className="ml-auto flex items-center gap-1.5 text-[12px] text-mute shrink-0">
            {revealed ? (
              <>
                <AIDot size={7} tone="green" /> Ready
              </>
            ) : (
              <>
                <Spinner size={13} /> Working
              </>
            )}
          </span>
        </div>
      </header>

      <div className="p-5 space-y-4">
        {phase === "loading" || phase === "finalizing" ? (
          /* The AI works for a beat before anything for this step appears. */
          <StepProgress agentName={step.agentName ?? agent.name} docLabel={step.docLabel} />
        ) : phase === "working" && step.stages ? (
          /* The extraction wizard appears only after the spinner has finished. */
          <ExtractionWizard
            stages={step.stages}
            sources={step.sources}
            onComplete={() => setPhase("finalizing")}
          />
        ) : (
          /* The reveal — reasoning checks, then the produced output + recommendation. */
          <div className="space-y-4">
            {/* Reasoning checklist — the thinking that ran during the loader */}
            <div className="space-y-1.5">
              {reasoningLines.map((line, i) => (
                <div key={i} className="flex items-start gap-2 text-[12.5px] text-ink leading-snug">
                  <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
                  <span>{line}</span>
                </div>
              ))}
            </div>

            <SpringIn className="space-y-4">
              {/* Produced document */}
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles size={13} className="text-surface-deep" />
                  <span className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                    Produced · {step.docLabel}
                  </span>
                </div>
                {step.document}
              </div>

              {/* Email round-trip — the agent drafts it, the buyer reviews and sends */}
              {step.email && (
                <AiDraftEmailCard
                  email={step.email}
                  sent={replied}
                  onSend={sendEmail}
                  onViewThread={viewThread}
                  sendLabel={step.email.cta}
                />
              )}

              {/* Recommendation — typed out character by character (no card pop) */}
              <div className="rounded-md bg-surface-mint/40 border border-surface-mint px-4 py-3">
                <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                  AI recommendation
                </div>
                <p className="text-[13px] text-ink leading-snug mt-1">
                  <StreamingText text={step.recommendation} cps={48} />
                </p>
              </div>

              {decided && (
                <div className={cn("flex items-center gap-2 text-[12.5px] font-medium", noteFor[status as Decision].cls)}>
                  <AIDot size={7} tone={status === "approved" ? "green" : status === "pending" ? "mute" : "red"} />
                  {isLast && status === "approved"
                    ? completeNote
                    : noteFor[status as Decision].label}
                </div>
              )}

              {/* Exception payoff — the halt resolves into an audit-grade envelope */}
              {decided && (status === "escalated" || status === "rejected") && step.exception && (
                <ExceptionResolutionCard ex={step.exception} />
              )}

              {!(decided && status === "approved") && (
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => onDecision("approved")}
                    className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green"
                  >
                    <ThumbsUp size={14} /> {decided ? "Approve anyway" : "Approve & hand off"}
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision("pending")}
                    className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                  >
                    <PauseCircle size={14} /> Pending
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision("escalated")}
                    className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                  >
                    <ArrowUpRight size={14} /> Escalate
                  </button>
                  <button
                    type="button"
                    onClick={() => onDecision("rejected")}
                    className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-mark-red border border-mark-red/40 hover:bg-surface-rose"
                  >
                    <X size={14} /> Reject
                  </button>
                </div>
              )}
            </SpringIn>
          </div>
        )}
      </div>

      {emailOpen && step.email && (
        <EmailReplyModal email={step.email} onClose={() => setEmailOpen(false)} />
      )}
    </section>
  );
}
