"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/lib/AuthContext";

const LIENS = [
  { href: "/dashboard", label: "Tableau de bord" },
  { href: "/produits", label: "Produits" },
  { href: "/mouvements", label: "Mouvements" },
  { href: "/parametres", label: "Paramètres" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profil, deconnexion } = useAuth();

  const gererDeconnexion = async () => {
    await deconnexion();
    router.push("/login");
  };

  return (
    <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 py-3">
        <div className="flex items-center gap-6">
          <span className="text-lg font-bold">Le Gestionnaire</span>
          <nav className="flex gap-1 text-sm">
            {LIENS.map((lien) => (
              <Link
                key={lien.href}
                href={lien.href}
                className={`rounded-md px-3 py-1.5 transition ${
                  pathname?.startsWith(lien.href)
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
                }`}
              >
                {lien.label}
              </Link>
            ))}
          </nav>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <div className="text-right">
            <div className="font-medium">{profil?.nom ?? session?.user.email}</div>
            <div className="text-xs uppercase tracking-wide text-zinc-500">
              {profil?.role === "admin" ? "Administrateur" : "Employé"}
            </div>
          </div>
          <button
            onClick={gererDeconnexion}
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-900"
          >
            Déconnexion
          </button>
        </div>
      </div>
    </header>
  );
}
