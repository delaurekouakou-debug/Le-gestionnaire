"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

interface Props {
  onCree: () => void;
}

export default function ProduitForm({ onCree }: Props) {
  const { profil } = useAuth();
  const [ouvert, setOuvert] = useState(false);
  const [nom, setNom] = useState("");
  const [reference, setReference] = useState("");
  const [categorie, setCategorie] = useState("");
  const [prix, setPrix] = useState("0");
  const [quantite, setQuantite] = useState("0");
  const [seuilAlerte, setSeuilAlerte] = useState("5");
  const [erreur, setErreur] = useState<string | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);

  const reinitialiser = () => {
    setNom("");
    setReference("");
    setCategorie("");
    setPrix("0");
    setQuantite("0");
    setSeuilAlerte("5");
  };

  const gererSoumission = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profil) return;
    setErreur(null);
    setEnregistrement(true);

    const { error } = await supabase.from("produits").insert({
      entreprise_id: profil.entreprise_id,
      nom,
      reference: reference || null,
      categorie: categorie || null,
      prix: Number(prix),
      quantite: Number(quantite),
      seuil_alerte: Number(seuilAlerte),
    });

    setEnregistrement(false);
    if (error) {
      setErreur(error.message);
      return;
    }

    reinitialiser();
    setOuvert(false);
    onCree();
  };

  if (!ouvert) {
    return (
      <button
        onClick={() => setOuvert(true)}
        className="flex items-center gap-1.5 rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700"
      >
        <Plus className="h-4 w-4" strokeWidth={2.5} />
        Ajouter un produit
      </button>
    );
  }

  const champClasse =
    "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950";

  return (
    <form
      onSubmit={gererSoumission}
      className="grid grid-cols-1 gap-3 rounded-xl border border-zinc-200 bg-chart-surface p-4 shadow-sm sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800"
    >
      <div>
        <label className="block text-sm font-medium text-chart-ink">Nom *</label>
        <input required value={nom} onChange={(e) => setNom(e.target.value)} className={champClasse} />
      </div>
      <div>
        <label className="block text-sm font-medium text-chart-ink">Référence</label>
        <input value={reference} onChange={(e) => setReference(e.target.value)} className={champClasse} />
      </div>
      <div>
        <label className="block text-sm font-medium text-chart-ink">Catégorie</label>
        <input value={categorie} onChange={(e) => setCategorie(e.target.value)} className={champClasse} />
      </div>
      <div>
        <label className="block text-sm font-medium text-chart-ink">Prix unitaire</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          className={champClasse}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-chart-ink">Quantité initiale</label>
        <input
          type="number"
          min="0"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          className={champClasse}
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-chart-ink">Seuil d&apos;alerte</label>
        <input
          type="number"
          min="0"
          value={seuilAlerte}
          onChange={(e) => setSeuilAlerte(e.target.value)}
          className={champClasse}
        />
      </div>

      {erreur && (
        <p className="col-span-full rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
      )}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={enregistrement}
          className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white hover:bg-brand-700 disabled:opacity-50"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm text-chart-ink-secondary hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
