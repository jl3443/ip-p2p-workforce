import { Logo } from "./header";

const FOOTER_COLUMNS = [
  {
    title: "Our company",
    links: ["About us", "Leadership", "Our values", "Locations", "Press"],
  },
  {
    title: "Businesses",
    links: [
      "Perfumery & Beauty",
      "Taste, Texture & Health",
      "Health, Nutrition & Care",
      "Animal Nutrition & Health",
    ],
  },
  {
    title: "Sustainability",
    links: ["Our approach", "Reporting", "Science-based targets", "Reports"],
  },
  {
    title: "Careers",
    links: ["Search jobs", "Our culture", "Early careers", "Benefits"],
  },
];

/**
 * Footer — white surface, black text, no chrome (§14).
 */
export function SiteFooter() {
  return (
    <footer className="bg-white text-black border-t border-[color:var(--divider)]">
      <div className="mx-auto max-w-[1456px] px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-12 mb-16">
          <div>
            <Logo tone="default" />
            <p className="text-[14px] leading-[24px] mt-6 text-[color:var(--mute)]">
              Innovators in nutrition, health, and beauty — bringing progress to life.
            </p>
          </div>
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="text-[14px] font-bold mb-4">{col.title}</div>
              <ul className="space-y-3">
                {col.links.map((l) => (
                  <li key={l}>
                    <a href="#" className="text-[14px] hover:underline underline-offset-4">
                      {l}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 pt-8 border-t border-[color:var(--divider)] text-[14px] text-[color:var(--mute)]">
          <div>© 2026 DSM-Firmenich AG. All rights reserved.</div>
          <div className="flex gap-6">
            <a href="#" className="hover:underline underline-offset-4">Privacy</a>
            <a href="#" className="hover:underline underline-offset-4">Terms</a>
            <a href="#" className="hover:underline underline-offset-4">Cookie preferences</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
