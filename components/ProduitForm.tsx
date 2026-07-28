"use client";

import { useState } from "react";
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
        className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
      >
        + Ajouter un produit
      </button>
    );
  }

  return (
    <form
      onSubmit={gererSoumission}
      className="grid grid-cols-1 gap-3 rounded-lg border border-zinc-200 bg-white p-4 sm:grid-cols-2 lg:grid-cols-3 dark:border-zinc-800 dark:bg-zinc-900"
    >
      <div>
        <label className="block text-sm font-medium">Nom *</label>
        <input
          required
          value={nom}
          onChange={(e) => setNom(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Référence</label>
        <input
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Catégorie</label>
        <input
          value={categorie}
          onChange={(e) => setCategorie(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Prix unitaire</label>
        <input
          type="number"
          min="0"
          step="0.01"
          value={prix}
          onChange={(e) => setPrix(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Quantité initiale</label>
        <input
          type="number"
          min="0"
          value={quantite}
          onChange={(e) => setQuantite(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>
      <div>
        <label className="block text-sm font-medium">Seuil d&apos;alerte</label>
        <input
          type="number"
          min="0"
          value={seuilAlerte}
          onChange={(e) => setSeuilAlerte(e.target.value)}
          className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
        />
      </div>

      {erreur && (
        <p className="col-span-full rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {erreur}
        </p>
      )}

      <div className="col-span-full flex gap-2">
        <button
          type="submit"
          disabled={enregistrement}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          {enregistrement ? "Enregistrement…" : "Enregistrer"}
        </button>
        <button
          type="button"
          onClick={() => setOuvert(false)}
          className="rounded-md border border-zinc-300 px-4 py-2 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
