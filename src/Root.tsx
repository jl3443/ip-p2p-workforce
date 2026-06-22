import * as React from "react";
import P2pApp from "@/App";
import O2cApp from "@/o2c/App";
import FreightApp from "@/freight/App";
import MroApp from "@/mro/App";
import { EntryLogin } from "@/views/EntryLogin";

export type Product = "p2p" | "o2c" | "freight" | "mro";

/**
 * Four agentic workforces behind one sign-in. The entry shows persona cards
 * (Procurement · Receivables · Freight · MRO); picking one signs straight into
 * that workforce. Signing out returns here.
 */
export function Root() {
  const [launched, setLaunched] = React.useState<Product | null>(null);
  const back = () => setLaunched(null);

  if (launched === "p2p") return <P2pApp startSignedIn onExit={back} />;
  if (launched === "o2c") return <O2cApp startSignedIn onExit={back} />;
  if (launched === "freight") return <FreightApp startSignedIn onExit={back} />;
  if (launched === "mro") return <MroApp startSignedIn onExit={back} />;
  return <EntryLogin onPick={setLaunched} />;
}
