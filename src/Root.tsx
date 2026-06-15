import * as React from "react";
import P2pApp from "@/App";
import O2cApp from "@/o2c/App";
import { EntryLogin } from "@/views/EntryLogin";

export type Product = "p2p" | "o2c";

/**
 * Both agentic workforces behind one sign-in. The entry is a single sign-in
 * screen with two persona cards (Procurement / Receivables); picking one signs
 * straight into that workforce. Signing out returns here.
 */
export function Root() {
  const [launched, setLaunched] = React.useState<Product | null>(null);
  const back = () => setLaunched(null);

  if (launched === "p2p") return <P2pApp startSignedIn onExit={back} />;
  if (launched === "o2c") return <O2cApp startSignedIn onExit={back} />;
  return <EntryLogin onPick={setLaunched} />;
}
