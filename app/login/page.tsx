"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Boxes, ClipboardList, ShieldCheck, TrendingUp } from "lucide-react";
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

  const champClasse =
    "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="flex flex-1">
      <div className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-navy-950 px-10 py-10 text-navy-200 lg:flex">
        <div className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-white">
            <Boxes className="h-5 w-5" strokeWidth={2.25} />
          </span>
          <span className="text-lg font-bold text-white">Le Gestionnaire</span>
        </div>

        <div className="max-w-sm">
          <h1 className="text-3xl font-bold leading-tight text-white">
            Le poste de contrôle de votre stock.
          </h1>
          <p className="mt-3 text-sm text-navy-200">
            Suivez vos entrées, sorties et alertes de rupture en temps réel, sur
            un seul écran pensé pour l&apos;opérationnel.
          </p>

          <ul className="mt-8 space-y-4 text-sm">
            <li className="flex items-start gap-3">
              <ClipboardList className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
              Traçabilité complète des mouvements de stock
            </li>
            <li className="flex items-start gap-3">
              <TrendingUp className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
              Tableau de bord avec alertes de réapprovisionnement
            </li>
            <li className="flex items-start gap-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-brand-400" strokeWidth={2} />
              Données isolées et sécurisées par entreprise
            </li>
          </ul>
        </div>

        <p className="text-xs text-navy-400">© {new Date().getFullYear()} Le Gestionnaire</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm space-y-6">
          <div className="text-center lg:hidden">
            <div className="mb-2 flex justify-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-500 text-white">
                <Boxes className="h-5 w-5" strokeWidth={2.25} />
              </span>
            </div>
            <h1 className="text-2xl font-bold text-chart-ink">Le Gestionnaire</h1>
            <p className="mt-1 text-sm text-chart-muted">Gestion de stock pour PME</p>
          </div>

          <div className="hidden lg:block">
            <h2 className="text-xl font-bold text-chart-ink">Bienvenue</h2>
            <p className="mt-1 text-sm text-chart-muted">Connectez-vous à votre espace</p>
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
                    ? "bg-brand-600 text-white"
                    : "text-chart-muted hover:text-chart-ink"
                }`}
              >
                {libelle}
              </button>
            ))}
          </div>

          <form onSubmit={gererSoumission} className="space-y-4">
            {mode !== "connexion" && (
              <div>
                <label className="block text-sm font-medium text-chart-ink">Votre nom</label>
                <input
                  type="text"
                  required
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className={champClasse}
                />
              </div>
            )}

            {mode === "creer" && (
              <div>
                <label className="block text-sm font-medium text-chart-ink">
                  Nom de l&apos;entreprise
                </label>
                <input
                  type="text"
                  required
                  value={nomEntreprise}
                  onChange={(e) => setNomEntreprise(e.target.value)}
                  className={champClasse}
                />
              </div>
            )}

            {mode === "rejoindre" && (
              <div>
                <label className="block text-sm font-medium text-chart-ink">Code entreprise</label>
                <input
                  type="text"
                  required
                  placeholder="Fourni par votre administrateur"
                  value={codeEntreprise}
                  onChange={(e) => setCodeEntreprise(e.target.value)}
                  className={champClasse}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-chart-ink">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={champClasse}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-chart-ink">Mot de passe</label>
              <input
                type="password"
                required
                minLength={6}
                value={motDePasse}
                onChange={(e) => setMotDePasse(e.target.value)}
                className={champClasse}
              />
            </div>

            {erreur && (
              <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
            )}

            <button
              type="submit"
              disabled={chargement}
              className="w-full rounded-md bg-brand-600 px-3 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
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
    </div>
  );
}
