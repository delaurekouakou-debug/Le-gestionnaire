"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import type { Produit } from "@/lib/types";
import ProduitForm from "@/components/ProduitForm";
import AlerteStock, { statutStock } from "@/components/AlerteStock";
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
        <h1 className="text-xl font-bold">Produits</h1>
        <div className="flex gap-2">
          <button
            onClick={() => exporterStockEnPdf(produitsFiltres)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Exporter PDF
          </button>
          <button
            onClick={() => exporterStockEnExcel(produitsFiltres)}
            className="rounded-md border border-zinc-300 px-3 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
          >
            Exporter Excel
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
          className="w-full max-w-sm rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        />
        <select
          value={filtre}
          onChange={(e) => setFiltre(e.target.value as "tous" | "alerte")}
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
        >
          <option value="tous">Tous les produits</option>
          <option value="alerte">En alerte / rupture uniquement</option>
        </select>
      </div>

      <div className="overflow-x-auto rounded-lg border border-zinc-200 dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-100 text-left dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-2">Nom</th>
              <th className="px-4 py-2">Référence</th>
              <th className="px-4 py-2">Catégorie</th>
              <th className="px-4 py-2 text-right">Prix</th>
              <th className="px-4 py-2 text-right">Quantité</th>
              <th className="px-4 py-2">Statut</th>
            </tr>
          </thead>
          <tbody>
            {chargement && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Chargement…
                </td>
              </tr>
            )}
            {!chargement && produitsFiltres.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-zinc-500">
                  Aucun produit trouvé.
                </td>
              </tr>
            )}
            {produitsFiltres.map((p) => (
              <tr key={p.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-2 font-medium">{p.nom}</td>
                <td className="px-4 py-2 text-zinc-500">{p.reference ?? "—"}</td>
                <td className="px-4 py-2 text-zinc-500">{p.categorie ?? "—"}</td>
                <td className="px-4 py-2 text-right">{p.prix.toLocaleString("fr-FR")}</td>
                <td className="px-4 py-2 text-right">{p.quantite}</td>
                <td className="px-4 py-2">
                  <AlerteStock produit={p} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
