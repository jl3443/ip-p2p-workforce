import { useApp } from "@/state";
import { SpringIn } from "@/components/ai/SpringIn";
import { CountUp } from "@/components/ai/CountUp";
import { PillButton } from "@/components/blocks/PillButton";
import { docLinksByFlow } from "@/data/flows";

const docLabels: Record<string, string> = {
  "purchase-req": "Purchase requisition",
  "bid-comparison": "Three-bid comparison",
  "draft-po": "Draft purchase order",
  "envelope-report": "Control-check report",
};

export function DecisionCardBelt({
  awaiting,
  finished,
  onApprove,
}: {
  awaiting: boolean;
  finished: boolean;
  onApprove: () => void;
}) {
  const { go } = useApp();

  if (finished) {
    return (
      <SpringIn>
        <section className="bg-surface-mint border-2 border-surface-deep rounded-md p-7 space-y-3">
          <div className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Paid · audit closed
          </div>
          <h3 className="text-[22px] font-bold text-ink leading-[28px]">
            $48,200 paid · the loop is closed
          </h3>
          <p className="text-[14px] text-ink">
            The belt was received at the mill, the invoice three-way matched with zero variance, and
            payment went out on the net-30 terms. The audit envelope is closed with all six artifacts
            attached — one trail from the maintenance note to the remittance.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <PillButton
              variant="secondary"
              size="md"
              onClick={() => go({ kind: "doc", id: "payment-advice" })}
            >
              Open remittance
            </PillButton>
            <PillButton variant="primary" size="md" arrow onClick={() => go({ kind: "cockpit" })}>
              Back to cockpit
            </PillButton>
          </div>
        </section>
      </SpringIn>
    );
  }

  if (!awaiting) {
    return (
      <SpringIn>
        <section className="bg-surface-mint border-2 border-surface-deep rounded-md p-7 space-y-3">
          <div className="text-[12px] tracking-[0.08em] uppercase text-surface-deep font-medium">
            Approved · order issued
          </div>
          <h3 className="text-[22px] font-bold text-ink leading-[28px]">Order on its way</h3>
          <p className="text-[14px] text-ink">
            Purchase order PO-77310 is posted to BeltPro Industrial. The agents take it from here —
            receive the belt at the mill, match the invoice and release payment, with no further
            buyer touch.
          </p>
        </section>
      </SpringIn>
    );
  }

  return (
    <SpringIn>
      <section className="bg-white border-2 border-ink rounded-md p-7 space-y-5">
        <header>
          <div className="text-[12px] tracking-[0.08em] uppercase text-mark-red font-medium">
            Decision card
          </div>
          <h3 className="text-[22px] font-bold text-ink leading-[28px] mt-1">
            Issue the order for the corrugator belt
          </h3>
        </header>

        <div className="grid grid-cols-4 gap-0 divide-x divide-divider">
          {[
            { label: "Order value", value: 48.2, prefix: "$", suffix: "K", decimals: 1 },
            { label: "Saving", value: 9, suffix: "%", decimals: 0 },
            { label: "Lead time", display: "5 days" },
            { label: "Risk", display: "Low" },
          ].map((m, i) => (
            <div key={m.label} className="px-4 first:pl-0 last:pr-0">
              <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium mb-1">
                {m.label}
              </div>
              <div className="text-[24px] font-bold leading-none text-ink">
                {"value" in m && m.value !== undefined ? (
                  <CountUp
                    to={m.value}
                    decimals={m.decimals ?? 0}
                    prefix={m.prefix}
                    suffix={m.suffix}
                    delay={i * 80}
                    duration={900}
                  />
                ) : (
                  m.display
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="rounded-md bg-surface-mint/50 border border-surface-deep/15 p-4">
          <div className="text-[11px] uppercase tracking-[0.08em] text-surface-deep font-medium mb-1">
            Recommended supplier
          </div>
          <div className="text-[15px] font-bold text-ink">BeltPro Industrial · on-contract</div>
          <div className="text-[13px] text-mute mt-0.5">
            Cheapest of three bids, fastest to the mill, and already on the framework contract — so
            the price and terms are pre-agreed.
          </div>
        </div>

        <div>
          <div className="text-[11px] uppercase tracking-[0.08em] text-mute font-medium mb-2">
            What the agents prepared
          </div>
          <div className="flex flex-wrap gap-2">
            {docLinksByFlow.belt.map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => go({ kind: "doc", id })}
                className="ui-pill text-[13px] px-3 py-1.5 rounded-full bg-surface-fog text-ink hover:bg-surface-mint inline-flex items-center gap-1.5"
              >
                {docLabels[id]}
                <span aria-hidden>↗</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 pt-2">
          <PillButton
            variant="secondary"
            size="lg"
            onClick={() => go({ kind: "doc", id: "draft-po" })}
          >
            Open draft order
          </PillButton>
          <PillButton variant="primary" size="lg" arrow onClick={onApprove}>
            Approve and issue
          </PillButton>
        </div>
      </section>
    </SpringIn>
  );
}
