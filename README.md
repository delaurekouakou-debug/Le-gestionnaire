# Le Gestionnaire

Application web de gestion de stock, destinée à être vendue en abonnement à
des PME. Architecture multi-tenant : une seule application, données isolées
par entreprise cliente (row-level security Supabase).

## Stack

- **Frontend** : Next.js (App Router) + TypeScript + Tailwind CSS
- **Backend / données** : Supabase (PostgreSQL + authentification + RLS)
- **Hébergement** : Vercel (ou Render)

## Fonctionnalités (V1)

1. Gestion des produits : fiche produit, seuil d'alerte, recherche/filtre
2. Mouvements de stock : entrée, sortie, ajustement manuel
3. Historique et traçabilité des mouvements
4. Alertes de rupture / réapprovisionnement
5. Tableau de bord : valeur du stock, produits en alerte, derniers mouvements
6. Utilisateurs et droits : administrateur + employés à accès limité
7. Export du stock en PDF ou Excel

## Démarrage

### 1. Installer les dépendances

```bash
npm install
```

### 2. Créer le projet Supabase

Sur [supabase.com](https://supabase.com/), créer un projet, puis exécuter le
script [`supabase/schema.sql`](./supabase/schema.sql) dans l'éditeur SQL. Il
crée les tables (`entreprises`, `utilisateurs`, `produits`, `mouvements`), un
trigger qui met à jour automatiquement la quantité d'un produit à chaque
mouvement, et les policies RLS qui isolent les données par entreprise.

Si l'éditeur SQL affiche une erreur en cours de script (le script s'arrête
alors avant la fin, les policies RLS peuvent manquer sans que les tables
soient affectées — symptôme typique : `new row violates row-level security
policy`), rejouez [`supabase/repair_policies.sql`](./supabase/repair_policies.sql)
: il recrée uniquement les fonctions, le trigger et les policies, sans
toucher aux tables ni aux données, et peut être relancé sans risque autant
de fois que nécessaire.

### 3. Configurer les variables d'environnement

Copier `.env.local.example` vers `.env.local` et renseigner les valeurs du
projet Supabase (Project Settings → API) :

```bash
cp .env.local.example .env.local
```

```
NEXT_PUBLIC_SUPABASE_URL=votre_url_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_anon
```

### 4. Lancer l'application

```bash
npm run dev
```

### 5. Créer un compte

Sur `/login`, utiliser l'onglet **Créer une entreprise** pour créer le
premier compte administrateur. Depuis `/parametres`, l'administrateur peut
ensuite partager le **code entreprise** avec ses employés, qui l'utilisent
sur l'onglet **Rejoindre** pour créer leur propre compte (rôle employé,
accès limité).

## Structure du projet

```
app/
├── login/page.tsx                 Connexion / création d'entreprise / rejoindre
└── (app)/                         Routes protégées (redirection vers /login si déconnecté)
    ├── dashboard/page.tsx         Valeur du stock, alertes, derniers mouvements
    ├── produits/page.tsx          Liste, ajout, recherche/filtre, export PDF/Excel
    ├── mouvements/page.tsx        Saisie et historique des mouvements de stock
    └── parametres/page.tsx        Entreprise, code d'invitation, gestion des rôles
lib/
├── supabaseClient.ts              Client Supabase (navigateur)
├── AuthContext.tsx                Session + profil (entreprise, rôle)
├── export.ts                      Export du stock en PDF (jsPDF) et Excel (exceljs)
└── types.ts                       Types partagés
components/
├── ProduitForm.tsx
├── MouvementForm.tsx
├── AlerteStock.tsx
└── Navbar.tsx
supabase/
└── schema.sql                     Schéma, trigger de stock, policies RLS
```

## Déploiement

### Hébergement définitif (Vercel ou Render)

1. Pousser le repo sur GitHub
2. Connecter le repo à Vercel (ou Render)
3. Renseigner `NEXT_PUBLIC_SUPABASE_URL` et `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   dans les réglages du projet d'hébergement

### En attendant : GitHub Pages (provisoire)

L'application est un client Supabase pur (aucune route API, aucun rendu
serveur), donc elle peut être exportée en site statique et servie
gratuitement par GitHub Pages le temps de mettre en place l'hébergement
définitif.

Le fichier [`next.config.ts`](./next.config.ts) active `output: "export"` et
n'ajoute le `basePath`/`assetPrefix` `/Le-gestionnaire` que lorsque la
variable `GITHUB_PAGES=true` est présente (donc `npm run dev` en local n'est
pas affecté). Le workflow
[`.github/workflows/deploy-gh-pages.yml`](./.github/workflows/deploy-gh-pages.yml)
construit le site et le publie automatiquement — l'URL et la clé publique
(publishable) Supabase du projet y sont déjà renseignées.

Étapes pour l'activer (une seule fois) :

1. **Settings → Pages → Build and deployment → Source** : choisir
   **GitHub Actions**.
2. S'assurer que ce workflow est présent sur la branche par défaut (`main`)
   — GitHub n'autorise le déclenchement manuel (`workflow_dispatch`) que si
   le fichier existe déjà sur cette branche, même pour lancer une exécution
   sur une autre branche.
3. Pousser sur `main`, ou lancer le workflow manuellement depuis l'onglet
   **Actions → Déployer sur GitHub Pages → Run workflow**.
4. Le site est publié sur `https://<utilisateur>.github.io/Le-gestionnaire/`.

Limite à connaître : les identifiants Supabase publics (URL + clé anonyme)
sont visibles dans le bundle JS, comme sur n'importe quel déploiement
frontend Supabase — la sécurité repose sur les policies RLS, pas sur le
secret de ces valeurs.

## Prévu pour la V2

- Gestion des fournisseurs
- Rapports de ventes
- Scan code-barres / QR code
- Multi-emplacements
- Notifications WhatsApp/SMS
- Facturation intégrée
- Paiement récurrent (CinetPay / PayDunya — Mobile Money)
