import { cn } from "@/lib/utils";
import { CountUp } from "@/components/ai/CountUp";
import { Sparkline } from "@/components/ai/Sparkline";

export type KPI = {
  label: string;
  value: number;
  prefix?: string;
  suffix?: string;
  decimals?: number;
  /** Direction is used for the trend tone and arrow. */
  trend?: { delta: string; direction: "up" | "down" | "flat" };
  /** 8 points for the inline sparkline. */
  spark?: number[];
};

const trendTone = {
  up: "text-surface-deep",
  down: "text-mark-red",
  flat: "text-mute",
};

export function KPIStrip({ items, className }: { items: KPI[]; className?: string }) {
  return (
    <div className={cn("grid grid-cols-4 gap-3", className)}>
      {items.map((k, i) => (
        <article
          key={k.label}
          className="bg-white border border-divider rounded-md px-4 py-3 flex flex-col justify-between h-[92px]"
        >
          <div className="text-[12px] tracking-[0.08em] uppercase text-mute font-medium">
            {k.label}
          </div>
          <div className="flex items-end justify-between gap-3">
            <div className="leading-none">
              <div className="flex items-baseline gap-2">
                <span className="text-[24px] leading-[28px] font-bold tracking-[-0.02em] text-ink">
                  <CountUp
                    to={k.value}
                    duration={1100}
                    delay={i * 90}
                    decimals={k.decimals ?? 0}
                    prefix={k.prefix}
                    suffix={k.suffix}
                    grouped
                  />
                </span>
                {k.trend && (
                  <span className={cn("text-[13px] font-medium", trendTone[k.trend.direction])}>
                    {k.trend.direction === "up" ? "↑" : k.trend.direction === "down" ? "↓" : "·"}{" "}
                    {k.trend.delta}
                  </span>
                )}
              </div>
            </div>
            {k.spark && <Sparkline points={k.spark} filled />}
          </div>
        </article>
      ))}
    </div>
  );
}
