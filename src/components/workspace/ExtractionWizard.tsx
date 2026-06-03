import * as React from "react";
import { Check, CornerUpRight, RotateCcw, Sparkles } from "lucide-react";
import { Spinner } from "@/components/ai/Spinner";
import { SpringIn } from "@/components/ai/SpringIn";
import type { ExtractStage, SourceArtifact } from "@/data/runSteps";

/**
 * The staged-extraction wizard for agent steps 1–4. The agent reads its source
 * files one at a time: the current source shows on the right; on the left the
 * active reasoning line spins for a beat while the agent "extracts", then the
 * auto-filled, editable form box (one section of the produced document) springs
 * in with Validate & Proceed / Discard. Each proceed advances to the next source
 * + box; after the last one the parent reveals the complete document.
 */

const EXTRACT_MS = 1000;
const REEXTRACT_MS = 1000;

function EditableField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="block min-w-0">
      <span className="block text-[10px] uppercase tracking-[0.06em] text-mute font-medium mb-1">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full bg-[#f4f6f9] border border-[#dfe3e8] rounded px-2.5 py-1.5 text-[12.5px] text-ink focus:outline-none focus:border-[#0a6ed1] focus:bg-white"
      />
    </label>
  );
}

export function ExtractionWizard({
  stages,
  sources,
  onComplete,
}: {
  stages: ExtractStage[];
  sources: SourceArtifact[];
  onComplete: () => void;
}) {
  const [stageIdx, setStageIdx] = React.useState(0);
  // True while the agent is "reading" the source — the box appears after this beat.
  const [extracting, setExtracting] = React.useState(true);
  const [vals, setVals] = React.useState<string[]>(() => stages[0].fields.map(() => ""));

  const stage = stages[stageIdx];
  const source = sources.find((s) => s.id === stage.sourceId);

  // On entering each stage: spin for a beat, then fill the box from the source.
  React.useEffect(() => {
    setExtracting(true);
    setVals(stages[stageIdx].fields.map(() => ""));
    const t = window.setTimeout(() => {
      setVals(stages[stageIdx].fields.map((f) => f.value));
      setExtracting(false);
    }, EXTRACT_MS);
    return () => window.clearTimeout(t);
  }, [stageIdx, stages]);

  const proceed = () => {
    if (extracting) return;
    if (stageIdx < stages.length - 1) setStageIdx((i) => i + 1);
    else onComplete();
  };

  // Discard = re-extract: spin again, then re-fill from the source.
  const discard = () => {
    if (extracting) return;
    setExtracting(true);
    setVals(stages[stageIdx].fields.map(() => ""));
    window.setTimeout(() => {
      setVals(stages[stageIdx].fields.map((f) => f.value));
      setExtracting(false);
    }, REEXTRACT_MS);
  };

  return (
    <div className="grid grid-cols-[minmax(0,560px)_minmax(0,1fr)] gap-4 items-start">
      {/* Left — staged reasoning + the auto-fill form box */}
      <div className="space-y-3 min-w-0">
        <div className="space-y-1.5">
          {stages.slice(0, stageIdx + 1).map((s, i) => {
            const active = i === stageIdx;
            return (
              <div key={i} className="flex items-start gap-2 text-[12.5px] leading-snug">
                {active ? (
                  <Spinner size={13} className="mt-[2px] shrink-0" />
                ) : (
                  <Check size={13} className="text-surface-deep mt-[3px] shrink-0" strokeWidth={3} />
                )}
                <span className={active ? "text-ink font-medium" : "text-ink"}>{s.reasoning}</span>
              </div>
            );
          })}
        </div>

        {extracting ? (
          <div className="flex items-center gap-2 text-[12px] text-mute pl-[21px]">
            <Spinner size={12} className="shrink-0" />
            Extracting fields from {source?.label}…
          </div>
        ) : (
          <SpringIn key={stageIdx}>
            <div className="bg-white border border-divider rounded-md overflow-hidden">
              <div className="flex items-center gap-2 px-3.5 py-2 bg-[#eef1f5] border-b border-divider border-l-[3px] border-l-[#354a5f]">
                <Sparkles size={12} className="text-[#354a5f] shrink-0" />
                <span className="text-[10.5px] uppercase tracking-[0.06em] text-[#354a5f] font-bold">
                  {stage.title}
                </span>
                <span className="ml-auto text-[10px] text-mute whitespace-nowrap">
                  auto-filled · editable
                </span>
              </div>
              <div className="p-4 grid grid-cols-2 gap-x-3 gap-y-3">
                {stage.fields.map((f, i) => (
                  <EditableField
                    key={f.label}
                    label={f.label}
                    value={vals[i] ?? ""}
                    onChange={(v) => setVals((arr) => arr.map((x, j) => (j === i ? v : x)))}
                  />
                ))}
              </div>
              <div className="px-4 py-3 border-t border-divider flex items-center gap-2">
                <button
                  type="button"
                  onClick={proceed}
                  className="ui-pill inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-bold bg-surface-deep text-ink-inverse hover:bg-accent-green"
                >
                  <CornerUpRight size={14} /> Validate &amp; proceed
                </button>
                <button
                  type="button"
                  onClick={discard}
                  className="ui-pill inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium bg-white text-ink border border-ink/30 hover:bg-surface-fog"
                >
                  <RotateCcw size={14} /> Discard
                </button>
                <span className="ml-auto text-[11px] text-mute tabular-nums">
                  {stageIdx + 1} / {stages.length}
                </span>
              </div>
            </div>
          </SpringIn>
        )}
      </div>

      {/* Right — the source the agent is reading right now */}
      <div className="min-w-0">
        {source && (
          <SpringIn key={stage.sourceId}>
            <div className="bg-white border border-divider rounded-md overflow-hidden">
              <div className="px-3.5 py-2 border-b border-divider bg-surface-fog">
                <div className="text-[12px] font-bold text-ink truncate">{source.label}</div>
                <div className="text-[10.5px] uppercase tracking-[0.06em] text-mute truncate">
                  {source.meta}
                </div>
              </div>
              <div className="p-3 overflow-x-auto">{source.body}</div>
            </div>
          </SpringIn>
        )}
      </div>
    </div>
  );
}
