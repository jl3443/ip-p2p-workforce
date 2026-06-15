import * as React from "react";
import { ArrowRight, ShoppingCart, Banknote, Sparkles } from "lucide-react";
import type { Product } from "@/Root";

/**
 * Top-level entry — pick which agentic workforce to open. Each card leads to
 * that product's own landing / sign-in (Procure-to-Pay or Order-to-Cash).
 */

const ACCENT = "#14b8a6";

const WORKFORCES: {
  id: Product;
  icon: typeof ShoppingCart;
  eyebrow: string;
  title: string;
  desc: string;
  chain: string;
  agents: string;
}[] = [
  {
    id: "p2p",
    icon: ShoppingCart,
    eyebrow: "Source-to-pay",
    title: "Procure-to-Pay",
    desc: "Turn requests into requisitions, run spot tenders, draft and check orders, and issue them with a complete audit trail.",
    chain: "Intake → Sourcing → PO → Invoice",
    agents: "6 agents + orchestrator",
  },
  {
    id: "o2c",
    icon: Banknote,
    eyebrow: "Order-to-cash",
    title: "Order-to-Cash",
    desc: "Apply the cash, classify every deduction, pull the proof that refutes the bad ones, and recover the money — with proof.",
    chain: "Cash app → Triage → Evidence → Recovery",
    agents: "5 agents + orchestrator",
  },
];

export function ProductSelector({ onPick }: { onPick: (p: Product) => void }) {
  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-neutral-950 text-white font-sans">
      {/* ambient backdrop */}
      <div
        className="pointer-events-none absolute inset-0 opacity-70"
        style={{
          background:
            "radial-gradient(60% 50% at 25% 0%, rgba(20,184,166,0.16), transparent 60%), radial-gradient(60% 50% at 80% 20%, rgba(56,116,203,0.14), transparent 60%)",
        }}
      />
      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-10">
        {/* header */}
        <div className="flex items-center gap-3">
          <span className="grid h-10 w-10 place-items-center rounded-xl border border-teal-400/45 bg-teal-400/15 text-teal-300">
            <Sparkles size={18} strokeWidth={2} />
          </span>
          <div className="leading-tight">
            <div className="text-[15px] font-bold tracking-[-0.01em]">International Paper</div>
            <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/55">
              Agentic operations
            </div>
          </div>
        </div>

        {/* hero */}
        <div className="mt-16 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
            Multi-agent workforce
          </span>
          <h1
            className="mt-4 font-bold leading-[1.05] tracking-[-0.025em]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.6rem)" }}
          >
            Choose a workforce
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-[14px] leading-relaxed text-white/65">
            Two specialist agent teams, one operating model — the agents do the work, a human
            approves every decision, and every action is audited.
          </p>
        </div>

        {/* cards */}
        <div className="mt-12 grid flex-1 content-start gap-5 sm:grid-cols-2">
          {WORKFORCES.map((w) => (
            <button
              key={w.id}
              type="button"
              onClick={() => onPick(w.id)}
              className="group relative flex flex-col rounded-2xl border border-white/10 bg-white/[0.035] p-6 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/50 hover:bg-white/[0.06]"
            >
              <div className="flex items-center justify-between">
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-teal-300"
                  style={{ boxShadow: `inset 0 0 0 1px rgba(20,184,166,0.0)` }}
                >
                  <w.icon size={22} strokeWidth={1.8} />
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/45">
                  {w.eyebrow}
                </span>
              </div>
              <h2 className="mt-5 text-[22px] font-bold tracking-[-0.01em]">{w.title}</h2>
              <p className="mt-2 text-[13.5px] leading-relaxed text-white/65">{w.desc}</p>
              <div className="mt-5 flex flex-col gap-1.5 text-[11.5px] text-white/55">
                <span className="font-mono text-teal-300/90">{w.chain}</span>
                <span>{w.agents}</span>
              </div>
              <span
                className="mt-6 inline-flex items-center gap-2 self-start rounded-md border border-white/20 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/85 transition-all duration-300 group-hover:border-teal-400 group-hover:text-teal-300"
                style={{ "--a": ACCENT } as React.CSSProperties}
              >
                Open workforce
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
              </span>
            </button>
          ))}
        </div>

        <div className="mt-10 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/35">
          Confidential · Enterprise use only
        </div>
      </div>
    </div>
  );
}
