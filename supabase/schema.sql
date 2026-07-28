-- Le Gestionnaire — schéma initial (multi-tenant)
-- À exécuter dans l'éditeur SQL du projet Supabase.
--
-- Isolation des données : chaque ligne métier porte un entreprise_id, et les
-- policies RLS s'appuient sur la fonction current_entreprise_id() ci-dessous
-- (SECURITY DEFINER) pour éviter la récursion RLS sur la table utilisateurs.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------

create table entreprises (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  plan_abonnement text not null default 'essai',
  created_at timestamptz not null default now()
);

-- utilisateurs.id référence directement auth.users(id) : chaque profil est
-- créé au moment de l'inscription (voir app/login).
create table utilisateurs (
  id uuid primary key references auth.users(id) on delete cascade,
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  nom text not null,
  role text not null default 'employe' check (role in ('admin', 'employe')),
  created_at timestamptz not null default now()
);

create table produits (
  id uuid primary key default gen_random_uuid(),
  entreprise_id uuid not null references entreprises(id) on delete cascade,
  nom text not null,
  reference text,
  categorie text,
  prix numeric(12, 2) not null default 0,
  quantite int not null default 0,
  seuil_alerte int not null default 5,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index produits_entreprise_id_idx on produits (entreprise_id);

create table mouvements (
  id uuid primary key default gen_random_uuid(),
  produit_id uuid not null references produits(id) on delete cascade,
  utilisateur_id uuid not null references utilisateurs(id),
  type text not null check (type in ('entree', 'sortie', 'ajustement')),
  quantite int not null check (quantite >= 0),
  note text,
  date timestamptz not null default now()
);

create index mouvements_produit_id_idx on mouvements (produit_id);
create index mouvements_date_idx on mouvements (date desc);

-- ---------------------------------------------------------------------------
-- Fonctions utilitaires (SECURITY DEFINER pour éviter la récursion RLS)
-- ---------------------------------------------------------------------------

create or replace function public.current_entreprise_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select entreprise_id from utilisateurs where id = auth.uid();
$$;

-- Nommée current_utilisateur_role() (et non current_role()) car CURRENT_ROLE
-- est un mot-clé réservé de PostgreSQL (comme CURRENT_USER) : il ne peut pas
-- être invoqué avec des parenthèses explicites dans une expression.
create or replace function public.current_utilisateur_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from utilisateurs where id = auth.uid();
$$;

-- Applique automatiquement un mouvement de stock sur le produit concerné.
-- 'entree'    -> quantite += mouvement.quantite
-- 'sortie'    -> quantite -= mouvement.quantite (jamais négatif)
-- 'ajustement'-> quantite := mouvement.quantite (nouvelle quantité absolue,
--                utilisée après un inventaire physique)
create or replace function public.appliquer_mouvement()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.type = 'entree' then
    update produits
      set quantite = quantite + new.quantite, updated_at = now()
      where id = new.produit_id;
  elsif new.type = 'sortie' then
    update produits
      set quantite = greatest(quantite - new.quantite, 0), updated_at = now()
      where id = new.produit_id;
  elsif new.type = 'ajustement' then
    update produits
      set quantite = new.quantite, updated_at = now()
      where id = new.produit_id;
  end if;
  return new;
end;
$$;

create trigger trg_appliquer_mouvement
  after insert on mouvements
  for each row execute function public.appliquer_mouvement();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table entreprises enable row level security;
alter table utilisateurs enable row level security;
alter table produits enable row level security;
alter table mouvements enable row level security;

-- entreprises : visible uniquement par ses membres, créable par tout
-- utilisateur authentifié (étape 1 de l'inscription "créer une entreprise"),
-- modifiable par un admin de l'entreprise.
create policy "select_entreprise" on entreprises
  for select using (id = current_entreprise_id());

create policy "insert_entreprise" on entreprises
  for insert with check (auth.uid() is not null);

create policy "update_entreprise" on entreprises
  for update using (id = current_entreprise_id() and current_utilisateur_role() = 'admin');

-- utilisateurs : visibles par les membres de la même entreprise. Un
-- utilisateur ne peut créer que sa propre ligne de profil (id = auth.uid()),
-- que ce soit en tant qu'admin (nouvelle entreprise) ou en tant qu'employé
-- (rejoint une entreprise existante via son entreprise_id, transmis par
-- l'administrateur comme "code d'invitation").
create policy "select_utilisateurs" on utilisateurs
  for select using (entreprise_id = current_entreprise_id());

create policy "insert_utilisateurs" on utilisateurs
  for insert with check (id = auth.uid());

create policy "update_utilisateurs" on utilisateurs
  for update using (
    id = auth.uid()
    or (current_utilisateur_role() = 'admin' and entreprise_id = current_entreprise_id())
  );

create policy "delete_utilisateurs" on utilisateurs
  for delete using (
    current_utilisateur_role() = 'admin'
    and entreprise_id = current_entreprise_id()
    and id <> auth.uid()
  );

-- produits : accès complet réservé aux membres de la même entreprise.
create policy "acces_produits_entreprise" on produits
  for all
  using (entreprise_id = current_entreprise_id())
  with check (entreprise_id = current_entreprise_id());

-- mouvements : journal d'audit — lecture et création, jamais de
-- modification/suppression, restreint aux membres de la même entreprise que
-- le produit concerné.
create policy "select_mouvements" on mouvements
  for select using (
    exists (
      select 1 from produits p
      where p.id = mouvements.produit_id
        and p.entreprise_id = current_entreprise_id()
    )
  );

create policy "insert_mouvements" on mouvements
  for insert with check (
    utilisateur_id = auth.uid()
    and exists (
      select 1 from produits p
      where p.id = mouvements.produit_id
        and p.entreprise_id = current_entreprise_id()
    )
  );
