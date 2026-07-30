import { statutStock } from "@/lib/stock";
import type { Produit } from "@/lib/types";

export { statutStock };

const STYLES = {
  rupture: "border border-critical text-critical",
  alerte: "border border-warning text-[#8a5a00] dark:text-warning",
};

const LIBELLES = {
  rupture: "Rupture",
  alerte: "Alerte",
  ok: "En stock",
};

export default function AlerteStock({
  produit,
}: {
  produit: Pick<Produit, "quantite" | "seuil_alerte">;
}) {
  const statut = statutStock(produit);

  if (statut === "ok") {
    return <span className="text-xs text-chart-muted">{LIBELLES.ok}</span>;
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 text-xs font-medium ${STYLES[statut]}`}>
      {LIBELLES[statut]}
    </span>
  );
}
