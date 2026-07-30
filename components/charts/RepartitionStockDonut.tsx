interface Props {
  ok: number;
  alerte: number;
  rupture: number;
}

const SEGMENTS = [
  { cle: "ok" as const, libelle: "En stock", couleur: "var(--color-good)" },
  { cle: "alerte" as const, libelle: "Stock bas", couleur: "var(--color-warning)" },
  { cle: "rupture" as const, libelle: "Rupture", couleur: "var(--color-critical)" },
];

const RAYON = 60;
const EPAISSEUR = 20;
const CIRCONFERENCE = 2 * Math.PI * RAYON;

export default function RepartitionStockDonut({ ok, alerte, rupture }: Props) {
  const total = ok + alerte + rupture;
  const valeurs = { ok, alerte, rupture };

  if (total === 0) {
    return <p className="text-sm text-chart-muted">Aucun produit enregistré.</p>;
  }

  const segmentsActifs = SEGMENTS.filter((s) => valeurs[s.cle] > 0);
  const arcs = segmentsActifs.map((s, i) => {
    const cumulAvant =
      segmentsActifs.slice(0, i).reduce((t, seg) => t + valeurs[seg.cle], 0) / total;
    const dash = (valeurs[s.cle] / total) * CIRCONFERENCE;
    const offset = -cumulAvant * CIRCONFERENCE;
    return { ...s, dash, offset };
  });

  return (
    <div className="flex flex-wrap items-center gap-6">
      <div className="relative h-36 w-36 shrink-0">
        <svg viewBox="0 0 160 160" className="h-36 w-36 -rotate-90">
          <circle cx="80" cy="80" r={RAYON} fill="none" stroke="var(--color-chart-grid)" strokeWidth={EPAISSEUR} />
          {arcs.map((s) => (
            <circle
              key={s.cle}
              cx="80"
              cy="80"
              r={RAYON}
              fill="none"
              stroke={s.couleur}
              strokeWidth={EPAISSEUR}
              strokeDasharray={`${s.dash} ${CIRCONFERENCE - s.dash}`}
              strokeDashoffset={s.offset}
            />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="font-heading text-2xl font-extrabold text-chart-ink">{total}</span>
          <span className="text-[10px] uppercase tracking-widest text-chart-muted">référence(s)</span>
        </div>
      </div>

      <div className="flex flex-col gap-2 text-sm">
        {SEGMENTS.map((s) => (
          <span key={s.cle} className="flex items-center gap-2 text-chart-ink-secondary">
            <span className="h-2.5 w-2.5 shrink-0" style={{ backgroundColor: s.couleur }} />
            {s.libelle}
            <span className="tabular-nums text-chart-muted">
              {valeurs[s.cle]} · {Math.round((valeurs[s.cle] / total) * 100)}%
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
