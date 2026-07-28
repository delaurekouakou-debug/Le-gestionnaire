-- Le Gestionnaire — réparation des policies RLS
--
-- À exécuter dans l'éditeur SQL Supabase si vous rencontrez des erreurs du
-- type "new row violates row-level security policy" (signe que le script
-- supabase/schema.sql ne s'est pas exécuté jusqu'au bout la première fois).
--
-- Sûr à relancer plusieurs fois : ne touche ni aux tables ni aux données,
-- recrée seulement les fonctions, le trigger et les policies.

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

-- RLS activée sur toutes les tables
alter table entreprises enable row level security;
alter table utilisateurs enable row level security;
alter table produits enable row level security;
alter table mouvements enable row level security;

-- entreprises
drop policy if exists "select_entreprise" on entreprises;
create policy "select_entreprise" on entreprises
  for select using (id = current_entreprise_id());

drop policy if exists "insert_entreprise" on entreprises;
create policy "insert_entreprise" on entreprises
  for insert with check (auth.uid() is not null);

drop policy if exists "update_entreprise" on entreprises;
create policy "update_entreprise" on entreprises
  for update using (id = current_entreprise_id() and current_utilisateur_role() = 'admin');

-- utilisateurs
drop policy if exists "select_utilisateurs" on utilisateurs;
create policy "select_utilisateurs" on utilisateurs
  for select using (entreprise_id = current_entreprise_id());

drop policy if exists "insert_utilisateurs" on utilisateurs;
create policy "insert_utilisateurs" on utilisateurs
  for insert with check (id = auth.uid());

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
