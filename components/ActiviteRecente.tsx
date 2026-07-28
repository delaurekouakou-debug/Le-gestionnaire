import { CONFIG_MOUVEMENT } from "./MouvementBadge";
import type { MouvementAvecProduit } from "@/lib/types";

export default function ActiviteRecente({ mouvements }: { mouvements: MouvementAvecProduit[] }) {
  if (mouvements.length === 0) {
    return <p className="text-sm text-chart-muted">Aucun mouvement enregistré.</p>;
  }

  return (
    <ul className="space-y-1">
      {mouvements.map((m) => {
        const config = CONFIG_MOUVEMENT[m.type];
        const Icone = config.icone;
        return (
          <li key={m.id} className="flex items-center gap-3 rounded-lg px-2 py-2 hover:bg-zinc-50 dark:hover:bg-zinc-900">
            <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${config.classe}`}>
              <Icone className="h-4 w-4" strokeWidth={2.25} />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-chart-ink">
                {m.produit?.nom ?? "Produit supprimé"}
              </p>
              <p className="text-xs text-chart-muted">
                {config.libelle} · {new Date(m.date).toLocaleString("fr-FR", {
                  day: "2-digit",
                  month: "2-digit",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <span className="tabular-nums text-sm font-medium text-chart-ink-secondary">
              {m.type === "sortie" ? "-" : m.type === "entree" ? "+" : "="}
              {m.quantite}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
