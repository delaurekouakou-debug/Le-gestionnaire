import { CONFIG_MOUVEMENT } from "./MouvementBadge";
import type { MouvementAvecProduit } from "@/lib/types";

export default function ActiviteRecente({ mouvements }: { mouvements: MouvementAvecProduit[] }) {
  if (mouvements.length === 0) {
    return <p className="text-sm text-chart-muted">Aucun mouvement enregistré.</p>;
  }

  return (
    <ul className="divide-y divide-chart-grid">
      {mouvements.map((m) => {
        const config = CONFIG_MOUVEMENT[m.type];
        return (
          <li key={m.id} className="flex items-center justify-between gap-3 py-2.5">
            <p className="min-w-0 truncate text-sm text-chart-ink">
              <span className="font-medium">{m.produit?.nom ?? "Produit supprimé"}</span>
              <span className="text-chart-muted"> — {config.libelle}</span>
            </p>
            <span
              className={`shrink-0 tabular-nums text-sm font-semibold ${
                m.type === "sortie" ? "text-critical" : "text-chart-ink"
              }`}
            >
              {m.type === "sortie" ? "-" : m.type === "entree" ? "+" : "="}
              {m.quantite}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
