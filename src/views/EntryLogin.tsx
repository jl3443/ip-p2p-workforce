import { ArrowRight, Sparkles, ShoppingCart, Banknote, ShieldCheck } from "lucide-react";
import type { Product } from "@/Root";

/**
 * Single sign-in interface for both agentic workforces. Two persona cards —
 * Procurement (Procure-to-Pay) and Receivables (Order-to-Cash). Picking one
 * signs into that workforce. (No separate selector page.)
 */

const ACCENT = { hex: "#14b8a6", halo: "rgba(20,184,166,0.45)" };

const HERO = [
  { label: "Sourcing & orders", src: "/hero-factory.jpg" },
  { label: "Delivery & receipt", src: "/hero-boxes.jpg" },
  { label: "Invoices & cash", src: "/hero-paper.jpg" },
];

type Persona = {
  id: Product;
  icon: typeof ShoppingCart;
  badge: string;
  name: string;
  caps: string[];
  userId: string;
};

const PERSONAS: Persona[] = [
  {
    id: "p2p",
    icon: ShoppingCart,
    badge: "Procurement Ops",
    name: "Procurement workspace",
    caps: [
      "One cockpit over 6 agents and the orchestrator",
      "Touchless orders within policy · approvals only when it matters",
      "Every order issued with a full audit trail",
    ],
    userId: "buyer01",
  },
  {
    id: "o2c",
    icon: Banknote,
    badge: "Order-to-Cash",
    name: "Receivables workspace",
    caps: [
      "One cockpit over 5 agents and the orchestrator",
      "Cash applied touchless · approvals only when it matters",
      "Every deduction resolved with a full audit trail",
    ],
    userId: "controller01",
  },
];

export function EntryLogin({ onPick }: { onPick: (p: Product) => void }) {
  return (
    <div className="fixed inset-0 overflow-auto bg-neutral-950 text-white">
      {/* tri-panel hero photography + dark wash */}
      <div className="pointer-events-none absolute inset-0 grid grid-cols-3">
        {HERO.map((h) => (
          <div
            key={h.label}
            className="relative bg-cover bg-center"
            style={{ backgroundImage: `url(${h.src})` }}
          >
            <div className="absolute inset-0 bg-neutral-950/82" />
          </div>
        ))}
      </div>
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(55% 45% at 50% 8%, rgba(20,184,166,0.14), transparent 60%)",
        }}
      />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-4xl flex-col px-6 py-9">
        {/* brand */}
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

        {/* heading */}
        <div className="mt-12 text-center">
          <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300">
            Receivables &amp; procurement
          </span>
          <h1
            className="mt-3 font-bold leading-[1.05] tracking-[-0.025em] drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
            style={{ fontSize: "clamp(2rem, 5vw, 3.4rem)" }}
          >
            Sign in
          </h1>
          <p className="mx-auto mt-3 max-w-md text-[13.5px] leading-relaxed text-white/65">
            Choose your workspace — the agents do the work, a human approves every decision,
            and every action is audited.
          </p>
        </div>

        {/* two persona cards */}
        <div className="mt-10 grid flex-1 content-start gap-5 sm:grid-cols-2">
          {PERSONAS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => onPick(p.id)}
              style={{ boxShadow: `inset 0 0 0 1px ${ACCENT.hex}26, 0 25px 70px -36px ${ACCENT.halo}` }}
              className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.045] p-6 text-left backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-teal-400/55 hover:bg-white/[0.07]"
            >
              <span
                aria-hidden
                className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-20 blur-3xl transition-opacity duration-300 group-hover:opacity-30"
                style={{ background: ACCENT.hex }}
              />
              <div className="relative flex items-center justify-between gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-teal-300">
                  <p.icon size={20} strokeWidth={1.8} />
                </span>
                <span
                  className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{ color: ACCENT.hex, background: `${ACCENT.hex}14`, border: `1px solid ${ACCENT.hex}55` }}
                >
                  {p.badge}
                </span>
              </div>

              <h3 className="relative mt-5 text-[19px] font-bold tracking-[-0.015em]">{p.name}</h3>

              <ul className="relative mt-4 space-y-2">
                {p.caps.map((c) => (
                  <li key={c} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-white/80">
                    <span aria-hidden className="mt-[6px] block h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACCENT.hex }} />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>

              <div
                className="relative my-5 h-px w-full"
                style={{ background: `linear-gradient(to right, transparent, ${ACCENT.hex}55, transparent)` }}
              />

              <div className="relative flex items-center justify-between">
                <span className="font-mono text-[11px] text-white/45">{p.userId}</span>
                <span
                  className="inline-flex items-center gap-2 rounded-md px-4 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-950 transition-all duration-300 group-hover:brightness-110"
                  style={{ background: ACCENT.hex }}
                >
                  Sign in
                  <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                </span>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-9 flex items-center justify-center gap-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-white/45">
          <ShieldCheck size={13} /> Agents activate on sign-in · every action is audited
        </div>
      </div>
    </div>
  );
}
