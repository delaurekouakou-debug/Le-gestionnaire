import type { Session } from "@supabase/supabase-js";
import { supabase } from "./supabaseClient";
import { creerClientIsole } from "./supabaseAdminClient";

// Supabase exige un email pour l'authentification par mot de passe ; comme
// l'app n'utilise plus d'email réel (identifiant + mot de passe uniquement),
// on en génère un synthétique et invisible pour l'utilisateur, dérivé de
// l'identifiant. Le domaine ".local" n'est jamais publiquement résolvable —
// c'est un simple identifiant technique interne, jamais un email envoyé.
export function identifiantVersEmail(identifiant: string): string {
  const nettoye = identifiant
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9._-]/g, "-");
  return `${nettoye}@membres.legestionnaire.local`;
}

export function messageErreurConnexion(message: string | undefined): string {
  if (!message) return "Identifiant ou mot de passe invalide.";
  if (message.toLowerCase().includes("email not confirmed")) {
    return "Ce compte n'est pas confirmé. Dans Supabase, désactivez « Confirm email » (Authentication → Providers → Email) : les comptes de cette application n'utilisent pas de vraie adresse email.";
  }
  if (message.toLowerCase().includes("invalid login credentials")) {
    return "Identifiant ou mot de passe invalide.";
  }
  return message;
}

export function messageErreurInscription(message: string | undefined): string {
  if (!message) return "Impossible de créer le compte.";
  if (message.toLowerCase().includes("email rate limit exceeded")) {
    return "Trop de tentatives en peu de temps : Supabase limite l'envoi d'emails de confirmation sur le plan gratuit. Désactivez « Confirm email » dans Authentication → Providers → Email pour ne plus en dépendre (aucun email réel n'est utilisé par cette application), ou réessayez dans quelques minutes.";
  }
  if (message.toLowerCase().includes("user already registered")) {
    return "Cet identifiant est déjà utilisé. Choisissez-en un autre.";
  }
  return message;
}

export const MESSAGE_PROFIL_MANQUANT =
  "Ce compte existe mais n'est associé à aucune entreprise (une inscription précédente a probablement été interrompue avant la fin). Contactez votre administrateur.";

export type ResultatCompte =
  | { type: "ok"; session: Session; userId: string }
  | { type: "confirmation_requise" }
  | { type: "erreur"; message: string };

// Crée le compte (via l'identifiant, converti en email synthétique), ou —
// s'il existe déjà (ex : une précédente tentative a été interrompue après le
// signUp mais avant la création du profil) — se connecte directement avec
// les mêmes identifiants pour reprendre l'inscription là où elle s'était
// arrêtée. Utilisé uniquement pour l'auto-inscription du tout premier admin
// (/creer-entreprise) : utilise le client principal, donc adapté seulement
// quand il n'y a pas déjà une session active à préserver.
export async function obtenirCompte(identifiant: string, motDePasse: string): Promise<ResultatCompte> {
  const email = identifiantVersEmail(identifiant);
  const { data: authData, error: authError } = await supabase.auth.signUp({
    email,
    password: motDePasse,
  });

  if (authError?.message?.toLowerCase().includes("user already registered")) {
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password: motDePasse,
    });
    if (signInError || !signInData.session || !signInData.user) {
      return {
        type: "erreur",
        message:
          "Cet identifiant existe déjà, mais le mot de passe saisi ne correspond pas à celui utilisé précédemment. Utilisez « Connexion » avec le bon mot de passe, ou contactez votre administrateur.",
      };
    }
    return { type: "ok", session: signInData.session, userId: signInData.user.id };
  }

  if (authError || !authData.user) {
    return { type: "erreur", message: messageErreurInscription(authError?.message) };
  }

  if (!authData.session) {
    return { type: "confirmation_requise" };
  }

  return { type: "ok", session: authData.session, userId: authData.user.id };
}

export type ResultatCreationMembre =
  | { type: "ok"; userId: string }
  | { type: "confirmation_requise" }
  | { type: "erreur"; message: string };

// Crée le compte "auth" d'un membre depuis l'écran d'un administrateur déjà
// connecté. Utilise un client Supabase isolé (voir supabaseAdminClient.ts)
// pour que le signUp n'affecte jamais la session de l'administrateur portée
// par le client principal — sans ça, créer le compte d'un tiers déconnecterait
// l'admin de son propre compte pour le remplacer par le nouveau.
export async function creerCompteMembre(
  identifiant: string,
  motDePasse: string
): Promise<ResultatCreationMembre> {
  const clientIsole = creerClientIsole();
  const email = identifiantVersEmail(identifiant);
  const { data, error } = await clientIsole.auth.signUp({ email, password: motDePasse });

  if (error) {
    return { type: "erreur", message: messageErreurInscription(error.message) };
  }
  if (!data.user) {
    return { type: "erreur", message: "Impossible de créer le compte." };
  }
  if (!data.session) {
    return { type: "confirmation_requise" };
  }

  return { type: "ok", userId: data.user.id };
}
