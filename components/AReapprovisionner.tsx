import Link from "next/link";
import { PackageCheck } from "lucide-react";
import StockMeter from "./StockMeter";
import { statutStock } from "@/lib/stock";
import type { Produit } from "@/lib/types";

export default function AReapprovisionner({ produits }: { produits: Produit[] }) {
  const critiques = produits
    .filter((p) => statutStock(p) !== "ok")
    .sort((a, b) => a.quantite - a.seuil_alerte - (b.quantite - b.seuil_alerte))
    .slice(0, 6);

  if (critiques.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-6 text-center text-sm text-chart-muted">
        <PackageCheck className="h-6 w-6 text-good" strokeWidth={2} />
        Tous les produits sont à un niveau de stock sain.
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {critiques.map((p) => (
        <li key={p.id} className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-chart-ink">{p.nom}</p>
            <StockMeter produit={p} />
          </div>
          <Link
            href="/mouvements"
            className="shrink-0 rounded-md border border-zinc-300 px-2.5 py-1 text-xs font-medium text-chart-ink-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Réapprovisionner
          </Link>
        </li>
      ))}
    </ul>
  );
}
