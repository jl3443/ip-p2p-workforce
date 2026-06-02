import * as React from "react";

/**
 * Reveal — opacity-only scroll-fade. Used sparingly per evidence §11
 * (DSM-F has just 14 opacity:0 initial elements vs AGCO's 179).
 */
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            setTimeout(() => el.setAttribute("data-revealed", "true"), delay);
            io.unobserve(el);
          }
        }
      },
      { threshold: 0.1 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);
  return (
    <div ref={ref} data-reveal className={className}>
      {children}
    </div>
  );
}
