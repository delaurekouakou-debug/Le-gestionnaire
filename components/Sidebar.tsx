"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Boxes,
  LayoutDashboard,
  LogOut,
  Package,
  Settings,
  ArrowLeftRight,
} from "lucide-react";
import { useAuth } from "@/lib/AuthContext";

const LIENS = [
  { href: "/dashboard", label: "Tableau de bord", icon: LayoutDashboard },
  { href: "/produits", label: "Produits", icon: Package },
  { href: "/mouvements", label: "Mouvements", icon: ArrowLeftRight },
  { href: "/parametres", label: "Paramètres", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { session, profil, deconnexion } = useAuth();

  const gererDeconnexion = async () => {
    await deconnexion();
    router.push("/login");
  };

  return (
    <aside className="flex w-64 shrink-0 flex-col bg-navy-950 text-navy-200">
      <div className="flex items-center gap-2 px-5 py-5">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-500 text-sm font-bold text-white">
          <Boxes className="h-5 w-5" strokeWidth={2.25} />
        </span>
        <div>
          <p className="text-sm font-bold leading-tight text-white">Le Gestionnaire</p>
          <p className="text-[11px] uppercase tracking-wider text-navy-400">Poste de contrôle</p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-2">
        {LIENS.map((lien) => {
          const actif = pathname?.startsWith(lien.href);
          const Icon = lien.icon;
          return (
            <Link
              key={lien.href}
              href={lien.href}
              className={`flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm transition ${
                actif
                  ? "border-brand-400 bg-navy-800 font-medium text-white"
                  : "border-transparent text-navy-200 hover:bg-navy-900 hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" strokeWidth={2} />
              {lien.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-navy-700 px-3 py-4">
        <div className="mb-3 px-2">
          <p className="truncate text-sm font-medium text-white">
            {profil?.nom ?? session?.user.email}
          </p>
          <p className="text-[11px] uppercase tracking-wide text-navy-400">
            {profil?.role === "admin" ? "Administrateur" : "Employé"}
          </p>
        </div>
        <button
          onClick={gererDeconnexion}
          className="flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm text-navy-200 transition hover:bg-navy-900 hover:text-white"
        >
          <LogOut className="h-4 w-4" strokeWidth={2} />
          Déconnexion
        </button>
      </div>
    </aside>
  );
}
