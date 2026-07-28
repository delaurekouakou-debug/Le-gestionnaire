import type { Produit } from "./types";

export type StatutStock = "rupture" | "alerte" | "ok";

export function statutStock(
  produit: Pick<Produit, "quantite" | "seuil_alerte">
): StatutStock {
  if (produit.quantite <= 0) return "rupture";
  if (produit.quantite <= produit.seuil_alerte) return "alerte";
  return "ok";
}
