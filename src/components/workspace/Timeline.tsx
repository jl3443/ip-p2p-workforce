import { cn } from "@/lib/utils";
import { CONTROL_ACTORS, type FlowStep } from "@/data/flows";
import { AIDot } from "@/components/ai/AIDot";
import { Spinner } from "@/components/ai/Spinner";

type StepState = "done" | "running" | "pending";

function stateFor(idx: number, activeStep: number, pauseAt: number): StepState {
  if (idx < activeStep) return "done";
  if (idx === activeStep) {
    // pauseAt is the human-review step — when we're sitting on it we say "running"
    if (idx === pauseAt) return "running";
    return "running";
  }
  return "pending";
}

export function Timeline({
  steps,
  activeStep,
  pauseAt,
}: {
  steps: FlowStep[];
  activeStep: number;
  pauseAt: number;
}) {
  return (
    <ol className="space-y-0">
      {steps.map((step, i) => {
        const state = stateFor(i, activeStep, pauseAt);
        const isLast = i === steps.length - 1;
        return (
          <li key={step.title} className="flex gap-4">
            {/* Rail: number circle + connector */}
            <div className="flex flex-col items-center shrink-0">
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center text-[14px] font-bold border-2 shrink-0",
                  state === "done" && "bg-surface-deep border-surface-deep text-ink-inverse",
                  state === "running" &&
                    "bg-surface-mint border-surface-deep text-surface-deep",
                  state === "pending" && "bg-white border-divider text-mute",
                )}
              >
                {state === "done" ? "✓" : state === "running" ? <Spinner size={14} /> : i + 1}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 my-1 min-h-[64px]",
                    state === "done" ? "bg-surface-deep" : "bg-divider",
                  )}
                />
              )}
            </div>
            {/* Body */}
            <div className={cn("flex-1 pb-6 space-y-1", isLast && "pb-0")}>
              <div
                className={cn(
                  "text-[14px] font-bold leading-[18px]",
                  state === "pending" ? "text-mute" : "text-ink",
                )}
              >
                {step.title}
              </div>
              <div className="flex items-center gap-2">
                <span
                  className={cn(
                    "text-[10px] tracking-[0.06em] uppercase font-medium px-1.5 py-0.5 rounded",
                    CONTROL_ACTORS.includes(step.actor)
                      ? "bg-surface-deep text-ink-inverse"
                      : "bg-surface-fog text-mute",
                  )}
                >
                  {step.actor}
                </span>
                <span className="text-[11px] text-mute">·</span>
                <span className="text-[11px] text-mute">{step.time}</span>
                {state === "running" && <AIDot size={6} tone="deep" pulse />}
              </div>
              <p
                className={cn(
                  "text-[12px] leading-[18px] pt-1",
                  state === "pending" ? "text-mute" : "text-ink",
                )}
              >
                {step.detail}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
