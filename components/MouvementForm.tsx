"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import type { Produit, TypeMouvement } from "@/lib/types";

interface Props {
  produits: Produit[];
  onEnregistre: () => void;
}

const TYPES: { valeur: TypeMouvement; libelle: string; aide: string }[] = [
  { valeur: "entree", libelle: "Entrée", aide: "Quantité ajoutée au stock" },
  { valeur: "sortie", libelle: "Sortie", aide: "Quantité retirée du stock" },
  {
    valeur: "ajustement",
    libelle: "Ajustement",
    aide: "Nouvelle quantité exacte après inventaire",
  },
];

const champClasse =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950";

export default function MouvementForm({ produits, onEnregistre }: Props) {
  const { session } = useAuth();
  const [produitId, setProduitId] = useState("");
  const [type, setType] = useState<TypeMouvement>("entree");
  const [quantite, setQuantite] = useState("1");
  const [note, setNote] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!session || !produitId) return;
    setErreur(null);
    setEnregistrement(true);

    const { error } = await supabase.from("mouvements").insert({
      produit_id: produitId,
      utilisateur_id: session.user.id,
      type,
      quantite: Number(quantite),
      note: note || null,
    });

    setEnregistrement(false);
    if (error) {
      setErreur(error.message);
      return;
    }

    setQuantite("1");
    setNote("");
    onEnregistre();
  };

  return (
    <form
      onSubmit={gererSoumission}
      className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-chart-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-zinc-800"
    >
      <div className="lg:col-span-2">
        <label className="block text-sm font-medium text-chart-ink">Produit *</label>
        <select
          required
          value={produitId}
          onChange={(e) => setProduitId(e.target.value)}
          className={champClasse}
        >
          <option value="" disabled>
            Sélectionner un produit
          </option>
          {produits.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nom} {p.reference ? `(${p.reference})` : ""} — stock actuel : {p.quantite}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium text-chart-ink">Type *</label>
        <select
          value={type}
          onChange={(e) => setType(e.target.value as TypeMouvement)}
          className={champClasse}
        >
          {TYPES.map((t) => (
            <option key={t.valeur} value={t.valeur}>
              {t.libelle}
            </option>
          ))}
        </select>
        <p className="mt-1 text-xs text-chart-muted">
          {TYPES.find((t) => t.valeur === type)?.aide}
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-chart-ink">Quantité *</label>
        <input
          type="number"
          min="0"
          required
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          className={champClasse}
        />
      </div>

      <div className="lg:col-span-3">
        <label className="block text-sm font-medium text-chart-ink">Note (optionnel)</label>
        <input
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Ex : livraison fournisseur, vente comptoir, inventaire…"
          className={champClasse}
        />
      </div>

      {erreur && (
        <p className="col-span-full rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
      )}

      <div className="col-span-full">
        <button
          type="submit"
          disabled={enregistrement || !produitId}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer le mouvement"}
        </button>
      </div>
    </form>
  );
}
