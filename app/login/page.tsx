"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

type Mode = "connexion" | "creer" | "rejoindre";

export default function LoginPage() {
  const router = useRouter();
  const { rafraichirProfil } = useAuth();

  const [mode, setMode] = useState<Mode>("connexion");
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nom, setNom] = useState("");
  const [nomEntreprise, setNomEntreprise] = useState("");
  const [codeEntreprise, setCodeEntreprise] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const allerAuTableauDeBord = () => {
    router.push("/dashboard");
    router.refresh();
  };

  const gererConnexion = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    setChargement(false);
    if (error) {
      setErreur("Identifiants invalides. Vérifiez votre email et mot de passe.");
      return;
    }
    allerAuTableauDeBord();
  };

  const gererCreationEntreprise = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: motDePasse,
    });
    if (authError || !authData.user) {
      setChargement(false);
      setErreur(authError?.message ?? "Impossible de créer le compte.");
      return;
    }

    const { data: entreprise, error: entrepriseError } = await supabase
      .from("entreprises")
      .insert({ nom: nomEntreprise })
      .select()
      .single();
    if (entrepriseError || !entreprise) {
      setChargement(false);
      setErreur(
        "Compte créé mais impossible de créer l'entreprise : " +
          (entrepriseError?.message ?? "erreur inconnue")
      );
      return;
    }

    const { error: profilError } = await supabase.from("utilisateurs").insert({
      id: authData.user.id,
      entreprise_id: entreprise.id,
      nom,
      role: "admin",
    });
    setChargement(false);
    if (profilError) {
      setErreur("Impossible de créer le profil : " + profilError.message);
      return;
    }

    await rafraichirProfil();
    allerAuTableauDeBord();
  };

  const gererRejoindre = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setChargement(true);

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password: motDePasse,
    });
    if (authError || !authData.user) {
      setChargement(false);
      setErreur(authError?.message ?? "Impossible de créer le compte.");
      return;
    }

    const { error: profilError } = await supabase.from("utilisateurs").insert({
      id: authData.user.id,
      entreprise_id: codeEntreprise.trim(),
      nom,
      role: "employe",
    });
    setChargement(false);
    if (profilError) {
      setErreur(
        "Impossible de rejoindre l'entreprise. Vérifiez le code fourni par votre administrateur : " +
          profilError.message
      );
      return;
    }

    await rafraichirProfil();
    allerAuTableauDeBord();
  };

  const gererSoumission =
    mode === "connexion"
      ? gererConnexion
      : mode === "creer"
        ? gererCreationEntreprise
        : gererRejoindre;

  return (
    <div className="flex flex-1 items-center justify-center px-4 py-12">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Le Gestionnaire</h1>
          <p className="mt-1 text-sm text-zinc-500">Gestion de stock pour PME</p>
        </div>

        <div className="flex rounded-lg border border-zinc-200 p-1 text-sm dark:border-zinc-800">
          {(
            [
              ["connexion", "Connexion"],
              ["creer", "Créer une entreprise"],
              ["rejoindre", "Rejoindre"],
            ] as [Mode, string][]
          ).map(([valeur, libelle]) => (
            <button
              key={valeur}
              type="button"
              onClick={() => {
                setMode(valeur);
                setErreur(null);
              }}
              className={`flex-1 whitespace-nowrap rounded-md px-1.5 py-1.5 text-xs transition sm:text-sm ${
                mode === valeur
                  ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                  : "text-zinc-500 hover:text-zinc-900 dark:hover:text-white"
              }`}
            >
              {libelle}
            </button>
          ))}
        </div>

        <form onSubmit={gererSoumission} className="space-y-4">
          {mode !== "connexion" && (
            <div>
              <label className="block text-sm font-medium">Votre nom</label>
              <input
                type="text"
                required
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}

          {mode === "creer" && (
            <div>
              <label className="block text-sm font-medium">Nom de l&apos;entreprise</label>
              <input
                type="text"
                required
                value={nomEntreprise}
                onChange={(e) => setNomEntreprise(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}

          {mode === "rejoindre" && (
            <div>
              <label className="block text-sm font-medium">Code entreprise</label>
              <input
                type="text"
                required
                placeholder="Fourni par votre administrateur"
                value={codeEntreprise}
                onChange={(e) => setCodeEntreprise(e.target.value)}
                className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Mot de passe</label>
            <input
              type="password"
              required
              minLength={6}
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className="mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
          </div>

          {erreur && (
            <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
              {erreur}
            </p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-zinc-700 disabled:opacity-50 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {chargement
              ? "Veuillez patienter…"
              : mode === "connexion"
                ? "Se connecter"
                : mode === "creer"
                  ? "Créer l'entreprise"
                  : "Rejoindre l'entreprise"}
          </button>
        </form>
      </div>
    </div>
  );
}
