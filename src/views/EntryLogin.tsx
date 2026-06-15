import { useState } from "react";
import { cn } from "@/lib/utils";
import {
  ArrowRight,
  ArrowLeft,
  Sparkles,
  ShoppingCart,
  Banknote,
  LogIn,
} from "lucide-react";
import type { Product } from "@/Root";

/**
 * Single entry sign-in for both agentic workforces. Same two-phase design as the
 * product logins (hero splash → sign-in), but the sign-in step shows TWO persona
 * cards — Procurement (Procure-to-Pay) and Receivables (Order-to-Cash). Picking
 * one signs straight into that workforce.
 */

const HERO_COLUMNS = [
  { label: "Sourcing & orders", src: "/hero-factory.jpg" },
  { label: "Delivery & receipt", src: "/hero-boxes.jpg" },
  { label: "Invoices & cash", src: "/hero-paper.jpg" },
];

const ACCENT = { hex: "#14b8a6", halo: "rgba(20,184,166,0.45)" };

type Persona = {
  id: Product;
  icon: typeof ShoppingCart;
  badge: string;
  name: string;
  capabilities: string[];
  userId: string;
};

const PERSONAS: Persona[] = [
  {
    id: "p2p",
    icon: ShoppingCart,
    badge: "Procurement Ops",
    name: "Procurement workspace",
    capabilities: [
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
    capabilities: [
      "One cockpit over 5 agents and the orchestrator",
      "Cash applied touchless · approvals only when it matters",
      "Every deduction resolved with a full audit trail",
    ],
    userId: "controller01",
  },
];

export function EntryLogin({ onPick }: { onPick: (p: Product) => void }) {
  const [phase, setPhase] = useState<"hero" | "personas">("hero");

  return (
    <div className="fixed inset-0 overflow-auto bg-neutral-950 text-white">
      <HeroBackground heavyOverlay={phase === "personas"} />

      <div className="relative min-h-screen flex flex-col">
        <TopBar phase={phase} onSelect={() => setPhase("personas")} onBack={() => setPhase("hero")} />

        <main className="relative z-10 flex flex-1 items-center justify-center px-6 pb-12 pt-6 sm:px-10">
          {phase === "hero" ? (
            <Hero onAccess={() => setPhase("personas")} />
          ) : (
            <SignInPanel onPick={onPick} />
          )}
        </main>

        <footer className="relative z-10 px-6 pb-7 text-center sm:px-10">
          <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
            Confidential · Enterprise Use Only
          </p>
        </footer>
      </div>
    </div>
  );
}

function HeroBackground({ heavyOverlay = false }: { heavyOverlay?: boolean }) {
  const colTint = heavyOverlay ? "bg-black/68" : "bg-black/48";
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 grid grid-cols-3">
        {HERO_COLUMNS.map((col) => (
          <div key={col.label} className="relative overflow-hidden">
            <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url('${col.src}')` }} />
            <div className={cn("absolute inset-0 transition-colors duration-500", colTint)} />
            <div className="absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-black/40 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/55 to-transparent" />
            {!heavyOverlay && (
              <span className="absolute inset-x-0 bottom-20 z-10 text-center text-[11px] font-bold uppercase tracking-[0.32em] text-white/60">
                {col.label}
              </span>
            )}
          </div>
        ))}
      </div>
      <div className="absolute inset-y-0 left-1/3 w-px bg-white/10" />
      <div className="absolute inset-y-0 left-2/3 w-px bg-white/10" />
    </div>
  );
}

function TopBar({
  phase,
  onSelect,
  onBack,
}: {
  phase: "hero" | "personas";
  onSelect: () => void;
  onBack: () => void;
}) {
  return (
    <header className="relative z-20 flex w-full items-center justify-between px-6 py-5 sm:px-10">
      <div className="inline-flex items-center gap-3">
        <span className="grid w-10 h-10 place-items-center rounded-xl border border-teal-400/45 bg-teal-400/15 text-teal-300">
          <Sparkles size={16} strokeWidth={2} />
        </span>
        <span className="flex flex-col leading-tight">
          <span className="text-[15px] font-bold tracking-[-0.01em] text-white">Agentic Operations</span>
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/55">
            International Paper · multi-agent workforce
          </span>
        </span>
      </div>

      {phase === "hero" ? (
        <button
          type="button"
          onClick={onSelect}
          className="ui-pill group inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.20em] text-white/85 transition-all duration-300 hover:border-teal-400 hover:bg-teal-400/[0.08] hover:text-teal-300"
        >
          Enter
          <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
        </button>
      ) : (
        <button
          type="button"
          onClick={onBack}
          className="ui-pill group inline-flex items-center gap-2 rounded-md border border-white/35 bg-white/[0.04] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.20em] text-white/85 transition-all duration-300 hover:border-white/60 hover:bg-white/10 hover:text-white"
        >
          <ArrowLeft size={14} className="transition-transform group-hover:-translate-x-0.5" />
          Back
        </button>
      )}
    </header>
  );
}

function Hero({ onAccess }: { onAccess: () => void }) {
  return (
    <div className="relative z-10 mx-auto flex w-full max-w-4xl flex-col items-center px-6 text-center">
      <span className="mb-5 text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
        Global operations intelligence
      </span>
      <h1
        className="font-bold leading-[1.04] tracking-[-0.025em] text-white drop-shadow-[0_2px_20px_rgba(0,0,0,0.6)]"
        style={{ fontSize: "clamp(2rem, 5.6vw, 4.4rem)" }}
      >
        Agentic Operations
      </h1>
      <p className="mt-6 max-w-xl text-[14px] font-normal leading-[1.55] text-white/80 drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)] sm:text-[15px]">
        Two specialist agent workforces — procurement and receivables. The agents do the
        work, a human approves every decision, and every action is audited.
      </p>
      <button
        type="button"
        onClick={onAccess}
        className="ui-pill group mt-8 inline-flex items-center gap-3 rounded-md bg-teal-400 px-8 py-3.5 text-[12px] font-bold uppercase tracking-[0.22em] text-neutral-950 transition-all duration-300 hover:bg-teal-300 active:scale-[0.97]"
      >
        Sign in
        <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
      </button>
    </div>
  );
}

function SignInPanel({ onPick }: { onPick: (p: Product) => void }) {
  return (
    <div className="relative z-10 mx-auto w-full max-w-[820px]">
      <div className="text-center mb-8">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300 drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]">
          Choose your workspace
        </span>
        <h2
          className="mt-3 font-bold leading-[1.05] tracking-[-0.02em] text-white drop-shadow-[0_2px_18px_rgba(0,0,0,0.55)]"
          style={{ fontSize: "clamp(1.7rem, 4vw, 2.6rem)" }}
        >
          Sign in
        </h2>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        {PERSONAS.map((p) => (
          <article
            key={p.id}
            style={{ boxShadow: `inset 0 0 0 1px ${ACCENT.hex}33, 0 25px 70px -30px ${ACCENT.halo}` }}
            className="group relative flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 text-white backdrop-blur-xl"
          >
            <span
              aria-hidden
              className="pointer-events-none absolute -right-16 -top-20 size-56 rounded-full opacity-25 blur-3xl"
              style={{ background: ACCENT.hex }}
            />

            <div className="relative flex items-center justify-between gap-3">
              <span className="grid w-10 h-10 shrink-0 place-items-center rounded-xl border border-white/12 bg-white/[0.06] text-white/85">
                <p.icon size={16} strokeWidth={1.75} />
              </span>
              <span
                className="rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                style={{ color: ACCENT.hex, background: `${ACCENT.hex}14`, border: `1px solid ${ACCENT.hex}55` }}
              >
                {p.badge}
              </span>
            </div>

            <h3 className="relative mt-5 text-[19px] font-bold leading-[1.15] tracking-[-0.015em] text-white">
              {p.name}
            </h3>

            <ul className="relative mt-4 space-y-2">
              {p.capabilities.map((cap) => (
                <li key={cap} className="flex items-start gap-2.5 text-[12.5px] leading-[1.5] text-white/80">
                  <span aria-hidden className="mt-[6px] block w-1.5 h-1.5 shrink-0 rounded-full" style={{ background: ACCENT.hex }} />
                  <span>{cap}</span>
                </li>
              ))}
            </ul>

            <div
              className="relative my-5 h-px w-full"
              style={{ background: `linear-gradient(to right, transparent, ${ACCENT.hex}55, transparent)` }}
            />

            <div className="relative mt-auto flex items-center justify-between gap-3">
              <span className="font-mono text-[11px] text-white/45">{p.userId}</span>
              <button
                type="button"
                onClick={() => onPick(p.id)}
                style={{ background: ACCENT.hex }}
                className="ui-pill inline-flex items-center gap-2 rounded-md px-5 py-2.5 text-[11px] font-bold uppercase tracking-[0.2em] text-neutral-950 transition-all duration-300 hover:brightness-110 active:scale-[0.97]"
              >
                <LogIn size={14} />
                Sign in
              </button>
            </div>
          </article>
        ))}
      </div>

      <p className="mt-8 text-center text-[10px] font-semibold uppercase tracking-[0.22em] text-white/55">
        Agents activate on sign-in · every action is audited
      </p>
    </div>
  );
}
