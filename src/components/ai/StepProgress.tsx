import * as React from "react";
import { Check } from "lucide-react";
import { Spinner } from "@/components/ai/Spinner";
import { AIDot } from "@/components/ai/AIDot";
import { cn } from "@/lib/utils";

/**
 * The "agent is working" loading chrome shown above a step's reasoning trace or
 * extraction wizard. A spinner + phase title, an animated progress bar with a
 * live percentage, and four phase chips that light up in sequence — so every
 * step opens with a visible "AI is running" moment before the artifact reveals.
 * Self-animating and decorative; it unmounts once the produced doc is shown.
 */

const PHASES = ["Read", "Reason", "Draft", "Verify"];

export function StepProgress({ agentName, docLabel }: { agentName: string; docLabel: string }) {
  const [pct, setPct] = React.useState(0);

  // Decelerating fill toward ~96% (held, "in progress") — the step reveal
  // unmounts this card, so it never needs to hit 100%.
  React.useEffect(() => {
    setPct(0);
    const iv = window.setInterval(() => {
      setPct((p) => {
        if (p >= 96) return 96;
        const step = p < 55 ? 6 : p < 80 ? 3 : 1;
        return Math.min(96, p + step);
      });
    }, 130);
    return () => window.clearInterval(iv);
  }, [docLabel]);

  const activePhase = Math.min(PHASES.length - 1, Math.floor((pct / 100) * PHASES.length));
  const docName = docLabel.split(" · ")[0];
  const titles = [
    "Reading the sources",
    "Reasoning over the evidence",
    `Drafting ${docName}`,
    "Verifying the controls",
  ];

  return (
    <div className="rounded-md border border-divider bg-white px-4 py-3">
      <div className="flex items-center gap-2">
        <Spinner size={14} className="shrink-0" />
        <span className="text-[13px] font-bold text-ink leading-tight truncate">{titles[activePhase]}…</span>
        <span className="ml-auto inline-flex items-center gap-1.5 text-[11px] text-mute shrink-0">
          <AIDot size={6} tone="deep" pulse /> {agentName}
        </span>
      </div>

      <div className="mt-2.5 flex items-center gap-2.5">
        <div className="flex-1 h-1.5 rounded-full bg-surface-fog overflow-hidden">
          <div
            className="h-full rounded-full bg-surface-deep"
            style={{ width: `${pct}%`, transition: "width 140ms linear" }}
          />
        </div>
        <span className="text-[11px] tabular-nums text-mute w-8 text-right">{pct}%</span>
      </div>

      <div className="mt-2.5 flex flex-wrap gap-1.5">
        {PHASES.map((p, i) => (
          <span
            key={p}
            className={cn(
              "inline-flex items-center gap-1 text-[10.5px] tracking-[0.02em] rounded-full px-2 py-0.5 border whitespace-nowrap",
              i < activePhase
                ? "border-surface-mint bg-surface-mint/50 text-surface-deep"
                : i === activePhase
                  ? "border-surface-deep bg-surface-deep text-ink-inverse"
                  : "border-divider bg-white text-mute",
            )}
          >
            {i < activePhase && <Check size={10} strokeWidth={3} />}
            {p}
          </span>
        ))}
      </div>
    </div>
  );
}
