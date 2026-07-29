"use client";

import { useEffect, useState } from "react";
import { Check, Palette, UserPlus } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { creerCompteMembre } from "@/lib/authFlows";
import { THEMES, useTheme } from "@/lib/ThemeContext";
import ChampMotDePasse from "@/components/ChampMotDePasse";
import type { Entreprise, Role, Utilisateur } from "@/lib/types";

const champClasse =
  "mt-1 w-full rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-900";

export default function ParametresPage() {
  const { profil } = useAuth();
  const estAdmin = profil?.role === "admin";

  return estAdmin ? <ParametresAdmin /> : <ParametresEmploye />;
}

function ParametresAdmin() {
  const { profil } = useAuth();
  const [entreprise, setEntreprise] = useState<Entreprise | null>(null);
  const [utilisateurs, setUtilisateurs] = useState<Utilisateur[]>([]);
  const [chargement, setChargement] = useState(true);
  const [rafraichissement, setRafraichissement] = useState(0);

  const [identifiant, setIdentifiant] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const [nomMembre, setNomMembre] = useState("");
  const [roleMembre, setRoleMembre] = useState<Role>("employe");
  const [erreurAjout, setErreurAjout] = useState<string | null>(null);
  const [succesAjout, setSuccesAjout] = useState<string | null>(null);
  const [ajoutEnCours, setAjoutEnCours] = useState(false);

  const declencherRafraichissement = () => setRafraichissement((n) => n + 1);

  useEffect(() => {
    let actif = true;
    (async () => {
      setChargement(true);
      const [{ data: entrepriseData }, { data: utilisateursData }] = await Promise.all([
        supabase.from("entreprises").select("*").maybeSingle(),
        supabase.from("utilisateurs").select("*").order("created_at", { ascending: true }),
      ]);
      if (!actif) return;
      setEntreprise(entrepriseData as Entreprise | null);
      setUtilisateurs((utilisateursData as Utilisateur[]) ?? []);
      setChargement(false);
    })();
    return () => {
      actif = false;
    };
  }, [rafraichissement]);

  const changerRole = async (utilisateurId: string, role: Role) => {
    await supabase.from("utilisateurs").update({ role }).eq("id", utilisateurId);
    declencherRafraichissement();
  };

  const gererAjoutMembre = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!entreprise) return;
    setErreurAjout(null);
    setSuccesAjout(null);
    setAjoutEnCours(true);

    const resultat = await creerCompteMembre(identifiant, motDePasse);

    if (resultat.type === "erreur") {
      setAjoutEnCours(false);
      setErreurAjout(resultat.message);
      return;
    }
    if (resultat.type === "confirmation_requise") {
      setAjoutEnCours(false);
      setErreurAjout(
        "Compte créé mais en attente de confirmation. Désactivez « Confirm email » dans Supabase (Authentication → Providers → Email) pour que les comptes créés ici soient utilisables immédiatement."
      );
      return;
    }

    const { error: profilError } = await supabase.from("utilisateurs").insert({
      id: resultat.userId,
      entreprise_id: entreprise.id,
      nom: nomMembre,
      role: roleMembre,
    });

    setAjoutEnCours(false);
    if (profilError) {
      setErreurAjout("Compte créé mais impossible de créer le profil : " + profilError.message);
      return;
    }

    setSuccesAjout(`Compte créé pour « ${nomMembre} ». Identifiant : ${identifiant}`);
    setIdentifiant("");
    setMotDePasse("");
    setNomMembre("");
    setRoleMembre("employe");
    declencherRafraichissement();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Paramètres</h1>
        <p className="text-sm text-chart-muted">Entreprise, membres et droits d&apos;accès</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-chart-ink">Entreprise</h2>
        {chargement ? (
          <p className="mt-2 text-sm text-chart-muted">Chargement…</p>
        ) : (
          <div className="mt-3 space-y-2 text-sm">
            <p>
              <span className="text-chart-muted">Nom : </span>
              <span className="text-chart-ink">{entreprise?.nom}</span>
            </p>
            <p>
              <span className="text-chart-muted">Plan : </span>
              <span className="rounded-full bg-brand-50 px-2 py-0.5 text-xs font-medium text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
                {entreprise?.plan_abonnement}
              </span>
            </p>
          </div>
        )}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-chart-ink">
          <UserPlus className="h-4 w-4" strokeWidth={2} />
          Ajouter un membre
        </h2>
        <p className="mt-1 text-xs text-chart-muted">
          Créez un identifiant et un mot de passe pour un nouveau membre de votre équipe — aucun
          email n&apos;est nécessaire, c&apos;est avec ces identifiants qu&apos;il se connectera.
        </p>

        <form onSubmit={gererAjoutMembre} className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="block text-sm font-medium text-chart-ink">Nom</label>
            <input
              type="text"
              required
              value={nomMembre}
              onChange={(e) => setNomMembre(e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-chart-ink">Rôle</label>
            <select
              value={roleMembre}
              onChange={(e) => setRoleMembre(e.target.value as Role)}
              className={champClasse}
            >
              <option value="employe">Employé</option>
              <option value="admin">Administrateur</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-chart-ink">Identifiant</label>
            <input
              type="text"
              required
              autoComplete="off"
              value={identifiant}
              onChange={(e) => setIdentifiant(e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-chart-ink">Mot de passe</label>
            <ChampMotDePasse
              required
              minLength={6}
              autoComplete="new-password"
              value={motDePasse}
              onChange={(e) => setMotDePasse(e.target.value)}
              className={champClasse}
            />
          </div>

          {erreurAjout && (
            <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical sm:col-span-2">
              {erreurAjout}
            </p>
          )}
          {succesAjout && (
            <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good sm:col-span-2">
              {succesAjout}
            </p>
          )}

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={ajoutEnCours || !entreprise}
              className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
            >
              {ajoutEnCours ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-chart-ink">Membres</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-chart-muted dark:bg-zinc-900">
              <tr>
                <th className="px-3 py-2">Nom</th>
                <th className="px-3 py-2">Rôle</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {utilisateurs.map((u) => (
                <tr key={u.id} className="border-t border-zinc-200 dark:border-zinc-800">
                  <td className="px-3 py-2 text-chart-ink">{u.nom}</td>
                  <td className="px-3 py-2 capitalize text-chart-ink-secondary">{u.role}</td>
                  <td className="px-3 py-2">
                    {u.id !== profil?.id && (
                      <select
                        value={u.role}
                        onChange={(e) => changerRole(u.id, e.target.value as Role)}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-zinc-700 dark:bg-zinc-950"
                      >
                        <option value="admin">Administrateur</option>
                        <option value="employe">Employé</option>
                      </select>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function ParametresEmploye() {
  const { theme, definirTheme } = useTheme();
  const [motDePasseActuel, setMotDePasseActuel] = useState("");
  const [nouveauMotDePasse, setNouveauMotDePasse] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [succes, setSucces] = useState<string | null>(null);
  const [chargement, setChargement] = useState(false);

  const gererChangementMotDePasse = async (e: React.FormEvent) => {
    e.preventDefault();
    setErreur(null);
    setSucces(null);

    if (nouveauMotDePasse !== confirmation) {
      setErreur("Les deux mots de passe ne correspondent pas.");
      return;
    }

    setChargement(true);

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user?.email) {
      setChargement(false);
      setErreur("Impossible de vérifier votre compte. Reconnectez-vous et réessayez.");
      return;
    }

    // On revalide le mot de passe actuel avant de le changer, pour éviter
    // qu'une session laissée ouverte permette à n'importe qui de le modifier.
    const { error: verifError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: motDePasseActuel,
    });
    if (verifError) {
      setChargement(false);
      setErreur("Mot de passe actuel incorrect.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: nouveauMotDePasse });
    setChargement(false);
    if (error) {
      setErreur("Impossible de changer le mot de passe : " + error.message);
      return;
    }

    setSucces("Mot de passe mis à jour.");
    setMotDePasseActuel("");
    setNouveauMotDePasse("");
    setConfirmation("");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-chart-ink">Paramètres</h1>
        <p className="text-sm text-chart-muted">Votre compte et l&apos;apparence de l&apos;application</p>
      </div>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="text-sm font-semibold text-chart-ink">Changer de mot de passe</h2>
        <form onSubmit={gererChangementMotDePasse} className="mt-4 max-w-sm space-y-4">
          <div>
            <label className="block text-sm font-medium text-chart-ink">Mot de passe actuel</label>
            <ChampMotDePasse
              required
              autoComplete="current-password"
              value={motDePasseActuel}
              onChange={(e) => setMotDePasseActuel(e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-chart-ink">Nouveau mot de passe</label>
            <ChampMotDePasse
              required
              minLength={6}
              autoComplete="new-password"
              value={nouveauMotDePasse}
              onChange={(e) => setNouveauMotDePasse(e.target.value)}
              className={champClasse}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-chart-ink">Confirmer le nouveau mot de passe</label>
            <ChampMotDePasse
              required
              minLength={6}
              autoComplete="new-password"
              value={confirmation}
              onChange={(e) => setConfirmation(e.target.value)}
              className={champClasse}
            />
          </div>

          {erreur && (
            <p className="rounded-md bg-critical/10 px-3 py-2 text-sm text-critical">{erreur}</p>
          )}
          {succes && (
            <p className="rounded-md bg-good/10 px-3 py-2 text-sm text-good">{succes}</p>
          )}

          <button
            type="submit"
            disabled={chargement}
            className="rounded-md bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700 disabled:opacity-50"
          >
            {chargement ? "Mise à jour…" : "Mettre à jour"}
          </button>
        </form>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-chart-surface p-5 shadow-sm dark:border-zinc-800">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-chart-ink">
          <Palette className="h-4 w-4" strokeWidth={2} />
          Thème
        </h2>
        <p className="mt-1 text-xs text-chart-muted">Choisissez l&apos;apparence de votre espace.</p>

        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {THEMES.map((t) => (
            <button
              key={t.valeur}
              type="button"
              onClick={() => definirTheme(t.valeur)}
              className={`flex items-center justify-between rounded-md border px-3 py-2.5 text-sm transition ${
                theme === t.valeur
                  ? "border-brand-500 bg-brand-50 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
                  : "border-zinc-300 text-chart-ink hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
              }`}
            >
              {t.libelle}
              {theme === t.valeur && <Check className="h-4 w-4" strokeWidth={2.5} />}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
