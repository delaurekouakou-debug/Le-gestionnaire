export type Role = "admin" | "employe";

export type TypeMouvement = "entree" | "sortie" | "ajustement";

export interface Entreprise {
  id: string;
  nom: string;
  plan_abonnement: string;
  created_at: string;
}

export interface Utilisateur {
  id: string;
  entreprise_id: string;
  nom: string;
  role: Role;
  created_at: string;
  entreprise?: Pick<Entreprise, "nom"> | null;
}

export interface Produit {
  id: string;
  entreprise_id: string;
  nom: string;
  reference: string | null;
  categorie: string | null;
  prix: number;
  quantite: number;
  seuil_alerte: number;
  created_at: string;
  updated_at: string;
}

export interface Mouvement {
  id: string;
  produit_id: string;
  utilisateur_id: string;
  type: TypeMouvement;
  quantite: number;
  note: string | null;
  date: string;
}

export interface MouvementAvecProduit extends Mouvement {
  produit: Pick<Produit, "id" | "nom" | "reference"> | null;
}
