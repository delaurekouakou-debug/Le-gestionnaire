"use client";

import { useEffect, useState } from "react";
import { FileDown, Receipt, Sheet } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import type { MouvementAvecProduit, Produit, TypeMouvement } from "@/lib/types";
import {
  exporterMouvementsEnExcel,
  exporterMouvementsEnPdf,
  genererBonDeLivraisonPdf,
} from "@/lib/export";
import MouvementForm from "@/components/MouvementForm";
import MouvementBadge from "@/components/MouvementBadge";

type FiltreType = "tous" | TypeMouvement;

const LIBELLE_FILTRE: Record<FiltreType, string> = {
  tous: "Tous les mouvements",
  entree: "Entrées",
  sortie: "Sorties",
  ajustement: "Ajustements",
};

function ilYA(jours: number) {
  const d = new Date();
  d.setDate(d.getDate() - jours);
  return d.toISOString().slice(0, 10);
}

const champClasse =
  "mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

export default function MouvementsPage() {
  const { profil } = useAuth();
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvements, setMouvements] = useState<MouvementAvecProduit[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(0);
  const [genereFactureId, setGenereFactureId] = useState<string | null>(null);

  const [dateDebut, setDateDebut] = useState(ilYA(30));
  const [dateFin, setDateFin] = useState(ilYA(0));
  const [typeFiltre, setTypeFiltre] = useState<FiltreType>("tous");

  const declencherRafraichissement = () => setRafraichissement((n) => n + 1);

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);

      const finExclusive = new Date(dateFin);
      finExclusive.setDate(finExclusive.getDate() + 1);

      let requete = supabase
        .from("mouvements")
        .select("*, produit:produits(id, nom, reference)")
        .gte("date", new Date(dateDebut).toISOString())
        .lt("date", finExclusive.toISOString())
        .order("date", { ascending: false })
        .limit(500);

      if (typeFiltre !== "tous") {
        requete = requete.eq("type", typeFiltre);
      }

      const [{ data: produitsData }, { data: mouvementsData }] = await Promise.all([
        supabase.from("produits").select("*").order("nom", { ascending: true }),
        requete,
      ]);
      if (!actif) return;
      setProduits((produitsData as Produit[]) ?? []);
      setMouvements((mouvementsData as MouvementAvecProduit[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [rafraichissement, dateDebut, dateFin, typeFiltre]);

  const periode = { debut: dateDebut, fin: dateFin, typeLibelle: LIBELLE_FILTRE[typeFiltre] };

  const gererFacture = async (m: MouvementAvecProduit) => {
    setGenereFactureId(m.id);
    try {
      await genererBonDeLivraisonPdf(m, profil?.entreprise?.nom ?? "Le Gestionnaire");
    } finally {
      setGenereFactureId(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Mouvements de stock</h1>
        <p className="text-sm text-chart-muted">Entrées, sorties et ajustements — journal d&apos;audit</p>
      </div>

      <MouvementForm produits={produits} onEnregistre={declencherRafraichissement} />

      <div className="rounded-xl border border-zinc-200 bg-chart-surface p-4 shadow-sm dark:border-zinc-800">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <label className="block text-xs font-medium text-chart-muted">Du</label>
            <input
              type="date"
              value={dateDebut}
              max={dateFin}
              onChange={(e) => setDateDebut(e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-chart-muted">Au</label>
            <input
              type="date"
              value={dateFin}
              min={dateDebut}
              max={ilYA(0)}
              onChange={(e) => setDateFin(e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-chart-muted">Type</label>
            <select
              value={typeFiltre}
              onChange={(e) => setTypeFiltre(e.target.value as FiltreType)}
              className={champClasse}
            >
              {(Object.keys(LIBELLE_FILTRE) as FiltreType[]).map((valeur) => (
                <option key={valeur} value={valeur}>
                  {LIBELLE_FILTRE[valeur]}
                </option>
              ))}
            </select>
          </div>

          <div className="ml-auto flex gap-2">
            <button
              onClick={() => exporterMouvementsEnPdf(mouvements, periode)}
              disabled={mouvements.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-chart-ink-secondary transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <FileDown className="h-4 w-4" strokeWidth={2} />
              PDF
            </button>
            <button
              onClick={() => exporterMouvementsEnExcel(mouvements, periode)}
              disabled={mouvements.length === 0}
              className="flex items-center gap-1.5 rounded-md border border-zinc-300 px-3 py-1.5 text-sm text-chart-ink-secondary transition hover:bg-zinc-100 disabled:opacity-50 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              <Sheet className="h-4 w-4" strokeWidth={2} />
              Excel
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-chart-surface shadow-sm dark:border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-chart-muted dark:bg-zinc-900">
            <tr>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Produit</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3 text-right">Quantité</th>
              <th className="px-4 py-3">Note</th>
              <th className="px-4 py-3 text-center">Bon de livraison</th>
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
            {!chargement && mouvements.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-center text-chart-muted">
                  Aucun mouvement sur cette période.
                </td>
              </tr>
            )}
            {mouvements.map((m) => (
              <tr key={m.id} className="border-t border-zinc-200 dark:border-zinc-800">
                <td className="px-4 py-2.5 tabular-nums text-chart-muted">
                  {new Date(m.date).toLocaleString("fr-FR")}
                </td>
                <td className="px-4 py-2.5 font-medium text-chart-ink">
                  {m.produit?.nom ?? "Produit supprimé"}
                </td>
                <td className="px-4 py-2.5">
                  <MouvementBadge type={m.type} />
                </td>
                <td className="px-4 py-2.5 text-right tabular-nums text-chart-ink">{m.quantite}</td>
                <td className="px-4 py-2.5 text-chart-muted">{m.note ?? "—"}</td>
                <td className="px-4 py-2.5 text-center">
                  {m.type === "sortie" && (
                    <button
                      onClick={() => gererFacture(m)}
                      disabled={genereFactureId === m.id}
                      title="Générer le bon de livraison à faire signer"
                      className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-brand-50 text-brand-700 transition hover:bg-brand-100 disabled:opacity-50 dark:bg-brand-900/40 dark:text-brand-300"
                    >
                      <Receipt className="h-3.5 w-3.5" strokeWidth={2} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
