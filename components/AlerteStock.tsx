import type { Produit } from "@/lib/types";

export function statutStock(produit: Pick<Produit, "quantite" | "seuil_alerte">) {
  if (produit.quantite <= 0) return "rupture" as const;
  if (produit.quantite <= produit.seuil_alerte) return "alerte" as const;
  return "ok" as const;
}

const STYLES = {
  rupture: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  alerte: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  ok: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
};

const LIBELLES = {
  rupture: "Rupture",
  alerte: "Stock bas",
  ok: "En stock",
};

export default function AlerteStock({
  produit,
}: {
  produit: Pick<Produit, "quantite" | "seuil_alerte">;
}) {
  const statut = statutStock(produit);
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${STYLES[statut]}`}
    >
      {LIBELLES[statut]}
    </span>
  );
}
