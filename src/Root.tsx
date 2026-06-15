import * as React from "react";
import P2pApp from "@/App";
import O2cApp from "@/o2c/App";
import { ProductSelector } from "@/views/ProductSelector";

export type Product = "p2p" | "o2c";

/**
 * Houses both agentic workforces in one shell. The selector is the entry; each
 * product runs its own self-contained app (its own login, cockpit and agents).
 * "← All workforces" on a product's landing returns here.
 */
export function Root() {
  const [product, setProduct] = React.useState<Product | null>(null);
  const back = () => setProduct(null);

  if (product === "p2p") return <P2pApp onExit={back} />;
  if (product === "o2c") return <O2cApp onExit={back} />;
  return <ProductSelector onPick={setProduct} />;
}
