import { statutStock } from "@/lib/stock";
import type { Produit } from "@/lib/types";

const COULEURS = {
  ok: "bg-good",
  alerte: "bg-warning",
  rupture: "bg-critical",
};

export default function StockMeter({
  produit,
}: {
  produit: Pick<Produit, "quantite" | "seuil_alerte">;
}) {
  const statut = statutStock(produit);
  const echelle = Math.max(produit.seuil_alerte * 2, produit.quantite, 1);
  const remplissage = Math.min((produit.quantite / echelle) * 100, 100);
  const seuilPosition = Math.min((produit.seuil_alerte / echelle) * 100, 100);

  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 w-24 rounded-full bg-zinc-200 dark:bg-zinc-800">
        <div
          className={`h-1.5 rounded-full ${COULEURS[statut]}`}
          style={{ width: `${remplissage}%` }}
        />
        <div
          className="absolute top-1/2 h-2.5 w-px -translate-y-1/2 bg-chart-baseline"
          style={{ left: `${seuilPosition}%` }}
          title={`Seuil d'alerte : ${produit.seuil_alerte}`}
        />
      </div>
      <span className="tabular-nums text-xs text-chart-ink-secondary">{produit.quantite}</span>
    </div>
  );
}
