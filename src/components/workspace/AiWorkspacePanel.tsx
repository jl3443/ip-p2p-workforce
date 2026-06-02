import * as React from "react";
import { Check, ThumbsUp, PauseCircle, ArrowUpRight, X, Sparkles, Mail } from "lucide-react";
import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";
import { Spinner } from "@/components/ai/Spinner";
import { SpringIn } from "@/components/ai/SpringIn";
import { StreamingText } from "@/components/ai/StreamingText";
import { EmailReplyModal } from "@/components/workspace/EmailReplyModal";
import { agentsById } from "@/data/agents";
import type { AgentOutputStatus } from "@/state";
import type { RunStep } from "@/data/runSteps";

const LINE_MS = 260;

type Decision = Exclude<AgentOutputStatus, "none">;

const noteFor: Record<Decision, { label: string; cls: string }> = {
  approved: { label: "Approved · output handed to the next agent", cls: "text-surface-deep" },
  pending: { label: "On hold · parked for review, run can still continue", cls: "text-mute" },
  escalated: { label: "Escalated · routed to a sourcing manager", cls: "text-mark-red" },
  rejected: { label: "Rejected · output returned to the agent", cls: "text-mark-red" },
};

export function AiWorkspacePanel({
  step,
  status,
  replied,
  isLast,
  onReplyReceived,
  onDecision,
}: {
  step: RunStep;
  status: AgentOutputStatus;
  replied: boolean;
  isLast: boolean;
  onReplyReceived: () => void;
  onDecision: (status: Decision) => void;
}) {
  const agent = agentsById[step.id];
  // Always replay the thinking beat: reasoning streams, then the document lands.
  const [revealed, setRevealed] = React.useState(false);
  const [shownLines, setShownLines] = React.useState(0);
  const [emailOpen, setEmailOpen] = React.useState(false);

  React.useEffect(() => {
    if (revealed) return;
    let n = 0;
    let revealTimer = 0;
    const iv = window.setInterval(() => {
      n += 1;
      setShownLines(Math.min(step.reasoning.length, n));
      if (n >= step.reasoning.length) {
        window.clearInterval(iv);
        revealTimer = window.setTimeout(() => setRevealed(true), 420);
      }
    }, LINE_MS);
    return () => {
      window.clearInterval(iv);
      window.clearTimeout(revealTimer);
    };
  }, [revealed, step.reasoning.length]);

  const decided = status !== "none";

  const openEmail = () => {
    setEmailOpen(true);
    if (!replied) onReplyReceived();
  };

  return (
    <section className="bg-white border border-divider rounded-md overflow-hidden flex flex-col">
      <header className="px-5 pt-4 pb-3 border-b border-divider">
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-md bg-surface-deep text-ink-inverse flex items-center justify-center shrink-0">
            <agent.icon size={15} />
          </span>
          <div className="min-w-0">
            <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium leading-none">
              Step {step.n} · AI workspace
            </div>
            <div className="text-[15px] font-bold text-ink leading-tight mt-0.5 truncate">
              {agent.name}
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
        {/* Reasoning trace */}
        <div className="space-y-1.5">
          {step.reasoning.slice(0, shownLines).map((line, i) => (
            <div key={i} className="flex items-start gap-2 text-[12.5px] text-ink leading-snug">
              <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
              {revealed ? <span>{line}</span> : <StreamingText text={line} cps={90} />}
            </div>
          ))}
          {!revealed && shownLines < step.reasoning.length && (
            <div className="flex items-center gap-2 text-[12px] text-mute pl-[21px]">
              <AIDot size={6} tone="deep" pulse /> reasoning…
            </div>
          )}
        </div>

        {revealed && (
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

            {/* Email round-trip — one button opens the thread in a center modal */}
            {step.email && (
              <button
                type="button"
                onClick={openEmail}
                className="ui-pill inline-flex items-center gap-2 rounded-md border border-divider bg-white px-3.5 py-2.5 text-[13px] font-medium text-ink hover:border-[#354a5f] hover:bg-surface-fog"
              >
                <Mail size={15} className="text-[#0a6ed1]" />
                View supplier reply
                {replied && <span className="text-[11px] font-bold text-[#107e3e]">· received</span>}
              </button>
            )}

            {/* Recommendation + decision */}
            <div className="rounded-md bg-surface-mint/40 border border-surface-mint px-4 py-3">
              <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-bold">
                AI recommendation
              </div>
              <p className="text-[13px] text-ink leading-snug mt-1">{step.recommendation}</p>
            </div>

            {decided && (
              <div className={cn("flex items-center gap-2 text-[12.5px] font-medium", noteFor[status as Decision].cls)}>
                <AIDot size={7} tone={status === "approved" ? "green" : status === "pending" ? "mute" : "red"} />
                {isLast && status === "approved"
                  ? "Run complete · invoice released to AP, audit envelope closed"
                  : noteFor[status as Decision].label}
              </div>
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
        )}
      </div>

      {emailOpen && step.email && (
        <EmailReplyModal email={step.email} onClose={() => setEmailOpen(false)} />
      )}
    </section>
  );
}
