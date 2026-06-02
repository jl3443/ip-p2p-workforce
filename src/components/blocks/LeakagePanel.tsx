import { cn } from "@/lib/utils";
import { leakage } from "@/data/cockpit";
import { AIDot } from "@/components/ai/AIDot";

/** Two-bar Pareto: a small share of suppliers drives most off-contract spend. */
function ParetoBar({ label, share, tone }: { label: string; share: number; tone: "deep" | "rose" }) {
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[12px]">
        <span className="text-ink">{label}</span>
        <span className="text-mute font-medium">{share}% of spend</span>
      </div>
      <div className="h-2.5 rounded-full bg-surface-fog overflow-hidden">
        <div
          className={cn("h-full rounded-full", tone === "deep" ? "bg-surface-deep" : "bg-surface-rose")}
          style={{ width: `${share}%` }}
        />
      </div>
    </div>
  );
}

export function LeakagePanel({ className }: { className?: string }) {
  return (
    <section
      className={cn(
        "bg-white border border-divider rounded-md overflow-hidden flex flex-col",
        className,
      )}
    >
      <header className="flex items-center justify-between px-4 py-2.5 border-b border-divider">
        <div className="flex items-center gap-3">
          <AIDot size={6} tone="deep" />
          <span className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Where the money leaks
          </span>
        </div>
        <span className="text-[11px] text-mute">80 / 20</span>
      </header>

      <div className="flex-1 flex flex-col px-4 py-4 gap-4">
        <p className="text-[15px] font-bold text-ink leading-snug">{leakage.headline}</p>

        <div className="space-y-3">
          <ParetoBar label="Top 20% of suppliers" share={80} tone="deep" />
          <ParetoBar label="Other 80% of suppliers" share={20} tone="rose" />
        </div>

        <div className="border-t border-divider pt-3 space-y-2.5">
          {leakage.rows.map((r) => (
            <div key={r.source} className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="text-[13px] font-medium text-ink leading-tight">{r.source}</div>
                <div className="text-[12px] text-mute">{r.fix}</div>
              </div>
              <span className="text-[13px] font-bold text-mark-red shrink-0">{r.amount}</span>
            </div>
          ))}
        </div>

        <div className="mt-auto rounded-md bg-surface-mint px-3 py-2.5">
          <div className="text-[12px] text-surface-deep font-medium leading-snug">{leakage.callout}</div>
        </div>
      </div>
    </section>
  );
}
