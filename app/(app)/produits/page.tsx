"use client";

import { useEffect, useMemo, useState } from "react";
import { FileDown, Sheet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { Produit } from "@/lib/types";
import { statutStock } from "@/lib/stock";
import ProduitForm from "@/components/ProduitForm";
import AlerteStock from "@/components/AlerteStock";
import StockMeter from "@/components/StockMeter";
import { exporterStockEnExcel, exporterStockEnPdf } from "@/lib/export";

export default function ProduitsPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [recherche, setRecherche] = useState("");
  const [filtre, setFiltre] = useState<"tous" | "alerte">("tous");
  const [rafraichissement, setRafraichissement] = useState(0);

  const declencherRafraichissement = () => setRafraichissement((n) => n + 1);

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);
      const { data } = await supabase
        .from("produits")
        .select("*")
        .order("nom", { ascending: true });
      if (!actif) return;
      setProduits((data as Produit[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [rafraichissement]);

  const produitsFiltres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return produits.filter((p) => {
      const correspond =
        !terme ||
        p.nom.toLowerCase().includes(terme) ||
        p.reference?.toLowerCase().includes(terme) ||
        p.categorie?.toLowerCase().includes(terme);
      const enAlerte = filtre === "tous" || statutStock(p) !== "ok";
      return correspond && enAlerte;
    });
  }, [produits, recherche, filtre]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold text-chart-ink">Produits</h1>
          <p className="text-sm text-chart-muted">{produits.length} référence(s) au catalogue</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => exporterStockEnPdf(produitsFiltres)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm text-chart-ink-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <FileDown className="h-4 w-4" strokeWidth={2} />
            PDF
          </button>
          <button
            onClick={() => exporterStockEnExcel(produitsFiltres)}
            className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-2 text-sm text-chart-ink-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            <Sheet className="h-4 w-4" strokeWidth={2} />
            Excel
          </button>
        </div>
      </div>

      <ProduitForm onCree={declencherRafraichissement} />

      <div className="flex flex-wrap items-center gap-3">
        <input
          type="search"
          placeholder="Rechercher par nom, référence, catégorie…"
          value={recherche}
          onChange={(e) => setRecherche(e.target.value)}
          className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value as "tous" | "alerte")}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="tous">Tous les produits</option>
          <option value="alerte">En alerte / rupture uniquement</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-chart-surface shadow-sm dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-chart-muted dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Référence</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3 text-right">Prix</th>
              <th className="px-4 py-3">Niveau de stock</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-chart-muted">
                  Chargement…
                </td>
              </tr>
            )}
            {!chargement && produitsFiltres.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-chart-muted">
                  Aucun produit trouvé.
                </td>
              </tr>
            )}
            {produitsFiltres.map((p) => {
              const statut = statutStock(p);
              return (
                <tr
                  key={p.id}
                  className={`border-t border-zinc-200 dark:border-zinc-800 ${
                    statut === "rupture"
                      ? "bg-critical/5"
                      : statut === "alerte"
                        ? "bg-warning/5"
                        : ""
                  }`}
                >
                  <td className="px-4 py-2.5 font-medium text-chart-ink">{p.nom}</td>
                  <td className="px-4 py-2.5 text-chart-muted">{p.reference ?? "—"}</td>
                  <td className="px-4 py-2.5">
                    {p.categorie ? (
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs text-chart-ink-secondary dark:bg-zinc-800">
                        {p.categorie}
                      </span>
                    ) : (
                      <span className="text-chart-muted">—</span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-chart-ink">
                    {p.prix.toLocaleString("fr-FR")}
                  </td>
                  <td className="px-4 py-2.5">
                    <StockMeter produit={p} />
                  </td>
                  <td className="px-4 py-2.5">
                    <AlerteStock produit={p} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
