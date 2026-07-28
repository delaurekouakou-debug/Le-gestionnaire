interface Props {
  ok: number;
  alerte: number;
  rupture: number;
}

const SEGMENTS: { cle: keyof Props; libelle: string; classe: string }[] = [
  { cle: "ok", libelle: "En stock", classe: "bg-good" },
  { cle: "alerte", libelle: "Stock bas", classe: "bg-warning" },
  { cle: "rupture", libelle: "Rupture", classe: "bg-critical" },
];

export default function RepartitionStockBar({ ok, alerte, rupture }: Props) {
  const total = ok + alerte + rupture;

  if (total === 0) {
    return <p className="text-sm text-chart-muted">Aucun produit enregistré.</p>;
  }

  const valeurs = { ok, alerte, rupture };

  return (
    <div>
      <div className="flex h-4 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
        {SEGMENTS.filter((s) => valeurs[s.cle] > 0).map((s, i) => (
          <div
            key={s.cle}
            className={`${s.classe} h-full`}
            style={{
              width: `${(valeurs[s.cle] / total) * 100}%`,
              marginLeft: i === 0 ? 0 : 2,
            }}
            title={`${s.libelle} : ${valeurs[s.cle]}`}
          />
        ))}
      </div>
      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-chart-ink-secondary">
        {SEGMENTS.map((s) => (
          <span key={s.cle} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-2.5 rounded-full ${s.classe}`} />
            {s.libelle}
            <span className="tabular-nums text-chart-muted">
              ({valeurs[s.cle]} · {total > 0 ? Math.round((valeurs[s.cle] / total) * 100) : 0}%)
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
