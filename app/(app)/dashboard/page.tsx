"use client";

import { useEffect, useMemo, useState } from "react";
import { Boxes, PackageX, ArrowLeftRight, TriangleAlert } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import type { MouvementAvecProduit, Produit, TypeMouvement } from "@/lib/types";
import { statutStock } from "@/lib/stock";
import StatCard from "@/components/StatCard";
import MouvementsBarChart, { type JourMouvements } from "@/components/charts/MouvementsBarChart";
import RepartitionStockBar from "@/components/charts/RepartitionStockBar";
import ActiviteRecente from "@/components/ActiviteRecente";
import AReapprovisionner from "@/components/AReapprovisionner";

type FiltreType = "tous" | TypeMouvement;

const LIBELLE_FILTRE: Record<FiltreType, string> = {
  tous: "Tous les mouvements",
  entree: "Entrées",
  sortie: "Sorties",
  ajustement: "Ajustements",
};

function debutJour(date: Date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function ilYA(jours: number) {
  return debutJour(new Date(Date.now() - jours * 86400000)).toISOString().slice(0, 10);
}

const champClasse =
  "mt-1 rounded-md border border-zinc-300 px-3 py-1.5 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

export default function DashboardPage() {
  const [produits, setProduits] = useState<Produit[]>([]);
  const [mouvementsPeriode, setMouvementsPeriode] = useState<MouvementAvecProduit[]>([]);
  const [chargement, setChargement] = useState(true);

  const [dateDebut, setDateDebut] = useState(ilYA(6));
  const [dateFin, setDateFin] = useState(ilYA(0));
  const [typeFiltre, setTypeFiltre] = useState<FiltreType>("tous");

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);

      const debut = debutJour(new Date(dateDebut));
      const finExclusive = new Date(dateFin);
      finExclusive.setDate(finExclusive.getDate() + 1);
      finExclusive.setHours(0, 0, 0, 0);

      let requeteMouvements = supabase
        .from("mouvements")
        .select("*, produit:produits(id, nom, reference)")
        .gte("date", debut.toISOString())
        .lt("date", finExclusive.toISOString())
        .order("date", { ascending: false })
        .limit(500);

      if (typeFiltre !== "tous") {
        requeteMouvements = requeteMouvements.eq("type", typeFiltre);
      }

      const [{ data: produitsData }, { data: mouvementsData }] = await Promise.all([
        supabase.from("produits").select("*"),
        requeteMouvements,
      ]);

      if (!actif) return;
      setProduits((produitsData as Produit[]) ?? []);
      setMouvementsPeriode((mouvementsData as MouvementAvecProduit[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [dateDebut, dateFin, typeFiltre]);

  const stats = useMemo(() => {
    const valeurStock = produits.reduce((total, p) => total + p.prix * p.quantite, 0);
    const enAlerte = produits.filter((p) => statutStock(p) === "alerte").length;
    const enRupture = produits.filter((p) => statutStock(p) === "rupture").length;
    const ok = produits.length - enAlerte - enRupture;
    return { valeurStock, enAlerte, enRupture, ok, nbProduits: produits.length };
  }, [produits]);

  const jours = useMemo<JourMouvements[]>(() => {
    const debut = debutJour(new Date(dateDebut));
    const fin = debutJour(new Date(dateFin));
    const nbJours = Math.min(
      92,
      Math.max(1, Math.round((fin.getTime() - debut.getTime()) / 86400000) + 1)
    );

    const base: JourMouvements[] = [];
    for (let i = 0; i < nbJours; i++) {
      const jour = new Date(debut);
      jour.setDate(jour.getDate() + i);
      base.push({
        libelle: jour.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" }),
        entree: 0,
        sortie: 0,
      });
    }

    mouvementsPeriode.forEach((m) => {
      const jourMouvement = debutJour(new Date(m.date));
      const indexJour = Math.round((jourMouvement.getTime() - debut.getTime()) / 86400000);
      if (indexJour < 0 || indexJour >= base.length) return;
      if (m.type === "entree") base[indexJour].entree += m.quantite;
      if (m.type === "sortie") base[indexJour].sortie += m.quantite;
    });

    return base;
  }, [mouvementsPeriode, dateDebut, dateFin]);

  const mouvementsPeriodeTotal = jours.reduce((t, j) => t + j.entree + j.sortie, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Tableau de bord</h1>
        <p className="text-sm text-chart-muted">Vue d&apos;ensemble de l&apos;activité du stock</p>
      </div>

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
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          icon={Boxes}
          label="Valeur totale du stock"
          value={chargement ? "…" : `${stats.valeurStock.toLocaleString("fr-FR")} F`}
          accent="brand"
        />
        <StatCard
          icon={TriangleAlert}
          label="Produits en alerte"
          value={chargement ? "…" : String(stats.enAlerte)}
          sousLibelle="Sous le seuil de réapprovisionnement"
          accent="warning"
        />
        <StatCard
          icon={PackageX}
          label="Produits en rupture"
          value={chargement ? "…" : String(stats.enRupture)}
          sousLibelle="Quantité à zéro"
          accent="critical"
        />
        <StatCard
          icon={ArrowLeftRight}
          label="Mouvements (période)"
          value={chargement ? "…" : String(mouvementsPeriodeTotal)}
          sousLibelle={LIBELLE_FILTRE[typeFiltre]}
          accent="brand"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">Mouvements — période sélectionnée</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <MouvementsBarChart jours={jours} />
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">Répartition du stock</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <RepartitionStockBar ok={stats.ok} alerte={stats.enAlerte} rupture={stats.enRupture} />
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-2">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">À réapprovisionner</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <AReapprovisionner produits={produits} />
          )}
        </div>

        <div className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800 lg:col-span-3">
          <h2 className="mb-4 text-sm font-semibold text-chart-ink">Activité — période sélectionnée</h2>
          {chargement ? (
            <p className="text-sm text-chart-muted">Chargement…</p>
          ) : (
            <ActiviteRecente mouvements={mouvementsPeriode.slice(0, 8)} />
          )}
        </div>
      </div>
    </div>
  );
}
