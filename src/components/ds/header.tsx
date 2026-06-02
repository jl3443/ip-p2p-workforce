import { cn } from "@/lib/utils";
import { Search, Globe, ChevronDown, ExternalLink } from "lucide-react";
import { Logo } from "./logo";

/**
 * Header — captured layout from dsm-firmenich.com (§13).
 * Dual-row: utility top + main nav.
 */

const UTILITY_LINKS = [
  { label: "Our company", hasChildren: true },
  { label: "Careers", hasChildren: true },
  { label: "Investors", hasChildren: true },
  { label: "Sustainability", hasChildren: true },
  { label: "News" },
  { label: "Contact us" },
  { label: "Animal Nutrition & Health", external: true },
];

const MAIN_NAV = [
  "Perfumery & Beauty",
  "Taste, Texture & Health",
  "Health, Nutrition & Care",
];

export { Logo };

export function SiteHeader({ tone = "inverse" }: { tone?: "default" | "inverse" }) {
  const isInverse = tone === "inverse";
  return (
    <header className={cn(isInverse ? "text-white" : "text-black")}>
      {/* Utility row — dark on inverse hero */}
      <div className={cn("w-full text-[14px]", isInverse ? "bg-black/80 text-white" : "bg-[color:var(--surface-fog)] text-black")}>
        <div className="mx-auto max-w-[1456px] flex items-center justify-end gap-8 px-6 py-3">
          {UTILITY_LINKS.map((l) => (
            <a
              key={l.label}
              href="#"
              className="font-normal hover:underline underline-offset-4 inline-flex items-center gap-1"
            >
              {l.label}
              {l.hasChildren && <ChevronDown className="w-3 h-3" />}
              {l.external && <ExternalLink className="w-3 h-3" />}
            </a>
          ))}
          <a href="#" className="inline-flex items-center gap-1 font-normal">
            EN <Globe className="w-3 h-3" />
          </a>
        </div>
      </div>

      {/* Main nav */}
      <div className="mx-auto max-w-[1456px] flex items-center justify-between px-6 py-5">
        <Logo tone={tone} />
        <nav className="flex items-center gap-8 text-[14px] font-bold">
          {MAIN_NAV.map((l) => (
            <a
              key={l}
              href="#"
              className="inline-flex items-center gap-1 hover:underline underline-offset-4"
            >
              {l} <ChevronDown className="w-3 h-3" />
            </a>
          ))}
          <button aria-label="Search" className="opacity-90">
            <Search className="w-5 h-5" />
          </button>
          <a
            href="#"
            className="ui-pill inline-flex items-center justify-center text-[14px] font-bold py-[9px] px-[15px] rounded-[9999px] border-[1.5px] border-current bg-transparent"
          >
            Login
          </a>
        </nav>
      </div>
    </header>
  );
}
