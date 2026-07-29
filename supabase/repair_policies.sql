-- Le Gestionnaire — réparation des policies RLS
--
-- À exécuter dans l'éditeur SQL Supabase si vous rencontrez des erreurs du
-- type "new row violates row-level security policy" (signe que le script
-- supabase/schema.sql ne s'est pas exécuté jusqu'au bout la première fois).
--
-- Sûr à relancer plusieurs fois : ne touche ni aux tables ni aux données,
-- recrée seulement les fonctions, le trigger et les policies.

create extension if not exists "pgcrypto";

-- Table du code maître (création d'entreprise protégée) : créée seulement
-- si absente, jamais modifiée par ce script — voir schema.sql pour définir
-- le code avec crypt(...).
create table if not exists configuration_globale (
  id boolean primary key default true check (id),
  code_maitre_hash text not null
);
alter table configuration_globale enable row level security;

-- Fonctions utilitaires
create or replace function public.current_entreprise_id()
returns uuid
language sql
security definer
set search_path = public
stable
as $$
  select entreprise_id from utilisateurs where id = auth.uid();
$$;

create or replace function public.current_utilisateur_role()
returns text
language sql
security definer
set search_path = public
stable
as $$
  select role from utilisateurs where id = auth.uid();
$$;

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

drop trigger if exists trg_appliquer_mouvement on mouvements;
create trigger trg_appliquer_mouvement
  after insert on mouvements
  for each row execute function public.appliquer_mouvement();

create or replace function public.verifier_code_maitre(code text)
returns boolean
language plpgsql
security definer
-- "extensions" en plus de "public" : pgcrypto (crypt/gen_salt) s'installe
-- par défaut dans le schéma "extensions" sur Supabase, pas "public".
set search_path = public, extensions
as $$
declare
  hash_stocke text;
begin
  select code_maitre_hash into hash_stocke from configuration_globale where id = true;
  if hash_stocke is null then
    return false;
  end if;
  return hash_stocke = crypt(code, hash_stocke);
end;
$$;

create or replace function public.creer_entreprise_admin(nom_entreprise text, code_maitre text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  nouvelle_id uuid;
begin
  if auth.uid() is null then
    raise exception 'Authentification requise';
  end if;
  if not public.verifier_code_maitre(code_maitre) then
    raise exception 'Code maître invalide';
  end if;

  insert into entreprises (nom) values (nom_entreprise) returning id into nouvelle_id;
  return nouvelle_id;
end;
$$;

revoke all on configuration_globale from anon, authenticated;
grant execute on function public.verifier_code_maitre(text) to anon, authenticated;
grant execute on function public.creer_entreprise_admin(text, text) to authenticated;

-- RLS activée sur toutes les tables
alter table entreprises enable row level security;
alter table utilisateurs enable row level security;
alter table produits enable row level security;
alter table mouvements enable row level security;

-- entreprises : pas de policy "insert" — la création passe exclusivement
-- par creer_entreprise_admin() (protégée par le code maître) ci-dessus.
drop policy if exists "insert_entreprise" on entreprises;

drop policy if exists "select_entreprise" on entreprises;
create policy "select_entreprise" on entreprises
  for select using (id = current_entreprise_id());

drop policy if exists "update_entreprise" on entreprises;
create policy "update_entreprise" on entreprises
  for update using (id = current_entreprise_id() and current_utilisateur_role() = 'admin');

-- utilisateurs
drop policy if exists "select_utilisateurs" on utilisateurs;
create policy "select_utilisateurs" on utilisateurs
  for select using (entreprise_id = current_entreprise_id());

drop policy if exists "insert_utilisateurs" on utilisateurs;
create policy "insert_utilisateurs" on utilisateurs
  for insert with check (
    id = auth.uid()
    or (current_utilisateur_role() = 'admin' and entreprise_id = current_entreprise_id())
  );

drop policy if exists "update_utilisateurs" on utilisateurs;
create policy "update_utilisateurs" on utilisateurs
  for update using (
    id = auth.uid()
    or (current_utilisateur_role() = 'admin' and entreprise_id = current_entreprise_id())
  );

drop policy if exists "delete_utilisateurs" on utilisateurs;
create policy "delete_utilisateurs" on utilisateurs
  for delete using (
    current_utilisateur_role() = 'admin'
    and entreprise_id = current_entreprise_id()
    and id <> auth.uid()
  );

-- produits
drop policy if exists "acces_produits_entreprise" on produits;
create policy "acces_produits_entreprise" on produits
  for all
  using (entreprise_id = current_entreprise_id())
  with check (entreprise_id = current_entreprise_id());

-- mouvements
drop policy if exists "select_mouvements" on mouvements;
create policy "select_mouvements" on mouvements
  for select using (
    exists (
      select 1 from produits p
      where p.id = mouvements.produit_id
        and p.entreprise_id = current_entreprise_id()
    )
  );

drop policy if exists "insert_mouvements" on mouvements;
create policy "insert_mouvements" on mouvements
  for insert with check (
    utilisateur_id = auth.uid()
    and exists (
      select 1 from produits p
      where p.id = mouvements.produit_id
        and p.entreprise_id = current_entreprise_id()
    )
  );

-- ---------------------------------------------------------------------------
-- Définir ou changer votre code maître (à exécuter séparément) :
-- ---------------------------------------------------------------------------
--
-- insert into configuration_globale (id, code_maitre_hash)
--   values (true, crypt('votre-code-secret', gen_salt('bf')))
--   on conflict (id) do update set code_maitre_hash = excluded.code_maitre_hash;
