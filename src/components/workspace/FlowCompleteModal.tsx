import * as React from "react";
import { Check, X, FileText } from "lucide-react";
import { SpringIn } from "@/components/ai/SpringIn";
import type { FlowRun } from "@/data/flowRuns";
import type { SourceArtifact } from "@/data/runSteps";

/**
 * The happy-path close ceremony — a centered "flow complete" card that lands
 * when the final agent hands off. Mirrors the OTM "FLOW COMPLETE" modal: green
 * tick, headline, three stat tiles, and the run's produced artifacts (PR · RFQ ·
 * PO · GR · invoice) as clickable chips that open the real document. Two actions:
 * stay on the run, or return to the cockpit.
 */
export function FlowCompleteModal({
  run,
  onOpenArtifact,
  onBackToCockpit,
  onClose,
}: {
  run: FlowRun;
  onOpenArtifact: (s: SourceArtifact) => void;
  onBackToCockpit: () => void;
  onClose: () => void;
}) {
  React.useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const c = run.completion;
  if (!c) return null;

  // Each agent step's produced document becomes a clickable artifact chip.
  const artifacts: SourceArtifact[] = run.steps.map((s) => ({
    id: `done-${s.id}`,
    label: s.docLabel.split(" · ")[0],
    meta: s.docLabel,
    kind: "sap",
    body: s.document,
  }));

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/40 px-4"
      onClick={onClose}
    >
      <SpringIn className="w-full max-w-[560px]">
        <div
          onClick={(e) => e.stopPropagation()}
          className="relative bg-white rounded-2xl shadow-xl px-8 pt-9 pb-7 text-center"
        >
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="ui-pill absolute top-4 right-4 w-8 h-8 rounded-full text-mute hover:bg-surface-fog flex items-center justify-center"
          >
            <X size={18} />
          </button>

          {/* Green tick */}
          <div className="flex justify-center">
            <span className="w-[72px] h-[72px] rounded-full bg-surface-mint flex items-center justify-center">
              <span className="w-[56px] h-[56px] rounded-full bg-surface-deep text-ink-inverse flex items-center justify-center">
                <Check size={30} strokeWidth={3} />
              </span>
            </span>
          </div>

          <div className="text-[11px] uppercase tracking-[0.1em] text-surface-deep font-bold mt-4">
            Flow complete
          </div>
          <div className="text-[24px] font-bold text-ink tracking-[-0.01em] mt-1">{c.title}</div>

          {/* Stat tiles */}
          <div className="grid grid-cols-3 gap-3 mt-5">
            {c.stats.map((s) => (
              <div key={s.label} className="rounded-lg border border-divider bg-surface-fog/60 py-3">
                <div className="text-[22px] font-bold text-surface-deep leading-none">{s.value}</div>
                <div className="text-[11px] text-mute mt-1 leading-tight">{s.label}</div>
              </div>
            ))}
          </div>

          <p className="text-[13px] text-mute leading-snug mt-4 px-2">{c.caption}</p>

          {/* Clickable artifacts */}
          <div className="mt-5 text-left">
            <div className="text-[11px] uppercase tracking-[0.07em] text-mute font-medium mb-2">
              Artifacts · click to open
            </div>
            <div className="flex flex-wrap gap-2">
              {artifacts.map((a) => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => onOpenArtifact(a)}
                  className="ui-pill inline-flex items-center gap-1.5 rounded-md border border-divider bg-white px-2.5 py-1.5 text-[12px] font-medium text-ink hover:border-surface-deep hover:bg-surface-mint/40"
                >
                  <FileText size={13} className="text-surface-deep" />
                  {a.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 mt-7">
            <button
              type="button"
              onClick={onClose}
              className="ui-pill flex-1 rounded-full border border-ink/25 bg-white px-4 py-2.5 text-[13px] font-medium text-ink hover:bg-surface-fog"
            >
              Stay on the run
            </button>
            <button
              type="button"
              onClick={onBackToCockpit}
              className="ui-pill flex-1 rounded-full bg-surface-deep px-4 py-2.5 text-[13px] font-bold text-ink-inverse hover:bg-accent-green"
            >
              Back to cockpit
            </button>
          </div>
        </div>
      </SpringIn>
    </div>
  );
}
