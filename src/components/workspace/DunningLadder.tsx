import { cn } from "@/lib/utils";
import { AIDot } from "@/components/ai/AIDot";

/**
 * The contract-based dunning ladder — five escalation tiers from a soft
 * courtesy nudge to a hard pre-legal demand. The Payment & Collections agent
 * reads the days-past-due against the customer's payment terms and picks the
 * tier; the chosen tier is highlighted and its email is drafted below (the
 * step's AiDraftEmailCard). Presentational — takes the tiers + the AI pick.
 */

export type DunningTier = {
  n: number;
  name: string;
  /** Days-past-due band this tier applies to, e.g. "8–21 days". */
  band: string;
  /** One-line description of the tone. */
  gist: string;
};

/** Soft (green) → hard (red) colour ramp across the five tiers. */
const RAMP = ["#107e3e", "#6a8b22", "#a07a12", "#b5560f", "#bb0000"];

export function DunningLadder({
  tiers,
  recommended,
  contract,
}: {
  tiers: DunningTier[];
  recommended: number;
  contract: string;
}) {
  return (
    <article className="bg-white border border-divider rounded-md overflow-hidden">
      <header className="flex items-center gap-2 px-4 py-2.5 border-b border-divider bg-surface-fog">
        <AIDot size={6} tone="deep" pulse />
        <span className="text-[11px] uppercase tracking-[0.07em] font-bold text-surface-deep">
          Dunning ladder · contract-based escalation
        </span>
        <span className="ml-auto text-[11px] text-mute">{contract}</span>
      </header>

      <div className="p-4">
        <div className="flex items-center justify-between text-[9.5px] uppercase tracking-[0.1em] text-mute font-bold mb-2 px-0.5">
          <span>Soft</span>
          <span className="text-[8.5px] tracking-[0.06em]">escalation as days past due grow →</span>
          <span>Hard</span>
        </div>

        <div className="grid grid-cols-5 gap-2">
          {tiers.map((t, i) => {
            const c = RAMP[i] ?? RAMP[RAMP.length - 1];
            const hot = t.n === recommended;
            return (
              <div
                key={t.n}
                className={cn(
                  "relative rounded-md p-2.5 flex flex-col gap-1 transition-colors",
                  hot ? "border-2" : "border",
                )}
                style={{
                  borderColor: hot ? c : "#e2e7ec",
                  background: hot ? `color-mix(in srgb, ${c} 9%, white)` : "white",
                }}
              >
                {hot && (
                  <span
                    className="absolute -top-2 right-2 text-[7.5px] font-bold uppercase tracking-[0.06em] text-white px-1.5 py-0.5 rounded shadow-sm"
                    style={{ background: c }}
                  >
                    AI pick
                  </span>
                )}
                <div className="flex items-center gap-1.5">
                  <span
                    className="w-5 h-5 rounded-full text-white text-[10px] font-bold flex items-center justify-center shrink-0"
                    style={{ background: c }}
                  >
                    {t.n}
                  </span>
                  <span className="text-[11px] font-bold text-ink leading-tight">{t.name}</span>
                </div>
                <span className="text-[9.5px] text-mute tabular-nums">{t.band}</span>
                <span className="text-[10px] text-ink leading-snug">{t.gist}</span>
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}
