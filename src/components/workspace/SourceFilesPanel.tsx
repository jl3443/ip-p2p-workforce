import {
  Mail,
  FileText,
  ScrollText,
  Wallet,
  Building2,
  Globe,
  FileCode2,
  BookOpen,
  ReceiptText,
  ArrowRight,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { SourceArtifact, SourceKind } from "@/data/runSteps";

const kindIcon: Record<SourceKind, LucideIcon> = {
  sap: FileText,
  email: Mail,
  contract: ScrollText,
  policy: ScrollText,
  budget: Wallet,
  master: Building2,
  external: Globe,
  edi: FileCode2,
  kb: BookOpen,
  invoice: ReceiptText,
};

export function SourceFilesPanel({
  sources,
  onOpen,
}: {
  sources: SourceArtifact[];
  onOpen: (s: SourceArtifact) => void;
}) {
  return (
    <aside className="bg-white border border-divider rounded-md overflow-hidden flex flex-col shrink-0">
      <div className="px-4 pt-4 pb-3 border-b border-divider">
        <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium">
          Source files
        </div>
        <div className="text-[15px] font-bold text-ink mt-0.5">
          {sources.length} inputs · click to inspect
        </div>
      </div>

      <ul className="p-2 space-y-1.5">
        {sources.map((s) => {
          const Icon = kindIcon[s.kind];
          return (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => onOpen(s)}
                className={cn(
                  "ui-pill group w-full text-left rounded-md border border-divider px-3 py-2.5",
                  "flex items-start gap-3 hover:border-surface-deep hover:bg-surface-fog",
                )}
              >
                <span className="w-8 h-8 rounded-md bg-surface-mint/60 text-surface-deep flex items-center justify-center shrink-0">
                  <Icon size={15} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5">
                    <span className="text-[13px] font-medium text-ink leading-tight truncate">
                      {s.label}
                    </span>
                    {s.handoff && (
                      <span className="text-[9px] uppercase tracking-[0.06em] bg-surface-deep text-ink-inverse px-1 py-0.5 rounded shrink-0">
                        handoff
                      </span>
                    )}
                  </span>
                  <span className="block text-[11px] text-mute leading-snug mt-0.5 truncate">
                    {s.meta}
                  </span>
                </span>
                <ArrowRight
                  size={14}
                  className="text-mute opacity-0 group-hover:opacity-100 transition-opacity shrink-0 mt-1"
                />
              </button>
            </li>
          );
        })}
      </ul>
    </aside>
  );
}
